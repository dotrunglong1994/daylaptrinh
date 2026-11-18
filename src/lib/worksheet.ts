// Phiếu bài tập in ra giấy: lấy câu tương tự từ chính game. Game có câu chữ khai báo printRound(levelIdx, rand)
// trong đoạn LEVELS của game.js (không đụng DOM), trả về { q, a } hoặc null nếu câu đó cần hình vẽ. Câu có hình in được
// thì trả thêm pic: chuỗi SVG (vd. bánh chia phần của Chia Bánh Pizza), vẽ màu đen trắng bằng thuộc tính, không dùng class.

/** Game có printRound. Thêm id vào đây khi viết printRound cho game mới. */
export const PRINTABLE = new Set(["nha-may-cuu-chuong", "tham-tu-de-bai", "kiem-tra", "xuong-hinh", "duong-dua-van-toc", "tau-hoa-so", "cua-hang-giam-gia",
  "ban-bong-so", "dong-ho", "sieu-thi-mini", "xay-cau", "bep-can-dong", "can-thang-bang", "khu-vuon-dien-tich", "hop-lap-phuong",
  "to-lich-nha-be", "hu-keo-may-man", "thuoc-do-goc", "bong-den-nhi-phan", "tau-danh-sach", "cong-logic", "robot-nha-kho", "den-giao-thong",
  "chia-banh-pizza",
]);

export type PrintItem = { q: string; a: string; pic?: string };

/** Khóa phân biệt câu: cùng lời hỏi nhưng khác hình vẫn là câu khác */
export const itemKey = (it: PrintItem) => it.q + (it.pic ?? "");
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
    if (!item || seen.has(itemKey(item))) continue;
    seen.add(itemKey(item));
    out.push(item);
  }
  return out;
}
