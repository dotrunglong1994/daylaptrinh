// Kiểm tra 🎨 Màu Và Chữ (Phòng Tập Trí Não)
export default function check({ loadSection, report, seeded }) {
  console.log("Màu Và Chữ");
  const { COLORS, makeTrial, answerOf, pointsFor, applyAnswer, formatSec } = loadSection("mau-va-chu/game.js", [
    "COLORS", "makeTrial", "answerOf", "pointsFor", "applyAnswer", "formatSec",
  ]);
  const rand = seeded(22);

  // Bảng màu: 4–5 màu, tên và mã màu khác nhau, không có tên "XANH" trơn gây nhập nhằng
  const names = COLORS.map((c) => c.name);
  const hexes = COLORS.map((c) => c.hex.toLowerCase());
  report(
    COLORS.length >= 4 && COLORS.length <= 5 && new Set(names).size === names.length && new Set(hexes).size === hexes.length && !names.includes("XANH"),
    `Bảng màu: ${names.join(", ")}`,
  );

  // Độ sáng đủ trên nền tối (tỉ lệ tương phản với #0d1424 >= 4.5)
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const bg = lum("#0d1424");
  const contrasts = hexes.map((h) => (lum(h) + 0.05) / (bg + 0.05));
  report(contrasts.every((c) => c >= 4.5), `Tương phản trên nền tối: thấp nhất ${Math.min(...contrasts).toFixed(1)}`);

  // Sinh nhiều câu như một lượt chơi thật
  const N = 40000;
  let prev = null, same = 0, early = 0, earlyWord = 0, late = 0, lateWord = 0, repeats = 0, bad = 0;
  const inkSeen = new Set(), wordSeen = new Set();
  for (let n = 0; n < N; n++) {
    const elapsed = (n % 120) / 2; // 0 → 59,5 giây
    if (elapsed === 0) prev = null;
    const t = makeTrial(elapsed, prev, rand);
    const valid = Number.isInteger(t.word) && Number.isInteger(t.ink) && t.word >= 0 && t.ink >= 0 &&
      t.word < COLORS.length && t.ink < COLORS.length && (t.rule === "ink" || t.rule === "word");
    if (!valid) bad++;
    if (t.word === t.ink) same++;
    if (elapsed < 30) { early++; if (t.rule === "word") earlyWord++; }
    else { late++; if (t.rule === "word") lateWord++; }
    if (prev && prev.word === t.word && prev.ink === t.ink && prev.rule === t.rule) repeats++;
    const ans = answerOf(t);
    if (ans !== (t.rule === "word" ? t.word : t.ink)) bad++;
    inkSeen.add(t.ink); wordSeen.add(t.word);
    prev = t;
  }
  const sameRate = same / N, lateRate = lateWord / late;
  report(bad === 0, `${N} câu hợp lệ, đáp án đúng luật`);
  report(sameRate > 0.2 && sameRate < 0.3, `Chữ trùng màu: ${(sameRate * 100).toFixed(1)}% (mục tiêu ~25%)`);
  report(earlyWord === 0 && early > 0, `Trước giây 30 không có câu "chọn nghĩa" (${earlyWord}/${early})`);
  report(lateRate > 0.2 && lateRate < 0.3, `Từ giây 30: ${(lateRate * 100).toFixed(1)}% câu "chọn nghĩa" (mục tiêu ~25%)`);
  report(repeats === 0, `Không câu nào lặp y hệt câu trước (${repeats})`);
  report(inkSeen.size === COLORS.length && wordSeen.size === COLORS.length, "Mọi màu đều xuất hiện làm chữ và màu in");

  // Điểm: +10 nhân hệ số chuỗi (mỗi 5 câu đúng +1, tối đa x4), sai −5 không dưới 0
  const mults = [0, 4, 5, 9, 10, 15, 30].map((s) => pointsFor(s));
  let s = { score: 0, streak: 0, good: 0, bad: 0 };
  s = applyAnswer(s, false); // 0 − 5 → 0
  const floorOk = s.score === 0 && s.bad === 1;
  for (let i = 0; i < 20; i++) s = applyAnswer(s, true); // 5×10 + 5×20 + 5×30 + 5×40 = 500
  const runOk = s.score === 500 && s.streak === 20;
  s = applyAnswer(s, false);
  const loseOk = s.score === 495 && s.streak === 0 && s.good === 20 && s.bad === 2;
  report(
    String(mults) === "10,10,20,20,30,40,40" && floorOk && runOk && loseOk && formatSec(850) === "0,85 giây",
    `Tính điểm: ${mults.join("/")}, 20 câu đúng liên tiếp = ${runOk ? 500 : "sai"}, sai không xuống dưới 0`,
  );
}
