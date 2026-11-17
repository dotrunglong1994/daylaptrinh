"use client";

import { useSyncExternalStore } from "react";
import { cloudClient, cloudEnabled, cloudUserId, onSynced } from "./cloud";
import { dayKey } from "./pet";
import { getSavedData, totalStars, type KidData } from "./progress";
import { strongSkills, weakSkills } from "./skills";

// Lớp học cho giáo viên (bảng classes, class_members trong supabase/schema.sql).
// Giáo viên tạo lớp và nhận mã 6 ký tự. Phụ huynh đăng nhập, nhập mã cho bé ở Góc phụ huynh.
// Sau mỗi lần đồng bộ, website gửi bản tóm tắt tiến độ của bé (ClassSummary) lên lớp; giáo viên chỉ đọc tóm tắt này.

/** Tóm tắt tiến độ một bé gửi cho giáo viên. Giữ nhỏ gọn, không có email hay dữ liệu thú cưng. */
export type ClassSummary = {
  grade?: number;
  stars: number;
  plays: number;
  /** Số game đã chơi */
  played: number;
  /** Số ngày có học và số lượt chơi trong 7 ngày gần nhất (tính cả hôm nay) */
  days7: number;
  plays7: number;
  /** Ngày chơi gần nhất (YYYY-MM-DD) */
  lastDay: string | null;
  /** id game → [sao cao nhất, số lượt] */
  games: Record<string, [number, number]>;
  /** Màn còn hay sai: id game, màn (từ 0), tên màn, số câu sai, số ngày sai, câu sai gần nhất */
  weak: { g: string; l: number; n: string; w: number; d: number; q?: string }[];
  /** Số màn đã vững */
  strong: number;
  /** Bài cô giao: id bài → số sao cao nhất bé đạt ở màn đó kể từ ngày giao (chỉ ghi bài đã làm) */
  asg?: Record<string, number>;
  /** Bài cô giao: id bài → ngày đầu tiên bé làm xong (YYYY-MM-DD), để cô biết bé nộp đúng hạn hay muộn */
  asgd?: Record<string, string>;
  at: string;
};

/** Bài giao cho cả lớp: một màn (l từ 0) hoặc cả game (l = -1). Bài mới nhất của lớp, nếu chưa đóng, là bài đang giao. */
export type Assignment = {
  id: string;
  class_id: string;
  g: string;
  l: number;
  level_name: string;
  note: string;
  created_at: string;
  /** Hạn nộp (YYYY-MM-DD, hết ngày đó), null = không có hạn */
  due: string | null;
  /** Cô đã "thôi giao" bài này */
  closed: boolean;
};

export type Membership = {
  class_id: string;
  kid_id: string;
  class_name: string;
  kid_name: string;
  avatar: string;
  joined_at: string;
  updated_at: string;
};

export type ClassRow = { id: string; name: string; grade: number | null; code: string; created_at: string };
export type MemberRow = Membership & { user_id: string; summary: Partial<ClassSummary> };

const WEAK_MAX = 8;
/** Số bài gần nhất của mỗi lớp mà bé báo kết quả (cô xem lại được) */
const HISTORY = 10;

const fits = (p: KidData["log"][number], a: Pick<Assignment, "g" | "l">, from: string) =>
  p.g === a.g && p.d >= from && (a.l < 0 || p.l === a.l) && p.s > 0;

/** Số sao cao nhất bé đạt ở bài giao kể từ ngày giao (0 = chưa làm). Màn tính theo nhật ký lượt chơi. */
export function assignmentStars(kid: Pick<KidData, "log">, a: Pick<Assignment, "g" | "l" | "created_at">) {
  const from = dayKey(Date.parse(a.created_at));
  return kid.log.reduce((best, p) => (fits(p, a, from) && p.s > best ? p.s : best), 0);
}

/** Ngày đầu tiên bé làm xong bài giao (ít nhất 1 sao), null nếu chưa làm */
export function assignmentDoneDay(kid: Pick<KidData, "log">, a: Pick<Assignment, "g" | "l" | "created_at">) {
  const from = dayKey(Date.parse(a.created_at));
  return kid.log.reduce<string | null>((min, p) => (fits(p, a, from) && (!min || p.d < min) ? p.d : min), null);
}

/** Số ngày từ hôm nay đến hạn nộp: 0 = hôm nay hết hạn, âm = đã quá hạn, null = không có hạn */
export function daysLeft(due: string | null, today: string) {
  if (!due) return null;
  return Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000);
}

