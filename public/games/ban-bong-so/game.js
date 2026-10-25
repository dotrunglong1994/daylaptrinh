const TOTAL = 10; // số câu ở chế độ luyện tập
const TIME_LIMIT = 60; // giây ở chế độ thử thách
const OPS = { '+': 'cộng', '−': 'trừ', '×': 'nhân', '÷': 'chia' };
const COLORS = ['#ff5e7e', '#ffb627', '#4cc9f0', '#52c47a', '#b388eb', '#ff8c42'];
const PRAISE = ['Giỏi quá!', 'Tuyệt vời!', 'Đúng rồi!', 'Xuất sắc!', 'Siêu ghê!'];
const COMFORT = ['Gần đúng rồi!', 'Thử lại nhé!', 'Không sao đâu!'];
// Phạm vi số cho từng mức độ: cộng/trừ dùng max, nhân/chia dùng bảng [a] × [b]
const LEVELS = {
  1: { max: 10, table: [2, 5], times: [1, 5], speed: 40 },
  2: { max: 20, table: [2, 9], times: [1, 10], speed: 52 },
  3: { max: 100, table: [6, 10], times: [2, 10], speed: 64 },
};

const $ = (s) => document.querySelector(s);
const field = $('#field');

const state = {
  op: '+', level: 1, mode: 'practice', sound: true, voice: true,
  q: null, qIndex: 0, score: 0, combo: 0, firstTry: 0, correctCount: 0, wrongs: 0,
  timeLeft: 0, lastSec: 0, ended: true,
  locked: false, balloons: [], raf: 0, last: 0, nextTimer: 0,
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
const balloonSize = () => (field.clientWidth < 520 ? 68 : 86);

function loadBest() {
  try { return JSON.parse(localStorage.getItem('bbs-best') || '{}'); } catch { return {}; }
}
function saveBest(best) {
  try { localStorage.setItem('bbs-best', JSON.stringify(best)); } catch {}
}
const bestKey = () => `${state.mode}|${state.op}|${state.level}`;

/* ---------- Âm thanh (tự tổng hợp, không cần file) ---------- */
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
  pop: () => tone(900, 0.12, { type: 'triangle', to: 200, vol: 0.25 }),
  win: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, { delay: 0.08 + i * 0.08, vol: 0.12 })),
  wrong: () => tone(260, 0.3, { type: 'square', to: 140, vol: 0.05 }),
  tick: () => tone(1200, 0.05, { type: 'square', vol: 0.05 }),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, { type: 'triangle', delay: i * 0.14, vol: 0.12 })),
};

/* ---------- Đọc đề bằng giọng tiếng Việt (nếu máy có) ---------- */
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
const readQuestion = () => state.q && speak(`${state.q.a} ${OPS[state.q.op]} ${state.q.b} bằng mấy?`);

/* ---------- Sinh đề ---------- */
function makeQuestion() {
  const L = LEVELS[state.level];
  let q;
  do {
    const op = state.op === 'mix' ? pick(Object.keys(OPS)) : state.op;
    let a, b, ans;
    if (op === '+') { a = rand(1, L.max - 1); b = rand(1, L.max - a); ans = a + b; }
    if (op === '−') { a = rand(2, L.max); b = rand(1, a); ans = a - b; }
    if (op === '×') { a = rand(...L.table); b = rand(...L.times); ans = a * b; }
    if (op === '÷') { b = rand(...L.table); ans = rand(...L.times); a = b * ans; }
    q = { a, b, op, ans };
  } while (state.q && q.a === state.q.a && q.b === state.q.b && q.op === state.q.op);
  return q;
}

// Đáp án nhiễu: gần đáp án đúng hoặc là lỗi sai hay gặp (nhầm phép tính, lệch một bảng)
function distractors(q, n) {
  const { a, b, op, ans } = q;
  const cands = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10];
  if (op === '+') cands.push(Math.abs(a - b));
  if (op === '−') cands.push(a + b);
  if (op === '×') cands.push(a * (b + 1), a * (b - 1), a + b);
  if (op === '÷') cands.push(ans * 2, a - b);
  const out = new Set();
  for (const v of shuffle(cands)) {
    if (out.size >= n) break;
    if (v >= 0 && v !== ans) out.add(v);
  }
  while (out.size < n) {
    const v = ans + rand(-6, 6);
    if (v >= 0 && v !== ans) out.add(v);
  }
  return [...out];
}

