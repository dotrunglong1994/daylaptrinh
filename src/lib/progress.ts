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
import { newBadges, type Badge } from "./badges";
import { CHALLENGE_BONUS, challengeDone, challengeGames, type PlayLog } from "./challenge";

// Tiến độ của bé, luôn lưu trong localStorage của trình duyệt.
// Nếu phụ huynh đăng nhập, src/lib/cloud.ts đồng bộ thêm bản sao lên Supabase.

export type Profile = {
  name: string;
  avatar: string;
  /** Lớp của bé (1–5). Không có = chưa chọn, bản đồ hiện mọi game. */
  grade?: number;
};

export type GameRecord = {
  bestStars: number;
  bestScore: number;
  plays: number;
  progressText?: string;
  lastPlayed: string;
};

export type Daily = { lastDay: string; streak: number };

/** Kết quả game Phòng Tập Trí Não (người lớn): điểm càng cao càng tốt, không tính sao và xu */
export type BrainRecord = {
  best: number;
  plays: number;
  lastPlayed: string;
  /** Điểm cao nhất mỗi ngày, tối đa 30 ngày gần nhất, cũ trước mới sau */
  history: { day: string; score: number }[];
};

/** Tiến độ của một bé. Mỗi tài khoản / mỗi máy có thể có nhiều bé. */
export type KidData = {
  id: string;
  profile: Profile | null;
  coins: number;
  games: Record<string, GameRecord>;
  pet: PetState | null;
  inventory: string[];
  daily: Daily | null;
  /** Các lượt chơi gần nhất (tối đa LOG_MAX), dùng cho báo cáo tuần và thử thách hằng ngày */
  log: PlayLog[];
  /** Ngày gần nhất hoàn thành thử thách hằng ngày, tổng số lần hoàn thành, các ngày hoàn thành gần đây */
  challenge: { day: string; count: number; days?: string[] } | null;
  /** Huy hiệu đã đạt: id → ngày đạt */
  badges: Record<string, string>;
};

/** Phần được lưu xuống localStorage và lên tài khoản: cả nhà dùng chung một bản */
export type SavedData = {
  version: 2;
  kids: KidData[];
  /** Điểm Phòng Tập Trí Não của người lớn, dùng chung cho cả nhà */
  brain: Record<string, BrainRecord>;
  /** Chuỗi ngày tập trí não, tính riêng với chuỗi ngày học của bé */
  brainDaily: Daily | null;
  /** Lần ghi gần nhất, dùng để biết bản trên máy hay trên tài khoản mới hơn */
  savedAt: string | null;
};

/** Những gì các trang đọc: tiến độ của bé đang chơi + phần dùng chung của cả nhà */
export type Progress = Omit<KidData, "id"> &
  Omit<SavedData, "version" | "kids"> & {
    /** Bé đang chơi (null khi chưa có bé nào) */
    kidId: string | null;
    kids: KidData[];
    /** false khi render phía server, trước khi đọc được localStorage */
    loaded: boolean;
  };

export type GameResult = { stars: number; score: number; progressText?: string };

export type Reward = { coins: number; bonus: number; challengeBonus: number; badges: Badge[] };

const KEY = "dlt-family-v2";
/** Bản cũ, mỗi máy một bé. Đọc một lần để chuyển sang bản mới, không xóa. */
const OLD_KEY = "dlt-progress-v1";
/** Bé đang chơi trên máy này (không đồng bộ). Game trong iframe cũng đọc khóa này, xem shared/bridge.js. */
const KID_KEY = "bhv-kid";
/** Bé đầu tiên giữ id này để game dùng lại tiến độ chọn màn đã lưu trước khi có nhiều bé */
const FIRST_KID = "k1";
const LOG_MAX = 400;

const blankKid = (id: string): KidData => ({
  id, profile: null, coins: 0, games: {}, pet: null, inventory: [], daily: null, log: [], challenge: null, badges: {},
});
const BLANK: SavedData = { version: 2, kids: [], brain: {}, brainDaily: null, savedAt: null };

