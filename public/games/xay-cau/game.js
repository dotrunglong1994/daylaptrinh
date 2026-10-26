const CLIFF = 64; // bề rộng mỗi vách núi (px)
const CAR_W = 48;
const MAX_PLANKS = 16;

// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Độ dài viết như "1m20cm", "5dm", "30cm". Mỗi loại ván trong kho dùng được nhiều lần.
// ruler = true: không ghi số, bé phải đếm vạch thước để đo khe.
const LEVELS = [
  { gap: '10cm', planks: ['5cm', '3cm', '2cm'], tip: 'Khe núi rộng 10 cm. Ghép ván cho vừa khít 10 cm nhé!' },
  { gap: '12cm', planks: ['5cm', '4cm', '3cm'], tip: 'Mỗi loại ván dùng được nhiều lần đó!' },
  { gap: '9cm', ruler: true, planks: ['4cm', '3cm', '2cm'], tip: 'Không có số! Bé đếm vạch trên thước để đo khe núi.' },
  { gap: '16cm', ruler: true, planks: ['6cm', '5cm', '4cm'], tip: 'Đo bằng thước trước, rồi mới chọn ván nhé.' },
  { gap: '25cm', planks: ['10cm', '5cm', '3cm'], tip: 'Khe rộng quá! Dùng ván dài cho nhanh.' },
  { gap: '1m', planks: ['50cm', '30cm', '20cm'], tip: 'Nhớ nhé: 1 m = 100 cm.' },
  { gap: '1m20cm', planks: ['50cm', '40cm', '30cm'], tip: '1 m 20 cm là bao nhiêu xăng-ti-mét nhỉ?' },
  { gap: '2m', planks: ['1m', '5dm', '20cm'], tip: '1 m = 10 dm = 100 cm. Ván 5 dm dài 50 cm đó!' },
];

const UNIT_CM = { m: 100, dm: 10, cm: 1 };

// "1m20cm" → 120 (đơn vị cm)
function parseLen(text) {
  const parts = [...text.matchAll(/(\d+)(dm|cm|m)/g)];
  if (!parts.length || parts.map((p) => p[0]).join('') !== text) throw new Error(`Độ dài sai: ${text}`);
  return parts.reduce((sum, [, n, unit]) => sum + Number(n) * UNIT_CM[unit], 0);
}

