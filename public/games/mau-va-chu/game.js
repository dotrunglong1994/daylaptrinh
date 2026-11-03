// 🎨 Màu Và Chữ: chữ tên màu được in bằng một màu khác, chọn MÀU CỦA CHỮ (hiệu ứng Stroop).
// Từ giây 30, khoảng 1/4 số câu đổi luật: chọn NGHĨA của chữ.

// LEVELS-START
const COLORS = [
  { id: 'do', name: 'ĐỎ', hex: '#ff5c5c' },
  { id: 'vang', name: 'VÀNG', hex: '#ffd43b' },
  { id: 'la', name: 'XANH LÁ', hex: '#3ddc6a' },
  { id: 'duong', name: 'XANH DƯƠNG', hex: '#4dabff' },
  { id: 'tim', name: 'TÍM', hex: '#c58bff' },
];
const ROUND_SEC = 60;
const SWITCH_FROM = 30; // giây bắt đầu có câu đổi luật
const SAME_RATE = 0.25; // tỉ lệ chữ trùng màu
const WORD_RATE = 0.25; // tỉ lệ câu "chọn nghĩa" sau giây 30
const GOOD_POINTS = 10;
const BAD_POINTS = 5;
const MAX_MULT = 4;

// Sinh một câu: word / ink là chỉ số trong COLORS. Không lặp y hệt câu trước.
function makeTrial(elapsedSec, prev, rand = Math.random) {
  const n = COLORS.length;
  for (let tries = 0; ; tries++) {
    const rule = elapsedSec >= SWITCH_FROM && rand() < WORD_RATE ? 'word' : 'ink';
    const ink = Math.floor(rand() * n);
    let word = ink;
    if (rand() >= SAME_RATE) word = (ink + 1 + Math.floor(rand() * (n - 1))) % n;
    const t = { word, ink, rule };
    if (!prev || tries > 20 || t.word !== prev.word || t.ink !== prev.ink || t.rule !== prev.rule) return t;
  }
}

// Chỉ số màu cần bấm
const answerOf = (trial) => (trial.rule === 'word' ? trial.word : trial.ink);

// Hệ số theo số câu đúng liên tiếp TRƯỚC câu này: 0–4 → x1, 5–9 → x2, 10–14 → x3, từ 15 → x4
const multOf = (streak) => Math.min(MAX_MULT, 1 + Math.floor(streak / 5));
const pointsFor = (streak) => GOOD_POINTS * multOf(streak);

// Áp dụng một câu trả lời lên state { score, streak, good, bad }
function applyAnswer(s, correct) {
  if (correct) return { ...s, score: s.score + pointsFor(s.streak), streak: s.streak + 1, good: s.good + 1 };
  return { ...s, score: Math.max(0, s.score - BAD_POINTS), streak: 0, bad: s.bad + 1 };
}

const formatSec = (ms) => `${(ms / 1000).toFixed(2).replace('.', ',')} giây`;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const cardEl = $('#card');
const wordEl = $('#word');
const ruleEl = $('#ruleLabel');
const answersEl = $('#answers');

const run = {
  id: 0, score: 0, streak: 0, good: 0, bad: 0, left: ROUND_SEC,
  startAt: 0, shownAt: 0, rtSum: 0, rtCount: 0,
  trial: null, busy: true, history: [],
};

answersEl.innerHTML = COLORS.map((c, i) => `
  <button class="ans" data-i="${i}" style="--c:${c.hex}">
    <span class="key">${i + 1}</span><span class="name">${c.name}</span>
  </button>`).join('');
const buttons = [...answersEl.querySelectorAll('.ans')];
buttons.forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.i), b)));

document.addEventListener('keydown', (e) => {
  if (!game.alive() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = Number(e.key) - 1;
  if (Number.isInteger(i) && i >= 0 && i < COLORS.length) {
    e.preventDefault();
    pick(i, buttons[i]);
  }
});

function hud() {
  game.hud(`<div>⏱ ${run.left}<span> giây</span></div><div>${run.score}<span> điểm</span></div><div class="mult m${multOf(run.streak)}">x${multOf(run.streak)}<span> chuỗi</span></div>`);
}

function flash(el, cls) {
  el.classList.remove('flash-good', 'flash-bad');
  void el.offsetWidth;
  el.classList.add(cls);
}

function show() {
  const elapsed = (performance.now() - run.startAt) / 1000;
  const t = makeTrial(elapsed, run.trial);
  run.trial = t;
  run.history.push({ ...t, at: elapsed });
  wordEl.textContent = COLORS[t.word].name;
  wordEl.style.color = COLORS[t.ink].hex;
  const isWord = t.rule === 'word';
  cardEl.classList.toggle('rule-word', isWord);
  ruleEl.innerHTML = isWord ? '⚠ Chọn <b>NGHĨA</b> của chữ' : 'Chọn <b>MÀU</b> của chữ';
  run.shownAt = performance.now();
  run.busy = false;
}

async function pick(i, btn) {
  if (!game.alive() || run.busy || !run.trial) return;
  run.busy = true;
  const id = run.id;
  run.rtSum += performance.now() - run.shownAt;
  run.rtCount++;
  const correct = i === answerOf(run.trial);
  Object.assign(run, applyAnswer(run, correct));
  if (correct) game.sfx.good(); else game.sfx.bad();
  flash(btn, correct ? 'flash-good' : 'flash-bad');
  flash(cardEl, correct ? 'flash-good' : 'flash-bad');
  hud();
  const ok = await game.wait(150);
  if (!ok || id !== run.id) return;
  show();
}

async function startRun() {
  const id = ++run.id;
  Object.assign(run, {
    score: 0, streak: 0, good: 0, bad: 0, left: ROUND_SEC,
    startAt: performance.now(), rtSum: 0, rtCount: 0, trial: null, busy: true, history: [],
  });
  cardEl.classList.remove('flash-good', 'flash-bad', 'rule-word');
  buttons.forEach((b) => b.classList.remove('flash-good', 'flash-bad'));
  hud();
  show();
  const done = await game.timer(ROUND_SEC, (left) => {
    if (id !== run.id) return;
    run.left = left;
    if (left > 0 && left <= 5) game.sfx.tick();
    hud();
  });
  if (!done || id !== run.id) return;
  run.busy = true;
  const total = run.good + run.bad;
  game.end(run.score, [
    ['Đúng', run.good],
    ['Sai', run.bad],
    ['Độ chính xác', total ? `${Math.round((run.good / total) * 100)}%` : '—'],
    ['Phản xạ TB', run.rtCount ? formatSec(run.rtSum / run.rtCount) : '—'],
  ]);
}

const game = createBrainGame({
  id: 'mau-va-chu',
  title: '🎨 Màu Và Chữ',
  skill: 'Tập trung',
  intro: `<p>Một chữ tên màu hiện ra, được in bằng một màu khác. Hãy bấm ô có <b>MÀU CỦA CHỮ</b>, đừng đọc nghĩa.</p>
    <p>Đúng liên tiếp để nhân điểm (tới x4). Từ giây 30, khi khung báo <b>“Chọn NGHĨA của chữ”</b> thì chọn theo nghĩa.</p>
    <p>Có thể dùng phím số 1–5. Lượt chơi 60 giây.</p>`,
  start: startRun,
});
