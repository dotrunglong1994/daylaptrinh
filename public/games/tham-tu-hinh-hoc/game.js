// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng vụ án)
const COLORS = {
  r: { name: 'đỏ', fill: '#ff6b6b', line: '#c92a2a' },
  b: { name: 'xanh dương', fill: '#5c7cfa', line: '#364fc7' },
  y: { name: 'vàng', fill: '#ffd43b', line: '#e67700' },
  g: { name: 'xanh lá', fill: '#51cf66', line: '#2b8a3e' },
  p: { name: 'tím', fill: '#cc5de8', line: '#862e9c' },
};

const regular = (n, r = 42) => Array.from({ length: n }, (_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [50 + r * Math.cos(a), 54 + r * Math.sin(a)];
});

// Đỉnh của từng hình trong khung 100×100 (hình tròn không có đỉnh).
const SHAPES = {
  circle: { name: 'hình tròn', points: null },
  triangle: { name: 'hình tam giác', points: [[50, 13], [90, 82], [10, 82]] },
  rtriangle: { name: 'hình tam giác vuông', points: [[15, 15], [15, 85], [85, 85]] },
  square: { name: 'hình vuông', points: [[18, 18], [82, 18], [82, 82], [18, 82]] },
  rect: { name: 'hình chữ nhật', points: [[6, 28], [94, 28], [94, 72], [6, 72]] },
  rhombus: { name: 'hình thoi', points: [[50, 6], [76, 50], [50, 94], [24, 50]] },
  pentagon: { name: 'hình ngũ giác', points: regular(5) },
  hexagon: { name: 'hình lục giác', points: regular(6) },
};

const dist = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);

// Các đỉnh có góc vuông (để vẽ dấu ô vuông nhỏ và đếm góc vuông).
function rightCorners(points) {
  if (!points) return [];
  return points.filter((p, i) => {
    const a = points[(i + points.length - 1) % points.length];
    const b = points[(i + 1) % points.length];
    const dot = (a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1]);
    return Math.abs(dot) < 1e-6 * dist(a, p) * dist(b, p) + 1e-9;
  });
}

function props(type) {
  const pts = SHAPES[type].points;
  if (!pts) return { sides: 0, right: 0, equal: false };
  const lens = pts.map((p, i) => dist(p, pts[(i + 1) % pts.length]));
  return {
    sides: pts.length,
    right: rightCorners(pts).length,
    equal: Math.max(...lens) - Math.min(...lens) < 1.5,
  };
}

// item: "loại:màu" hoặc "loại:màu:góc xoay"
function parseItems(text) {
  return text.trim().split(/\s+/).map((tok) => {
    const [type, color, rot] = tok.split(':');
    return { type, color, rot: Number(rot || 0) };
  });
}

// want: shape, color, sides, minSides, right, minRight, equal (bỏ trống = không xét)
function matches(want, item) {
  const p = props(item.type);
  return (want.shape === undefined || want.shape === item.type)
    && (want.color === undefined || want.color === item.color)
    && (want.sides === undefined || want.sides === p.sides)
    && (want.minSides === undefined || p.sides >= want.minSides)
    && (want.right === undefined || want.right === p.right)
    && (want.minRight === undefined || p.right >= want.minRight)
    && (want.equal === undefined || want.equal === p.equal);
}