// "1m20cm" → "1 m 20 cm"
const prettyLen = (text) => text.replace(/(\d+)(dm|cm|m)/g, '$1 $2 ').trim();
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, def: null, gap: 0, kinds: [], placed: [], fails: 0, running: false, runToken: 0, sound: true };

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('bridge-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('bridge-progress', JSON.stringify(p)); } catch {}
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
  place: () => tone(330, 0.1, { type: 'square', vol: 0.06 }),
  remove: () => tone(520, 0.08, { type: 'triangle', to: 300, vol: 0.1 }),
  drive: () => tone(120, 0.6, { type: 'sawtooth', to: 180, vol: 0.04 }),
  fall: () => tone(600, 0.7, { type: 'triangle', to: 80, vol: 0.12 }),
  bad: () => tone(180, 0.3, { type: 'sawtooth', to: 90, vol: 0.08 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);
const total = () => state.placed.reduce((s, k) => s + state.kinds[k].len, 0);

/* ---------- Chọn màn ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function renderLevelGrid() {
  const progress = loadProgress();
  $('#levelGrid').innerHTML = LEVELS.map((_, i) => {
    const stars = progress[i] || 0;
    const unlocked = i === 0 || progress[i - 1];
    const starText = stars ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    return `<button data-i="${i}" class="${stars ? 'done' : ''}" ${unlocked ? '' : 'disabled'}>${unlocked ? i + 1 : '🔒'}<small>${starText}</small></button>`;
  }).join('');
  show('levels');
}

$('#levelGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn && !btn.disabled) startLevel(Number(btn.dataset.i));
});

/* ---------- Khung cảnh ---------- */
const scale = () => ($('#scene').clientWidth - 2 * CLIFF) / state.gap; // px cho mỗi cm

function renderMeasure() {
  const s = scale();
  const el = $('#measure');
  if (!state.def.ruler) {
    el.className = 'measure label';
    el.innerHTML = `<span>⟵ ${prettyLen(state.def.gap)} ⟶</span>`;
    return;
  }
  el.className = 'measure ruler';
  let html = '';
  for (let i = 0; i <= state.gap; i++) {
    html += `<i style="left:${i * s}px"></i><b style="left:${i * s}px">${i}</b>`;
  }
  el.innerHTML = html;
}

function renderBridge() {
  const s = scale();
  let end = 0;
  $('#bridge').innerHTML = state.placed.map((k, i) => {
    const kind = state.kinds[k];
    end += kind.len;
    const over = end > state.gap ? ' over' : '';
    return `<button class="plank${over}" data-i="${i}" style="width:${kind.len * s}px" title="Gỡ ván">` +
      `${kind.len * s > 44 ? kind.label : ''}</button>`;
  }).join('');
  $('#plankCount').textContent = `${state.placed.length} tấm ván`;
}

function renderShelf() {
  const max = Math.max(...state.kinds.map((k) => k.len));
  $('#shelf').innerHTML = state.kinds.map((k, i) =>
    `<button class="stock" data-k="${i}" style="width:${70 + (k.len / max) * 130}px">${k.label}</button>`,
  ).join('');
}

function placeCar(x, { y = 0, rot = 0, ms = 0 } = {}) {
  const car = $('#car');
  car.style.transition = ms ? `transform ${ms}ms ${y ? 'ease-in' : 'linear'}` : 'none';
  car.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
}

function resetCar() {
  $('#car').classList.remove('win');
  placeCar(8);
}

function renderAll() {
  renderMeasure();
  renderBridge();
  resetCar();
}

$('#shelf').addEventListener('click', (e) => {
  const btn = e.target.closest('.stock');
  if (!btn || state.running) return;
  if (state.placed.length >= MAX_PLANKS) return say('Nhiều ván quá rồi! Thử dùng ván dài hơn nhé.', 'sad', 'soft');
  state.placed.push(Number(btn.dataset.k));
  sfx.place();
  renderBridge();
});

$('#bridge').addEventListener('click', (e) => {
  const btn = e.target.closest('.plank');
  if (!btn || state.running) return;
  state.placed.splice(Number(btn.dataset.i), 1);
  sfx.remove();
  renderBridge();
});

$('#clearBtn').addEventListener('click', () => {
  if (state.running) return;
  state.placed = [];
  renderBridge();
});

/* ---------- Cho xe chạy ---------- */
function setRunning(running) {
  state.running = running;
  $('#runBtn').disabled = running;
  $('#clearBtn').disabled = running;
  $('#play').classList.toggle('running', running);
}

async function run() {
  if (state.running) return;
  if (!state.placed.length) return say('Chưa có tấm ván nào! Chạm vào ván trong kho để đặt nhé.', 'sad', 'soft');
  const token = ++state.runToken;
  setRunning(true);
  resetCar();
  const len = total();
  const s = scale();
  const sceneW = $('#scene').clientWidth;
  await wait(50);

  if (len > state.gap) {
    sfx.bad();
    $('#bridge').classList.add('wobble');
    state.fails++;
    say(`Cầu dài ${len} cm, khe chỉ ${state.gap} cm. Dư ${len - state.gap} cm nên ván không đặt vừa!`, 'sad', 'soft');
    await wait(900);
    $('#bridge').classList.remove('wobble');
    if (token === state.runToken) setRunning(false);
    return;
  }

  if (len < state.gap) {
    const edge = CLIFF + len * s - CAR_W / 2;
    const ms = Math.max(500, (edge - 8) * 4);
    sfx.drive();
    placeCar(edge, { ms });
    await wait(ms);
    if (token !== state.runToken) return;
    sfx.fall();
    placeCar(edge + 30, { y: 150, rot: 70, ms: 600 });
    state.fails++;
    say(`Ối! Cầu dài ${len} cm, còn thiếu ${state.gap - len} cm nữa mới tới bờ!`, 'sad', 'soft');
    await wait(1300);
    if (token !== state.runToken) return;
    resetCar();
    setRunning(false);
    return;
  }

  const end = sceneW - CLIFF + 8;
  const ms = (end - 8) * 4;
  sfx.drive();
  placeCar(end, { ms });
  await wait(ms);
  if (token !== state.runToken) return;
  win();
}

function win() {
  setRunning(false);
  $('#car').classList.add('win');
  sfx.win();

  const stars = state.fails === 0 ? 3 : state.fails === 1 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'xay-cau', stars, score: totalStars, progressText: `${done}/${LEVELS.length} cây cầu`,
  });

  say('Cầu vừa khít! Xe qua sông an toàn 🎉', 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winEq').textContent = `${state.placed.map((k) => state.kinds[k].label).join(' + ')} = ${prettyLen(state.def.gap)}`;
  $('#winText').textContent = stars === 3
    ? 'Xây đúng ngay lần đầu. Kỹ sư cầu đường giỏi quá!'
    : `Bé thử ${state.fails + 1} lần mới qua. Tính trước khi cho xe chạy để được 3 sao nhé!`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Màn tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 700);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.def = LEVELS[idx];
  state.gap = parseLen(state.def.gap);
  state.kinds = state.def.planks.map((p) => ({ len: parseLen(p), label: prettyLen(p) }));
  state.placed = [];
  state.fails = 0;
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Màn ${idx + 1}/${LEVELS.length}`;
  $('#gapLen').textContent = state.def.ruler ? '? cm (dùng thước đo)' : prettyLen(state.def.gap);
  show('play');
  setRunning(false);
  renderShelf();
  renderAll();
  say(state.def.tip, 'happy');
}

$('#runBtn').addEventListener('click', run);
$('#backBtn').addEventListener('click', () => { state.runToken++; setRunning(false); renderLevelGrid(); });
$('#replayBtn').addEventListener('click', () => startLevel(state.idx));
$('#nextBtn').addEventListener('click', () => {
  if (state.idx < LEVELS.length - 1) startLevel(state.idx + 1);
  else { $('#winModal').classList.add('hidden'); renderLevelGrid(); }
});
$('#soundBtn').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.currentTarget.classList.toggle('off', !state.sound);
});
window.addEventListener('resize', () => {
  if (!state.def || $('#play').classList.contains('hidden') || state.running) return;
  renderAll();
});

renderLevelGrid();
