// LEVELS-START
// Phần logic thuần (không DOM): sinh đề theo cấp, đổi cấp.
const MAX_LEVEL = 8;
const ROUND_SEC = 60;
const STREAK_UP = 3;    // đúng liền 3 câu → lên cấp
const WRONG_DOWN = 2;   // sai liền 2 lần → xuống cấp
const NEG_LEVEL = 7;    // từ cấp này mới có thể có đáp án âm

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const add = (a, b) => ({ text: `${a} + ${b}`, answer: a + b });
const sub = (a, b) => ({ text: `${a} − ${b}`, answer: a - b });
const mul = (a, b) => ({ text: `${a} × ${b}`, answer: a * b });
const div = (b, q) => ({ text: `${b * q} ÷ ${b}`, answer: q });
// Trừ không âm: số lớn trước
const subPos = (x, y) => (x >= y ? sub(x, y) : sub(y, x));
// Phép nhân có thể đảo thứ tự hai thừa số
const mulAny = (rand, a, b) => (rand() < 0.5 ? mul(a, b) : mul(b, a));

// Mỗi cấp: danh sách cách sinh đề, chọn ngẫu nhiên một cách
const KINDS = {
  1: [
    (r) => add(ri(r, 1, 9), ri(r, 1, 9)),
    (r) => subPos(ri(r, 1, 9), ri(r, 1, 9)),
  ],
  2: [
    (r) => (r() < 0.5 ? add(ri(r, 10, 19), ri(r, 1, 9)) : add(ri(r, 1, 9), ri(r, 10, 19))),
    (r) => sub(ri(r, 11, 19), ri(r, 2, 9)),
    (r) => mulAny(r, ri(r, 2, 5), ri(r, 2, 9)),
  ],
  3: [
    (r) => add(ri(r, 20, 99), ri(r, 2, 9)),
    (r) => sub(ri(r, 20, 99), ri(r, 2, 9)),
    (r) => mulAny(r, ri(r, 2, 9), ri(r, 2, 9)),
  ],
  4: [
    (r) => add(ri(r, 11, 89), ri(r, 11, 49)),
    (r) => subPos(ri(r, 11, 99), ri(r, 11, 99)),
    (r) => mulAny(r, ri(r, 3, 9), ri(r, 3, 9)),
    (r) => div(ri(r, 2, 9), ri(r, 2, 9)),
  ],
  5: [
    (r) => add(ri(r, 15, 99), ri(r, 15, 99)),
    (r) => subPos(ri(r, 15, 99), ri(r, 15, 99)),
    (r) => mulAny(r, ri(r, 2, 9), ri(r, 11, 19)),
    (r) => div(ri(r, 3, 9), ri(r, 3, 12)),
  ],
  6: [
    (r) => add(ri(r, 100, 899), ri(r, 11, 99)),
    (r) => sub(ri(r, 100, 999), ri(r, 11, 99)),
    (r) => mulAny(r, ri(r, 3, 9), ri(r, 12, 49)),
    (r) => div(ri(r, 3, 9), ri(r, 11, 19)),
    (r) => { const p = mul(ri(r, 2, 9), ri(r, 2, 9)); const c = ri(r, 2, 30); return { text: `${p.text} + ${c}`, answer: p.answer + c }; },
    (r) => { const p = mul(ri(r, 3, 9), ri(r, 3, 9)); const c = ri(r, 2, p.answer); return { text: `${p.text} − ${c}`, answer: p.answer - c }; },
  ],
  7: [
    (r) => add(ri(r, 101, 599), ri(r, 101, 399)),
    // Có thể ra số âm (khoảng 1/3 số đề)
    (r) => { const a = ri(r, 101, 999), b = ri(r, 101, 999); return r() < 0.35 ? sub(Math.min(a, b), Math.max(a, b)) : subPos(a, b); },
    (r) => mulAny(r, ri(r, 3, 9), ri(r, 21, 99)),
    (r) => div(ri(r, 4, 9), ri(r, 12, 30)),
    (r) => { const p = mul(ri(r, 4, 9), ri(r, 4, 9)); const c = ri(r, 5, 60); return { text: `${p.text} − ${c}`, answer: p.answer - c }; },
    (r) => { const d = div(ri(r, 3, 9), ri(r, 3, 12)); const c = ri(r, 5, 49); return { text: `${d.text} + ${c}`, answer: d.answer + c }; },
  ],
  8: [
    (r) => { const a = ri(r, 101, 999), b = ri(r, 101, 999); return r() < 0.4 ? sub(Math.min(a, b), Math.max(a, b)) : add(a, b); },
    (r) => { const p = mul(ri(r, 3, 9), ri(r, 11, 29)); const c = ri(r, 11, 99); return r() < 0.5 ? { text: `${p.text} + ${c}`, answer: p.answer + c } : { text: `${p.text} − ${c}`, answer: p.answer - c }; },
    (r) => { const p = mul(ri(r, 3, 9), ri(r, 3, 9)); const c = ri(r, 10, 99); return { text: `${c} − ${p.text}`, answer: c - p.answer }; },
    (r) => { const d = div(ri(r, 3, 9), ri(r, 11, 25)); const c = ri(r, 11, 99); return { text: `${d.text} + ${c}`, answer: d.answer + c }; },
    (r) => { const a = ri(r, 2, 5), b = ri(r, 2, 9), c = ri(r, 2, 9); return { text: `${a} × ${b} × ${c}`, answer: a * b * c }; },
  ],
};

