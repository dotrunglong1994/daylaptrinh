const MS_PER_STEP = 260;
const MS_PER_TURN = 220;

// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
const MAX_STEPS = 6;
const MAX_LOOP = 8;
// Lệnh: ['fd', n] = đi tới n bước (vẽ nét), ['rt', góc] = quay phải, ['lt', góc] = quay trái.
// solution = lời giải mẫu, hình mẫu được vẽ từ chính lời giải này nên màn nào cũng giải được.
// loop = số lần lặp của lời giải (màn có vòng lặp), slots = số lệnh tối đa bé được dùng.
const LEVELS = [
  { name: 'Đường thẳng', turns: [90], slots: 4, solution: [['fd', 3]],
    tip: 'Rùa đang nhìn lên trên. Bấm ⬆️ Đi, rồi chạm vào lệnh để đổi số bước!' },
  { name: 'Chữ L', turns: [90], slots: 5, solution: [['fd', 3], ['rt', 90], ['fd', 2]],
    tip: 'Vẽ xong nét dọc thì quay phải rồi đi tiếp nhé!' },
  { name: 'Hình vuông', turns: [90], slots: 9, solution: [['fd', 3], ['rt', 90], ['fd', 3], ['rt', 90], ['fd', 3], ['rt', 90], ['fd', 3]],
    tip: 'Hình vuông có 4 cạnh bằng nhau và 4 góc vuông.' },
  { name: 'Vuông bằng vòng lặp', turns: [90], loop: 4, slots: 3, solution: [['fd', 3], ['rt', 90]],
    tip: 'Mới: vòng lặp! Chỉ cần viết 1 cạnh và 1 lần quay, rồi cho lặp lại.' },
  { name: 'Hình chữ nhật', turns: [90], loop: 2, slots: 5, solution: [['fd', 4], ['rt', 90], ['fd', 2], ['rt', 90]],
    tip: 'Cạnh dài, quay, cạnh ngắn, quay… rồi lặp lại!' },
  { name: 'Cầu thang', turns: [90], loop: 3, slots: 5, solution: [['fd', 1], ['rt', 90], ['fd', 1], ['lt', 90]],
    tip: 'Mỗi bậc: đi lên, quay phải, đi ngang, quay trái.' },
  { name: 'Tam giác', turns: [120], loop: 3, slots: 3, solution: [['fd', 4], ['rt', 120]],
    tip: 'Tam giác đều quay 120° ở mỗi góc!' },
  { name: 'Lục giác', turns: [60], loop: 6, slots: 3, solution: [['fd', 2], ['rt', 60]],
    tip: 'Tổ ong có 6 cạnh, mỗi góc quay 60°. Lặp lại mấy lần nhỉ?' },
];

// Rùa bắt đầu ở (0, 0) nhìn lên trên (hướng 0°), trục y hướng xuống như SVG
function trace(program, loops = 1) {
  let x = 0;
  let y = 0;
  let h = 0;
  const moves = [];
  for (let r = 0; r < loops; r++) {
    for (let i = 0; i < program.length; i++) {
      const [op, v] = program[i];
      if (op === 'fd') {
        const rad = (h * Math.PI) / 180;
        const nx = x + v * Math.sin(rad);
        const ny = y - v * Math.cos(rad);
        moves.push({ op, i, from: [x, y], to: [nx, ny], n: v, h });
        x = nx;
        y = ny;
      } else {
        const nh = h + (op === 'rt' ? v : -v);
        moves.push({ op, i, from: [x, y], to: [x, y], h0: h, h: nh });
        h = nh;
      }
    }
  }
  return moves;
}

