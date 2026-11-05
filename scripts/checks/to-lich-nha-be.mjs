// Tờ Lịch Nhà Bé: tính lại đáp án bằng lịch riêng (thuật toán Zeller, không dùng Date), 4 đáp án khác nhau.
export default function check({ loadSection, report, seeded, optionsOk }) {
  console.log("Tờ Lịch Nhà Bé");
  const { LEVELS, ROUNDS, makeRound, answerOf, questionOf, labelOf } = loadSection("to-lich-nha-be/game.js", [
    "LEVELS", "ROUNDS", "makeRound", "answerOf", "questionOf", "labelOf",
  ]);
  const rand = seeded(17);
  const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const monthDays = (y, m) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  // 0 = Chủ nhật … 6 = Thứ Bảy
  const wd = (y, m, d) => {
    if (m < 3) { m += 12; y -= 1; }
    const k = y % 100, j = Math.floor(y / 100);
    const h = (d + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7; // 0 = Thứ Bảy
    return (h + 6) % 7;
  };
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        const last = monthDays(r.y, r.m);
        kinds.add(r.kind);
        let ok = L.kinds.includes(r.kind) && r.last === last && !questionOf(r).includes("undefined") && !labelOf(r, ans).includes("undefined");
        const inMonth = (d) => Number.isInteger(d) && d >= 1 && d <= last;
        let want;
        switch (r.kind) {
          case "next": want = (r.w + r.step + 7) % 7; break;
          case "sheet":
            ok &&= inMonth(r.d) && r.d < last;
            want = { day: r.d, month: r.m, weekday: wd(r.y, r.m, r.d), tomorrow: r.d + 1 }[r.ask];
            break;
          case "weekday": ok &&= inMonth(r.d); want = wd(r.y, r.m, r.d); break;
          case "tap": {
            const same = Array.from({ length: last }, (_, x) => x + 1).filter((d) => wd(r.y, r.m, d) === r.w);
            want = r.target === "date" ? ans : r.target === "first" ? same[0] : same[same.length - 1];
            ok &&= inMonth(ans);
            break;
          }
          case "count": want = Array.from({ length: last }, (_, x) => x + 1).filter((d) => wd(r.y, r.m, d) === r.w).length; break;
          case "week": want = r.d + r.dir; ok &&= inMonth(r.d) && inMonth(want) && wd(r.y, r.m, want) === r.w; break;
          case "after": want = r.d + r.n; ok &&= inMonth(r.d) && inMonth(want); break;
          case "daysIn": want = last; break;
          case "untilEnd": want = last - r.d; ok &&= inMonth(r.d) && want > 0; break;
          default: want = last - r.d + r.e; ok &&= inMonth(r.d) && r.e >= 1 && r.e <= monthDays(r.m === 12 ? r.y + 1 : r.y, r.m2) && r.m2 === (r.m % 12) + 1;
        }
        ok &&= ans === want;
        if (r.kind !== "tap") ok &&= optionsOk(r.options, ans);
        if (["sheet", "week", "after"].includes(r.kind) && r.ask !== "weekday" && r.ask !== "month") ok &&= r.options.every(inMonth);
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length && L.kinds.every((k) => kinds.has(k)), `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
