// Bài Kiểm Tra: mỗi lớp đủ 10 dạng câu, mỗi câu 4 đáp án khác nhau và chỉ một đáp án đúng.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Bài Kiểm Tra");
  const { LEVELS, QUESTIONS, GRADES, makeRound, answerOf } = loadSection("kiem-tra/game.js", ["LEVELS", "QUESTIONS", "GRADES", "makeRound", "answerOf"]);
  const rand = seeded(71);
  LEVELS.forEach((L, i) => {
    const problems = [];
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < QUESTIONS; k++) {
        const r = makeRound(i, k, rand);
        const ok = typeof r.q === "string" && r.q.length > 3 && optionsOk(r.options, answerOf(r)) && r.options.every((o) => (typeof o === "number" ? o >= 0 : o.length > 0));
        if (!ok) problems.push(`dạng ${k + 1}: ${JSON.stringify(r)}`);
      }
    }
    report(GRADES[i].length === QUESTIONS && !problems.length, `${L.name}: ${2000 * QUESTIONS} câu, ${problems.length} câu lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
