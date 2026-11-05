// Thám Tử Đề Bài: tính lại đáp số bằng bộ tính riêng, mọi số trong đề đều chạm được, manh mối thừa không dùng trong
// phép tính đúng, không phép tính sai nào cho cùng đáp số, 4 đáp số khác nhau.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Thám Tử Đề Bài");
  const { LEVELS, ROUNDS, makeRound, answerOf } = loadSection("tham-tu-de-bai/game.js", ["LEVELS", "ROUNDS", "makeRound", "answerOf"]);
  const rand = seeded(61);
  const calc = (expr, v) => {
    const js = expr.replace(/[a-z]/g, (k) => `(${v[k]})`).replaceAll("×", "*").replaceAll(":", "/").replaceAll("−", "-");
    return new Function(`return ${js};`)();
  };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const used = new Set();
    let extras = 0;
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const { p, v } = r;
        used.add(p.t);
        const keys = [...p.t.matchAll(/\{([a-z])\}/g)].map((m) => m[1]);
        const ans = calc(p.e, v);
        let ok = Number.isInteger(ans) && ans > 0 && ans === answerOf(r);
        // Số chỉ xuất hiện qua chỗ {x}, mỗi số một lần, các số khác nhau
        ok &&= !/\d/.test(p.t.replace(/\{[a-z]\}/g, "")) && new Set(keys).size === keys.length;
        ok &&= keys.every((key) => Number.isInteger(v[key]) && v[key] > 0) && new Set(keys.map((key) => v[key])).size === keys.length;
        // Các số trong phép tính đúng đều có trong đề, manh mối thừa không có trong phép tính đúng
        ok &&= r.needed.every((key) => keys.includes(key)) && r.extras.every((key) => !p.e.includes(key));
        ok &&= keys.length === r.needed.length + r.extras.length;
        // Phép tính: đáp án đúng duy nhất, chuỗi khác nhau, không phép tính sai nào ra cùng đáp số
        ok &&= r.exprOptions.length >= 2 && new Set(r.exprOptions).size === r.exprOptions.length && r.exprOptions.filter((x) => x === r.answer).length === 1;
        ok &&= p.w.every((w) => calc(w, v) !== ans);
        ok &&= optionsOk(r.options, ans);
        if (r.extras.length) extras++;
        if (!ok) problems.push(JSON.stringify({ t: p.t, v, ans }));
      }
    }
    // Màn 1–4 không có số thừa; màn 5 (giới thiệu manh mối thừa) và màn thử thách phải có
    const extrasOk = i < 4 ? extras === 0 : i === 4 || i === LEVELS.length - 1 ? extras > 0 : true;
    report(!problems.length && used.size === new Set(L.problems.map((p) => p.t)).size && extrasOk,
      `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${used.size} dạng, ${extras} đề có số thừa, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
