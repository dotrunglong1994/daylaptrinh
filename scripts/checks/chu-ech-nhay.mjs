// Chú Ếch Nhảy: đề sinh ngẫu nhiên phải có đúng một đáp án và giải được.
export default function check({ loadSection, report, seeded }) {
  console.log("Chú Ếch Nhảy");
  const { LEVELS, ROUNDS, COLS, ROWS, DIR_KEYS, makeRound, answerOf, simulate, stepFrom } = loadSection("chu-ech-nhay/game.js", [
    "LEVELS", "ROUNDS", "COLS", "ROWS", "DIR_KEYS", "makeRound", "answerOf", "simulate", "stepFrom",
  ]);
  const rand = seeded(31);
  const reaches = (r, m) => {
    const s = simulate(r.pads, r.start, m);
    return s.fail < 0 && s.end === r.goal;
  };
  // Số bước ít nhất từ chỗ ếch tới chú dế (chỉ đi trên lá sen)
  function shortest(r) {
    const dist = new Map([[r.start, 0]]);
    const queue = [r.start];
    while (queue.length) {
      const p = queue.shift();
      for (const d of DIR_KEYS) {
        const n = stepFrom(p, d);
        if (n >= 0 && r.pads.includes(n) && !dist.has(n)) {
          dist.set(n, dist.get(p) + 1);
          queue.push(n);
        }
      }
    }
    return dist.get(r.goal) ?? Infinity;
  }

  LEVELS.forEach((L, i) => {
    const problems = [];
    for (let n = 0; n < 1500; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        let ok = true;
        if (r.kind === "pattern" || r.kind === "gap") {
          // Ít nhất 2 lần trọn nhóm hiện ra để bé thấy quy luật, và các chữ trong nhóm khác hướng nhau đúng như mẫu
          const shownCount = r.kind === "pattern" ? r.seq.length : r.seq.length - 1;
          ok = shownCount >= r.unit.length * 2 && DIR_KEYS.includes(ans) && r.gap >= r.unit.length && new Set(r.unit).size >= 2;
          if (r.kind === "pattern") ok &&= r.gap === r.seq.length;
          else ok &&= r.gap < r.seq.length && r.seq[r.gap] === ans;
        } else {
          const inPond = (p) => p >= 0 && p < COLS * ROWS;
          ok = r.pads.every(inPond) && new Set(r.pads).size === r.pads.length && r.pads.includes(r.start) && r.goal !== r.start;
          ok &&= reaches(r, r.moves) && r.moves.length >= L.len[0] && r.moves.length <= L.len[1];
          if (r.kind === "trace") ok &&= ans === r.goal;
          if (r.kind === "write") ok &&= shortest(r) <= r.moves.length; // ô trống đủ cho lời giải (moves + 2 ô)
          if (r.kind === "choose") {
            const good = r.programs.filter((p) => reaches(r, p)).length;
            ok &&= r.programs.length === 3 && good === 1 && ans >= 0 && new Set(r.programs.map((p) => p.join())).size === 3;
          }
          if (r.kind === "fix") {
            const sim = simulate(r.pads, r.start, r.buggy);
            const fixes = DIR_KEYS.filter((d) => {
              const m = [...r.buggy];
              m[r.bugAt] = d;
              return reaches(r, m);
            });
            // Ếch tõm đúng ở lệnh sai, các lệnh khác giữ nguyên, và chỉ một hướng sửa được
            ok &&= sim.fail === r.bugAt && r.buggy.every((d, j) => j === r.bugAt || d === r.moves[j]);
            ok &&= fixes.length === 1 && fixes[0] === ans.dir;
          }
        }
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length, `Màn ${i + 1} (${L.name}): ${1500 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
