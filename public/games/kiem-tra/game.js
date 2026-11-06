// LEVELS-START (scripts/checks/kiem-tra.mjs đọc đoạn này để kiểm tra từng bài)
// Mỗi lớp một bài 10 câu, mỗi câu một dạng (trộn toán và lập trình). Bé chỉ được trả lời mỗi câu một lần.
// Mỗi dạng câu: (rand) => { q, ans, options } với options[0] là đáp án đúng, 4 đáp án khác nhau.
const QUESTIONS = 10;

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const r2 = (x) => Math.round(x * 100) / 100;
const dec = (x) => String(r2(x)).replace('.', ',');

// Đáp án đúng đứng đầu rồi 3 đáp án nhiễu khác nhau (giữ thứ tự ưu tiên), số không âm
function nums(ans, list) {
  const out = [ans];
  for (const x of list.map(r2)) if (Number.isFinite(x) && x >= 0 && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) if (!out.includes(ans + d)) out.push(ans + d);
  return out;
}
function words(ans, list) {
  return [ans, ...list.filter((x, i) => x !== ans && list.indexOf(x) === i).slice(0, 3)];
}
const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const FRUITS = ['🍎', '🍌', '🍓', '🥕', '🐟', '⭐'];
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };

const GRADES = [
  // Lớp 1
  [
    (rand) => { const a = ri(rand, 1, 6), b = ri(rand, 1, 10 - a); return { q: `${a} + ${b} = ?`, ans: a + b, options: nums(a + b, [a + b + 1, a + b - 1, a + b + 2]) }; },
    (rand) => { const a = ri(rand, 5, 10), b = ri(rand, 1, a - 1); return { q: `${a} − ${b} = ?`, ans: a - b, options: nums(a - b, [a + b, a - b + 1, a - b - 1]) }; },
    (rand) => { const a = ri(rand, 10, 15), b = ri(rand, 1, 19 - a); return { q: `${a} + ${b} = ?`, ans: a + b, options: nums(a + b, [a + b + 1, a + b - 1, a + b + 10]) }; },
    (rand) => { const n = ri(rand, 4, 9), f = pick(rand, FRUITS); return { q: `Có mấy hình? ${f.repeat(n)}`, ans: n, options: nums(n, [n - 1, n + 1, n + 2]) }; },
    (rand) => {
      const a = ri(rand, 0, 10), b = pick(rand, [a, ri(rand, 0, 10)]);
      const ans = a > b ? '>' : a < b ? '<' : '=';
      return { q: `Điền dấu: ${a} … ${b}`, ans, options: words(ans, ['>', '<', '=', '≠']) };
    },
    (rand) => {
      const n = ri(rand, 11, 18), after = rand() < 0.5;
      const ans = after ? n + 1 : n - 1;
      return { q: `Số liền ${after ? 'sau' : 'trước'} của ${n} là số nào?`, ans, options: nums(ans, [after ? n - 1 : n + 1, n, ans + 2]) };
    },
    (rand) => {
      const h = ri(rand, 1, 11);
      return { q: `Kim ngắn chỉ số ${h}, kim dài chỉ số 12. Đồng hồ chỉ mấy giờ?`, ans: `${h} giờ`, options: words(`${h} giờ`, ['12 giờ', `${h + 1} giờ`, `${(h + 5) % 12 || 12} giờ`, `${h} giờ rưỡi`]) };
    },
    (rand) => {
      const [name, ask] = pick(rand, [['Hình tam giác', 'có 3 cạnh'], ['Hình vuông', 'có 4 cạnh bằng nhau'], ['Hình tròn', 'không có cạnh nào']]);
      return { q: `Hình nào ${ask}?`, ans: name, options: words(name, ['Hình tam giác', 'Hình vuông', 'Hình tròn', 'Hình chữ nhật']) };
    },
    (rand) => {
      const s = ri(rand, 1, 4), k = ri(rand, 2, 4);
      return { q: `Ếch đứng ở ô số ${s}. Ếch nhảy theo lệnh ${'➡️ '.repeat(k).trim()}, mỗi mũi tên một ô. Ếch tới ô số mấy?`, ans: s + k, options: nums(s + k, [k, s + k - 1, s + k + 1]) };
    },
    (rand) => { const u = ri(rand, 1, 9); return { q: `Số gồm 1 chục và ${u} đơn vị là số nào?`, ans: 10 + u, options: nums(10 + u, [u, 1 + u, 10 + u + 1]) }; },
  ],
  // Lớp 2
  [
    (rand) => { const a = ri(rand, 15, 69), b = ri(rand, 6, 29); const s = a + b; return s < 100 && (a % 10) + (b % 10) >= 10 ? { q: `${a} + ${b} = ?`, ans: s, options: nums(s, [s - 10, s + 10, s - 1]) } : GRADES[1][0](rand); },
    (rand) => { const a = ri(rand, 40, 95), b = ri(rand, 6, 29); return (a % 10) < (b % 10) ? { q: `${a} − ${b} = ?`, ans: a - b, options: nums(a - b, [a - b + 10, a - b - 10, a - b + 1]) } : GRADES[1][1](rand); },
    (rand) => { const a = pick(rand, [2, 5]), b = ri(rand, 2, 10); return { q: `${a} × ${b} = ?`, ans: a * b, options: nums(a * b, [a + b, a * b + a, a * b - a]) }; },
    (rand) => { const a = pick(rand, [2, 5]), b = ri(rand, 2, 10); return { q: `${a * b} : ${a} = ?`, ans: b, options: nums(b, [b + 1, b - 1, a * b - a]) }; },
    (rand) => { const n = ri(rand, 2, 9); return { q: `${n} dm = ? cm`, ans: n * 10, options: nums(n * 10, [n, n * 100, n + 10]) }; },
    (rand) => { const a = ri(rand, 2, 9), b = ri(rand, 1, 9); return { q: `Túi gạo nặng ${a} kg, túi đường nặng ${b} kg. Cả hai túi nặng bao nhiêu ki-lô-gam?`, ans: a + b, options: nums(a + b, [Math.abs(a - b), a * b, a + b + 1]) }; },
    (rand) => {
      const d = ri(rand, 0, 6), k = ri(rand, 2, 4);
      const ans = DAYS[(d + k) % 7];
      return { q: `Hôm nay là ${DAYS[d]}. ${k} ngày nữa là thứ mấy?`, ans, options: words(ans, [DAYS[(d + k + 1) % 7], DAYS[(d + k + 6) % 7], DAYS[(d + k + 2) % 7]]) };
    },
    (rand) => {
      const a = ri(rand, 2, 6), b = ri(rand, 1, 3);
      const ans = `${(a + b) * 1000} đồng`;
      return { q: `Bút chì giá ${a}000 đồng, tẩy giá ${b}000 đồng. Mua cả hai hết bao nhiêu tiền?`, ans, options: words(ans, [`${(a - b) * 1000} đồng`, `${(a + b) * 100} đồng`, `${(a + b + 1) * 1000} đồng`]) };
    },
    (rand) => { const n = ri(rand, 2, 5), k = ri(rand, 2, 4); return { q: `Chương trình: LẶP LẠI ${n} LẦN [vỗ tay ${k} cái]. Bé vỗ tay tất cả mấy cái?`, ans: n * k, options: nums(n * k, [n + k, n * k + k, k]) }; },
    (rand) => { const t = ri(rand, 2, 9), u = ri(rand, 1, 9); return { q: `Số ${t}${u} gồm mấy chục?`, ans: t, options: nums(t, [u, t * 10, t + u]) }; },
  ],
  // Lớp 3
  [
    (rand) => { const a = ri(rand, 6, 9), b = ri(rand, 3, 9); return { q: `${a} × ${b} = ?`, ans: a * b, options: nums(a * b, [a * b + a, a * b - b, a + b]) }; },
    (rand) => { const a = ri(rand, 6, 9), b = ri(rand, 3, 9); return { q: `${a * b} : ${a} = ?`, ans: b, options: nums(b, [b + 1, b - 1, a]) }; },
    (rand) => { const a = ri(rand, 101, 312), b = ri(rand, 2, 3); return { q: `${a} × ${b} = ?`, ans: a * b, options: nums(a * b, [a * b + 10, a * b - 100, a + b]) }; },
    (rand) => { const a = ri(rand, 5, 15), b = ri(rand, 2, a - 1); return { q: `Hình chữ nhật dài ${a} cm, rộng ${b} cm. Chu vi là bao nhiêu xăng-ti-mét?`, ans: 2 * (a + b), options: nums(2 * (a + b), [a + b, a * b, 2 * a + b]) }; },
    (rand) => { const d = pick(rand, [2, 3, 4, 5]), k = ri(rand, 3, 9); return { q: `1/${d} của ${d * k} là bao nhiêu?`, ans: k, options: nums(k, [d * k * d, k + d, d * k - d]) }; },
    (rand) => { const n = ri(rand, 2, 9); return { q: `${n} cm = ? mm`, ans: n * 10, options: nums(n * 10, [n * 100, n, n + 10]) }; },
    (rand) => {
      const h = ri(rand, 6, 9), m = pick(rand, [5, 10, 15, 20]), add = pick(rand, [20, 25, 30, 35]);
      const ans = `${h} giờ ${m + add} phút`;
      return { q: `Phim bắt đầu lúc ${h} giờ ${m} phút và dài ${add} phút. Phim kết thúc lúc mấy giờ?`, ans, options: words(ans, [`${h + 1} giờ ${m + add} phút`, `${h} giờ ${add} phút`, `${h} giờ ${m + add + 10} phút`]) };
    },
    (rand) => {
      const n = ri(rand, 3, 15);
      const ans = n % 2 === 0 ? n + 1 : n * 2;
      return { q: `NẾU số là số chẵn THÌ cộng thêm 1, NGƯỢC LẠI nhân với 2. Bắt đầu với số ${n}, kết quả là?`, ans, options: nums(ans, [n % 2 === 0 ? n * 2 : n + 1, n, ans + 2]) };
    },
    (rand) => {
      const a = ri(rand, 1, 9), d = ri(rand, 2, 6);
      const seq = [0, 1, 2, 3].map((i) => a + i * d);
      return { q: `Tìm số tiếp theo: ${seq.join(', ')}, …`, ans: a + 4 * d, options: nums(a + 4 * d, [a + 4 * d + 1, a + 3 * d + 1, a + 5 * d]) };
    },
    (rand) => { const n = ri(rand, 4, 12); return { q: `Số La Mã ${ROMAN[n]} là số mấy?`, ans: n, options: nums(n, [n + 2, n - 2, n === 9 ? 11 : n === 11 ? 9 : n + 1]) }; },
  ],
  // Lớp 4
  [
    (rand) => {
      const n = ri(rand, 10, 98) * 1000 + ri(rand, 1, 999);
      const ans = Math.round(n / 1000) * 1000;
      return { q: `Làm tròn số ${n} đến hàng nghìn.`, ans, options: nums(ans, [Math.floor(n / 1000) * 1000 === ans ? ans + 1000 : ans - 1000, Math.round(n / 100) * 100, Math.round(n / 10000) * 10000]) };
    },
    (rand) => { const a = ri(rand, 12, 39), b = ri(rand, 11, 25); return { q: `${a} × ${b} = ?`, ans: a * b, options: nums(a * b, [a * b + a, a * b - b * 10, a * (b % 10) + a]) }; },
    (rand) => { const d = ri(rand, 3, 9), k = ri(rand, 21, 99); return { q: `${d * k} : ${d} = ?`, ans: k, options: nums(k, [k + 10, k - 1, k * 10]) }; },
    (rand) => {
      const m = ri(rand, 5, 11), a = ri(rand, 1, 3), b = ri(rand, 1, m - a - 1);
      const ans = `${a + b}/${m}`;
      return { q: `${a}/${m} + ${b}/${m} = ?`, ans, options: words(ans, [`${a + b}/${m * 2}`, `${a * b}/${m}`, `${a + b + 1}/${m}`, `${a + b}/${m + 1}`]) };
    },
    (rand) => {
      const big = rand() < 0.5;
      const ans = big ? '1/2' : '1/8';
      return { q: `Phân số nào ${big ? 'lớn' : 'bé'} nhất?`, ans, options: words(ans, ['1/2', '1/3', '1/5', '1/8']) };
    },
    (rand) => {
      const deg = pick(rand, [30, 45, 60, 90, 120, 135, 150, 180]);
      const ans = deg < 90 ? 'Góc nhọn' : deg === 90 ? 'Góc vuông' : deg < 180 ? 'Góc tù' : 'Góc bẹt';
      return { q: `Góc ${deg}° là góc gì?`, ans, options: words(ans, ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']) };
    },
    (rand) => {
      const avg = ri(rand, 12, 40), d = ri(rand, 2, 9);
      const xs = [avg - d, avg, avg + d];
      return { q: `Trung bình cộng của ${xs.join(', ')} là?`, ans: avg, options: nums(avg, [avg * 3, avg + d, avg - 1]) };
    },
    (rand) => {
      const a = ri(rand, 2, 9), b = ri(rand, 2, 9);
      const ans = (a + b) * 2;
      return { q: `x = ${a}; x = x + ${b}; x = x × 2. Cuối cùng x bằng bao nhiêu?`, ans, options: nums(ans, [a + b * 2, a + b, a * 2 + b]) };
    },
    (rand) => { const a = ri(rand, 4, 15), b = ri(rand, 3, a - 1); return { q: `Mảnh vườn hình chữ nhật dài ${a} m, rộng ${b} m. Diện tích là bao nhiêu mét vuông?`, ans: a * b, options: nums(a * b, [2 * (a + b), a + b, a * b + a]) }; },
    (rand) => { const n = ri(rand, 2, 9); return { q: `${n} phút = ? giây`, ans: n * 60, options: nums(n * 60, [n * 100, n * 10, n * 60 + 60]) }; },
  ],
  // Lớp 5
  [
    (rand) => { const a = r2(ri(rand, 11, 59) / 10), b = r2(ri(rand, 101, 399) / 100); const s = r2(a + b); return { q: `${dec(a)} + ${dec(b)} = ?`, ans: s, options: nums(s, [r2(s + 0.1), r2(s - 1), r2(s + 1)]) }; },
    (rand) => { const a = r2(ri(rand, 101, 999) / 100), k = pick(rand, [10, 100]); const s = r2(a * k); return { q: `${dec(a)} × ${k} = ?`, ans: s, options: nums(s, [r2(a * (k === 10 ? 100 : 10)), r2(a / 10), r2(s + 1)]) }; },
    (rand) => { const p = pick(rand, [10, 20, 25, 50, 75]), n = pick(rand, [40, 80, 120, 200]); const s = (p * n) / 100; return { q: `${p}% của ${n} là bao nhiêu?`, ans: s, options: nums(s, [n - s, p, s * 2]) }; },
    // Hình học: diện tích tam giác, hình thang, chu vi hoặc diện tích hình tròn (như game Xưởng Hình)
    (rand) => {
      const kind = pick(rand, ['tri', 'trap', 'circC', 'circS']);
      if (kind === 'tri') {
        const a = ri(rand, 3, 12), h = ri(rand, 2, 8) * 2;
        return { q: `Tam giác có đáy ${a} cm, chiều cao ${h} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?`, ans: (a * h) / 2, options: nums((a * h) / 2, [a * h, a + h, (a * h) / 2 + a]) };
      }
      if (kind === 'trap') {
        const b = ri(rand, 3, 9), a = b + ri(rand, 2, 8), h = ri(rand, 1, 5) * 2;
        const s = ((a + b) * h) / 2;
        return { q: `Hình thang có hai đáy ${a} cm và ${b} cm, chiều cao ${h} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?`, ans: s, options: nums(s, [(a + b) * h, a * b * h / 2, (a + b) * 2]) };
      }
      const r = ri(rand, 3, 10);
      if (kind === 'circC') {
        const c = r2(r * 2 * 3.14);
        return { q: `Hình tròn có bán kính ${r} cm. Chu vi là bao nhiêu xăng-ti-mét?`, ans: c, options: nums(c, [r * 3.14, r * r * 3.14, r * 2]) };
      }
      const area = r2(r * r * 3.14);
      return { q: `Hình tròn có bán kính ${r} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?`, ans: area, options: nums(area, [r * 2 * 3.14, r * 3.14, r * r]) };
    },
    (rand) => { const a = ri(rand, 2, 9), b = ri(rand, 2, 6), c = ri(rand, 2, 5); return { q: `Hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${c} cm. Thể tích là bao nhiêu xăng-ti-mét khối?`, ans: a * b * c, options: nums(a * b * c, [a * b, a + b + c, (a + b) * 2 * c]) }; },
    (rand) => { const v = pick(rand, [30, 40, 45, 50, 60]), t = ri(rand, 2, 4); return { q: `Ô tô đi mỗi giờ ${v} km, đi trong ${t} giờ. Ô tô đi được bao nhiêu ki-lô-mét?`, ans: v * t, options: nums(v * t, [v + t, v * t + v, v * (t - 1)]) }; },
    (rand) => { const km = r2(ri(rand, 11, 49) / 10); const m = r2(km * 1000); return { q: `${dec(km)} km = ? m`, ans: m, options: nums(m, [r2(km * 100), r2(km * 10), r2(m + 100)]) }; },
    (rand) => {
      const list = [ri(rand, 1, 9), ri(rand, 10, 19), ri(rand, 20, 29), ri(rand, 30, 39)].sort(() => rand() - 0.5);
      const k = ri(rand, 2, 4);
      return { q: `Danh sách điểm: [${list.join(', ')}]. Phần tử thứ ${k} (đếm từ trái, bắt đầu từ 1) là?`, ans: list[k - 1], options: nums(list[k - 1], [list[k - 2], list[k % 4], list[(k + 1) % 4]]) };
    },
    (rand) => {
      const n = ri(rand, 3, 6);
      const ans = (n * (n + 1)) / 2;
      return { q: `tổng = 0; LẶP với i từ 1 đến ${n}: tổng = tổng + i. Cuối cùng tổng bằng?`, ans, options: nums(ans, [n, ans - n, ans + n + 1]) };
    },
    (rand) => {
      const [f, v] = pick(rand, [['1/2', 0.5], ['1/4', 0.25], ['3/4', 0.75], ['1/5', 0.2], ['2/5', 0.4]]);
      return { q: `Viết ${f} dưới dạng số thập phân.`, ans: v, options: nums(v, [Number(f.replace('/', '.')), r2(v * 10), r2(v + 0.5)]) };
    },
  ],
];
const LEVELS = GRADES.map((_, i) => ({ name: `Lớp ${i + 1}` }));

const makeRound = (levelIdx, k, rand = Math.random) => GRADES[levelIdx][k](rand);
const answerOf = (r) => r.ans;
// Số câu đúng → số sao: 10 câu = 3 sao, 8–9 = 2 sao, 5–7 = 1 sao
const starsOf = (score) => (score === QUESTIONS ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0);
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, i: 0, order: [], score: 0, busy: false, r: null };
const label = (x) => (typeof x === 'number' ? dec(x) : x);

const game = createGame({
  id: 'kiem-tra',
  title: '📝 Bài Kiểm Tra',
  sub: 'Mỗi lớp 10 câu, mỗi câu chỉ trả lời một lần. Đúng từ 8 câu được bằng khen!',
  levels: LEVELS.length,
  unit: 'lớp',
  winTitle: 'Nộp bài! 📝',
  free: true,
  levelLabel: (i) => `L${i + 1}`,
  start: startLevel,
});

/* ---------- Làm bài ---------- */
function startLevel(idx) {
  state.level = idx;
  state.i = 0;
  state.score = 0;
  state.busy = false;
  state.order = window.shuffle([...Array(QUESTIONS).keys()]);
  $('#cert').classList.add('hidden');
  game.say(`Bài kiểm tra lớp ${idx + 1}: 10 câu, mỗi câu chọn một lần thôi. Đọc kỹ rồi hãy chọn nhé!`);
  showQuestion();
}

function showQuestion() {
  const r = (state.r = makeRound(state.level, state.order[state.i]));
  state.busy = false;
  game.rounds(state.i, QUESTIONS);
  $('#qnum').textContent = `Câu ${state.i + 1}/${QUESTIONS} · Đúng ${state.score}`;
  $('#question').textContent = r.q;
  const opts = window.shuffle(r.options);
  $('#choices').innerHTML = opts.map((o, i) => `<button class="choice" data-i="${i}">${label(o)}</button>`).join('');
  $('#choices').onclick = async (e) => {
    const btn = e.target.closest('.choice');
    if (!btn || state.busy) return;
    state.busy = true;
    const ok = opts[Number(btn.dataset.i)] === answerOf(r);
    // Chấm như bài kiểm tra thật: đánh dấu đáp án đúng, không cho chọn lại
    for (const b of $('#choices').children) {
      b.disabled = true;
      if (opts[Number(b.dataset.i)] === answerOf(r)) b.classList.add('right');
    }
    if (ok) {
      state.score++;
      game.sfx.good();
      game.say('Đúng rồi! 🎉', 'cheer', 'good');
    } else {
      btn.classList.add('wrong');
      game.sfx.bad();
      game.say(`Đáp án đúng là ${label(answerOf(r))}. Câu sau cố lên nhé!`, 'sad', 'soft');
    }
    if (!(await game.wait(ok ? 900 : 1800))) return;
    state.i++;
    if (state.i < QUESTIONS) return showQuestion();
    finish();
  };
}

function finish() {
  game.rounds(QUESTIONS, QUESTIONS);
  const stars = starsOf(state.score);
  const text = state.score >= 8
    ? 'Xuất sắc! Bấm "Bằng khen" để xem và in bằng khen nhé.'
    : state.score >= 5 ? 'Khá lắm! Ôn lại các game của lớp này rồi làm lại để được bằng khen nhé.' : 'Bé cần ôn thêm. Chơi các game trên bản đồ rồi quay lại làm bài nhé!';
  game.win({ stars, eq: `${state.score}/${QUESTIONS} câu đúng`, text });
  $('#certBtn').classList.toggle('hidden', state.score < 8);
}

/* ---------- Bằng khen ---------- */
// Tên bé đang chơi: website lưu trong localStorage cùng origin (xem src/lib/progress.ts)
function kidName() {
  try {
    const family = JSON.parse(localStorage.getItem('dlt-family-v2'));
    const id = localStorage.getItem('bhv-kid');
    const kid = family.kids.find((k) => k.id === id) ?? family.kids[0];
    return kid?.profile?.name || 'Bé';
  } catch {
    return 'Bé';
  }
}

$('#winModal .row').insertAdjacentHTML('afterbegin', '<button id="certBtn" class="btn go hidden">📜 Bằng khen</button>');
$('#certBtn').addEventListener('click', () => {
  $('#certName').textContent = kidName();
  $('#certGrade').textContent = `lớp ${state.level + 1}`;
  $('#certScore').textContent = `${state.score}/${QUESTIONS}`;
  $('#certStars').textContent = '⭐ '.repeat(starsOf(state.score)).trim();
  $('#certDate').textContent = new Date().toLocaleDateString('vi-VN');
  $('#winModal').classList.add('hidden');
  $('#cert').classList.remove('hidden');
});
$('#printBtn').addEventListener('click', () => window.print());
$('#closeCert').addEventListener('click', () => {
  $('#cert').classList.add('hidden');
  $('#winModal').classList.remove('hidden');
});
