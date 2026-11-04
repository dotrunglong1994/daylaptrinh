// Tàu Danh Sách: đáp án tính lại độc lập bằng mảng JavaScript, đáp án đúng duy nhất.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Tàu Danh Sách");
  const { LEVELS, ROUNDS, makeRound, answerOf } = loadSection("tau-danh-sach/game.js", ["LEVELS", "ROUNDS", "makeRound", "answerOf"]);
  const rand = seeded(83);
  // Chạy lệnh bằng phương thức mảng có sẵn
  const exec = (list, ops) => {
    const a = [...list];
    for (const o of ops) {
      if (o.type === "push") a.push(o.v);
      else if (o.type === "unshift") a.unshift(o.v);
      else if (o.type === "pop") a.pop();
      else a.splice(o.k - 1, 1);
    }
    return a;
  };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = true;
        if (r.kind === "tap") ok = ans === r.at - 1 && r.at >= 1 && r.at <= r.list.length;
        if (r.kind === "find") ok = optionsOk(r.options, ans) && r.list.indexOf(r.list[r.at - 1]) === r.at - 1;
        if (r.kind === "length") ok = optionsOk(r.options, ans) && ans === exec(r.list, r.ops).length && ans > 0;
        if (r.kind === "edit") {
          ok = r.options.length === 3 && new Set(r.options).size === 3 && r.options.filter((o) => o === ans).length === 1;
          ok &&= ans === exec(r.list, r.ops).join("") && ans.length > 0;
          // Lệnh xóa toa thứ k phải có toa thứ k
          let size = r.list.length;
          for (const o of r.ops) {
            if (o.type === "removeAt") ok &&= o.k >= 1 && o.k <= size;
            if (o.type === "pop") ok &&= size > 1;
            size += o.type === "push" || o.type === "unshift" ? 1 : -1;
          }
          if (L.ops) ok &&= r.ops.every((o) => L.ops.includes(o.type));
        }
        if (r.kind === "sum") ok = optionsOk(r.options, ans) && ans === r.list.reduce((a, b) => a + b, 0);
        if (r.kind === "count") ok = optionsOk(r.options, ans) && ans === r.list.filter((x) => x > r.limit).length;
        if (r.kind === "max") ok = optionsOk(r.options, ans) && ans === Math.max(...r.list);
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length && L.kinds.every((k) => kinds.has(k)), `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
