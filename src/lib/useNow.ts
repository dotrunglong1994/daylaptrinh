"use client";

import { useSyncExternalStore } from "react";
import { dayKey } from "./pet";
import type { Daily } from "./progress";

// Đồng hồ dùng chung, cập nhật mỗi 30 giây để chỉ số thú cưng giảm dần trên màn hình.
// Chỉ đọc giờ trên trình duyệt; khi render phía server trả về 0.
const TICK_MS = 30_000;
let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  if (!listeners.size) {
    current = Date.now(); // quay lại trang sau một lúc thì lấy giờ mới ngay
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) clearInterval(timer);
  };
}

function getSnapshot() {
  if (!current) current = Date.now();
  return current;
}

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

/** Chuỗi ngày học còn hiệu lực: bị mất nếu bỏ lỡ cả ngày hôm qua. */
export function streakOf(daily: Daily | null, now: number) {
  const playedToday = daily?.lastDay === dayKey(now);
  const alive = playedToday || daily?.lastDay === dayKey(now - 86_400_000);
  return { streak: alive && daily ? daily.streak : 0, playedToday };
}