/** Bé làm bài thế nào: đúng hạn, muộn hay chưa làm. Đọc cả tóm tắt cũ (chỉ có asg, không có ngày làm xong). */
export function memberStatus(m: Pick<MemberRow, "summary">, a: Pick<Assignment, "id" | "due">) {
  const stars = m.summary.asg?.[a.id] ?? 0;
  if (!stars) return { stars: 0, state: "todo" as const, day: null };
  const day = m.summary.asgd?.[a.id] ?? null;
  const late = !!(a.due && day && day > a.due);
  return { stars, state: late ? ("late" as const) : ("ontime" as const), day };
}

export function kidSummary(kid: KidData, now = Date.now(), assignments: Assignment[] = []): ClassSummary {
  const asg = Object.fromEntries(
    assignments.map((a) => [a.id, assignmentStars(kid, a)] as const).filter(([, stars]) => stars > 0),
  );
  const asgd = Object.fromEntries(
    assignments.flatMap((a) => {
      const d = asg[a.id] ? assignmentDoneDay(kid, a) : null;
      return d ? [[a.id, d] as const] : [];
    }),
  );
  const week = new Set(Array.from({ length: 7 }, (_, i) => dayKey(now - i * 86_400_000)));
  const recent = kid.log.filter((p) => week.has(p.d));
  const games = Object.fromEntries(
    Object.entries(kid.games).map(([id, g]) => [id, [g.bestStars, g.plays] as [number, number]]),
  );
  const lastDay = kid.log.reduce<string | null>((max, p) => (!max || p.d > max ? p.d : max), null);
  return {
    grade: kid.profile?.grade,
    stars: totalStars(kid),
    plays: Object.values(kid.games).reduce((sum, g) => sum + g.plays, 0),
    played: Object.keys(kid.games).length,
    days7: new Set(recent.map((p) => p.d)).size,
    plays7: recent.length,
    lastDay,
    games,
    weak: weakSkills(kid.skills)
      .slice(0, WEAK_MAX)
      .map((s) => ({ g: s.g, l: s.l, n: s.name, w: s.wrong, d: s.wrongDays.length, q: s.recent[0]?.slice(0, 160) })),
    strong: strongSkills(kid.skills).length,
    ...(Object.keys(asg).length ? { asg, asgd } : {}),
    at: new Date(now).toISOString(),
  };
}

/** Thông báo lỗi dễ hiểu cho phụ huynh và giáo viên */
function explain(err: { message?: string; code?: string } | null): string {
  const msg = err?.message ?? "Lỗi không xác định";
  if (/CLASS_NOT_FOUND/.test(msg)) return "Không tìm thấy lớp có mã này. Bố mẹ kiểm tra lại mã cô giáo gửi nhé.";
  if (/CLASS_FULL/.test(msg)) return "Lớp này đã đủ 60 bạn.";
  if (err?.code === "PGRST202" || err?.code === "PGRST205" || /schema cache|does not exist/.test(msg)) {
    return /assignment/.test(msg)
      ? "Chưa tạo bảng bài giao trên Supabase. Hãy chạy lại file supabase/schema.sql trong SQL Editor."
      : "Chưa tạo bảng lớp học trên Supabase. Hãy chạy lại file supabase/schema.sql trong SQL Editor.";
  }
  if (/fetch|network/i.test(msg)) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
  return msg;
}

/* ---------- Phụ huynh: lớp của các bé ---------- */

type MineState = {
  user: string | null;
  list: Membership[];
  /** Các bài gần nhất của các lớp mà bé trong nhà đã vào (mới trước, tối đa HISTORY bài mỗi lớp) */
  assignments: Assignment[];
  loaded: boolean;
  loadedAt: number;
  error: string | null;
};
let mine: MineState = { user: null, list: [], assignments: [], loaded: false, loadedAt: 0, error: null };
const listeners = new Set<() => void>();
const setMine = (patch: Partial<MineState>) => {
  mine = { ...mine, ...patch };
  listeners.forEach((l) => l());
};
const EMPTY: MineState = { user: null, list: [], assignments: [], loaded: false, loadedAt: 0, error: null };

/** Bài cô đang giao cho một bé (các lớp bé đã vào, mỗi lớp bài mới nhất nếu chưa đóng), kèm tên lớp */
export function assignmentsForKid(state: MineState, kidId: string | null) {
  return state.list
    .filter((m) => m.kid_id === kidId)
    .flatMap((m) => {
      const a = state.assignments.find((x) => x.class_id === m.class_id);
      return a && !a.closed ? [{ ...a, className: m.class_name }] : [];
    });
}

