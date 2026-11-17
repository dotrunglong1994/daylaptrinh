// Tên các màn của một game, đọc từ đoạn LEVELS trong /games/<id>/game.js (giống worksheet.ts, không chạy phần DOM).
// Dùng khi thầy cô chọn màn để giao bài. Game không có đoạn LEVELS thì trả về [] (chỉ giao "màn nào cũng được").

const cache = new Map<string, Promise<string[]>>();
const MODES = ["Dễ", "Vừa", "Khó"];

type Level = { name?: string; dish?: [string, string] } | null | undefined;

export function loadLevelNames(gameId: string): Promise<string[]> {
  let p = cache.get(gameId);
  if (!p) {
    p = fetch(`/games/${gameId}/game.js`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((src) => {
        const start = src.indexOf("// LEVELS-START");
        const end = src.indexOf("// LEVELS-END");
        if (start < 0 || end < 0) return [];
        // File của chính website (cùng nguồn), giống cách scripts/check-levels.mjs đọc đoạn này.
        // Game chia màn theo phép tính × mức độ khai báo PRINT_LEVELS; LEVELS dạng { 1: …, 2: … } là các mức Dễ / Vừa / Khó.
        const read = new Function(
          `${src.slice(start, end)}
          if (typeof PRINT_LEVELS !== "undefined") return { list: PRINT_LEVELS, modes: false };
          if (typeof LEVELS === "undefined") return null;
          return Array.isArray(LEVELS) ? { list: LEVELS, modes: false } : { list: Object.values(LEVELS), modes: true };`,
        );
        const got = read() as { list: Level[]; modes: boolean } | null;
        if (!got) return [];
        return got.list.map((L, i) => {
          const name = (L && (L.name || (Array.isArray(L.dish) && L.dish[1]))) || (got.modes ? MODES[i] : "") || `Màn ${i + 1}`;
          return name.charAt(0).toUpperCase() + name.slice(1);
        });
      })
      .catch(() => []);
    cache.set(gameId, p);
  }
  return p;
}