// Chia mỗi nét thành các đoạn dài 1 bước để "đi 3" và "đi 1" ba lần được coi là giống nhau
const round = (v) => (Math.abs(v) < 1e-9 ? 0 : Math.round(v * 100) / 100);
function unitKeys(move) {
  const keys = [];
  for (let k = 0; k < move.n; k++) {
    const p = (t) => [round(move.from[0] + ((move.to[0] - move.from[0]) * t) / move.n), round(move.from[1] + ((move.to[1] - move.from[1]) * t) / move.n)];
    const a = p(k).join(',');
    const b = p(k + 1).join(',');
    keys.push(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return keys;
}
const drawingOf = (moves) => new Set(moves.filter((m) => m.op === 'fd').flatMap(unitKeys));
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, target: null, program: [], loopN: 2, running: false, runToken: 0, sound: true, turtle: { x: 0, y: 0, h: 0 } };

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('turtle-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('turtle-progress', JSON.stringify(p)); } catch {}
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
  add: () => tone(660, 0.08, { type: 'triangle', vol: 0.12 }),
  draw: () => tone(520, 0.06, { type: 'triangle', vol: 0.05 }),
  turn: () => tone(380, 0.06, { type: 'sine', vol: 0.06 }),
  fail: () => tone(220, 0.35, { type: 'sawtooth', to: 110, vol: 0.07 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);

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

/* ---------- Khung vẽ ---------- */
function renderCanvas() {
  const moves = trace(state.level.solution, state.level.loop ?? 1);
  const pts = [[0, 0], ...moves.map((m) => m.to)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 4) + 3;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;

  let dots = '';
  for (let x = Math.ceil(x0); x <= x0 + size; x++) {
    for (let y = Math.ceil(y0); y <= y0 + size; y++) dots += `<circle class="dot" cx="${x}" cy="${y}" r=".06"/>`;
  }
  const target = moves.filter((m) => m.op === 'fd')
    .map((m) => `<line class="target" x1="${m.from[0]}" y1="${m.from[1]}" x2="${m.to[0]}" y2="${m.to[1]}"/>`).join('');

  const canvas = $('#canvas');
  canvas.setAttribute('viewBox', `${x0} ${y0} ${size} ${size}`);
  canvas.innerHTML = `${dots}${target}<g id="ink"></g>` +
    `<g id="turtle"><circle class="turtle-leg" cx="-.32" cy="-.22" r=".13"/><circle class="turtle-leg" cx=".32" cy="-.22" r=".13"/>` +
    `<circle class="turtle-leg" cx="-.32" cy=".26" r=".13"/><circle class="turtle-leg" cx=".32" cy=".26" r=".13"/>` +
    `<circle class="turtle-head" cx="0" cy="-.5" r=".17"/><ellipse class="turtle-shell" cx="0" cy="0" rx=".34" ry=".4"/>` +
    `<circle class="turtle-spot" cx="0" cy="0" r=".13"/></g>`;
  placeTurtle(0, 0, 0);
}

function placeTurtle(x, y, h) {
  state.turtle = { x, y, h };
  $('#turtle').setAttribute('transform', `translate(${x} ${y}) rotate(${h})`);
}

function clearInk() {
  $('#ink').innerHTML = '';
  placeTurtle(0, 0, 0);
}

// Chạy một hoạt ảnh theo thời gian, gọi frame(p) với p từ 0 tới 1
function animate(ms, frame, token) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = (t) => {
      if (token !== state.runToken) return resolve(false);
      const p = Math.min(1, (t - t0) / ms);
      frame(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve(true);
    };
    requestAnimationFrame(step);
  });
}

/* ---------- Chương trình ---------- */
const cmdIcon = ([op, v]) => (op === 'fd' ? `⬆️<small>Đi</small><b>${v}</b>` : `${op === 'rt' ? '↪️' : '↩️'}<small>${v}°</small>`);

function renderPalette() {
  const turns = state.level.turns;
  $('#palette').innerHTML = '<button data-cmd="fd,1" title="Đi tới">⬆️</button>' +
    turns.map((a) => `<button class="turn" data-cmd="rt,${a}" title="Quay phải ${a}°">↪️<br>${a}°</button>` +
      `<button class="turn" data-cmd="lt,${a}" title="Quay trái ${a}°">↩️<br>${a}°</button>`).join('');
}

function renderProgram(activeIdx = -1) {
  const L = state.level;
  const blocks = state.program.map((c, i) =>
    `<div class="blk${i === activeIdx ? ' active' : ''}" data-i="${i}">` +
    `<button class="blk-main" title="${c[0] === 'fd' ? 'Chạm để đổi số bước' : ''}">${cmdIcon(c)}</button>` +
    `<button class="blk-del" title="Xóa lệnh">✕</button></div>`
  );
  const empty = Array(Math.max(0, L.slots - state.program.length)).fill('<div class="slot"></div>');
  $('#program').innerHTML = blocks.join('') + empty.join('');
  $('#slotInfo').textContent = `${state.program.length}/${L.slots} lệnh`;
  $('#loopN').textContent = state.loopN;
}

function setRunning(running) {
  state.running = running;
  $('#play').classList.toggle('running', running);
  document.querySelectorAll('#palette button, #clearBtn, #loopDec, #loopInc').forEach((b) => (b.disabled = running));
  $('#runBtn').textContent = running ? '⏹️ Dừng' : '▶️ Vẽ';
}

function edited() {
  clearInk();
  renderProgram();
}

$('#palette').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || state.running) return;
  if (state.program.length >= state.level.slots) {
    say(state.level.loop ? 'Hết chỗ rồi! Dùng vòng lặp để viết ngắn hơn nhé 💡' : 'Hết chỗ rồi! Xóa bớt lệnh nhé.', 'sad', 'soft');
    return;
  }
  const [op, v] = btn.dataset.cmd.split(',');
  state.program.push([op, Number(v)]);
  sfx.add();
  edited();
});

