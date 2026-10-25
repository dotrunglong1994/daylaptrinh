const ROUNDS = 8;

// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để thử sinh đề ngẫu nhiên)
// balance = thêm quả cân cho cân thăng bằng, find = tìm số trong hộp quà 🎁
const LEVELS = {
  1: { tasks: ['balance', 'find'], max: 10, tray: [1, 2, 5], boxes: [1] },
  2: { tasks: ['balance', 'find', 'find'], max: 20, tray: [1, 2, 5, 10], boxes: [1] },
  3: { tasks: ['balance', 'find', 'find', 'find'], max: 30, tray: [1, 2, 5, 10], boxes: [1, 2, 2, 3] },
};

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const sum = (items) => items.reduce((s, it) => s + it, 0);

// Chia total thành 2 quả cân nếu đủ lớn, để bé phải cộng hai bên
function split(total, parts) {
  if (parts < 2 || total < 4) return [total];
  const a = rand(1, total - 1);
  return [a, total - a];
}

function makeTask(levelId) {
  const L = LEVELS[levelId];
  const type = pick(L.tasks);
  if (type === 'balance') {
    const n = rand(2, 3);
    let left;
    do left = Array.from({ length: n }, () => rand(1, Math.min(9, Math.floor(L.max / 2))));
    while (sum(left) > L.max || sum(left) < 4);
    return { type, left, right: [], tray: L.tray };
  }
  const k = pick(L.boxes);
  let x;
  let a;
  do {
    x = rand(1, levelId === 1 ? 6 : 9);
    a = rand(1, levelId === 1 ? 5 : 9);
  } while (k * x + a > L.max);
  const total = k * x + a;
  const parts = levelId === 1 ? 1 : 2;
  return { type, k, x, left: split(a, levelId === 3 && k === 1 ? 2 : 1), right: split(total, parts) };
}

// Đáp án nhiễu: số gần đúng, quên trừ, quên chia cho số hộp
function findOptions(task) {
  const { k, x } = task;
  const total = sum(task.right);
  const a = sum(task.left);
  const cands = shuffle([x + 1, x - 1, x + 2, x - 2, total, total - a, x * k]);
  const out = [];
  for (const v of cands) if (out.length < 3 && v > 0 && v !== x && !out.includes(v)) out.push(v);
  while (out.length < 3) {
    const v = rand(1, x + 5);
    if (v !== x && !out.includes(v)) out.push(v);
  }
  return shuffle([x, ...out]);
}
// LEVELS-END

const PRAISE = ['Thăng bằng rồi! ⚖️', 'Chính xác!', 'Giỏi quá!', 'Bé tính siêu ghê!'];
const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#748ffc', '#da77f2', '#f783ac', '#3bc9db', '#a9e34b'];
const weightColor = (v) => COLORS[(v - 1) % COLORS.length];

const $ = (s) => document.querySelector(s);
const state = {
  level: 1, sound: true, voice: true,
  round: 0, score: 0, firstTry: 0, wrongs: 0, task: null, locked: false, busy: false, timer: 0,
  angle: 0, anim: 0,
};

