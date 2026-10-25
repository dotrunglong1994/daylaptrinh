const STEP_MS = 360;

// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
const DIRS = {
  up: { dx: 0, dy: -1, icon: '⬆️' },
  right: { dx: 1, dy: 0, icon: '➡️' },
  down: { dx: 0, dy: 1, icon: '⬇️' },
  left: { dx: -1, dy: 0, icon: '⬅️' },
};
const DIR_ORDER = ['up', 'right', 'down', 'left'];
const MAX_REPEAT = 8;
// Bản đồ: S = robot, G = kho báu, # = đá. buggy = chương trình có lỗi bé nhận được,
// fixed = một cách sửa đúng, bugs = số lệnh ít nhất cần sửa (đã kiểm tra bằng script).
const LEVELS = [
  { map: ['S...G'], buggy: [['right', 3]], fixed: [['right', 4]], bugs: 1,
    tip: 'Robot dừng sớm quá! Chạy thử rồi chạm vào số ×3 để sửa nhé.' },
  { map: ['S....', '.....', '....G'], buggy: [['right', 4], ['up', 2]], fixed: [['right', 4], ['down', 2]], bugs: 1,
    tip: 'Có một lệnh bị sai hướng. Chạy thử xem robot đi lạc ở đâu!' },
  { map: ['S.#..', '..#..', '....G'], buggy: [['down', 1], ['right', 4]], fixed: [['down', 2], ['right', 4]], bugs: 1,
    tip: 'Robot cứ va vào đá. Lệnh nào làm robot đi sai đường nhỉ?' },
  { map: ['S...#', '###.#', 'G....'], buggy: [['right', 3], ['down', 2], ['right', 3]], fixed: [['right', 3], ['down', 2], ['left', 3]], bugs: 1,
    tip: 'Kho báu ở bên trái mà! Tìm con bọ nào 🔍' },
  { map: ['S......', '######.', 'G......'], buggy: [['right', 5], ['down', 2], ['right', 6]], fixed: [['right', 6], ['down', 2], ['left', 6]], bugs: 2,
    tip: 'Lần này có 2 con bọ! Sửa xong con thứ nhất thì chạy thử lại nhé.' },
  { map: ['S.#', '..#', '#.G'], buggy: [['right', 1], ['down', 1], ['right', 1], ['down', 1]], fixed: [['right', 1], ['down', 1], ['down', 1], ['right', 1]], bugs: 1,
    tip: 'Các bước nhỏ xíu, bé quan sát robot thật kỹ nhé!' },
  { map: ['S..#....', '##.#.##.', '...#..#.', '.###.##.', '......#G'],
    buggy: [['right', 2], ['down', 2], ['left', 2], ['down', 2], ['right', 4], ['up', 3], ['right', 3], ['down', 4]],
    fixed: [['right', 2], ['down', 2], ['left', 2], ['down', 2], ['right', 4], ['up', 4], ['right', 3], ['down', 4]], bugs: 1,
    tip: 'Mê cung dài quá! Chạy thử để biết robot hỏng ở lệnh số mấy.' },
  { map: ['S..#....', '##.#.##.', '...#..#.', '.###.##.', '......#G'],
    buggy: [['right', 2], ['down', 2], ['right', 2], ['down', 2], ['right', 4], ['up', 4], ['right', 2], ['down', 4]],
    fixed: [['right', 2], ['down', 2], ['left', 2], ['down', 2], ['right', 4], ['up', 4], ['right', 3], ['down', 4]], bugs: 2,
    tip: 'Màn cuối: 2 con bọ trốn trong mê cung. Bé là thám tử giỏi nhất! 🕵️' },
];

function parseMap(map) {
  const level = { walls: new Set(), rows: map.length, cols: map[0].length };
  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'S') level.start = { x, y };
    if (c === 'G') level.goal = { x, y };
    if (c === '#') level.walls.add(`${x},${y}`);
  }));
  return level;
}

