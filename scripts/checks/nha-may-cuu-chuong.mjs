// Nhà Máy Cửu Chương: tính lại đáp án độc lập, đáp án đúng duy nhất, số nằm trong bảng của màn.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Nhà Máy Cửu Chương");
  const { LEVELS, ROUNDS, makeRound, answerOf, questionOf, equationOf } = loadSection("nha-may-cuu-chuong/game.js", [
    "LEVELS", "ROUNDS", "makeRound", "answerOf", "questionOf", "equationOf",
  ]);
  const rand = seeded(29);
  // "2 × 3" → 6, "2 + 3" → 5
  const evalExpr = (s) => {
    const [a, op, b] = s.split(" ");
    return op === "×" ? Number(a) * Number(b) : Number(a) + Number(b);
  };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = L.kinds.includes(r.kind) && L.tables.includes(r.t);
        ok &&= questionOf(r).length > 0 && !equationOf(r).includes("undefined") && !questionOf(r).includes("undefined");
        if (r.kind === "group") ok &&= ans === r.t * r.m && optionsOk(r.options, ans);
        if (r.kind === "fact") ok &&= ans === r.t * r.m && r.m >= 1 && r.m <= 10 && optionsOk(r.options, ans);
        if (r.kind === "expr") {
          // Đáp án là phép nhân "t × m"; không có đáp án nhiễu nào là phép nhân cho cùng kết quả
          ok &&= optionsOk(r.options, ans) && ans === `${r.t} × ${r.m}` && r.m >= 3;
          ok &&= r.options.filter((o) => o.includes("×") && evalExpr(o) === r.t * r.m).length === 1;
        }
        if (r.kind === "div") ok &&= r.n % r.t === 0 && ans === r.n / r.t && optionsOk(r.options, ans);
        if (r.kind === "missing") {
          const solve = { a: r.p / r.m, b: r.p / r.t, div: r.p / r.m }[r.form];
          ok &&= r.p === r.t * r.m && ans === solve && optionsOk(r.options, ans);
        }
        if (r.kind === "remainder") {
          const want = `${Math.floor(r.n / r.t)} hộp, thừa ${r.n % r.t}`;
          ok &&= r.n % r.t > 0 && ans === want && optionsOk(r.options, ans);
        }
        if (r.kind === "word") {
          const want = r.op === "mul" ? r.t * r.m : r.n / r.t;
          ok &&= Number.isInteger(want) && ans === want && optionsOk(r.options, ans) && !/\{/.test(r.text);
        }
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length && L.kinds.every((k) => kinds.has(k)), `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
