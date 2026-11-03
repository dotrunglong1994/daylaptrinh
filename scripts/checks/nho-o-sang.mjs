// Kiểm tra logic Nhớ Ô Sáng: kích thước lưới, dãy sinh ngẫu nhiên, cách tính điểm.
export default function check({ loadSection, report, seeded }) {
  console.log("Nhớ Ô Sáng");
  const { makeSequence, gridSizeFor, scoreOf, accuracyOf, START_LEN, LIVES } = loadSection("nho-o-sang/game.js", [
    "makeSequence", "gridSizeFor", "scoreOf", "accuracyOf", "START_LEN", "LIVES",
  ]);

  const sizes = Array.from({ length: 30 }, (_, i) => gridSizeFor(i + 1));
  const sizeOk = sizes.every((s, i) => s === (i + 1 <= 5 ? 3 : i + 1 <= 8 ? 4 : 5));
  report(sizeOk && START_LEN === 3 && LIVES === 3, "Lưới 3×3 (≤5), 4×4 (6–8), 5×5 (≥9); bắt đầu 3 ô, 3 mạng");

  const rand = seeded(21);
  const problems = [];
  let total = 0;
  for (let len = 3; len <= 16; len++) {
    const n = gridSizeFor(len) ** 2;
    const used = new Set();
    const firsts = new Set();
    for (let k = 0; k < 2000; k++) {
      const seq = makeSequence(len, rand);
      total++;
      if (seq.length !== len) problems.push(`len ${len}: dài ${seq.length}`);
      seq.forEach((c, i) => {
        if (!Number.isInteger(c) || c < 0 || c >= n) problems.push(`len ${len}: ô ${c} ngoài lưới`);
        if (i && c === seq[i - 1]) problems.push(`len ${len}: lặp liền kề ${c}`);
        used.add(c);
      });
      firsts.add(seq[0]);
    }
    if (used.size !== n || firsts.size !== n) problems.push(`len ${len}: không phủ hết ${n} ô`);
  }
  report(!problems.length, `${total} dãy độ dài 3–16: đúng độ dài, trong lưới, không lặp liền kề, phủ mọi ô${problems.length ? ` — ${problems.length} lỗi (vd ${problems[0]})` : ""}`);

  // Cùng seed → cùng dãy (hàm ngẫu nhiên đi qua tham số rand)
  const a = makeSequence(12, seeded(5)).join();
  const b = makeSequence(12, seeded(5)).join();
  report(a === b, "makeSequence chỉ dùng hàm rand truyền vào");

  const scoreOk = scoreOf([]) === 0 && scoreOf([3, 4, 5]) === 120 && scoreOf([3, 3]) === 60;
  const accOk = accuracyOf(0, 0) === 0 && accuracyOf(9, 10) === 90 && accuracyOf(2, 3) === 67;
  report(scoreOk && accOk, "Điểm = tổng độ dài dãy đúng × 10; độ chính xác theo lần bấm");
}
