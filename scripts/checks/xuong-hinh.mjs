// Xưởng Hình Lớp 5: tính lại kết quả bằng bộ tính riêng, công thức đúng ra đúng số đo (tính bằng số nguyên),
// mỗi công thức sai ra một kết quả khác, 4 đáp án khác nhau; câu chạm có đáp án nằm trên hình.
export default function check({ loadSection, report, seeded }) {
  console.log("Xưởng Hình Lớp 5");
  const { LEVELS, ROUNDS, makeRound, answerOf } = loadSection("xuong-hinh/game.js", ["LEVELS", "ROUNDS", "makeRound", "answerOf"]);
  const rand = seeded(73);
  const calc = (expr) => {
    if (!/^[\d ,()+×:−]+$/.test(expr)) return NaN;
    const js = expr.replaceAll(",", ".").replaceAll("×", "*").replaceAll(":", "/").replaceAll("−", "-");
    return Math.round(new Function(`return ${js};`)() * 100);
  };
  const TAP = { tri: ["base", "side", "height"], trap: ["base", "side", "top", "height"], circle: ["radius", "diameter", "chord"] };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        kinds.add(r.name);
        let ok;
        if (r.kind === "tap") {
          ok = TAP[r.fig.type]?.includes(r.ans) && answerOf(r) === r.ans && r.ask.length > 0;
        } else {
          const values = r.exprs.map(calc);
          ok = r.exprs.length === 4 && values[0] === r.value && r.answer === r.exprs[0] && answerOf(r) === r.value;
          ok &&= new Set(values).size === 4 && values.every((v) => v > 0);
          ok &&= r.options.length === 4 && r.options.every((o, j) => o === values[j]);
          // Số đo trên hình là số nguyên dương, cạnh bên dài hơn chiều cao
          const f = r.fig;
          if (f.type === "tri" || f.type === "trap") ok &&= f.s > f.h && f.a > f.p && (f.type === "tri" || f.a >= f.p + f.b);
        }
        if (!ok) problems.push(JSON.stringify(r).slice(0, 200));
      }
    }
    const want = new Set(L.kinds);
    report(!problems.length && kinds.size === want.size,
      `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} câu, ${kinds.size}/${want.size} dạng, ${problems.length} câu lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