/** Giữ tối đa HISTORY bài mỗi lớp (danh sách đã xếp mới trước) */
const recentPerClass = (rows: Assignment[]) => {
  const count = new Map<string, number>();
  return rows.filter((a) => {
    const n = (count.get(a.class_id) ?? 0) + 1;
    count.set(a.class_id, n);
    return n <= HISTORY;
  });
};

/** Các lớp mà các bé trong nhà đã vào (theo tài khoản đang đăng nhập) */
export function useMyClasses() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => mine,
    () => EMPTY,
  );
}

const COLUMNS = "class_id, kid_id, class_name, kid_name, avatar, joined_at, updated_at";
const ASSIGN_COLUMNS = "id, class_id, g, l, level_name, note, created_at, due, closed";
/** Sau mỗi lần đồng bộ, tải lại lớp và bài giao nếu bản đang có cũ hơn chừng này */
const REFRESH_MS = 2 * 60_000;
/** Tóm tắt đã gửi gần nhất của mỗi bé (bỏ trường `at`), để không gửi lại khi không có gì mới */
const sent = new Map<string, string>();

export async function loadMyClasses() {
  const user = cloudUserId();
  if (!user) return setMine({ ...EMPTY });
  const { data, error } = await cloudClient()
    .from("class_members")
    .select(COLUMNS)
    .eq("user_id", user)
    .order("joined_at");
  if (cloudUserId() !== user) return;
  if (error) return setMine({ user, loaded: true, loadedAt: Date.now(), error: explain(error) });
  const list = (data ?? []) as Membership[];
  let assignments: Assignment[] = [];
  if (list.length) {
    const res = await cloudClient()
      .from("class_assignments")
      .select(ASSIGN_COLUMNS)
      .in("class_id", [...new Set(list.map((m) => m.class_id))])
      .order("created_at", { ascending: false });
    // Chưa chạy bảng bài giao trên Supabase thì vẫn dùng lớp học bình thường
    assignments = recentPerClass((res.data ?? []) as Assignment[]);
  }
  if (cloudUserId() !== user) return;
  setMine({ user, list, assignments, loaded: true, loadedAt: Date.now(), error: null });
}

const sameSummary = (a: ClassSummary) => JSON.stringify({ ...a, at: "" });

/** Gửi tóm tắt mới của các bé đã vào lớp (sau mỗi lần đồng bộ). */
export async function pushSummaries() {
  const user = cloudUserId();
  if (!user) return;
  if (mine.user !== user || !mine.loaded || Date.now() - mine.loadedAt > REFRESH_MS) await loadMyClasses();
  const kids = getSavedData().kids;
  for (const m of mine.list) {
    const kid = kids.find((k) => k.id === m.kid_id);
    if (!kid?.profile) continue;
    const summary = kidSummary(kid, Date.now(), mine.assignments.filter((a) => a.class_id === m.class_id));
    const key = `${user}|${m.class_id}|${m.kid_id}`;
    const sig = sameSummary(summary) + kid.profile.name + kid.profile.avatar;
    if (sent.get(key) === sig) continue;
    const { error } = await cloudClient()
      .from("class_members")
      .update({ summary, kid_name: kid.profile.name, avatar: kid.profile.avatar, updated_at: new Date().toISOString() })
      .match({ class_id: m.class_id, user_id: user, kid_id: m.kid_id });
    if (!error) sent.set(key, sig);
  }
}

/** Cho bé vào lớp bằng mã cô giáo gửi. Trả về lỗi (chuỗi) hoặc null. */
export async function joinClass(code: string, kid: KidData): Promise<string | null> {
  if (!cloudUserId() || !kid.profile) return "Bố mẹ cần đăng nhập trước.";
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 6) return "Mã lớp có 6 ký tự, ví dụ K7M2QP.";
  const { error } = await cloudClient().rpc("join_class", {
    p_code: clean,
    p_kid_id: kid.id,
    p_kid_name: kid.profile.name,
    p_avatar: kid.profile.avatar,
    p_summary: kidSummary(kid),
  });
  if (error) return explain(error);
  await loadMyClasses();
  return null;
}

