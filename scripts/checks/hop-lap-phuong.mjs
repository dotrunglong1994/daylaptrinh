// Kho Hộp Lập Phương: đáp án đúng duy nhất, hình vẽ vừa khung, số liệu hợp lý cho lớp 5.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Kho Hộp Lập Phương");
  const { LEVELS, ROUNDS, makeRound, answerOf } = loadSection("hop-lap-phuong/game.js", ["LEVELS", "ROUNDS", "makeRound", "answerOf"]);
  const rand = seeded(53);
  const UNIT = { "dm-cm": 1000, "cm-dm": 1 / 1000, "dm-l": 1, "m-dm": 1000 };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = optionsOk(r.options, ans) && r.options.every((o) => o > 0);
        if (r.a) ok &&= r.a * r.b * r.c <= 1000 && Math.max(r.a, r.b, r.c) <= 12;
        if (r.kind === "count") ok &&= ans === r.a * r.b * r.c && ans >= 2 && ans <= 36;
        if (r.kind === "fill") ok &&= r.placed > 0 && ans > 0 && r.placed + ans === r.a * r.b * r.c && r.placed % r.a === 0;
        if (r.kind === "formula" || r.kind === "cube") ok &&= ans === r.a * r.b * r.c;
        if (r.kind === "cube") ok &&= r.a === r.b && r.b === r.c;
        if (r.kind === "reverse") ok &&= r.v === r.a * r.b * ans && Number.isInteger(ans);
        if (r.kind === "unit") ok &&= Math.abs(r.n * UNIT[r.u] - ans) < 1e-9 && Number.isInteger(ans * 2);
        if (r.kind === "tank") ok &&= r.h > 0 && r.h < r.c && ans === r.a * r.b * r.h;
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    const allKinds = L.kinds.every((k) => kinds.has(k));
    report(!problems.length && allKinds, `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
