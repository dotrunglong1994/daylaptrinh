// Thước Đo Góc: số đo nằm trên vạch thước, đáp án đúng duy nhất, đề "gọi tên" không có góc gần 90° dễ nhầm.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Thước Đo Góc");
  const { LEVELS, ROUNDS, KIND_NAMES, makeRound, answerOf, kindOf } = loadSection("thuoc-do-goc/game.js", [
    "LEVELS", "ROUNDS", "KIND_NAMES", "makeRound", "answerOf", "kindOf",
  ]);
  const rand = seeded(47);
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = true;
        if (r.kind !== "set") ok = optionsOk(r.options, ans);
        if (r.kind === "name") {
          ok &&= KIND_NAMES.includes(ans) && (r.deg === 90 || r.deg === 180 || Math.abs(r.deg - 90) >= 15) && r.deg >= 20;
        }
        if (r.kind === "read" || r.kind === "set") {
          ok &&= r.deg > 0 && r.deg < 180 && r.deg % r.step === 0 && ["right", "left"].includes(r.base);
          if (r.kind === "set") ok &&= r.start % r.step === 0 && r.start >= 0 && r.start <= 180 && Math.abs(r.start - r.deg) >= 30;
          // Câu đọc góc có đáp án nhầm vòng số (trừ góc vuông, hai vòng đọc giống nhau)
          if (r.kind === "read" && r.deg !== 90) ok &&= r.options.includes(180 - r.deg);
        }
        if (r.kind === "clock") ok &&= r.deg === 30 * Math.min(r.hour, 12 - r.hour) && r.deg <= 180 && r.options.every((o) => o > 0);
        if (r.kind === "missing") ok &&= r.deg > 0 && r.deg + r.known === r.whole && r.options.every((o) => o > 0 && o <= 180);
        if (r.kind === "name") ok &&= kindOf(r.deg) === KIND_NAMES.indexOf(ans);
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    const allKinds = L.kinds.every((k) => kinds.has(k));
    report(!problems.length && allKinds, `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