function makeProblem(level, rand = Math.random) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, level));
  const p = pick(rand, KINDS[lv])(rand);
  return { text: p.text, answer: p.answer, level: lv };
}

// streak: số câu đúng liên tiếp tính từ lần đổi cấp gần nhất; wrongInRow: số lần sai liên tiếp
function nextLevel(level, streak, wrongInRow) {
  if (wrongInRow >= WRONG_DOWN) return Math.max(1, level - 1);
  if (streak >= STREAK_UP) return Math.min(MAX_LEVEL, level + 1);
  return level;
}

const pointsFor = (level) => 10 * level;
// LEVELS-END

const $ = (s) => document.querySelector(s);

// Trạng thái lượt chơi (đặt lại trong startRun)
const S = {
  run: 0, level: 1, maxLevel: 1, score: 0, right: 0, wrong: 0, skipped: 0,
  streak: 0, wrongInRow: 0, problem: null, input: '', neg: false, left: ROUND_SEC, busy: false,
};

const game = createBrainGame({
  id: 'tinh-nham-nhanh',
  title: '⚡ Tính Nhẩm Nhanh',
  skill: 'Tốc độ',
  intro: `<p>Giải càng nhiều phép tính càng tốt trong <b>60 giây</b>. Gõ đáp án bằng bàn phím trên màn hình
    hoặc bàn phím máy, <b>đủ số chữ số là tự chấm</b>, không cần Enter.</p>
    <p>Đúng liền ${STREAK_UP} câu thì lên cấp (tối đa ${MAX_LEVEL}), sai liền ${WRONG_DOWN} lần thì xuống cấp.
    Mỗi câu đúng được <b>10 × cấp</b> điểm. Từ cấp ${NEG_LEVEL} có đáp án âm: bấm <b>−</b> trước.
    <b>Bỏ qua</b> không trừ điểm hay thời gian, chỉ mất chuỗi đúng.</p>`,
  start: startRun,
});

const board = $('#board');
const problemEl = $('#problem');
const answerEl = $('#answer');
const streakEl = $('#streak');
board.addEventListener('animationend', () => board.classList.remove('flash-good', 'flash-bad'));

function renderHud() {
  game.hud(`<div class="${S.left <= 10 ? 'low' : ''}">${S.left}<span> giây</span></div><div>${S.score}<span> điểm</span></div><div><span>Cấp </span><b class="lv">${S.level}</b></div>`);
}
function renderStreak() {
  streakEl.innerHTML = Array.from({ length: STREAK_UP }, (_, i) => `<i class="${i < S.streak ? 'on' : ''}"></i>`).join('');
  streakEl.style.visibility = S.level >= MAX_LEVEL ? 'hidden' : 'visible';
}
function renderAnswer() {
  const need = String(Math.abs(S.problem?.answer ?? 0)).length;
  const typed = (S.neg ? '−' : '') + S.input;
  const slots = '_'.repeat(Math.max(0, need - S.input.length));
  answerEl.innerHTML = `${typed}${S.input.length < need ? '<span class="caret"></span>' : ''}<span class="slot">${slots.slice(1)}</span>`;
}
function renderProblem() {
  problemEl.innerHTML = `${S.problem.text} <span class="eq">=</span>`;
  renderAnswer();
}
function flash(cls) {
  board.classList.remove('flash-good', 'flash-bad');
  void board.offsetWidth;
  board.classList.add(cls);
}

