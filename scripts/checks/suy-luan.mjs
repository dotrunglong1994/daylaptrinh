// Suy Luận Thứ Tự: các manh mối xác định đúng một thứ tự, và đó là đáp án.
export default function check({ loadSection, report, seeded }) {
  console.log("Suy Luận Thứ Tự");
  const { makePuzzle, nextN, MIN_N, MAX_N, THEMES } = loadSection("suy-luan/game.js", ["makePuzzle", "nextN", "MIN_N", "MAX_N", "THEMES"]);
  const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p])));
  // Đọc lại manh mối từ chữ: "A hơn B" hoặc "B kém A"
  const parse = (clue) => {
    for (const [up, down] of THEMES) {
      if (clue.includes(` ${up} `)) { const [a, b] = clue.split(` ${up} `); return [a, b]; }
      if (clue.includes(` ${down} `)) { const [b, a] = clue.split(` ${down} `); return [a, b]; }
    }
    return null;
  };
  const rand = seeded(29);
  const problems = [];
  let total = 0;
  for (let n = MIN_N; n <= MAX_N; n++) {
    for (let k = 0; k < 400; k++) {
      const p = makePuzzle(n, rand);
      total++;
      const rel = p.clues.map(parse);
      const fits = perms(p.order).filter((o) => rel.every((r) => r && o.indexOf(r[0]) < o.indexOf(r[1])));
      if (fits.length !== 1 || fits[0].join() !== p.order.join() || new Set(p.order).size !== n) problems.push(JSON.stringify(p.clues));
    }
  }
  report(!problems.length, `${total} câu đố 3–6 người: manh mối cho đúng một thứ tự${problems.length ? ` — ${problems.length} lỗi (vd ${problems[0]})` : ""}`);
  report(nextN(3, 2, true) === 4 && nextN(3, 1, true) === 3 && nextN(3, 0, false) === 3 && nextN(6, 2, true) === 6 && nextN(5, 0, false) === 4, "Đúng liền 2 câu thêm người, sai bớt người, trong khoảng 3–6");
}
