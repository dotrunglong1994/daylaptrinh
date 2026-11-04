import { RARE_ITEMS, dayKey } from "./pet";

// Hành trình tuần: mỗi ngày hoàn thành thử thách hằng ngày, thú cưng đi thêm một chặng (tuần tính từ thứ Hai).
// Đi đủ JOURNEY_GOAL chặng trong tuần thì mở rương nhận một món đồ hiếm.

export const STOPS = [
  { emoji: "🏡", name: "Nhà" },
  { emoji: "🌳", name: "Rừng" },
  { emoji: "🌉", name: "Cây cầu" },
  { emoji: "⛰️", name: "Núi" },
  { emoji: "🏝️", name: "Đảo" },
  { emoji: "🌋", name: "Núi lửa" },
  { emoji: "🏰", name: "Lâu đài" },
];
export const JOURNEY_GOAL = 5;
/** Đã có đủ đồ hiếm thì rương có xu */
export const JOURNEY_COINS = 50;

/** Thứ Hai của tuần chứa thời điểm `now` (YYYY-MM-DD) */
export function weekOf(now: number) {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7;
  return dayKey(now - back * 86_400_000);
}

/** Số chặng đã đi trong tuần: số ngày hoàn thành thử thách từ thứ Hai */
export function stepsThisWeek(days: string[] | undefined, now: number) {
  const monday = weekOf(now);
  const today = dayKey(now);
  return new Set((days ?? []).filter((d) => d >= monday && d <= today)).size;
}

/** Món đồ hiếm tiếp theo bé chưa có (null = đã đủ, rương cho xu) */
export const nextRare = (inventory: string[]) => RARE_ITEMS.find((i) => !inventory.includes(i.id)) ?? null;
