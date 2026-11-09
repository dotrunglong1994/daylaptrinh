// Phiếu bài tập in ra giấy: lấy câu tương tự từ chính game. Game có câu chữ khai báo printRound(levelIdx, rand)
// trong đoạn LEVELS của game.js (không đụng DOM), trả về { q, a } hoặc null nếu câu đó cần hình vẽ.

/** Game có printRound. Thêm id vào đây khi viết printRound cho game mới. */
export const PRINTABLE = new Set(["nha-may-cuu-chuong", "tham-tu-de-bai", "kiem-tra", "xuong-hinh", "duong-dua-van-toc", "tau-hoa-so", "cua-hang-giam-gia"]);

export type PrintItem = { q: string; a: string };
type PrintRound = (levelIdx: number) => PrintItem | null;

const cache = new Map<string, Promise<PrintRound | null>>();

/** Nạp printRound của một game từ /games/<id>/game.js (chỉ chạy đoạn dữ liệu màn chơi). */
export function loadPrintRound(gameId: string): Promise<PrintRound | null> {
  if (!PRINTABLE.has(gameId)) return Promise.resolve(null);
  let p = cache.get(gameId);
  if (!p) {
    p = fetch(`/games/${gameId}/game.js`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((src) => {
        const start = src.indexOf("// LEVELS-START");
        const end = src.indexOf("// LEVELS-END");
        if (start < 0 || end < 0) return null;
        // File của chính website (cùng nguồn), giống cách scripts/check-levels.mjs đọc đoạn này
        const make = new Function(`${src.slice(start, end)}\nreturn typeof printRound === "function" ? printRound : null;`);
        return make() as PrintRound | null;
      })
      .catch(() => null);
    cache.set(gameId, p);
  }
  return p;
}

/** n câu khác nhau của một màn (bỏ câu cần hình, bỏ câu bé đã gặp trong `skip`). */
export function makeItems(printRound: PrintRound, level: number, n: number, skip: string[] = []): PrintItem[] {
  const out: PrintItem[] = [];
  const seen = new Set(skip);
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const item = printRound(level);
    if (!item || seen.has(item.q)) continue;
    seen.add(item.q);
    out.push(item);
  }
  return out;
}