/* ---------- Điều hướng màn hình ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function renderMenuBest() {
  const best = loadBest()[bestKey()];
  $('#menuBest').textContent = best ? `🏆 Kỷ lục bài này: ${best} điểm` : '';
}

for (const group of ['ops', 'levels', 'modes']) {
  document.querySelector(`.${group}`).addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    btn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    if (btn.dataset.op) state.op = btn.dataset.op;
    if (btn.dataset.level) state.level = Number(btn.dataset.level);
    if (btn.dataset.mode) state.mode = btn.dataset.mode;
    renderMenuBest();
  });
}

/* ---------- Vòng chơi ---------- */
function startGame() {
  Object.assign(state, {
    q: null, qIndex: 0, score: 0, combo: 0, firstTry: 0, correctCount: 0,
    timeLeft: TIME_LIMIT, lastSec: TIME_LIMIT, ended: false,
  });
  show('game');
  field.style.setProperty('--bs', `${balloonSize()}px`);
  cancelAnimationFrame(state.raf);
  state.last = performance.now();
  state.raf = requestAnimationFrame(loop);
  nextQuestion();
  mascotSay(state.mode === 'timed' ? 'Sẵn sàng! 60 giây nhé!' : 'Cùng chơi nào!', 'cheer');
}

function stopGame() {
  state.ended = true;
  clearTimeout(state.nextTimer);
  cancelAnimationFrame(state.raf);
  clearBalloons();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function nextQuestion() {
  if (state.ended) return;
  clearBalloons();
  if (state.mode === 'practice' && state.qIndex >= TOTAL) return endGame();
  state.qIndex++;
  state.wrongs = 0;
  state.locked = false;
  const q = (state.q = makeQuestion());
  const qEl = $('#question');
  qEl.innerHTML = `${q.a} ${q.op} ${q.b} = <span class="qmark">?</span>`;
  qEl.classList.remove('bump', 'solved');
  void qEl.offsetWidth; // chạy lại animation
  qEl.classList.add('bump');
  spawnBalloons(q);
  updateHud();
  readQuestion();
}

function spawnBalloons(q) {
  const n = field.clientWidth < 520 ? 4 : 5;
  const values = shuffle([q.ans, ...distractors(q, n - 1)]);
  const colors = shuffle(COLORS.slice());
  const H = field.clientHeight;
  const ramp = Math.min(state.qIndex, 20) * 0.03; // nhanh dần, tối đa +60%
  const speed = LEVELS[state.level].speed * (1 + ramp);
  state.balloons = values.map((value, lane) => {
    const el = document.createElement('div');
    el.className = 'balloon';
    el.style.setProperty('--c', colors[lane % colors.length]);
    el.innerHTML = `<div class="body">${value}</div>`;
    const b = {
      el, value, lane,
      y: H * 0.5 + Math.random() * H * 0.55,
      speed: speed * (0.85 + Math.random() * 0.3),
      phase: Math.random() * Math.PI * 2,
      dead: false,
    };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(b); });
    field.appendChild(el);
    return b;
  });
}

function clearBalloons() {
  for (const b of state.balloons) b.el.remove();
  state.balloons = [];
}

function loop(t) {
  const dt = Math.min(0.05, (t - state.last) / 1000);
  state.last = t;

  if (state.mode === 'timed') {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      return endGame();
    }
    const sec = Math.ceil(state.timeLeft);
    if (sec !== state.lastSec) {
      state.lastSec = sec;
      if (sec <= 5) sfx.tick();
      if (sec === 10) mascotSay('Nhanh lên nào! ⏱️', 'cheer', 'soft');
    }
    updateHud();
  }

  const W = field.clientWidth;
  const H = field.clientHeight;
  const size = balloonSize();
  const laneW = W / Math.max(state.balloons.length, 1);
  const sway = Math.max(0, Math.min(12, (laneW - size) / 2));
  for (const b of state.balloons) {
    b.y -= b.speed * dt;
    // Bóng bay khỏi màn hình thì quay lại từ dưới, nên đáp án đúng không bao giờ bị mất
    if (b.y < -(size * 1.2 + 60)) b.y = H + Math.random() * 60;
    b.phase += dt * 1.6;
    const x = laneW * b.lane + (laneW - size) / 2 + Math.sin(b.phase) * sway;
    b.el.style.transform = `translate(${x}px, ${b.y}px)`;
  }
  state.raf = requestAnimationFrame(loop);
}

function hit(b) {
  if (state.locked || state.ended || b.dead) return;
  if (b.value === state.q.ans) correct(b);
  else wrong(b);
}

function correct(b) {
  state.locked = true;
  b.dead = true;
  b.el.classList.add('pop');
  burst(b);
  sfx.pop();
  sfx.win();

  const gain = 10 + state.combo * 2;
  state.combo++;
  state.score += gain;
  state.correctCount++;
  if (state.wrongs === 0) state.firstTry++;

  floatText(`+${gain}`, b);
  const qEl = $('#question');
  qEl.querySelector('.qmark').textContent = state.q.ans;
  qEl.classList.add('solved');
  if (state.combo >= 3) {
    mascotSay(`Combo ${state.combo}! 🔥`, 'cheer');
    speak(`Combo ${state.combo}!`);
  } else {
    const praise = pick(PRAISE);
    mascotSay(praise, 'happy');
    speak(praise);
  }

  for (const other of state.balloons) if (other !== b) other.el.classList.add('away');
  updateHud();
  // Chế độ thử thách chuyển câu nhanh hơn để không phí thời gian
  state.nextTimer = setTimeout(nextQuestion, state.mode === 'timed' ? 650 : 1100);
}