const LEVELS = [
  { name: 'Làm quen', tip: 'Đọc manh mối rồi chạm vào TẤT CẢ các hình đúng nhé!', rounds: [
    { clue: 'Tìm tất cả hình tròn', want: { shape: 'circle' }, items: 'circle:r square:b circle:y triangle:g rect:p circle:b square:y' },
    { clue: 'Tìm tất cả hình vuông', want: { shape: 'square' }, items: 'square:r circle:b square:g triangle:y square:p rect:b hexagon:r' },
    { clue: 'Tìm tất cả hình tam giác', want: { sides: 3 }, items: 'triangle:b circle:r triangle:y square:g rtriangle:p circle:y pentagon:b' },
  ] },
  { name: 'Màu sắc', tip: 'Lần này phải đúng cả hình lẫn màu đó!', rounds: [
    { clue: 'Tìm hình tròn màu đỏ', want: { shape: 'circle', color: 'r' }, items: 'circle:r circle:b square:r circle:r triangle:r circle:y' },
    { clue: 'Tìm hình vuông màu xanh dương', want: { shape: 'square', color: 'b' }, items: 'square:b square:r circle:b square:b rect:b square:y triangle:b' },
    { clue: 'Tìm hình tam giác màu vàng', want: { sides: 3, color: 'y' }, items: 'triangle:y triangle:g circle:y rtriangle:y square:y triangle:r' },
  ] },
  { name: 'Đếm cạnh', tip: 'Cạnh là các đường thẳng bao quanh hình. Bé đếm thử xem!', rounds: [
    { clue: 'Tìm hình có 4 cạnh', want: { sides: 4 }, items: 'square:r triangle:b rect:g circle:y rhombus:p pentagon:r hexagon:g' },
    { clue: 'Tìm hình có 5 cạnh', want: { sides: 5 }, items: 'pentagon:b hexagon:r square:y pentagon:g triangle:p circle:b' },
    { clue: 'Tìm hình không có cạnh thẳng nào', want: { sides: 0 }, items: 'circle:g triangle:r square:b circle:p hexagon:y rect:r' },
  ] },
  { name: 'Hình xoay', tip: 'Hình bị xoay nghiêng vẫn là hình đó. Đừng để bị lừa!', rounds: [
    { clue: 'Tìm tất cả hình vuông, kể cả hình bị xoay', want: { shape: 'square' }, items: 'square:r:45 rhombus:b square:g:20 rect:y square:p rhombus:g:90 triangle:r' },
    { clue: 'Tìm tất cả hình chữ nhật', want: { shape: 'rect' }, items: 'rect:b:90 rhombus:r rect:g:-30 hexagon:y rect:p triangle:b circle:g' },
    { clue: 'Tìm hình lục giác (6 cạnh)', want: { shape: 'hexagon' }, items: 'hexagon:r pentagon:b hexagon:y:30 pentagon:g:36 circle:p hexagon:g:15' },
  ] },
  { name: 'Góc vuông', tip: 'Ô vuông nhỏ ở góc là dấu góc vuông. Tìm dấu đó nhé!', rounds: [
    { clue: 'Tìm hình có 4 góc vuông', want: { right: 4 }, items: 'square:r rhombus:b rect:g pentagon:y square:p:30 triangle:r rhombus:y:90' },
    { clue: 'Tìm hình có ít nhất 1 góc vuông', want: { minRight: 1 }, items: 'rtriangle:b triangle:r square:y circle:g rect:p hexagon:b rtriangle:g:90' },
    { clue: 'Tìm hình tam giác có góc vuông', want: { sides: 3, minRight: 1 }, items: 'rtriangle:r triangle:b rtriangle:y:180 square:g triangle:p rect:r' },
  ] },
  { name: 'Cạnh bằng nhau', tip: 'So độ dài các cạnh: dài bằng nhau hay có cạnh dài, cạnh ngắn?', rounds: [
    { clue: 'Tìm hình có 4 cạnh dài bằng nhau', want: { sides: 4, equal: true }, items: 'square:r rect:b rhombus:g rect:y:90 square:p:45 rhombus:r:90 pentagon:b' },
    { clue: 'Tìm hình 4 cạnh mà không có góc vuông nào', want: { sides: 4, right: 0 }, items: 'rhombus:b square:r rhombus:y:30 rect:g triangle:p rhombus:p:90 circle:r' },
    { clue: 'Tìm hình có 4 góc vuông nhưng các cạnh không bằng nhau', want: { right: 4, equal: false }, items: 'rect:r square:b rect:y:90 square:g:45 rhombus:p rect:p:-20' },
  ] },
  { name: 'Nhiều cạnh', tip: '"Nhiều hơn 4" nghĩa là 5, 6, 7… cạnh đó!', rounds: [
    { clue: 'Tìm hình có nhiều hơn 4 cạnh', want: { minSides: 5 }, items: 'pentagon:r hexagon:b square:y rect:g hexagon:p triangle:r pentagon:y:36 circle:b' },
    { clue: 'Tìm hình có đúng 3 góc', want: { sides: 3 }, items: 'triangle:g rtriangle:b square:r triangle:y:180 pentagon:p rtriangle:r:270 circle:y' },
    { clue: 'Tìm hình màu tím có nhiều hơn 3 cạnh', want: { color: 'p', minSides: 4 }, items: 'square:p triangle:p hexagon:p circle:p rect:r pentagon:p rhombus:b rhombus:p' },
  ] },
  { name: 'Thám tử bậc thầy', tip: 'Vụ án khó nhất! Mỗi manh mối có 2 điều kiện.', rounds: [
    { clue: 'Tìm hình màu đỏ có 4 góc vuông', want: { color: 'r', right: 4 }, items: 'square:r rect:r rhombus:r square:b rect:g:90 rect:r:90 triangle:r circle:r' },
    { clue: 'Tìm hình màu xanh lá có góc vuông', want: { color: 'g', minRight: 1 }, items: 'rtriangle:g triangle:g square:g rect:b hexagon:g rhombus:g rect:g:45 rtriangle:y' },
    { clue: 'Tìm hình có các cạnh bằng nhau nhưng không có góc vuông', want: { equal: true, right: 0 }, items: 'triangle:b square:r rhombus:y rect:g hexagon:p circle:r pentagon:g rtriangle:b' },
  ] },
];
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, round: 0, items: [], mistakes: 0, busy: false, sound: true };

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('geo-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('geo-progress', JSON.stringify(p)); } catch {}
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
  good: () => { tone(660, 0.12, { type: 'triangle' }); tone(990, 0.16, { type: 'triangle', delay: 0.08 }); },
  bad: () => tone(200, 0.3, { type: 'sawtooth', to: 110, vol: 0.08 }),
  round: () => [659, 784, 988].forEach((f, i) => tone(f, 0.2, { type: 'triangle', delay: i * 0.1, vol: 0.12 })),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Vẽ hình ---------- */
function shapeSvg(item) {
  const { points } = SHAPES[item.type];
  const c = COLORS[item.color];
  const style = `fill="${c.fill}" stroke="${c.line}" stroke-width="4" stroke-linejoin="round"`;
  let body;
  if (!points) {
    body = `<circle cx="50" cy="50" r="40" ${style} />`;
  } else {
    body = `<polygon points="${points.map((p) => p.join(',')).join(' ')}" ${style} />`;
    // Dấu góc vuông: ô vuông nhỏ dọc theo hai cạnh
    body += rightCorners(points).map((p) => {
      const i = points.indexOf(p);
      const a = points[(i + points.length - 1) % points.length];
      const b = points[(i + 1) % points.length];
      const unit = (q) => [(q[0] - p[0]) / dist(p, q) * 10, (q[1] - p[1]) / dist(p, q) * 10];
      const [ax, ay] = unit(a);
      const [bx, by] = unit(b);
      return `<path d="M${p[0] + ax} ${p[1] + ay} L${p[0] + ax + bx} ${p[1] + ay + by} L${p[0] + bx} ${p[1] + by}" fill="none" stroke="#fff" stroke-width="3" />`;
    }).join('');
  }
  return `<svg viewBox="-6 -6 112 112"><g transform="rotate(${item.rot} 50 50)">${body}</g></svg>`;
}

function describe(item) {
  const p = props(item.type);
  const facts = [p.sides ? `${p.sides} cạnh` : 'không có cạnh thẳng'];
  if (p.sides) facts.push(p.right ? `${p.right} góc vuông` : 'không có góc vuông');
  if (p.equal) facts.push('các cạnh bằng nhau');
  return `Đây là ${SHAPES[item.type].name} màu ${COLORS[item.color].name}: ${facts.join(', ')}.`;
}

/* ---------- Chọn vụ án ---------- */
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

/* ---------- Chơi ---------- */
function renderRound() {
  const level = LEVELS[state.idx];
  const round = level.rounds[state.round];
  state.items = shuffle(parseItems(round.items)).map((it) => ({ ...it, found: false, match: matches(round.want, it) }));
  $('#roundInfo').textContent = `${state.round + 1}/${level.rounds.length}`;
  $('#clueText').textContent = round.clue;
  $('#scene').innerHTML = state.items.map((it, i) =>
    `<button class="shape" data-i="${i}" style="--s:${(0.82 + Math.random() * 0.18).toFixed(2)}">${shapeSvg(it)}</button>`,
  ).join('');
  updateFound();
}

function updateFound() {
  const total = state.items.filter((it) => it.match).length;
  const found = state.items.filter((it) => it.found).length;
  $('#foundInfo').textContent = `🔎 ${found}/${total}`;
  return found === total;
}

$('#scene').addEventListener('click', async (e) => {
  const btn = e.target.closest('.shape');
  if (!btn || state.busy) return;
  const item = state.items[Number(btn.dataset.i)];
  if (item.found) return;

  if (!item.match) {
    state.mistakes++;
    sfx.bad();
    btn.classList.remove('wrong');
    void btn.offsetWidth;
    btn.classList.add('wrong');
    say(`${describe(item)} Chưa khớp manh mối!`, 'sad', 'soft');
    return;
  }

  item.found = true;
  btn.classList.add('found');
  sfx.good();
  if (!updateFound()) {
    say(['Đúng rồi!', 'Giỏi quá!', 'Tìm thêm nữa nào!', 'Mắt tinh ghê!'][Math.floor(Math.random() * 4)], 'happy', 'good');
    return;
  }

  state.busy = true;
  sfx.round();
  const level = LEVELS[state.idx];
  if (state.round < level.rounds.length - 1) {
    say('Tìm đủ hết rồi! Sang manh mối tiếp theo nhé 🔍', 'cheer', 'good');
    await wait(1300);
    state.round++;
    renderRound();
    state.busy = false;
  } else {
    win();
  }
});

function win() {
  const m = state.mistakes;
  const stars = m <= 1 ? 3 : m <= 3 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'tham-tu-hinh-hoc', stars, score: totalStars, progressText: `${done}/${LEVELS.length} vụ án`,
  });

  sfx.win();
  say('Phá án xong rồi! 🎉', 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = m === 0
    ? 'Không chạm nhầm lần nào. Thám tử siêu đẳng!'
    : `Bé chạm nhầm ${m} lần. ${stars < 3 ? 'Đọc kỹ manh mối để được 3 sao nhé!' : 'Giỏi lắm!'}`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Vụ tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 700);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.idx = idx;
  state.round = 0;
  state.mistakes = 0;
  state.busy = false;
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Vụ ${idx + 1}: ${LEVELS[idx].name}`;
  show('play');
  renderRound();
  say(LEVELS[idx].tip, 'happy');
}

$('#backBtn').addEventListener('click', renderLevelGrid);
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
