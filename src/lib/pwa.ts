"use client";

import { useSyncExternalStore } from "react";

// Cài website lên máy như ứng dụng (PWA) và tải sẵn để chơi khi không có mạng (public/sw.js).

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const READY_KEY = "bhv-offline-ready";
let installEvent: InstallPrompt | null = null;
let started = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Gọi một lần khi mở website (component ServiceWorker trong layout gốc) */
export function setupPwa() {
  if (started) return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // tự hiện nút "Cài lên máy" ở Góc phụ huynh thay cho thanh mặc định
    installEvent = e as InstallPrompt;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    notify();
  });
  // Chỉ bật ở bản production: khi phát triển, bản lưu sẵn sẽ che mất code vừa sửa
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type !== "offline-ready") return;
    try {
      localStorage.setItem(READY_KEY, "1");
    } catch {}
    notify();
  });
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => reg.active?.postMessage("warm"))
    .catch(() => {});
}

export async function installApp() {
  if (!installEvent) return;
  await installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  notify();
}

type PwaState = { canInstall: boolean; installed: boolean; offlineReady: boolean; ios: boolean };
const SERVER: PwaState = { canInstall: false, installed: false, offlineReady: false, ios: false };
let last = SERVER;

function snapshot(): PwaState {
  let offlineReady = false;
  try {
    offlineReady = localStorage.getItem(READY_KEY) === "1";
  } catch {}
  const next: PwaState = {
    canInstall: installEvent !== null,
    installed: window.matchMedia("(display-mode: standalone)").matches,
    offlineReady,
    // iPad đời mới báo là "Macintosh" nhưng có màn hình cảm ứng
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1),
  };
  const same = (Object.keys(next) as (keyof PwaState)[]).every((k) => next[k] === last[k]);
  return same ? last : (last = next);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const usePwa = () => useSyncExternalStore(subscribe, snapshot, () => SERVER);