function wrong(b) {
  b.dead = true;
  b.el.classList.add('wrong');
  sfx.wrong();
  state.combo = 0;
  state.wrongs++;
  // Sai 2 lần thì cho quả bóng đúng phát sáng để bé không bị nản
  if (state.wrongs >= 2) {
    state.balloons.find((x) => x.value === state.q.ans)?.el.classList.add('hint');
    mascotSay('Nhìn quả bóng sáng kìa! ✨', 'sad', 'soft');
  } else {
    mascotSay(pick(COMFORT), 'sad', 'soft');
  }
  updateHud();
}

function starsFor() {
  if (state.mode === 'timed') return state.correctCount >= 15 ? 3 : state.correctCount >= 8 ? 2 : 1;
  return state.firstTry >= 9 ? 3 : state.firstTry >= 6 ? 2 : 1;
}

function endGame() {
  state.ended = true;
  clearTimeout(state.nextTimer);
  cancelAnimationFrame(state.raf);
  clearBalloons();

  const stars = starsFor();
  const best = loadBest();
  const prev = best[bestKey()] || 0;
  const isRecord = state.score > prev;
  if (isRecord) { best[bestKey()] = state.score; saveBest(best); }

  $('#resultTitle').textContent = stars === 3 ? 'Tuyệt vời! 🎉' : stars === 2 ? 'Giỏi lắm! 👏' : 'Cố lên nhé! 💪';
  $('#stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#rCorrect').innerHTML = state.mode === 'timed'
    ? `Trả lời đúng: <b>${state.correctCount}</b> câu trong ${TIME_LIMIT} giây`
    : `Đúng ngay lần đầu: <b>${state.firstTry}</b>/${TOTAL}`;
  $('#rScore').textContent = state.score;
  $('#rBest').textContent = isRecord ? '🏆 Kỷ lục mới!' : `🏆 Kỷ lục: ${prev} điểm`;
  show('result');
  sfx.fanfare();
  confetti(stars * 30);
  window.reportResult?.({ gameId: 'ban-bong-so', stars, score: state.score });
  speak(stars === 3 ? 'Tuyệt vời! Bé được ba sao!' : `Bé được ${stars} sao. Cố lên nhé!`);
}

/* ---------- Hiệu ứng ---------- */
function centerOf(b) {
  const r = b.el.firstElementChild.getBoundingClientRect();
  const f = field.getBoundingClientRect();
  return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
}

function burst(b) {
  const { x, y } = centerOf(b);
  const color = b.el.style.getPropertyValue('--c');
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const angle = (i / 14) * Math.PI * 2;
    const dist = 50 + Math.random() * 40;
    s.style.cssText = `left:${x - 6}px;top:${y - 6}px;background:${i % 2 ? color : '#ffe066'};` +
      `--dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px`;
    field.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }
}

function floatText(text, b) {
  const { x, y } = centerOf(b);
  const el = document.createElement('span');
  el.className = 'float';
  el.textContent = text;
  el.style.left = `${x - 24}px`;
  el.style.top = `${y - 20}px`;
  field.appendChild(el);
  setTimeout(() => el.remove(), 950);
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
  const hud = $('.hud');
  if (state.mode === 'timed') {
    $('#progressFill').style.width = `${(state.timeLeft / TIME_LIMIT) * 100}%`;
    $('#progressText').textContent = `⏱️ ${Math.ceil(state.timeLeft)} giây · ${state.correctCount} câu đúng`;
    hud.classList.toggle('hurry', state.timeLeft <= 10);
  } else {
    $('#progressFill').style.width = `${((state.qIndex - (state.locked ? 0 : 1)) / TOTAL) * 100}%`;
    $('#progressText').textContent = `Câu ${state.qIndex}/${TOTAL}`;
    hud.classList.remove('hurry');
  }
  $('#score').textContent = state.score;
  $('#combo').textContent = state.combo >= 2 ? `🔥 x${state.combo}` : '';
}

/* ---------- Nút bấm ---------- */
$('#startBtn').addEventListener('click', startGame);
$('#againBtn').addEventListener('click', startGame);
$('#menuBtn').addEventListener('click', () => { show('menu'); renderMenuBest(); });
$('#homeBtn').addEventListener('click', () => { stopGame(); show('menu'); renderMenuBest(); });
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
window.addEventListener('resize', () => field.style.setProperty('--bs', `${balloonSize()}px`));

renderMenuBest();
