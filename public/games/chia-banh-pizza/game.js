const ROUNDS = 8;
// Dạng bài: paint = tô phân số, read = đọc phân số, share = chia đều, compare = so sánh
const LEVELS = {
  1: { tasks: ['paint', 'read'], dens: [2, 3, 4] },
  2: { tasks: ['paint', 'read', 'share'], dens: [2, 3, 4, 6, 8] },
  3: { tasks: ['paint', 'read', 'share', 'compare'], dens: [2, 3, 4, 5, 6, 8] },
};
// Các cặp phân số bằng nhau cho bài so sánh
const EQUAL_PAIRS = [[1, 2, 2, 4], [1, 2, 4, 8], [1, 3, 2, 6], [2, 4, 4, 8], [1, 4, 2, 8], [2, 3, 4, 6]];
const FRIENDS = ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼', '🐷', '🐨'];
const PRAISE = ['Giỏi quá!', 'Chính xác!', 'Ngon tuyệt! 😋', 'Bé hiểu phân số rồi!'];

const $ = (s) => document.querySelector(s);
const state = {
  level: 1, sound: true, voice: true,
  round: 0, score: 0, firstTry: 0, wrongs: 0, task: null, sel: [], locked: false, timer: 0,
};

/* ---------- Tiện ích ---------- */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const frac = (num, den) => `<span class="frac"><b>${num}</b><i></i><b>${den}</b></span>`;
const sayFrac = (num, den) => `${num} phần ${den}`;
const sameValue = (a, b) => a[0] * b[1] === a[1] * b[0];

function loadBest() {
  try { return JSON.parse(localStorage.getItem('pizza-best') || '{}'); } catch { return {}; }
}
function saveBest(best) {
  try { localStorage.setItem('pizza-best', JSON.stringify(best)); } catch {}
}

/* ---------- Âm thanh ---------- */
let actx;
function tone(freq, dur, { type = 'sine', vol = 0.15, to = null, delay = 0 } = {}) {
  if (!state.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}
const sfx = {
  tap: () => tone(520, 0.07, { type: 'triangle', vol: 0.12, to: 780 }),
  win: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, { delay: i * 0.08, vol: 0.12 })),
  wrong: () => tone(260, 0.3, { type: 'square', to: 140, vol: 0.05 }),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, { type: 'triangle', delay: i * 0.14, vol: 0.12 })),
};

