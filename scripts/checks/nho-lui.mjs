// Kiểm tra logic game Nhớ Lùi N Bước (public/games/nho-lui/game.js)
export default function check({ loadSection, report, seeded }) {
  console.log("Nhớ Lùi N Bước");
  const { makeBlock, isTarget, scoreBlock, nextN, SCORED, TARGETS, CELLS, MAX_N } = loadSection("nho-lui/game.js", [
    "makeBlock", "isTarget", "scoreBlock", "nextN", "SCORED", "TARGETS", "CELLS", "MAX_N",
  ]);
  const rand = seeded(24);
  const COUNT = 3000;

  for (let n = 1; n <= 6; n++) {
    const problems = [];
    const firstCells = new Set();
    for (let k = 0; k < COUNT; k++) {
      const seq = makeBlock(n, rand);
      firstCells.add(seq[n]);
      const errs = [];
      if (seq.length !== SCORED + n) errs.push(`dài ${seq.length}`);
      if (!seq.every((v) => Number.isInteger(v) && v >= 0 && v < CELLS)) errs.push("vị trí ngoài 0..8");
      // Đếm trùng trực tiếp (không qua isTarget) để kiểm luôn isTarget
      let targets = 0;
      for (let i = n; i < seq.length; i++) if (seq[i] === seq[i - n]) targets++;
      if (targets !== TARGETS) errs.push(`${targets} bước trùng`);
      const viaFn = seq.filter((_, i) => isTarget(seq, i, n)).length;
      if (viaFn !== targets) errs.push("isTarget đếm khác");
      if (seq.slice(0, n).some((_, i) => isTarget(seq, i, n))) errs.push("isTarget chấm bước < N");

      // Người chơi hoàn hảo
      const perfect = seq.map((_, i) => isTarget(seq, i, n));
      const p = scoreBlock(seq, n, perfect);
      if (p.accuracy !== 1 || p.hits !== TARGETS || p.misses || p.falseAlarms || p.correctRejections !== SCORED - TARGETS
        || p.points !== TARGETS * 10 * n) errs.push(`hoàn hảo: ${JSON.stringify(p)}`);
      // Không bấm gì
      const none = scoreBlock(seq, n, []);
      if (none.misses !== TARGETS || none.hits || none.falseAlarms || none.points !== 0
        || Math.abs(none.accuracy - (SCORED - TARGETS) / SCORED) > 1e-9) errs.push(`không bấm: ${JSON.stringify(none)}`);
      // Bấm tất cả (kể cả bước < N, không được tính)
      const all = scoreBlock(seq, n, seq.map(() => true));
      if (all.hits !== TARGETS || all.falseAlarms !== SCORED - TARGETS || all.correctRejections
        || all.points !== TARGETS * 10 * n - (SCORED - TARGETS) * 5 * n) errs.push(`bấm hết: ${JSON.stringify(all)}`);
      // Ngẫu nhiên: các ô cộng lại = số bước chấm
      const rnd = scoreBlock(seq, n, seq.map(() => rand() < 0.4));
      if (rnd.hits + rnd.misses + rnd.falseAlarms + rnd.correctRejections !== SCORED
        || rnd.hits + rnd.misses !== TARGETS) errs.push(`ngẫu nhiên: ${JSON.stringify(rnd)}`);
      if (errs.length) problems.push(`${errs.join(", ")} [${seq.join("")}]`);
    }
    report(!problems.length && firstCells.size === CELLS,
      `N = ${n}: ${COUNT} khối dài ${SCORED + n}, ${TARGETS} bước trùng, ${problems.length} khối lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  }

  // Dãy cố định: N = 2, trùng ở bước 2 và 4
  {
    const seq = [0, 1, 0, 2, 0, 3];
    const t = seq.map((_, i) => isTarget(seq, i, 2));
    const r = scoreBlock(seq, 2, [true, false, true, true, false, false]);
    const ok = t.join() === "false,false,true,false,true,false"
      && r.hits === 1 && r.misses === 1 && r.falseAlarms === 1 && r.correctRejections === 1
      && r.accuracy === 0.5 && r.points === 10 * 2 - 5 * 2;
    report(ok, `Ví dụ tay N = 2: ${JSON.stringify(r)}`);
  }

  // Ngưỡng đổi N
  const cases = [
    [1, 1, 2], [1, 0.8, 2], [3, 16 / 20, 4], [3, 15 / 20, 3], [3, 0.5, 3], [3, 0.45, 2],
    [1, 0.2, 1], [1, 0, 1], [2, 0.49, 1], [MAX_N, 1, MAX_N],
  ];
  const bad = cases.filter(([n, a, want]) => nextN(n, a) !== want);
  report(!bad.length, `nextN: ≥80% tăng, <50% giảm (tối thiểu 1), còn lại giữ${bad.length ? `, sai ${JSON.stringify(bad)}` : ""}`);
}
