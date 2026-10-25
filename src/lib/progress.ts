"use client";

import { useSyncExternalStore } from "react";
import {
  DAILY_BONUS,
  FOODS,
  ITEMS,
  PET_COOLDOWN_MIN,
  dayKey,
  petNow,
  type ItemSlot,
  type PetState,
  type SpeciesId,
} from "./pet";

// Tiến độ của bé, hiện lưu trong localStorage của trình duyệt.
// Khi có backend (Supabase/Firebase) chỉ cần thay read/write trong file này.

export type Profile = { name: string; avatar: string };

export type GameRecord = {
  bestStars: number;
  bestScore: number;
  plays: number;
  progressText?: string;
  lastPlayed: string;
};

export type Daily = { lastDay: string; streak: number };

export type Progress = {
  profile: Profile | null;
  coins: number;
  games: Record<string, GameRecord>;
  pet: PetState | null;
  inventory: string[];
  daily: Daily | null;
  /** false khi render phía server, trước khi đọc được localStorage */
  loaded: boolean;
};

export type GameResult = { stars: number; score: number; progressText?: string };

const KEY = "dlt-progress-v1";
const SERVER: Progress = { profile: null, coins: 0, games: {}, pet: null, inventory: [], daily: null, loaded: false };
const EMPTY: Progress = { ...SERVER, loaded: true };

let cache: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw), loaded: true } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: Progress) {
  cache = next;
  try {
    const { profile, coins, games, pet, inventory, daily } = next;
    localStorage.setItem(KEY, JSON.stringify({ profile, coins, games, pet, inventory, daily }));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Đồng bộ khi bé mở web ở nhiều tab
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}

export function setProfile(profile: Profile) {
  write({ ...read(), profile });
}

/** Chuỗi ngày học sau khi chơi xong một game hôm nay. */
function nextDaily(daily: Daily | null, now: number): Daily {
  const today = dayKey(now);
  if (daily?.lastDay === today) return daily;
  const yesterday = dayKey(now - 86_400_000);
  return { lastDay: today, streak: daily?.lastDay === yesterday ? daily.streak + 1 : 1 };
}

/** Ghi kết quả một lượt chơi. Game đầu tiên trong ngày được thêm xu thưởng. */
export function recordResult(gameId: string, result: GameResult): { coins: number; bonus: number } {
  const current = read();
  const now = Date.now();
  const prev = current.games[gameId];
  const stars = Math.max(0, Math.min(3, Math.round(result.stars)));
  const coins = stars * 5;
  const daily = nextDaily(current.daily, now);
  const bonus = daily !== current.daily ? DAILY_BONUS : 0;
  write({
    ...current,
    coins: current.coins + coins + bonus,
    daily,
    games: {
      ...current.games,
      [gameId]: {
        bestStars: Math.max(prev?.bestStars ?? 0, stars),
        bestScore: Math.max(prev?.bestScore ?? 0, result.score || 0),
        plays: (prev?.plays ?? 0) + 1,
        progressText: result.progressText ?? prev?.progressText,
        lastPlayed: new Date(now).toISOString(),
      },
    },
  });
  return { coins, bonus };
}

/* ---------- Thú cưng ---------- */

export function adoptPet(species: SpeciesId, name: string) {
  const pet: PetState = {
    species,
    name,
    fullness: 80,
    happiness: 80,
    xp: 0,
    updatedAt: new Date().toISOString(),
    equipped: {},
  };
  write({ ...read(), pet });
}

export type ActionResult = { ok: true } | { ok: false; reason: string };

export function feedPet(foodId: string): ActionResult {
  const current = read();
  const food = FOODS.find((f) => f.id === foodId);
  if (!current.pet || !food) return { ok: false, reason: "Không tìm thấy thức ăn." };
  if (current.coins < food.price) return { ok: false, reason: `Cần ${food.price} xu, chơi game để kiếm thêm xu nhé!` };
  const pet = petNow(current.pet, Date.now());
  if (pet.fullness >= 100) return { ok: false, reason: `${pet.name} no căng bụng rồi!` };
  write({
    ...current,
    coins: current.coins - food.price,
    pet: {
      ...pet,
      fullness: Math.min(100, pet.fullness + food.fill),
      happiness: Math.min(100, pet.happiness + food.joy),
      xp: pet.xp + food.fill,
    },
  });
  return { ok: true };
}

/** Phút còn phải chờ trước khi được vuốt ve tiếp (0 = vuốt được ngay). */
export function petCooldown(pet: PetState, now: number) {
  if (!pet.lastPettedAt) return 0;
  const passed = (now - Date.parse(pet.lastPettedAt)) / 60_000;
  return Math.max(0, Math.ceil(PET_COOLDOWN_MIN - passed));
}

export function cuddlePet(): ActionResult {
  const current = read();
  if (!current.pet) return { ok: false, reason: "Chưa có thú cưng." };
  const now = Date.now();
  const wait = petCooldown(current.pet, now);
  if (wait > 0) return { ok: false, reason: `${current.pet.name} đang ngủ, ${wait} phút nữa quay lại nhé!` };
  const pet = petNow(current.pet, now);
  write({
    ...current,
    pet: { ...pet, happiness: Math.min(100, pet.happiness + 15), xp: pet.xp + 5, lastPettedAt: new Date(now).toISOString() },
  });
  return { ok: true };
}

export function buyItem(itemId: string): ActionResult {
  const current = read();
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, reason: "Không tìm thấy món đồ." };
  if (current.inventory.includes(itemId)) return { ok: false, reason: "Bé đã có món này rồi." };
  if (current.coins < item.price) return { ok: false, reason: `Cần ${item.price} xu, chơi game để kiếm thêm xu nhé!` };
  write({ ...current, coins: current.coins - item.price, inventory: [...current.inventory, itemId] });
  equipItem(item.slot, itemId);
  return { ok: true };
}

export function equipItem(slot: ItemSlot, itemId: string | null) {
  const current = read();
  if (!current.pet) return;
  const equipped = { ...current.pet.equipped };
  if (itemId) equipped[slot] = itemId;
  else delete equipped[slot];
  write({ ...current, pet: { ...current.pet, equipped } });
}

export function resetProgress() {
  write({ ...EMPTY, profile: read().profile });
}

export const totalStars = (p: Progress) =>
  Object.values(p.games).reduce((sum, g) => sum + g.bestStars, 0);