/** Đọc dữ liệu đã lưu, kể cả bản cũ một bé (dlt-progress-v1 hoặc bản cũ trên tài khoản). */
export function normalize(raw: unknown): SavedData {
  if (!raw || typeof raw !== "object") return BLANK;
  const d = raw as Partial<SavedData> & Partial<Omit<KidData, "id">>;
  if (Array.isArray(d.kids)) {
    return { ...BLANK, ...d, version: 2, kids: d.kids.map((k) => ({ ...blankKid(k.id), ...k })) };
  }
  const { brain, brainDaily, savedAt, ...kid } = d as Record<string, unknown>;
  const old = { ...blankKid(FIRST_KID), ...(kid as Partial<KidData>), id: FIRST_KID };
  const hasKid = old.profile || old.pet || Object.keys(old.games).length || old.coins;
  return {
    ...BLANK,
    kids: hasKid ? [old] : [],
    brain: (brain as SavedData["brain"]) ?? {},
    brainDaily: (brainDaily as Daily | null) ?? null,
    savedAt: (savedAt as string | null) ?? null,
  };
}

function view(data: SavedData, loaded: boolean): Progress {
  let wanted: string | null = null;
  try {
    wanted = localStorage.getItem(KID_KEY);
  } catch {}
  const kid = data.kids.find((k) => k.id === wanted) ?? data.kids[0] ?? null;
  const { id, ...fields } = kid ?? blankKid("");
  return { ...fields, brain: data.brain, brainDaily: data.brainDaily, savedAt: data.savedAt, kidId: kid ? id : null, kids: data.kids, loaded };
}

const SERVER: Progress = { ...view(BLANK, false), kidId: null };

const kidFields = (p: Omit<KidData, "id">): Omit<KidData, "id"> => ({
  profile: p.profile, coins: p.coins, games: p.games, pet: p.pet, inventory: p.inventory, daily: p.daily,
  log: p.log, challenge: p.challenge, badges: p.badges,
});

let data: SavedData | null = null;
let cache: Progress | null = null;
const listeners = new Set<() => void>();
const writeListeners = new Set<() => void>();

function load(): SavedData {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
    return raw ? normalize(JSON.parse(raw)) : BLANK;
  } catch {
    return BLANK;
  }
}

function read(): Progress {
  if (cache) return cache;
  data ??= load();
  cache = view(data, true);
  return cache;
}