$('#program').addEventListener('click', (e) => {
  if (state.running) return;
  const blk = e.target.closest('.blk');
  if (!blk) return;
  const i = Number(blk.dataset.i);
  if (e.target.closest('.blk-del')) state.program.splice(i, 1);
  else if (state.program[i][0] === 'fd') state.program[i][1] = (state.program[i][1] % MAX_STEPS) + 1;
  else return;
  sfx.add();
  edited();
});

$('#loopDec').addEventListener('click', () => { state.loopN = Math.max(2, state.loopN - 1); sfx.add(); edited(); });
$('#loopInc').addEventListener('click', () => { state.loopN = Math.min(MAX_LOOP, state.loopN + 1); sfx.add(); edited(); });

$('#clearBtn').addEventListener('click', () => {
  state.program = [];
  edited();
  say(state.level.tip);
});

/* ---------- Vẽ ---------- */
async function run() {
  if (state.running) {
    state.runToken++;
    setRunning(false);
    edited();
    return;
  }
  if (!state.program.length) return say('Bé thêm lệnh cho rùa trước nhé!', 'sad', 'soft');
  const token = ++state.runToken;
  setRunning(true);
  clearInk();
  say('Rùa bắt đầu vẽ! 🎨', 'cheer');

  const moves = trace(state.program, state.level.loop ? state.loopN : 1);
  const ink = $('#ink');
  for (const m of moves) {
    renderProgram(m.i);
    if (m.op === 'fd') {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'ink');
      line.setAttribute('x1', m.from[0]);
      line.setAttribute('y1', m.from[1]);
      line.dataset.keys = unitKeys(m).join(' ');
      ink.appendChild(line);
      sfx.draw();
      const ok = await animate(m.n * MS_PER_STEP, (p) => {
        const x = m.from[0] + (m.to[0] - m.from[0]) * p;
        const y = m.from[1] + (m.to[1] - m.from[1]) * p;
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        placeTurtle(x, y, m.h);
      }, token);
      if (!ok) return;
    } else {
      sfx.turn();
      const ok = await animate(MS_PER_TURN, (p) => placeTurtle(m.from[0], m.from[1], m.h0 + (m.h - m.h0) * p), token);
      if (!ok) return;
    }
  }
  renderProgram();
  await wait(250);
  if (token !== state.runToken) return;
  check(moves);
}

function check(moves) {
  const drawn = drawingOf(moves);
  const target = state.target;
  let bad = 0;
  document.querySelectorAll('#ink .ink').forEach((line) => {
    const good = line.dataset.keys.split(' ').every((k) => target.has(k));
    line.classList.add(good ? 'good' : 'bad');
    if (!good) bad++;
  });
  const missing = [...target].filter((k) => !drawn.has(k)).length;
  setRunning(false);
  if (!bad && !missing) return win();

  sfx.fail();
  const loopHint = state.level.loop ? ' Thử đổi số lần lặp xem!' : '';
  if (!drawn.size) say('Rùa chưa vẽ nét nào! Thêm lệnh ⬆️ Đi nhé.', 'sad', 'soft');
  else if (bad) say('Nét màu đỏ bị lệch khỏi hình mẫu rồi! Sửa lệnh nhé.', 'sad', 'soft');
  else say(`Gần xong rồi! Còn thiếu ${missing} đoạn nữa.${loopHint}`, 'sad', 'soft');
}

function win() {
  sfx.win();
  const blocks = state.program.length;
  const par = state.level.solution.length;
  const stars = blocks <= par ? 3 : blocks <= par + 2 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'hoa-si-rua', stars, score: totalStars, progressText: `${done}/${LEVELS.length} màn`,
  });

  say(`Rùa vẽ xong ${state.level.name.toLowerCase()}! 🎉`, 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = stars === 3
    ? `Bé dùng ${blocks} lệnh, gọn gàng nhất!`
    : `Bé dùng ${blocks} lệnh. Thử dùng ${par} lệnh để được 3 sao nhé!`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Màn tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 700);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.level = LEVELS[idx];
  state.target = drawingOf(trace(state.level.solution, state.level.loop ?? 1));
  state.program = [];
  state.loopN = 2;
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Màn ${idx + 1}: ${state.level.name}`;
  $('#loopBox').classList.toggle('plain', !state.level.loop);
  show('play');
  setRunning(false);
  renderCanvas();
  renderPalette();
  renderProgram();
  say(state.level.tip, 'happy');
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

renderLevelGrid();
