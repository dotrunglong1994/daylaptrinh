import { GAMES, SUBJECTS, gamesForGrade, type Game } from "./games";

// Thử thách hằng ngày: mỗi ngày 3 game cố định (hợp lớp của bé, có cả toán lẫn lập trình).
// Chơi xong cả 3 game trong ngày (ít nhất 1 sao mỗi game) thì được thưởng thêm xu, mỗi ngày một lần.

export const CHALLENGE_SIZE = 3;
export const CHALLENGE_BONUS = 30;

/** Mỗi lượt chơi: ngày (YYYY-MM-DD), id game, số sao */
export type PlayLog = { d: string; g: string; s: number };

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Game cần ôn: bé đã chơi trước hôm nay, chưa đạt 3 sao, và đã ít nhất 2 ngày chưa chơi lại.
 * Chỉ xét các lượt trước hôm nay để cả ngày thử thách không đổi.
 */
export function reviewGame(day: string, pool: Game[], log: PlayLog[]): Game | null {
  const twoDaysAgo = new Date(Date.parse(`${day}T00:00`) - 2 * 86_400_000).toLocaleDateString("en-CA");
  let pick: { game: Game; best: number; last: string } | null = null;
  for (const game of pool) {
    const past = log.filter((e) => e.g === game.id && e.d < day);
    if (!past.length) continue;
    const best = Math.max(...past.map((e) => e.s));
    const last = past[past.length - 1].d;
    if (best >= 3 || last > twoDaysAgo) continue;
    // Ít sao hơn trước, cùng số sao thì game lâu chưa chơi hơn trước
    if (!pick || best < pick.best || (best === pick.best && last < pick.last)) pick = { game, best, last };
  }
  return pick?.game ?? null;
}

export function challengeGames(day: string, grade?: number, log: PlayLog[] = []): Game[] {
  const pool = grade ? gamesForGrade(grade) : GAMES.filter((g) => g.src);
  let seed = hash(`${day}|${grade ?? 0}`);
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Một suất dành cho game cần ôn lại (nếu có)
  const review = reviewGame(day, pool, log);
  const lists = SUBJECTS.map((s) => {
    const a = pool.filter((g) => g.subject === s.id && g !== review);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
  // Ngày này 2 toán 1 lập trình, ngày khác ngược lại; game ôn lại tính vào môn của nó
  let first = rand() < 0.5 ? 0 : 1;
  const picked: Game[] = [];
  if (review) {
    picked.push(review);
    first = SUBJECTS.findIndex((s) => s.id !== review.subject);
  }
  for (let i = 0; picked.length < CHALLENGE_SIZE && lists.some((l) => l.length); i++) {
    const next = lists[(first + i) % lists.length].shift();
    if (next) picked.push(next);
  }
  return picked;
}

/** Id các game thử thách bé đã chơi xong trong ngày */
export function challengeDone(log: PlayLog[], day: string, games: Game[]) {
  return new Set(games.filter((g) => log.some((e) => e.d === day && e.g === g.id && e.s >= 1)).map((g) => g.id));
}
