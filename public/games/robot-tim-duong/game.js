const DIRS = {
  up: { dx: 0, dy: -1, icon: '⬆️' },
  down: { dx: 0, dy: 1, icon: '⬇️' },
  left: { dx: -1, dy: 0, icon: '⬅️' },
  right: { dx: 1, dy: 0, icon: '➡️' },
};
const MAX_REPEAT = 8;
const STEP_MS = 380;
// Bản đồ: S = robot, G = kho báu, # = đá. par = số lệnh ít nhất (đã kiểm tra bằng BFS).
// repeat = cho phép bấm vào lệnh để lặp nhiều bước (giới thiệu vòng lặp).
const LEVELS = [
  { map: ['.....', 'S..G.', '.....'], par: 3, slots: 6, tip: 'Bấm ➡️ ba lần rồi bấm ▶️ Chạy nhé!' },
  { map: ['S....', '.....', '..G..'], par: 4, slots: 6, tip: 'Robot cần đi xuống rồi sang phải đó.' },
  { map: ['S.#..', '..#.G', '.....'], par: 7, slots: 10, tip: 'Cẩn thận tảng đá 🪨! Tìm đường vòng nhé.' },
  { map: ['........', 'S......G', '........'], par: 1, slots: 2, repeat: true, tip: 'Mẹo mới: bấm vào lệnh trong chương trình để đi nhiều bước (×2, ×3…)' },
  { map: ['S....', '....#', '.....', '....G'], par: 2, slots: 3, repeat: true, tip: 'Chỉ có 3 chỗ trống thôi, dùng mẹo lặp nhé!' },
  { map: ['S#...', '.#.#.', '...#G'], par: 5, slots: 6, repeat: true, tip: 'Đường ngoằn ngoèo, bé tính kỹ từng bước nhé!' },
  { map: ['S......', '######.', 'G......'], par: 3, slots: 4, repeat: true, tip: 'Đi một vòng thật xa nào!' },
  { map: ['S..#....', '##.#.##.', '...#..#.', '.###.##.', '......#G'], par: 8, slots: 10, repeat: true, tip: 'Mê cung cuối cùng! Bé làm được mà 💪' },
];

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, program: [], pos: null, running: false, runToken: 0, sound: true };

/* ---------- Lưu tiến độ từng màn ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('robot-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('robot-progress', JSON.stringify(p)); } catch {}
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
  step: () => tone(440, 0.07, { type: 'square', vol: 0.04 }),
  bump: () => tone(180, 0.3, { type: 'sawtooth', to: 90, vol: 0.08 }),
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
    const label = unlocked ? i + 1 : '🔒';
    const starText = stars ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    return `<button data-i="${i}" class="${stars ? 'done' : ''}" ${unlocked ? '' : 'disabled'}>${label}<small>${starText}</small></button>`;
  }).join('');
  show('levels');
}

$('#levelGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn && !btn.disabled) startLevel(Number(btn.dataset.i));
});

/* ---------- Bản đồ ---------- */
function parseLevel(def) {
  const level = { ...def, walls: new Set(), rows: def.map.length, cols: def.map[0].length };
  def.map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'S') level.start = { x, y };
    if (c === 'G') level.goal = { x, y };
    if (c === '#') level.walls.add(`${x},${y}`);
  }));
  return level;
}

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
  placeRobot();
}

function placeRobot() {
  const cell = parseFloat($('#board').style.getPropertyValue('--cell'));
  $('#robot').style.transform = `translate(${state.pos.x * cell}px, ${state.pos.y * cell}px)`;
}

function resetRobot() {
  state.pos = { ...state.level.start };
  const robot = $('#robot');
  robot.classList.remove('bump', 'win');
  placeRobot();
}

/* ---------- Chương trình ---------- */
function renderProgram(activeIdx = -1, failIdx = -1) {
  const L = state.level;
  const blocks = state.program.map((b, i) => {
    const cls = i === activeIdx ? ' active' : i === failIdx ? ' fail' : '';
    const count = L.repeat ? `<b>×${b.count}</b>` : '';
    return `<div class="blk${cls}" data-i="${i}">` +
      `<button class="blk-main" title="${L.repeat ? 'Bấm để đổi số bước' : ''}">${DIRS[b.dir].icon}${count}</button>` +
      `<button class="blk-del" title="Xóa lệnh">✕</button></div>`;
  });
  const empty = Array(Math.max(0, L.slots - state.program.length)).fill('<div class="slot"></div>');
  $('#program').innerHTML = blocks.join('') + empty.join('');
  $('#slotInfo').textContent = `${state.program.length}/${L.slots} lệnh`;
}

