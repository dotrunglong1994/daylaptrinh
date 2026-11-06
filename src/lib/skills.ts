import type { Game } from "./games";

// Sổ tay lỗi sai: mỗi màn của một game là một "kỹ năng". Game gửi về câu bé làm sai (shared/kit.js → bridge.js),
// website ghi theo từng màn. Hôm sau thử thách hằng ngày cho bé ôn đúng màn đó, Góc phụ huynh xem màn nào còn yếu.

/** Một màn chơi bé đã sai hoặc đã thắng */
export type SkillRecord = {
  /** id game */
  g: string;
  /** Màn (đếm từ 0) */
  l: number;
  /** Tên màn, vd. "Bảng nhân 6" */
  name: string;
  /** Tổng số câu sai */
  wrong: number;
  /** Các ngày có sai (YYYY-MM-DD), tối đa 10 ngày gần nhất */
  wrongDays: string[];
  /** Vài câu sai gần nhất, mới nhất trước */
  recent: string[];
  lastWrongAt: string | null;
  lastWinAt: string | null;
  lastStars: number;
  bestStars: number;
  wins: number;
};

/** Mỗi lượt chơi: ngày (YYYY-MM-DD), id game, số sao, màn (nếu game gửi về) */
export type PlayLog = { d: string; g: string; s: number; l?: number };

export const skillKey = (g: string, l: number) => `${g}#${l}`;

const blankSkill = (g: string, l: number, name: string): SkillRecord => ({
  g, l, name, wrong: 0, wrongDays: [], recent: [], lastWrongAt: null, lastWinAt: null, lastStars: 0, bestStars: 0, wins: 0,
});

export function withMistake(
  skills: Record<string, SkillRecord>, g: string, l: number, name: string, question: string, now: Date, day: string,
): Record<string, SkillRecord> {
  const key = skillKey(g, l);
  const s = skills[key] ?? blankSkill(g, l, name);
  const q = question.trim().slice(0, 90);
  return {
    ...skills,
    [key]: {
      ...s,
      name: name || s.name,
      wrong: s.wrong + 1,
      wrongDays: s.wrongDays.includes(day) ? s.wrongDays : [...s.wrongDays, day].slice(-10),
      recent: q ? [q, ...s.recent.filter((r) => r !== q)].slice(0, 3) : s.recent,
      lastWrongAt: now.toISOString(),
    },
  };
}

export function withWin(
  skills: Record<string, SkillRecord>, g: string, l: number, name: string, stars: number, now: Date,
): Record<string, SkillRecord> {
  const key = skillKey(g, l);
  const s = skills[key] ?? blankSkill(g, l, name);
  return {
    ...skills,
    [key]: {
      ...s,
      name: name || s.name,
      lastWinAt: now.toISOString(),
      lastStars: stars,
      bestStars: Math.max(s.bestStars, stars),
      wins: s.wins + 1,
    },
  };
}

/** Màn đã thắng 3 sao sau lần sai gần nhất (hoặc chưa sai lần nào) */
const solved = (s: SkillRecord) =>
  s.lastStars === 3 && !!s.lastWinAt && (!s.lastWrongAt || s.lastWinAt > s.lastWrongAt);

/** Màn còn yếu: có sai và chưa thắng 3 sao lại. Sai nhiều trước. */
export function weakSkills(skills: Record<string, SkillRecord> = {}) {
  return Object.values(skills)
    .filter((s) => s.wrong > 0 && !solved(s))
    .sort((a, b) => b.wrongDays.length - a.wrongDays.length || b.wrong - a.wrong || (b.lastWrongAt ?? "").localeCompare(a.lastWrongAt ?? ""));
}

/** Màn bé đã vững: lần chơi gần nhất được 3 sao và không sai thêm sau đó. Mới thắng trước. */
export function strongSkills(skills: Record<string, SkillRecord> = {}) {
  return Object.values(skills)
    .filter(solved)
    .sort((a, b) => (b.lastWinAt ?? "").localeCompare(a.lastWinAt ?? ""));
}

/**
 * Màn cần ôn hôm nay: bé sai ở những ngày trước hôm nay và chưa thắng 3 sao màn đó kể từ ngày sai gần nhất.
 * Chỉ xét dữ liệu trước hôm nay để cả ngày thử thách không đổi. Sai nhiều ngày trước, rồi sai gần đây trước.
 */
export function reviewSkill(
  day: string, pool: Game[], log: PlayLog[], skills: Record<string, SkillRecord> = {},
): SkillRecord | null {
  const ids = new Set(pool.map((g) => g.id));
  let pick: { s: SkillRecord; days: number; last: string; key: string } | null = null;
  for (const s of Object.values(skills)) {
    if (!ids.has(s.g)) continue;
    const before = s.wrongDays.filter((d) => d < day);
    if (!before.length) continue;
    const last = before.reduce((a, b) => (a > b ? a : b));
    if (log.some((e) => e.g === s.g && e.l === s.l && e.s >= 3 && e.d >= last && e.d < day)) continue;
    const key = skillKey(s.g, s.l);
    const better =
      !pick ||
      before.length > pick.days ||
      (before.length === pick.days && (last > pick.last || (last === pick.last && key < pick.key)));
    if (better) pick = { s, days: before.length, last, key };
  }
  return pick?.s ?? null;
}
