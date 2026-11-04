// Đường Đua Vận Tốc: s = v × t đúng cho mọi đề, đáp án đúng duy nhất, câu chỉnh tốc độ bấm nút tới được.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Đường Đua Vận Tốc");
  const { LEVELS, ROUNDS, makeRound, answerOf } = loadSection("duong-dua-van-toc/game.js", ["LEVELS", "ROUNDS", "makeRound", "answerOf"]);
  const rand = seeded(61);
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = true;
        if (r.kind === "tune") {
          // Nút đổi vận tốc theo bước 5 trong khoảng 5–120
          ok = r.v % 5 === 0 && r.start % 5 === 0 && r.v >= 5 && r.v <= 120 && Math.abs(r.start - r.v) >= 20 && r.s === r.v * r.t;
        } else {
          ok = optionsOk(r.options, ans) && r.options.every((o) => o > 0);
        }
        if (["dist", "speed", "time", "mixed", "walk"].includes(r.kind)) ok &&= r.s === r.v * r.t && Number.isInteger(r.s);
        if (r.kind === "dist" || r.kind === "mixed" || r.kind === "walk") ok &&= ans === r.s;
        if (r.kind === "speed") ok &&= ans === r.v;
        if (r.kind === "time") ok &&= ans === r.t;
        if (r.kind === "meet") ok &&= r.s === (r.v1 + r.v2) * ans;
        if (r.kind === "chase") ok &&= r.v1 > r.v2 && r.d === (r.v1 - r.v2) * ans;
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    const allKinds = L.kinds.every((k) => kinds.has(k));
    report(!problems.length && allKinds, `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