function setRunning(running) {
  state.running = running;
  $('#play').classList.toggle('running', running);
  document.querySelectorAll('.palette button, #clearBtn').forEach((b) => (b.disabled = running));
  $('#runBtn').textContent = running ? '⏹️ Dừng' : '▶️ Chạy';
}

$('.palette').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || state.running) return;
  if (state.program.length >= state.level.slots) {
    say(state.level.repeat ? 'Hết chỗ rồi! Bấm vào lệnh để đi nhiều bước nhé 💡' : 'Hết chỗ rồi! Xóa bớt lệnh nhé.', 'sad', 'soft');
    return;
  }
  state.program.push({ dir: btn.dataset.dir, count: 1 });
  sfx.add();
  resetRobot();
  renderProgram();
});

$('#program').addEventListener('click', (e) => {
  if (state.running) return;
  const blk = e.target.closest('.blk');
  if (!blk) return;
  const i = Number(blk.dataset.i);
  if (e.target.closest('.blk-del')) state.program.splice(i, 1);
  else if (state.level.repeat) state.program[i].count = (state.program[i].count % MAX_REPEAT) + 1;
  else return;
  sfx.add();
  resetRobot();
  renderProgram();
});

$('#clearBtn').addEventListener('click', () => {
  state.program = [];
  resetRobot();
  renderProgram();
  say(state.level.tip);
});

/* ---------- Chạy chương trình ---------- */
function blockedReason(x, y) {
  const L = state.level;
  if (x < 0 || y < 0 || x >= L.cols || y >= L.rows) return 'Ối! Robot suýt ra khỏi bản đồ 😵';
  if (L.walls.has(`${x},${y}`)) return 'Ối! Robot va vào đá rồi 😵';
  return null;
}

async function run() {
  if (state.running) return stopRun();
  if (!state.program.length) return say('Bé hãy thêm lệnh trước đã nhé!', 'sad', 'soft');
  const token = ++state.runToken;
  setRunning(true);
  resetRobot();
  say('Robot xuất phát! 🚀', 'cheer');

  for (let i = 0; i < state.program.length; i++) {
    const { dir, count } = state.program[i];
    renderProgram(i);
    for (let n = 0; n < count; n++) {
      await wait(STEP_MS);
      if (token !== state.runToken) return;
      const nx = state.pos.x + DIRS[dir].dx;
      const ny = state.pos.y + DIRS[dir].dy;
      const reason = blockedReason(nx, ny);
      if (reason) {
        $('#robot').classList.add('bump');
        sfx.bump();
        renderProgram(-1, i);
        say(`${reason} Sửa lệnh màu đỏ nhé.`, 'sad', 'soft');
        return endRun(token, 1100);
      }
      state.pos = { x: nx, y: ny };
      placeRobot();
      sfx.step();
      if (nx === state.level.goal.x && ny === state.level.goal.y) {
        await wait(350);
        if (token === state.runToken) win();
        return;
      }
    }
  }
  await wait(400);
  if (token !== state.runToken) return;
  say('Chưa tới kho báu, thêm lệnh nữa nhé!', 'sad', 'soft');
  endRun(token, 800);
}

async function endRun(token, delay) {
  await wait(delay);
  if (token !== state.runToken) return;
  setRunning(false);
  resetRobot();
}

function stopRun() {
  state.runToken++;
  setRunning(false);
  resetRobot();
  renderProgram();
  say(state.level.tip);
}

function starsFor(blocks) {
  const par = state.level.par;
  return blocks <= par ? 3 : blocks <= par + 2 ? 2 : 1;
}

function win() {
  setRunning(false);
  renderProgram();
  $('#robot').classList.add('win');
  sfx.win();

  const blocks = state.program.length;
  const stars = starsFor(blocks);
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'robot-tim-duong', stars, score: totalStars, progressText: `${done}/${LEVELS.length} màn`,
  });

  say(stars === 3 ? 'Hoàn hảo! 🎉' : 'Giỏi lắm! 👏', 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = stars === 3
    ? `Bé dùng ${blocks} lệnh, ít nhất có thể!`
    : `Bé dùng ${blocks} lệnh. Thử lại với ${state.level.par} lệnh để được 3 sao nhé!`;
  const last = state.idx === LEVELS.length - 1;
  $('#nextBtn').textContent = last ? 'Xong hết rồi! 🏆' : 'Màn tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 600);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.level = parseLevel(LEVELS[idx]);
  state.program = [];
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Màn ${idx + 1}/${LEVELS.length}`;
  show('play');
  setRunning(false);
  state.pos = { ...state.level.start };
  renderBoard();
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
window.addEventListener('resize', () => {
  if (!state.level || $('#play').classList.contains('hidden')) return;
  $('#board').style.setProperty('--cell', `${cellSize(state.level)}px`);
  placeRobot();
});

renderLevelGrid();