function loadBest() {
  try { return JSON.parse(localStorage.getItem('balance-best') || '{}'); } catch { return {}; }
}
function saveBest(best) {
  try { localStorage.setItem('balance-best', JSON.stringify(best)); } catch {}
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
  clunk: () => tone(220, 0.12, { type: 'triangle', vol: 0.15, to: 160 }),
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

/* ---------- Vẽ cái cân (SVG) ---------- */
const PIVOT = { x: 200, y: 80 };
const HALF = 140; // nửa chiều dài đòn cân
const HANG = 90; // dây treo đĩa cân

function itemsSvg(items, side) {
  // items: [{ v, box, revealed, tap }]
  return items.map((it, i) => {
    const row = Math.floor(i / 3);
    const inRow = Math.min(3, items.length - row * 3);
    const x = ((i % 3) - (inRow - 1) / 2) * 36;
    const y = HANG - 32 * (row + 1);
    const cls = ['item', it.box ? 'box' : '', it.revealed ? 'revealed' : '', it.tap ? 'tap' : ''].join(' ');
    const fill = it.box ? '' : `fill="${weightColor(it.v)}"`;
    const label = it.box && !it.revealed ? '🎁' : it.v;
    return `<g class="${cls}" data-side="${side}" data-i="${i}">` +
      `<rect x="${x - 16}" y="${y}" width="32" height="30" rx="7" ${fill}/>` +
      `<text x="${x}" y="${y + 15}">${label}</text></g>`;
  }).join('');
}

function panSvg(id, items, side) {
  return `<g id="${id}"><line class="rope" x1="0" y1="0" x2="-62" y2="${HANG}"/><line class="rope" x1="0" y1="0" x2="62" y2="${HANG}"/>` +
    `<path class="dish" d="M-72,${HANG} Q0,${HANG + 30} 72,${HANG} Z"/>${itemsSvg(items, side)}</g>`;
}

function renderScale(left, right) {
  $('#scaleWrap').innerHTML =
    `<svg class="scale" viewBox="0 -80 400 380" aria-hidden="true">` +
    `<rect class="base" x="130" y="268" width="140" height="18" rx="8"/>` +
    `<rect class="post" x="192" y="${PIVOT.y}" width="16" height="190" rx="4"/>` +
    `<g id="beam"><rect class="beam" x="${PIVOT.x - HALF - 6}" y="${PIVOT.y - 6}" width="${HALF * 2 + 12}" height="12" rx="6"/></g>` +
    panSvg('panL', left, 'L') + panSvg('panR', right, 'R') +
    `<circle class="pivot" cx="${PIVOT.x}" cy="${PIVOT.y}" r="10"/></svg>`;
  setAngle(state.angle);
}

function setAngle(deg) {
  state.angle = deg;
  const r = (deg * Math.PI) / 180;
  const dx = HALF * Math.cos(r);
  const dy = HALF * Math.sin(r);
  $('#beam')?.setAttribute('transform', `rotate(${deg} ${PIVOT.x} ${PIVOT.y})`);
  $('#panL')?.setAttribute('transform', `translate(${PIVOT.x - dx} ${PIVOT.y - dy})`);
  $('#panR')?.setAttribute('transform', `translate(${PIVOT.x + dx} ${PIVOT.y + dy})`);
}

// Bên phải nặng hơn thì đòn cân nghiêng sang phải (góc dương)
const tiltFor = (leftSum, rightSum) => Math.max(-18, Math.min(18, (rightSum - leftSum) * 3));

// Nghiêng tới góc mới, lắc nhẹ như cân thật
function tiltTo(target) {
  cancelAnimationFrame(state.anim);
  const from = state.angle;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / 900);
    setAngle(target + (from - target) * Math.exp(-5 * p) * Math.cos(9 * p));
    if (p < 1) state.anim = requestAnimationFrame(step);
    else setAngle(target);
  };
  state.anim = requestAnimationFrame(step);
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
  do t = makeTask(state.level); while (state.task && JSON.stringify(t) === JSON.stringify(state.task));
  Object.assign(state, { task: t, wrongs: 0, locked: false, busy: false });
  cancelAnimationFrame(state.anim); // dừng cân đang lắc của câu trước
  $('#hint').textContent = '';
  $('#equation').classList.remove('solved');
  updateHud();
  if (t.type === 'balance') startBalance();
  else startFind();
  readQuestion();
}

function readQuestion() {
  const t = state.task;
  if (!t) return;
  if (t.type === 'balance') speak('Thêm quả cân vào bên phải để cân thăng bằng nhé!');
  else speak(`${t.k > 1 ? 'Mỗi hộp quà nặng bằng nhau. ' : ''}${equationText(t, '?').replace(/🎁/g, 'hộp quà')}. Hộp quà nặng bao nhiêu?`);
}

const leftItems = (t, reveal) => [
  ...Array.from({ length: t.k ?? 0 }, () => ({ box: true, v: reveal, revealed: reveal != null })),
  ...t.left.map((v) => ({ v })),
];

function equationText(t, boxLabel) {
  const left = [...Array(t.k ?? 0).fill(boxLabel), ...t.left].join(' + ');
  const right = t.right.length ? t.right.join(' + ') : '?';
  return `${left} = ${right}`;
}

/* ---------- Dạng 1: thêm quả cân ---------- */
function startBalance() {
  const t = state.task;
  $('#question').textContent = 'Thêm quả cân vào bên phải để cân thăng bằng!';
  state.angle = tiltFor(sum(t.left), 0);
  drawBalance();
  $('#options').innerHTML =
    `<p class="tray-label">Chạm để đặt quả cân lên đĩa bên phải:</p><div class="tray">` +
    t.tray.map((v) => `<button data-add="${v}" style="background:${weightColor(v)}">${v}</button>`).join('') +
    '</div><button id="doneBtn" class="big go">Xong rồi ✅</button>';
  window.mascotSay('Chạm vào quả cân trên đĩa để bỏ ra nhé!', null, '', 0);
}

function drawBalance() {
  const t = state.task;
  $('#equation').textContent = equationText(t);
  renderScale(t.left.map((v) => ({ v })), t.right.map((v) => ({ v, tap: !state.locked })));
  tiltTo(tiltFor(sum(t.left), sum(t.right)));
}

$('#scaleWrap').addEventListener('click', (e) => {
  const t = state.task;
  const item = e.target.closest('.item.tap');
  if (!t || t.type !== 'balance' || state.locked || !item) return;
  t.right.splice(Number(item.dataset.i), 1);
  sfx.clunk();
  drawBalance();
});