export async function leaveClass(classId: string, kidId: string): Promise<string | null> {
  const user = cloudUserId();
  if (!user) return "Bố mẹ cần đăng nhập trước.";
  const { error } = await cloudClient().from("class_members").delete().match({ class_id: classId, user_id: user, kid_id: kidId });
  if (error) return explain(error);
  await loadMyClasses();
  return null;
}

let started = false;
/** Gọi một lần khi website mở: sau mỗi lần đồng bộ thì gửi tóm tắt cho lớp. */
export function startClassroom() {
  if (!cloudEnabled || started) return () => {};
  started = true;
  const stop = onSynced(() => {
    pushSummaries().catch(() => {});
  });
  return () => {
    stop();
    started = false;
  };
}

/* ---------- Giáo viên ---------- */

export async function listClasses(): Promise<{ data: ClassRow[]; error: string | null }> {
  const user = cloudUserId();
  if (!user) return { data: [], error: null };
  const { data, error } = await cloudClient()
    .from("classes")
    .select("id, name, grade, code, created_at")
    .eq("teacher_id", user)
    .order("created_at");
  return { data: (data ?? []) as ClassRow[], error: error ? explain(error) : null };
}

export async function createClass(name: string, grade: number | null): Promise<{ data: ClassRow | null; error: string | null }> {
  const { data, error } = await cloudClient().rpc("create_class", { p_name: name.trim(), p_grade: grade });
  return { data: (data as ClassRow) ?? null, error: error ? explain(error) : null };
}

export async function deleteClass(id: string): Promise<string | null> {
  const { error } = await cloudClient().from("classes").delete().eq("id", id);
  return error ? explain(error) : null;
}

export async function listMembers(classId: string): Promise<{ data: MemberRow[]; error: string | null }> {
  const { data, error } = await cloudClient()
    .from("class_members")
    .select(`${COLUMNS}, user_id, summary`)
    .eq("class_id", classId)
    .order("kid_name");
  return { data: (data ?? []) as MemberRow[], error: error ? explain(error) : null };
}

export async function removeMember(m: MemberRow): Promise<string | null> {
  const { error } = await cloudClient()
    .from("class_members")
    .delete()
    .match({ class_id: m.class_id, user_id: m.user_id, kid_id: m.kid_id });
  return error ? explain(error) : null;
}

/** Các bài đã giao của lớp, mới trước (bài đầu, nếu chưa đóng, là bài đang giao) */
export async function listAssignments(classId: string): Promise<{ data: Assignment[]; error: string | null }> {
  const { data, error } = await cloudClient()
    .from("class_assignments")
    .select(ASSIGN_COLUMNS)
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(HISTORY);
  return { data: (data ?? []) as Assignment[], error: error ? explain(error) : null };
}

/** Giao bài mới cho lớp (thay bài đang giao). l = -1: chơi màn nào của game cũng được. due: YYYY-MM-DD hoặc null. */
export async function assignWork(
  classId: string,
  g: string,
  l: number,
  levelName: string,
  note: string,
  due: string | null,
): Promise<string | null> {
  const { error } = await cloudClient()
    .from("class_assignments")
    .insert({ class_id: classId, g, l, level_name: levelName.slice(0, 80), note: note.trim().slice(0, 200), due });
  return error ? explain(error) : null;
}

/** Thôi giao bài: đóng bài đang giao (vẫn giữ để xem lại, bé không thấy nữa) */
export async function closeAssignments(classId: string): Promise<string | null> {
  const { error } = await cloudClient()
    .from("class_assignments")
    .update({ closed: true })
    .eq("class_id", classId)
    .eq("closed", false);
  return error ? explain(error) : null;
}

/** Màn nhiều bé trong lớp còn sai nhất: số bé sai, tổng câu sai, vài câu các bé đã sai (tối đa 3). */
export function classWeakSkills(members: MemberRow[]) {
  const map = new Map<string, { g: string; l: number; n: string; kids: string[]; wrong: number; qs: string[] }>();
  for (const m of members) {
    for (const w of m.summary.weak ?? []) {
      const key = `${w.g}#${w.l}`;
      const cur = map.get(key) ?? { g: w.g, l: w.l, n: w.n, kids: [], wrong: 0, qs: [] };
      cur.kids.push(m.kid_name);
      cur.wrong += w.w;
      if (w.q && cur.qs.length < 3 && !cur.qs.includes(w.q)) cur.qs.push(w.q);
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.kids.length - a.kids.length || b.wrong - a.wrong);
}
