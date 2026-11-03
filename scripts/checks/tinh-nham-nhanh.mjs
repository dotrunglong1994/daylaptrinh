// Kiểm tra Tính Nhẩm Nhanh: đề sinh ra ở mọi cấp phải đúng, đáp án nguyên, chia hết, không âm ở cấp thấp.
export default function check({ loadSection, report, seeded }) {
  console.log("Tính Nhẩm Nhanh");
  const { MAX_LEVEL, NEG_LEVEL, STREAK_UP, WRONG_DOWN, makeProblem, nextLevel, pointsFor } = loadSection(
    "tinh-nham-nhanh/game.js",
    ["MAX_LEVEL", "NEG_LEVEL", "STREAK_UP", "WRONG_DOWN", "makeProblem", "nextLevel", "pointsFor"],
  );
  const rand = seeded(23);
  const N = 5000;
  // Giới hạn độ lớn đáp án theo cấp
  const LIMIT = [0, 18, 45, 108, 140, 200, 999, 1100, 2000];
  const evalText = (t) => Function(`"use strict"; return (${t.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")});`)();

  let prevAvg = 0;
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    const bad = [];
    const texts = new Set();
    const ops = new Set();
    let neg = 0, twoStep = 0, sum = 0;
    for (let n = 0; n < N; n++) {
      const p = makeProblem(lv, rand);
      texts.add(p.text);
      const val = evalText(p.text);
      const opsHere = p.text.match(/[+−×÷]/g) || [];
      opsHere.forEach((o) => ops.add(o));
      if (opsHere.length > 1) twoStep++;
      if (p.answer < 0) neg++;
      sum += Math.abs(p.answer);
      const divsOk = [...p.text.matchAll(/(\d+) ÷ (\d+)/g)].every(([, a, b]) => Number(b) > 1 && Number(a) % Number(b) === 0);
      const ok = val === p.answer
        && Number.isInteger(p.answer)
        && /^[\d +−×÷]+$/.test(p.text)        // chỉ dùng dấu × ÷ −, không dùng - * /
        && opsHere.length >= 1 && opsHere.length <= 2
        && divsOk
        && Math.abs(p.answer) <= LIMIT[lv]
        && (lv >= NEG_LEVEL || p.answer >= 0)
        && p.level === lv;
      if (!ok) bad.push(`${p.text} = ${p.answer} (tính lại ${val})`);
    }
    const avg = sum / N;
    const varied = texts.size >= Math.min(40, N / 10) && ops.size >= (lv === 1 ? 2 : 3);
    const harder = avg >= prevAvg * 0.7; // trung bình độ lớn đáp án không giảm nhiều khi lên cấp (cấp có phép chia thì đáp án nhỏ hơn)
    prevAvg = avg;
    report(!bad.length && varied && harder,
      `Cấp ${lv}: ${N} đề, ${bad.length} lỗi, ${texts.size} đề khác nhau, phép ${[...ops].join(" ")}, `
      + `${twoStep} đề 2 bước, ${neg} đáp án âm, TB |đáp án| ${avg.toFixed(0)}${bad.length ? ` (vd ${bad[0]})` : ""}`);
  }

  // Đổi cấp
  const lvOk = nextLevel(1, STREAK_UP, 0) === 2
    && nextLevel(1, STREAK_UP - 1, 0) === 1
    && nextLevel(MAX_LEVEL, STREAK_UP, 0) === MAX_LEVEL
    && nextLevel(3, 0, WRONG_DOWN) === 2
    && nextLevel(3, 0, WRONG_DOWN - 1) === 3
    && nextLevel(1, 0, WRONG_DOWN) === 1
    && pointsFor(1) === 10 && pointsFor(MAX_LEVEL) === 10 * MAX_LEVEL;
  // Chơi đúng liên tục thì lên tới cấp tối đa sau (MAX_LEVEL - 1) * STREAK_UP câu
  let level = 1, streak = 0, steps = 0;
  while (level < MAX_LEVEL && steps < 100) {
    steps++; streak++;
    const nl = nextLevel(level, streak, 0);
    if (nl !== level) { level = nl; streak = 0; }
  }
  report(lvOk && steps === (MAX_LEVEL - 1) * STREAK_UP,
    `Đổi cấp: đúng ${STREAK_UP} liền lên cấp, sai ${WRONG_DOWN} liền xuống cấp, tới cấp ${MAX_LEVEL} sau ${steps} câu`);
}