/* ---------- Dạng 2: tìm số trong hộp quà ---------- */
function startFind() {
  const t = state.task;
  $('#question').textContent = t.k > 1
    ? `Các hộp quà 🎁 nặng bằng nhau. Mỗi hộp nặng bao nhiêu?`
    : 'Cân đang thăng bằng. Hộp quà 🎁 nặng bao nhiêu?';
  state.angle = 0;
  drawFind(null);
  $('#options').innerHTML = findOptions(t).map((v) => `<button class="opt" data-v="${v}">${v}</button>`).join('');
  window.mascotSay('Hai bên cân nặng bằng nhau đó!', null, '', 0);
}

function drawFind(reveal) {
  const t = state.task;
  $('#equation').innerHTML = equationText(t, `<span class="box">${reveal ?? '🎁'}</span>`);
  renderScale(leftItems(t, reveal), t.right.map((v) => ({ v })));
}

$('#options').addEventListener('click', (e) => {
  const t = state.task;
  const btn = e.target.closest('button');
  if (!t || !btn || btn.disabled || state.locked || state.busy) return;

  if (btn.dataset.add) {
    if (t.right.length >= 9) return window.mascotSay('Đĩa cân đầy rồi!', 'sad', 'soft', 0);
    t.right.push(Number(btn.dataset.add));
    sfx.clunk();
    return drawBalance();
  }
  if (btn.id === 'doneBtn') return checkBalance();

  // Thử một đáp án: hiện số lên hộp quà và để cân tự nghiêng
  const v = Number(btn.dataset.v);
  drawFind(v);
  const leftSum = t.k * v + sum(t.left);
  tiltTo(tiltFor(leftSum, sum(t.right)));
  sfx.clunk();
  if (v === t.x) {
    btn.classList.add('right');
    $('#equation').classList.add('solved');
    return correct();
  }
  btn.disabled = true;
  btn.classList.add('wrong');
  miss(leftSum > sum(t.right)
    ? 'Bên trái nặng hơn rồi! Hộp quà phải nhẹ hơn.'
    : 'Bên trái nhẹ hơn rồi! Hộp quà phải nặng hơn.');
  if (state.wrongs >= 2) {
    const rest = sum(t.right) - sum(t.left);
    $('#hint').textContent = t.k > 1
      ? `Gợi ý: ${t.k} hộp nặng ${sum(t.right)} − ${sum(t.left)} = ${rest}, chia đều cho ${t.k} hộp`
      : `Gợi ý: lấy ${sum(t.right)} − ${sum(t.left)}`;
  }
  // Cho bé nhìn cân nghiêng một lúc rồi đặt lại như cũ
  state.busy = true;
  state.timer = setTimeout(() => {
    state.busy = false;
    drawFind(null);
    tiltTo(0);
  }, 1500);
});

function checkBalance() {
  const t = state.task;
  const l = sum(t.left);
  const r = sum(t.right);
  if (l === r) {
    state.locked = true;
    drawBalance();
    $('#equation').classList.add('solved');
    return correct();
  }
  if (!t.right.length) return window.mascotSay('Bé đặt quả cân lên đĩa bên phải trước nhé!', 'sad', 'soft', 0);
  miss(r < l ? `Bên phải còn nhẹ hơn ${l - r} đó!` : `Bên phải nặng hơn ${r - l} rồi, bỏ bớt ra nhé!`);
}

function correct() {
  state.locked = true;
  state.score += state.wrongs === 0 ? 10 : 5;
  if (state.wrongs === 0) state.firstTry++;
  sfx.win();
  const msg = PRAISE[rand(0, PRAISE.length - 1)];
  window.mascotSay(msg, 'cheer', 'good', 0);
  speak(msg.replace(/[^\p{L}\p{N}\s!,.]/gu, ''));
  updateHud();
  state.timer = setTimeout(nextTask, 1600);
}

function miss(text) {
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

  $('#resultTitle').textContent = stars === 3 ? 'Bậc thầy cân! 🎉' : stars === 2 ? 'Giỏi lắm! 👏' : 'Cố lên nhé! 💪';
  $('#stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#rCorrect').innerHTML = `Đúng ngay lần đầu: <b>${state.firstTry}</b>/${ROUNDS}`;
  $('#rScore').textContent = state.score;
  $('#rBest').textContent = isRecord ? '🏆 Kỷ lục mới!' : `🏆 Kỷ lục: ${prev} điểm`;
  show('result');
  sfx.fanfare();
  confetti(stars * 30);
  window.reportResult?.({ gameId: 'can-thang-bang', stars, score: state.score });
  speak(stars === 3 ? 'Tuyệt vời! Bé là bậc thầy cân!' : `Bé được ${stars} sao. Cố lên nhé!`);
}

function confetti(count) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};` +
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