/* ---------- Đọc bằng giọng tiếng Việt (nếu máy có) ---------- */
let viVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  viVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('vi')) || null;
}
pickVoice();
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;
function speak(text) {
  if (!state.voice || !viVoice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = viVoice;
  u.lang = viVoice.lang;
  u.rate = 0.95;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

/* ---------- Vẽ bánh pizza (SVG) ---------- */
const C = 100;
const R = 82;
const polar = (r, a) => [(C + r * Math.cos(a)).toFixed(2), (C + r * Math.sin(a)).toFixed(2)];
const angle = (i, den) => (i / den) * 2 * Math.PI - Math.PI / 2;

function pepperoni(i, den) {
  const mid = angle(i + 0.5, den);
  const spread = Math.PI / den;
  const spots = den <= 4
    ? [[0.55, 0], [0.28, 0], [0.8, -spread * 0.5], [0.8, spread * 0.5]]
    : [[0.45, 0], [0.78, -spread * 0.45], [0.78, spread * 0.45]];
  const r = den <= 4 ? 9 : 7;
  return spots.map(([rf, da]) => {
    const [x, y] = polar(R * rf, mid + da);
    return `<circle class="pep" cx="${x}" cy="${y}" r="${r}"/><circle class="pep-dot" cx="${x}" cy="${y}" r="1.6"/>`;
  }).join('');
}

function pizzaSvg(den, filled = [], { cut = true, tappable = false, animate = true } = {}) {
  let s = `<svg viewBox="0 0 200 200" class="pizza${animate ? ' spin' : ''}${tappable ? ' tappable' : ''}" aria-hidden="true">`;
  s += `<circle cx="${C}" cy="${C}" r="97" class="plate"/><circle cx="${C}" cy="${C}" r="${R + 9}" class="crust"/>`;
  if (!cut) return `${s}<circle cx="${C}" cy="${C}" r="${R}" class="slice"/></svg>`;
  for (let i = 0; i < den; i++) {
    const [x0, y0] = polar(R, angle(i, den));
    const [x1, y1] = polar(R, angle(i + 1, den));
    const on = filled.includes(i) ? ' on' : '';
    s += `<path class="slice${on}" data-i="${i}" d="M${C},${C} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z"/>`;
  }
  for (const i of filled) s += pepperoni(i, den);
  return `${s}</svg>`;
}

/* ---------- Sinh đề ---------- */
function makeTask() {
  const L = LEVELS[state.level];
  const type = pick(L.tasks);
  if (type === 'paint' || type === 'read') {
    const den = pick(L.dens);
    return { type, den, num: rand(1, den - 1) };
  }
  if (type === 'share') return { type, den: pick(L.dens.filter((d) => d <= 6)), num: 1 };

  const kind = pick(['sameNum', 'sameDen', 'equal']);
  let left;
  let right;
  if (kind === 'sameNum') {
    const [a, b] = shuffle(L.dens.slice());
    [left, right] = [[1, a], [1, b]];
  } else if (kind === 'sameDen') {
    const d = pick(L.dens.filter((x) => x >= 3));
    const [x, y] = shuffle(range(1, d - 1));
    [left, right] = [[x, d], [y, d]];
  } else {
    const [a, b, c, d] = pick(EQUAL_PAIRS);
    [left, right] = shuffle([[a, b], [c, d]]);
  }
  const diff = left[0] * right[1] - right[0] * left[1];
  return { type, kind, left, right, answer: diff > 0 ? 'left' : diff < 0 ? 'right' : 'equal' };
}

// 1 đáp án đúng + 3 đáp án nhiễu là các lỗi hay gặp (đảo tử/mẫu, đếm phần còn lại…)
function fracOptions(num, den) {
  const correct = [num, den];
  const cands = shuffle([[den - num, den], [num, den + 1], [num, den - 1], [den, num], [num + 1, den], [num - 1, den]]);
  const out = [];
  const add = (c) => {
    const [a, b] = c;
    if (a < 1 || b < 2 || sameValue(c, correct) || out.some((o) => o[0] === a && o[1] === b)) return;
    out.push(c);
  };
  for (const c of cands) if (out.length < 3) add(c);
  while (out.length < 3) add([rand(1, 3), rand(2, 9)]);
  return shuffle([correct, ...out]);
}

/* ---------- Điều hướng ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}
function renderMenuBest() {
  const best = loadBest()[state.level];
  $('#menuBest').textContent = best ? `🏆 Kỷ lục mức này: ${best} điểm` : '';
}
document.querySelector('.levels').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  btn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  state.level = Number(btn.dataset.level);
  renderMenuBest();
});

/* ---------- Vòng chơi ---------- */
function startGame() {
  clearTimeout(state.timer);
  Object.assign(state, { round: 0, score: 0, firstTry: 0, task: null });
  show('game');
  nextTask();
}

function nextTask() {
  if (state.round >= ROUNDS) return endGame();
  state.round++;
  let t;
  do t = makeTask(); while (state.task && JSON.stringify(t) === JSON.stringify(state.task));
  Object.assign(state, { task: t, wrongs: 0, locked: false, sel: [] });
  $('#hint').textContent = '';
  $('#friends').textContent = '';
  $('#pizzas').className = 'pizzas';
  updateHud();
  ({ paint: renderPaint, read: renderRead, share: renderShare, compare: renderCompare })[t.type]();
  readQuestion();
}

function readQuestion() {
  const t = state.task;
  if (!t) return;
  if (t.type === 'paint') speak(`Cho xúc xích lên ${sayFrac(t.num, t.den)} cái bánh`);
  if (t.type === 'read') speak('Phần bánh có xúc xích là bao nhiêu?');
  if (t.type === 'share') speak(`${t.den} bạn chia đều một cái bánh. Mỗi bạn được bao nhiêu?`);
  if (t.type === 'compare') speak('Bánh nào có nhiều xúc xích hơn?');
}

function renderFracOptions(num, den) {
  $('#options').innerHTML = fracOptions(num, den)
    .map(([a, b]) => `<button class="opt" data-a="${a}" data-b="${b}">${frac(a, b)}</button>`).join('');
}

function renderPaint(animate = true) {
  const t = state.task;
  $('#question').innerHTML = `Cho xúc xích lên ${frac(t.num, t.den)} cái bánh`;
  $('#pizzas').innerHTML = pizzaSvg(t.den, state.sel, { tappable: true, animate });
  if (animate) {
    $('#options').innerHTML = '<button id="doneBtn" class="big go">Xong rồi ✅</button>';
    window.mascotSay('Chạm vào miếng bánh để thêm xúc xích nhé!', null, '', 0);
  }
}

function renderRead() {
  const t = state.task;
  const filled = shuffle(range(0, t.den - 1)).slice(0, t.num);
  $('#question').textContent = 'Phần bánh có xúc xích là bao nhiêu?';
  $('#pizzas').innerHTML = pizzaSvg(t.den, filled);
  renderFracOptions(t.num, t.den);
  window.mascotSay('Đếm số miếng bánh thật kỹ nhé!', null, '', 0);
}

function renderShare() {
  const t = state.task;
  $('#friends').textContent = shuffle(FRIENDS.slice()).slice(0, t.den).join('');
  $('#question').textContent = `${t.den} bạn chia đều 1 cái bánh. Mỗi bạn được bao nhiêu?`;
  $('#pizzas').innerHTML = pizzaSvg(t.den, [], { cut: false });
  renderFracOptions(1, t.den);
  window.mascotSay('Chia đều nghĩa là ai cũng được phần bằng nhau!', null, '', 0);
}

function renderCompare() {
  const t = state.task;
  $('#question').textContent = 'Bánh nào có nhiều xúc xích hơn?';
  $('#pizzas').className = 'pizzas two';
  $('#pizzas').innerHTML = [['left', t.left], ['right', t.right]].map(([side, [num, den]]) =>
    `<button class="pizza-box" data-side="${side}">${pizzaSvg(den, range(0, num - 1))}${frac(num, den)}</button>`
  ).join('');
  $('#options').innerHTML = '<button class="opt text" data-side="equal">Bằng nhau 🤝</button>';
  window.mascotSay('Chạm vào bánh nhiều xúc xích hơn, hoặc chọn "Bằng nhau"!', null, '', 0);
}

/* ---------- Xử lý trả lời ---------- */
$('#pizzas').addEventListener('click', (e) => {
  const t = state.task;
  if (!t || state.locked) return;
  if (t.type === 'paint') {
    const slice = e.target.closest('.slice');
    if (!slice) return;
    const i = Number(slice.dataset.i);
    state.sel = state.sel.includes(i) ? state.sel.filter((x) => x !== i) : [...state.sel, i];
    sfx.tap();
    renderPaint(false);
  } else if (t.type === 'compare') {
    const box = e.target.closest('.pizza-box');
    if (box && !box.disabled) answerCompare(box);
  }
});

$('#options').addEventListener('click', (e) => {
  const t = state.task;
  const btn = e.target.closest('button');
  if (!t || !btn || btn.disabled || state.locked) return;
  if (btn.id === 'doneBtn') return checkPaint();
  if (t.type === 'compare') return answerCompare(btn);
  const ok = Number(btn.dataset.a) === t.num && Number(btn.dataset.b) === t.den;
  if (ok) {
    btn.classList.add('right');
    if (t.type === 'share') {
      $('#pizzas').innerHTML = pizzaSvg(t.den, range(0, t.den - 1));
      correct(`Mỗi bạn được ${sayFrac(1, t.den)} cái bánh! 🍕`);
    } else {
      correct();
    }
  } else {
    btn.disabled = true;
    btn.classList.add('wrong');
    miss();
    if (state.wrongs >= 2) {
      $('#hint').textContent = t.type === 'share'
        ? `Gợi ý: có ${t.den} bạn thì cắt bánh thành ${t.den} phần bằng nhau`
        : 'Gợi ý: số ở dưới là tổng số miếng, số ở trên là số miếng có xúc xích';
    }
  }
});

function checkPaint() {
  const t = state.task;
  const n = state.sel.length;
  if (n === t.num) return correct();
  if (n === 0) return window.mascotSay('Bé chạm vào miếng bánh trước nhé!', 'sad', 'soft', 0);
  miss(n > t.num ? `Nhiều quá rồi! Chỉ cần ${t.num} miếng thôi.` : 'Còn thiếu, thêm xúc xích nữa nhé!');
  if (state.wrongs >= 2) {
    $('#hint').innerHTML = `Gợi ý: ${frac(t.num, t.den)} là bánh chia ${t.den} phần, lấy ${t.num} phần`;
  }
}

function answerCompare(el) {
  const t = state.task;
  if (el.dataset.side === t.answer) {
    el.classList.add('right');
    correct();
    return;
  }
  el.disabled = true;
  el.classList.add('wrong');
  miss();
  if (state.wrongs >= 1) {
    $('#hint').textContent = {
      sameNum: 'Gợi ý: bánh cắt càng nhiều miếng thì mỗi miếng càng nhỏ!',
      sameDen: 'Gợi ý: hai bánh cắt bằng nhau, đếm số miếng có xúc xích nhé!',
      equal: 'Gợi ý: nhìn kỹ phần có xúc xích của hai bánh xem!',
    }[t.kind];
  }
}

function correct(message = pick(PRAISE)) {
  state.locked = true;
  state.score += state.wrongs === 0 ? 10 : 5;
  if (state.wrongs === 0) state.firstTry++;
  sfx.win();
  window.mascotSay(message, 'cheer', 'good', 0);
  speak(message.replace(/[^\p{L}\p{N}\s!,.]/gu, ''));
  updateHud();
  state.timer = setTimeout(nextTask, 1400);
}

function miss(text = pick(['Chưa đúng, thử lại nhé!', 'Gần đúng rồi!', 'Bé nhìn kỹ lại xem!'])) {
  state.wrongs++;
  sfx.wrong();
  window.mascotSay(text, 'sad', 'soft', 0);
}

function endGame() {
  const stars = state.firstTry >= ROUNDS - 1 ? 3 : state.firstTry >= ROUNDS * 0.6 ? 2 : 1;
  const best = loadBest();
  const prev = best[state.level] || 0;
  const isRecord = state.score > prev;
  if (isRecord) { best[state.level] = state.score; saveBest(best); }

  $('#resultTitle').textContent = stars === 3 ? 'Vua chia bánh! 🎉' : stars === 2 ? 'Giỏi lắm! 👏' : 'Cố lên nhé! 💪';
  $('#stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#rCorrect').innerHTML = `Đúng ngay lần đầu: <b>${state.firstTry}</b>/${ROUNDS}`;
  $('#rScore').textContent = state.score;
  $('#rBest').textContent = isRecord ? '🏆 Kỷ lục mới!' : `🏆 Kỷ lục: ${prev} điểm`;
  show('result');
  sfx.fanfare();
  confetti(stars * 30);
  window.reportResult?.({ gameId: 'chia-banh-pizza', stars, score: state.score });
  speak(stars === 3 ? 'Tuyệt vời! Bé là vua chia bánh!' : `Bé được ${stars} sao. Cố lên nhé!`);
}

function confetti(count) {
  const colors = ['#ffd166', '#f03e3e', '#d9822b', '#2bb673', '#d6336c'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};` +
      `animation-duration:${2 + Math.random() * 2}s;animation-delay:${Math.random() * 0.8}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function updateHud() {
  $('#progressFill').style.width = `${((state.round - 1) / ROUNDS) * 100}%`;
  $('#progressText').textContent = `Câu ${state.round}/${ROUNDS}`;
  $('#score').textContent = state.score;
}

/* ---------- Nút bấm ---------- */
$('#startBtn').addEventListener('click', startGame);
$('#againBtn').addEventListener('click', startGame);
$('#menuBtn').addEventListener('click', () => { show('menu'); renderMenuBest(); });
$('#homeBtn').addEventListener('click', () => {
  clearTimeout(state.timer);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  show('menu');
  renderMenuBest();
});
$('#question').addEventListener('click', readQuestion);
$('#soundBtn').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.currentTarget.classList.toggle('off', !state.sound);
});
$('#voiceBtn').addEventListener('click', (e) => {
  state.voice = !state.voice;
  e.currentTarget.classList.toggle('off', !state.voice);
  if (!state.voice && 'speechSynthesis' in window) speechSynthesis.cancel();
});

renderMenuBest();