function newProblem() {
  let p;
  do p = makeProblem(S.level); while (S.problem && p.text === S.problem.text);
  S.problem = p;
  S.input = '';
  S.neg = false;
  S.shownAt = performance.now();
  renderProblem();
}

function setLevel(lv) {
  if (lv !== S.level) {
    S.level = lv;
    S.streak = 0;
    S.wrongInRow = 0;
    S.maxLevel = Math.max(S.maxLevel, lv);
  }
}

function judge() {
  const value = (S.neg ? -1 : 1) * Number(S.input);
  if (value === S.problem.answer) {
    S.right++;
    S.score += pointsFor(S.problem.level);
    S.streak++;
    S.wrongInRow = 0;
    game.sfx.good();
    flash('flash-good');
    setLevel(nextLevel(S.level, S.streak, S.wrongInRow));
    newProblem();
  } else {
    S.wrong++;
    S.streak = 0;
    S.wrongInRow++;
    game.sfx.bad();
    flash('flash-bad');
    setLevel(nextLevel(S.level, S.streak, S.wrongInRow));
    // Giữ nguyên câu, xóa ô nhập
    S.input = '';
    S.neg = false;
    renderAnswer();
  }
  renderHud();
  renderStreak();
}

function press(k) {
  if (!game.alive() || !S.problem) return;
  const need = String(Math.abs(S.problem.answer)).length;
  if (k === 'del') {
    if (S.input) S.input = S.input.slice(0, -1);
    else S.neg = false;
  } else if (k === '-') {
    if (!S.input) S.neg = !S.neg;
  } else if (/^\d$/.test(k)) {
    if (S.input.length >= need) return;
    if (S.input === '0') S.input = k; // không gõ số 0 thừa ở đầu
    else S.input += k;
  }
  renderAnswer();
  if (S.input.length === need && !(S.input === '0' && need > 1)) judge();
}

function skip() {
  if (!game.alive() || !S.problem) return;
  S.skipped++;
  S.streak = 0;
  renderStreak();
  newProblem();
}

$('#pad').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]');
  if (b) press(b.dataset.k);
});
$('#skipBtn').addEventListener('click', skip);

document.addEventListener('keydown', (e) => {
  if (!game.alive() || e.ctrlKey || e.metaKey || e.altKey) return;
  let k = null;
  if (/^\d$/.test(e.key)) k = e.key;
  else if (e.key === '-' || e.key === 'Subtract' || e.key === '−') k = '-';
  else if (e.key === 'Backspace' || e.key === 'Delete') k = 'del';
  if (!k) return;
  e.preventDefault();
  press(k);
  const btn = document.querySelector(`.pad button[data-k="${k}"]`);
  if (btn) { btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 90); }
});

const fmtSec = (x) => `${x.toFixed(1).replace('.', ',')} giây`;

async function startRun() {
  const run = ++S.run;
  Object.assign(S, {
    level: 1, maxLevel: 1, score: 0, right: 0, wrong: 0, skipped: 0,
    streak: 0, wrongInRow: 0, problem: null, input: '', neg: false, left: ROUND_SEC,
  });
  board.classList.remove('flash-good', 'flash-bad');
  newProblem();
  renderStreak();
  renderHud();
  const done = await game.timer(ROUND_SEC, (left) => {
    if (run !== S.run) return;
    S.left = left;
    renderHud();
    if (left > 0 && left <= 5) game.sfx.tick();
  });
  if (!done || run !== S.run) return;
  game.end(S.score, [
    ['Đúng', S.right],
    ['Sai', S.wrong],
    ['Cấp cao nhất', S.maxLevel],
    ['TB mỗi câu', S.right ? fmtSec(ROUND_SEC / S.right) : '—'],
  ]);
}