// Chạy chương trình, trả về các bước đi và lý do dừng: goal | wall | out | short
function simulate(level, program) {
  let { x, y } = level.start;
  const steps = [];
  for (let i = 0; i < program.length; i++) {
    const [dir, count] = program[i];
    for (let n = 0; n < count; n++) {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows) return { steps, result: 'out', block: i };
      if (level.walls.has(`${nx},${ny}`)) return { steps, result: 'wall', block: i };
      x = nx;
      y = ny;
      steps.push({ x, y, block: i });
      if (x === level.goal.x && y === level.goal.y) return { steps, result: 'goal', block: i };
    }
  }
  return { steps, result: 'short', block: program.length - 1 };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, def: null, level: null, program: [], pos: null, running: false, runToken: 0, sound: true };

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('bug-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('bug-progress', JSON.stringify(p)); } catch {}
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
  tap: () => tone(660, 0.08, { type: 'triangle', vol: 0.12 }),
  step: () => tone(440, 0.07, { type: 'square', vol: 0.04 }),
  bump: () => tone(180, 0.3, { type: 'sawtooth', to: 90, vol: 0.08 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);
const cloneProgram = (p) => p.map(([dir, count]) => [dir, count]);
const edits = () => state.program.filter(([d, c], i) => d !== state.def.buggy[i][0] || c !== state.def.buggy[i][1]).length;

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

/* ---------- Bản đồ ---------- */
function cellSize(level) {
  const avail = Math.min($('#boardWrap').clientWidth || window.innerWidth - 32, 720);
  return Math.max(36, Math.min(72, Math.floor(avail / level.cols)));
}

function renderBoard() {
  const L = state.level;
  const board = $('#board');
  board.style.setProperty('--cell', `${cellSize(L)}px`);
  board.style.gridTemplateColumns = `repeat(${L.cols}, var(--cell))`;
  let html = '';
  for (let y = 0; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) {
      const alt = (x + y) % 2 ? ' alt' : '';
      if (L.walls.has(`${x},${y}`)) html += `<div class="cell${alt}">🪨</div>`;
      else if (x === L.goal.x && y === L.goal.y) html += `<div class="cell goal${alt}"><span>💎</span></div>`;
      else html += `<div class="cell${alt}"></div>`;
    }
  }
  board.innerHTML = html + '<div id="robot" class="robot"><span>🤖</span></div>';
  resetRobot();
}

function placeRobot() {
  const cell = parseFloat($('#board').style.getPropertyValue('--cell'));
  $('#robot').style.transform = `translate(${state.pos.x * cell}px, ${state.pos.y * cell}px)`;
}

function resetRobot() {
  state.pos = { ...state.level.start };
  $('#robot').classList.remove('bump', 'win');
  placeRobot();
}

/* ---------- Chương trình ---------- */
function renderProgram(activeIdx = -1, failIdx = -1) {
  $('#program').innerHTML = state.program.map(([dir, count], i) => {
    const [od, oc] = state.def.buggy[i];
    const cls = [
      i === activeIdx ? 'active' : '',
      i === failIdx ? 'fail' : '',
      dir !== od || count !== oc ? 'changed' : '',
    ].join(' ');
    return `<div class="blk ${cls}" data-i="${i}"><span class="blk-num">${i + 1}</span>` +
      `<button class="blk-dir" title="Đổi hướng">${DIRS[dir].icon}</button>` +
      `<button class="blk-count" title="Đổi số bước">×${count}</button></div>`;
  }).join('');
  const n = edits();
  $('#editInfo').textContent = n ? `🔧 Đã sửa ${n} lệnh` : '';
}

$('#program').addEventListener('click', (e) => {
  if (state.running) return;
  const blk = e.target.closest('.blk');
  if (!blk) return;
  const block = state.program[Number(blk.dataset.i)];
  if (e.target.closest('.blk-dir')) block[0] = DIR_ORDER[(DIR_ORDER.indexOf(block[0]) + 1) % DIR_ORDER.length];
  else if (e.target.closest('.blk-count')) block[1] = (block[1] % MAX_REPEAT) + 1;
  else return;
  sfx.tap();
  resetRobot();
  renderProgram();
});

$('#restoreBtn').addEventListener('click', () => {
  if (state.running) return;
  state.program = cloneProgram(state.def.buggy);
  resetRobot();
  renderProgram();
  say('Đã khôi phục chương trình ban đầu.');
});

/* ---------- Chạy thử ---------- */
function setRunning(running) {
  state.running = running;
  $('#play').classList.toggle('running', running);
  $('#runBtn').disabled = running;
  $('#restoreBtn').disabled = running;
}

async function run() {
  if (state.running) return;
  const token = ++state.runToken;
  setRunning(true);
  resetRobot();
  const { steps, result, block } = simulate(state.level, state.program);

  for (const step of steps) {
    renderProgram(step.block);
    await wait(STEP_MS);
    if (token !== state.runToken) return;
    state.pos = { x: step.x, y: step.y };
    placeRobot();
    sfx.step();
  }
  await wait(STEP_MS);
  if (token !== state.runToken) return;

  if (result === 'goal') return win();

  $('#robot').classList.add('bump');
  sfx.bump();
  renderProgram(-1, block);
  const n = block + 1;
  say({
    wall: `Ối! Robot va vào đá ở lệnh số ${n}. Con bọ ở gần đây đó! 🐞`,
    out: `Ối! Lệnh số ${n} làm robot suýt ra khỏi bản đồ! 🐞`,
    short: 'Hết lệnh mà robot chưa tới kho báu. Có lệnh nào đi thiếu bước không?',
  }[result], 'sad', 'soft');
  await wait(1200);
  if (token !== state.runToken) return;
  setRunning(false);
  resetRobot();
}

function win() {
  setRunning(false);
  renderProgram();
  $('#robot').classList.add('win');
  sfx.win();

  const n = edits();
  const bugs = state.def.bugs;
  const stars = n <= bugs ? 3 : n <= bugs + 1 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'bat-bo', stars, score: totalStars, progressText: `${done}/${LEVELS.length} màn`,
  });

  say('Robot tới kho báu rồi! 🎉', 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = stars === 3
    ? `Bé chỉ sửa ${n} lệnh, đúng chỗ có bọ. Thám tử giỏi quá!`
    : `Bé sửa ${n} lệnh. Thử chỉ sửa ${bugs} lệnh có bọ để được 3 sao nhé!`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Màn tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 600);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.def = LEVELS[idx];
  state.level = parseMap(state.def.map);
  state.program = cloneProgram(state.def.buggy);
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Màn ${idx + 1}/${LEVELS.length}`;
  $('#bugCount').textContent = `🐞 × ${state.def.bugs}`;
  show('play');
  setRunning(false);
  renderBoard();
  renderProgram();
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
  if (!state.level || $('#play').classList.contains('hidden')) return;
  $('#board').style.setProperty('--cell', `${cellSize(state.level)}px`);
  placeRobot();
});

renderLevelGrid();
