import { GAMES, gamesForGrade } from "./games";
import type { KidData } from "./progress";

type BadgeData = Omit<KidData, "id">;

// Huy hiệu: tính từ tiến độ của bé. Đạt rồi thì giữ mãi (lưu ngày đạt trong progress.badges),
// kể cả khi chuỗi ngày học bị đứt.

export type Badge = {
  id: string;
  emoji: string;
  name: string;
  text: string;
  /** [đã làm được, cần đạt] */
  measure: (d: BadgeData) => [number, number];
};

const stars = (d: BadgeData) => Object.values(d.games).reduce((sum, g) => sum + g.bestStars, 0);
const plays = (d: BadgeData) => Object.values(d.games).reduce((sum, g) => sum + g.plays, 0);
const threeStar = (d: BadgeData, subject: string) =>
  GAMES.filter((g) => g.subject === subject && d.games[g.id]?.bestStars === 3).length;
const playable = GAMES.filter((g) => g.src);

export const BADGES: Badge[] = [
  { id: "first-play", emoji: "🎮", name: "Bước đầu tiên", text: "Chơi xong game đầu tiên", measure: (d) => [plays(d), 1] },
  { id: "stars-10", emoji: "⭐", name: "Ngôi sao nhỏ", text: "Có 10 sao", measure: (d) => [stars(d), 10] },
  { id: "stars-50", emoji: "🌟", name: "Chòm sao", text: "Có 50 sao", measure: (d) => [stars(d), 50] },
  { id: "stars-100", emoji: "🌌", name: "Dải ngân hà", text: "Có 100 sao", measure: (d) => [stars(d), 100] },
  { id: "explorer", emoji: "🧭", name: "Nhà thám hiểm", text: "Chơi 10 game khác nhau", measure: (d) => [Object.keys(d.games).length, 10] },
  {
    id: "all-games",
    emoji: "🗺️",
    name: "Chinh phục bản đồ",
    text: "Chơi thử mọi game trên bản đồ",
    measure: (d) => [playable.filter((g) => d.games[g.id]).length, playable.length],
  },
  { id: "math", emoji: "🧮", name: "Nhà toán học nhí", text: "Đạt 3 sao ở 5 game toán", measure: (d) => [threeStar(d, "toan"), 5] },
  { id: "code", emoji: "💻", name: "Lập trình viên nhí", text: "Đạt 3 sao ở 5 game lập trình", measure: (d) => [threeStar(d, "lap-trinh"), 5] },
  { id: "streak-3", emoji: "🔥", name: "Chăm chỉ", text: "Học 3 ngày liền", measure: (d) => [d.daily?.streak ?? 0, 3] },
  { id: "streak-7", emoji: "🏆", name: "Kiên trì", text: "Học 7 ngày liền", measure: (d) => [d.daily?.streak ?? 0, 7] },
  { id: "challenge-1", emoji: "🎯", name: "Nhận thử thách", text: "Hoàn thành một thử thách hằng ngày", measure: (d) => [d.challenge?.count ?? 0, 1] },
  { id: "challenge-7", emoji: "🎖️", name: "Vua thử thách", text: "Hoàn thành 7 thử thách hằng ngày", measure: (d) => [d.challenge?.count ?? 0, 7] },
  { id: "plays-50", emoji: "💪", name: "Siêng năng", text: "Chơi 50 lượt", measure: (d) => [plays(d), 50] },
  {
    id: "grade-master",
    emoji: "🎓",
    name: "Học sinh xuất sắc",
    text: "Đạt 3 sao mọi game của lớp mình",
    measure: (d) => {
      const games = d.profile?.grade ? gamesForGrade(d.profile.grade) : [];
      return [games.filter((g) => d.games[g.id]?.bestStars === 3).length, games.length || 1];
    },
  },
  { id: "pet-star", emoji: "🐾", name: "Bạn thân thú cưng", text: "Chăm thú cưng thành Siêu sao", measure: (d) => [d.pet?.xp ?? 0, 300] },
];

export const badgeOf = (id: string) => BADGES.find((b) => b.id === id);

/** Huy hiệu bé vừa đủ điều kiện mà chưa được ghi nhận */
export function newBadges(d: BadgeData): Badge[] {
  return BADGES.filter((b) => {
    if (d.badges[b.id]) return false;
    const [value, goal] = b.measure(d);
    return value >= goal;
  });
}
