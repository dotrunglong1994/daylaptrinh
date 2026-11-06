// Phiếu bài tập: mọi game trong PRINTABLE (src/lib/worksheet.ts) có printRound, mỗi màn in được ít nhất 5 câu chữ
// khác nhau, câu và lời giải không có chữ "undefined", "NaN" hay chỗ trống {x} chưa điền.
import { readFileSync } from "node:fs";

export default function check({ loadSection, report }) {
  console.log("Phiếu bài tập");
  const src = readFileSync(new URL("../../src/lib/worksheet.ts", import.meta.url), "utf8");
  const ids = [...src.match(/PRINTABLE = new Set\(\[([^\]]*)\]/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const { LEVELS, printRound } = loadSection(`${id}/game.js`, ["LEVELS", "printRound"]);
    const problems = [];
    LEVELS.forEach((L, i) => {
      const qs = new Set();
      for (let n = 0; n < 300; n++) {
        const item = printRound(i);
        if (item === null) continue;
        if (!item.q || !item.a || /undefined|NaN|\{[a-z]\}/.test(item.q + item.a)) problems.push(`màn ${i + 1}: ${JSON.stringify(item)}`);
        qs.add(item.q);
      }
      if (qs.size < 5) problems.push(`màn ${i + 1} (${L.name}) chỉ có ${qs.size} câu in được`);
    });
    report(!problems.length, `${id}: ${LEVELS.length} màn${problems.length ? `, lỗi: ${problems[0]}` : ""}`);
  }
}
