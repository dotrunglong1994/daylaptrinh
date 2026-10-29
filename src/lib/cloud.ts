"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { getSavedData, isBlank, onLocalWrite, replaceSavedData, type SavedData } from "./progress";

// Tài khoản phụ huynh (không bắt buộc): đăng nhập bằng mã OTP gửi qua email,
// rồi đồng bộ tiến độ trong localStorage với bảng `progress` (xem supabase/schema.sql).
// Không cấu hình biến môi trường thì website chỉ lưu trên máy, ẩn phần đăng nhập.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(URL && ANON_KEY);

/** Máy này đã đồng bộ với tài khoản nào (để lần sau không hỏi lại khi dữ liệu khác nhau). */
const LINK_KEY = "dlt-cloud-user";
const PUSH_DELAY_MS = 1500;

export type CloudState = {
  /** idle: chưa đăng nhập; conflict: máy và tài khoản đều có dữ liệu khác nhau, chờ phụ huynh chọn */
  status: "off" | "loading" | "idle" | "syncing" | "synced" | "conflict" | "error";
  email: string | null;
  lastSynced: string | null;
  error: string | null;
  remote: SavedData | null;
};

const OFF: CloudState = { status: "off", email: null, lastSynced: null, error: null, remote: null };
let state: CloudState = cloudEnabled ? { ...OFF, status: "loading" } : OFF;
const listeners = new Set<() => void>();

function setState(patch: Partial<CloudState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useCloud() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state,
    () => (cloudEnabled ? { ...OFF, status: "loading" as const } : OFF),
  );
}

let client: SupabaseClient | null = null;
const sb = () => (client ??= createClient(URL!, ANON_KEY!));

let userId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

const linkedUser = () => {
  try {
    return localStorage.getItem(LINK_KEY);
  } catch {
    return null;
  }
};
const setLinkedUser = (id: string) => {
  try {
    localStorage.setItem(LINK_KEY, id);
  } catch {}
};

function explain(err: { message?: string; code?: string } | null): string {
  const msg = err?.message ?? "Lỗi không xác định";
  if (err?.code === "PGRST205" || (/progress/.test(msg) && /schema cache|does not exist/.test(msg))) {
    return "Chưa tạo bảng lưu tiến độ trên Supabase. Hãy chạy file supabase/schema.sql trong SQL Editor.";
  }
  if (/fetch|network/i.test(msg)) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
  return msg;
}

async function push() {
  if (!userId || state.status === "conflict") return;
  clearTimeout(pushTimer);
  setState({ status: "syncing" });
  const data = getSavedData();
  const { error } = await sb()
    .from("progress")
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) return setState({ status: "error", error: explain(error) });
  setLinkedUser(userId);
  setState({ status: "synced", error: null, lastSynced: new Date().toISOString() });
}

/** So sánh bản trên máy với bản trên tài khoản rồi chọn hướng đồng bộ. */
export async function syncNow() {
  if (!userId) return;
  setState({ status: "syncing", error: null });
  const { data: row, error } = await sb().from("progress").select("data").eq("user_id", userId).maybeSingle();
  if (error) return setState({ status: "error", error: explain(error) });

  const local = getSavedData();
  const remote = (row?.data as SavedData | undefined) ?? null;
  if (!remote) return push();
  if (isBlank(local)) return pull(remote);

  const sameAccount = linkedUser() === userId;
  const localTime = Date.parse(local.savedAt ?? "") || 0;
  const remoteTime = Date.parse(remote.savedAt ?? "") || 0;
  if (localTime === remoteTime) {
    setLinkedUser(userId);
    return setState({ status: "synced", lastSynced: new Date().toISOString() });
  }
  if (!sameAccount) return setState({ status: "conflict", remote });
  return remoteTime > localTime ? pull(remote) : push();
}

function pull(remote: SavedData) {
  replaceSavedData(remote);
  setLinkedUser(userId!);
  setState({ status: "synced", remote: null, error: null, lastSynced: new Date().toISOString() });
}

/** Phụ huynh chọn giữ bản nào khi máy và tài khoản khác nhau. */
export function resolveConflict(keep: "local" | "remote") {
  if (state.status !== "conflict" || !state.remote) return;
  if (keep === "remote") return pull(state.remote);
  setState({ status: "syncing", remote: null });
  return push();
}

export async function sendCode(email: string) {
  const { error } = await sb().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${location.origin}/phu-huynh` },
  });
  if (!error) return null;
  if (error.status === 429 || /rate limit/i.test(error.message)) {
    return "Gửi email nhiều quá, vui lòng đợi ít phút rồi thử lại.";
  }
  return explain(error);
}

export async function verifyCode(email: string, token: string) {
  const { error } = await sb().auth.verifyOtp({ email, token, type: "email" });
  if (!error) return null;
  if (/expired|invalid/i.test(error.message)) return "Mã không đúng hoặc đã hết hạn. Bé nhờ bố mẹ kiểm tra lại nhé.";
  return explain(error);
}

export async function signOut() {
  await sb().auth.signOut();
}

let started = false;

/** Gọi một lần khi website mở (CloudSync trong layout). */
export function startCloud() {
  if (!cloudEnabled || started) return () => {};
  started = true;

  const { data } = sb().auth.onAuthStateChange((event, session) => {
    const id = session?.user.id ?? null;
    const changed = id !== userId;
    userId = id;
    if (!id) return setState({ ...OFF, status: "idle" });
    setState({ email: session!.user.email ?? null });
    // Hàm này không được await gọi Supabase trực tiếp (tránh khóa phiên), nên đẩy ra sau.
    if (changed || event === "SIGNED_IN") setTimeout(syncNow, 0);
  });

  const stopWrites = onLocalWrite(() => {
    if (!userId || state.status === "conflict") return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, PUSH_DELAY_MS);
  });

  // Quay lại tab: lấy tiến độ mới nếu bé vừa chơi trên máy khác.
  const onVisible = () => {
    if (document.visibilityState === "visible" && userId && state.status !== "syncing") syncNow();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    data.subscription.unsubscribe();
    stopWrites();
    document.removeEventListener("visibilitychange", onVisible);
    started = false;
  };
}