function store(next: SavedData) {
  data = next;
  cache = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

/** Ghi lại tiến độ của bé đang chơi (tạo bé mới nếu chưa có) và phần dùng chung. */
function write(next: Progress) {
  const current = data ?? load();
  const { kidId, brain, brainDaily } = next;
  const fields = kidFields(next);
  let kids = current.kids;
  if (kidId && kids.some((k) => k.id === kidId)) {
    kids = kids.map((k) => (k.id === kidId ? { ...fields, id: kidId } : k));
  } else if (fields.profile || fields.pet || Object.keys(fields.games).length) {
    // Chưa có bé nào: bé đầu tiên
    const id = kids.length ? newKidId() : FIRST_KID;
    kids = [...kids, { ...fields, id }];
    setActiveKid(id);
  }
  store({ ...current, kids, brain, brainDaily, savedAt: new Date().toISOString() });
  writeListeners.forEach((l) => l());
}

export function getSavedData(): SavedData {
  return data ?? (data = load());
}

/** Thay toàn bộ tiến độ bằng bản tải từ tài khoản (không tính là một lần ghi mới). */
export function replaceSavedData(remote: unknown) {
  store(normalize(remote));
}

/** Gọi lại mỗi khi bé chơi, mua đồ… (không gọi khi tải bản từ tài khoản về). */
export function onLocalWrite(listener: () => void) {
  writeListeners.add(listener);
  return () => {
    writeListeners.delete(listener);
  };
}

/** Máy này chưa có gì đáng giữ: chưa có bé nào chơi, chưa có điểm trí não. */
export const isBlank = (d: SavedData) =>
  d.kids.every((k) => !k.profile && !k.pet && Object.keys(k.games).length === 0 && k.coins === 0) &&
  Object.keys(d.brain ?? {}).length === 0;

/* ---------- Nhiều bé ---------- */

const newKidId = () => `k${Date.now().toString(36)}`;

function setActiveKid(id: string) {
  try {
    localStorage.setItem(KID_KEY, id);
  } catch {}
}

/** Đổi bé đang chơi trên máy này */
export function switchKid(id: string) {
  setActiveKid(id);
  cache = null;
  listeners.forEach((l) => l());
}

/** Thêm một bé mới và chuyển sang bé đó */
export function addKid(profile: Profile) {
  const current = getSavedData();
  const id = current.kids.length ? newKidId() : FIRST_KID;
  setActiveKid(id);
  store({ ...current, kids: [...current.kids, { ...blankKid(id), profile }], savedAt: new Date().toISOString() });
  writeListeners.forEach((l) => l());
}

/** Xóa hẳn một bé (cùng sao, xu, thú cưng của bé đó) */
export function removeKid(id: string) {
  const current = getSavedData();
  const kids = current.kids.filter((k) => k.id !== id);
  if (read().kidId === id && kids[0]) setActiveKid(kids[0].id);
  store({ ...current, kids, savedAt: new Date().toISOString() });
  writeListeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Đồng bộ khi bé mở web ở nhiều tab
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY && e.key !== KID_KEY) return;
    if (e.key === KEY) data = null;
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

/** Thêm huy hiệu bé vừa đạt (ghi ngày đạt). Trả về state mới và các huy hiệu mới. */
function withBadges(kid: Progress, now: number): [Progress, Badge[]] {
  const earned = newBadges(kid);
  if (!earned.length) return [kid, earned];
  const day = dayKey(now);
  return [{ ...kid, badges: { ...kid.badges, ...Object.fromEntries(earned.map((b) => [b.id, day])) } }, earned];
}

/**
 * Ghi kết quả một lượt chơi. Game đầu tiên trong ngày được thêm xu thưởng,
 * chơi xong cả 3 game thử thách hôm nay được thưởng thêm.
 */
export function recordResult(gameId: string, result: GameResult): Reward {
  const current = read();
  const now = Date.now();
  const today = dayKey(now);
  const prev = current.games[gameId];
  const stars = Math.max(0, Math.min(3, Math.round(result.stars)));
  const coins = stars * 5;
  const daily = nextDaily(current.daily, now);
  const bonus = daily !== current.daily ? DAILY_BONUS : 0;
  const log = [...(current.log ?? []), { d: today, g: gameId, s: stars }].slice(-LOG_MAX);

  let challenge = current.challenge;
  let challengeBonus = 0;
  if (challenge?.day !== today) {
    const games = challengeGames(today, current.profile?.grade);
    if (games.length && challengeDone(log, today, games).size === games.length) {
      challenge = { day: today, count: (challenge?.count ?? 0) + 1 };
      challengeBonus = CHALLENGE_BONUS;
    }
  }

  const [next, badges] = withBadges({
    ...current,
    coins: current.coins + coins + bonus + challengeBonus,
    daily,
    log,
    challenge,
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
  }, now);
  write(next);
  return { coins, bonus, challengeBonus, badges };
}

/** Ghi nhận huy hiệu đã đủ điều kiện nhưng chưa có (vd. nhờ chăm thú cưng). Trả về huy hiệu mới. */
export function syncBadges(): Badge[] {
  const current = read();
  const [next, badges] = withBadges(current, Date.now());
  if (badges.length) write(next);
  return badges;
}

/** Ghi điểm một lượt chơi game trí não. Trả về true nếu là kỷ lục mới. */
export function recordBrain(gameId: string, score: number): boolean {
  const current = read();
  const now = Date.now();
  const today = dayKey(now);
  const prev = current.brain[gameId];
  const history = (prev?.history ?? []).filter((h) => h.day !== today);
  const todayBest = Math.max(score, prev?.history.find((h) => h.day === today)?.score ?? 0);
  write({
    ...current,
    brainDaily: nextDaily(current.brainDaily, now),
    brain: {
      ...current.brain,
      [gameId]: {
        best: Math.max(prev?.best ?? 0, score),
        plays: (prev?.plays ?? 0) + 1,
        lastPlayed: new Date(now).toISOString(),
        history: [...history, { day: today, score: todayBest }].slice(-30),
      },
    },
  });
  return score > (prev?.best ?? 0);
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

/** Xóa tiến độ của bé đang chơi; giữ hồ sơ bé, các bé khác và điểm trí não của người lớn. */
export function resetProgress() {
  const current = read();
  write({ ...current, ...kidFields(blankKid("")), profile: current.profile });
}

export const totalStars = (p: Pick<KidData, "games">) =>
  Object.values(p.games).reduce((sum, g) => sum + g.bestStars, 0);
