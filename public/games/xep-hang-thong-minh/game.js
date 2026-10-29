// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// sort: các bạn đứng theo chiều cao này, bé chỉ được đổi chỗ hai bạn đứng cạnh nhau (sắp xếp nổi bọt).
//   Đổi hai bạn đã đúng thứ tự là một lần sai.
// search: n cánh cửa, mỗi cửa giấu một số. sorted = các số xếp từ bé đến lớn, bé tìm số `target`
//   bằng cách mở cửa ở giữa (tìm kiếm nhị phân). Mở quá ceil(log2(n + 1)) cửa là sai.
const LEVELS = [
  { name: 'Xếp 3 bạn', rounds: [{ sort: [3, 1, 2] }, { sort: [2, 3, 1] }, { sort: [3, 2, 1] }],
    tip: 'Xếp các bạn từ thấp đến cao. Chạm nút ⇄ giữa hai bạn để đổi chỗ, chỉ đổi khi bạn bên trái cao hơn!' },
  { name: 'Xếp 5 bạn', rounds: [{ sort: [4, 2, 5, 1, 3] }, { sort: [5, 4, 3, 2, 1] }],
    tip: 'Mẹo: đi từ trái sang phải, gặp cặp nào sai thứ tự thì đổi. Bạn cao nhất sẽ "nổi" về cuối hàng!' },
  { name: 'Xếp 6 bạn', rounds: [{ sort: [6, 1, 5, 2, 4, 3] }, { sort: [2, 6, 4, 1, 5, 3] }],
    tip: 'Đổi cặp đã đúng thứ tự là phí công. Nhìn kỹ trước khi chạm nhé!' },
  { name: 'Cửa lộn xộn', rounds: [{ search: { n: 8, sorted: false } }, { search: { n: 8, sorted: false } }],
    tip: 'Các số sau cửa không theo thứ tự nào, nên bé phải mở từng cửa cho tới khi thấy số cần tìm.' },
  { name: 'Tìm nhị phân', rounds: [{ search: { n: 7, sorted: true } }, { search: { n: 7, sorted: true } }, { search: { n: 7, sorted: true } }],
    tip: 'Số sau cửa xếp từ bé đến lớn! Mở cửa ở giữa: nếu số đó bé hơn số cần tìm thì bỏ hết nửa bên trái.' },
  { name: '15 cánh cửa', rounds: [{ search: { n: 15, sorted: true } }, { search: { n: 15, sorted: true } }, { search: { n: 15, sorted: true } }],
    tip: '15 cửa mà chỉ cần mở nhiều nhất 4 cửa, nếu lần nào cũng mở cửa ở giữa!' },
  { name: 'Xếp 8 bạn', rounds: [{ sort: [5, 8, 1, 7, 3, 6, 2, 4] }],
    tip: 'Hàng dài! Cứ đi từ trái sang phải nhiều lượt, mỗi lượt một bạn cao về đúng chỗ.' },
  { name: '31 cánh cửa', rounds: [{ search: { n: 31, sorted: true } }, { sort: [3, 6, 1, 5, 2, 4] }, { search: { n: 31, sorted: true } }],
    tip: '31 cửa chỉ cần 5 lần mở. Mỗi lần mở là bỏ được một nửa số cửa!' },
];

// Số cặp đứng sai thứ tự = số lần đổi chỗ ít nhất
const inversions = (a) => a.reduce((s, x, i) => s + a.slice(i + 1).filter((y) => y < x).length, 0);
const isSorted = (a) => a.every((x, i) => i === 0 || a[i - 1] <= x);
const searchLimit = (n) => Math.ceil(Math.log2(n + 1));

// Các số sau cửa: khác nhau, từ 1 đến 99; sorted thì xếp tăng dần
function makeDoors(search, rand = Math.random) {
  const nums = new Set();
  while (nums.size < search.n) nums.add(1 + Math.floor(rand() * 99));
  let values = [...nums];
  if (search.sorted) values.sort((a, b) => a - b);
  const target = values[Math.floor(rand() * values.length)];
  return { values, target };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, ri: 0, mistakes: 0, busy: false, line: [], swaps: 0, doors: null, opened: [], lo: 0, hi: 0 };

const game = createGame({
  id: 'xep-hang-thong-minh',
  title: '📏 Xếp Hàng Thông Minh',
  sub: 'Sắp xếp và tìm kiếm như máy tính!',
  levels: LEVELS.length,
  winTitle: 'Thông minh quá! 🧠',
  start: startLevel,
});

const round = () => state.level.rounds[state.ri];
const KID_COLORS = ['#ff6b6b', '#f59f00', '#51cf66', '#339af0', '#845ef7', '#f06595', '#20c997', '#fd7e14'];
const FACES = ['🐻', '🐰', '🐼', '🦊', '🐸', '🐯', '🐨', '🐷'];

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.ri = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

function showRound() {
  const r = round();
  state.busy = false;
  game.rounds(state.ri, state.level.rounds.length);
  if (r.sort) {
    state.line = [...r.sort];
    state.swaps = 0;
    $('#question').textContent = 'Xếp các bạn từ THẤP đến CAO';
    renderLine();
  } else {
    state.doors = makeDoors(r.search);
    state.opened = [];
    state.lo = 0;
    state.hi = r.search.n - 1;
    $('#question').textContent = `Tìm cánh cửa giấu số ${state.doors.target}${r.search.sorted ? ' (số xếp từ bé đến lớn)' : ''}`;
    renderDoors();
  }
}

/* ---------- Xếp hàng ---------- */
function renderLine() {
  const max = Math.max(...state.line);
  const sorted = isSorted(state.line);
  $('#board').innerHTML = `<div class="line">${state.line.map((h, i) => `
    ${i ? `<button class="swap" data-i="${i - 1}" title="Đổi chỗ">⇄</button>` : ''}
    <div class="kid${sorted ? ' ok' : ''}" style="--kc:${KID_COLORS[(h - 1) % 8]}">
      <span class="face">${FACES[(h - 1) % 8]}</span>
      <span class="body" style="height:${40 + (h / max) * 110}px">${h}</span>
    </div>`).join('')}</div>`;
  $('#counter').textContent = `Đã đổi chỗ ${state.swaps} lần (ít nhất cần ${inversions(round().sort)} lần)`;
}

$('#board').addEventListener('click', async (e) => {
  if (state.busy) return;
  const sw = e.target.closest('.swap');
  if (sw) return swapAt(Number(sw.dataset.i));
  const door = e.target.closest('.door');
  if (door) openDoor(Number(door.dataset.i));
});

async function swapAt(i) {
  const a = state.line;
  const useless = a[i] < a[i + 1];
  [a[i], a[i + 1]] = [a[i + 1], a[i]];
  state.swaps++;
  if (useless) {
    state.mistakes++;
    game.sfx.bad();
    game.say('Hai bạn này đã đúng thứ tự rồi, đổi làm gì nữa! Chỉ đổi khi bạn bên trái cao hơn.', 'sad', 'soft');
  } else game.sfx.pop();
  renderLine();
  if (isSorted(a)) {
    state.busy = true;
    game.sfx.good();
    game.say(`Xếp xong rồi! Bé đổi chỗ ${state.swaps} lần 🎉`, 'cheer', 'good');
    if (await game.wait(1500)) next();
  }
}

/* ---------- Tìm sau cánh cửa ---------- */
function renderDoors() {
  const r = round();
  const { values, target } = state.doors;
  $('#board').innerHTML = `<div class="doors${values.length > 15 ? ' many' : ''}">${values.map((v, i) => {
    const open = state.opened.includes(i);
    const out = r.search.sorted && !open && (i < state.lo || i > state.hi);
    return `<button class="door${open ? ' open' : ''}${open && v === target ? ' found' : ''}${out ? ' out' : ''}" data-i="${i}">${open ? v : `<small>${i + 1}</small>`}</button>`;
  }).join('')}</div>`;
  const limit = r.search.sorted ? ` (giỏi nhất: tối đa ${searchLimit(values.length)} lần)` : '';
  $('#counter').textContent = `Đã mở ${state.opened.length} cửa${limit}`;
}

async function openDoor(i) {
  const r = round();
  if (state.opened.includes(i)) return;
  const { values, target } = state.doors;
  state.opened.push(i);
  const v = values[i];
  const limit = searchLimit(values.length);
  if (r.search.sorted && state.opened.length > limit) state.mistakes++;
  if (v === target) {
    renderDoors();
    state.busy = true;
    game.sfx.good();
    const n = state.opened.length;
    game.say(r.search.sorted
      ? (n <= limit ? `Tìm thấy sau ${n} lần mở! Đúng kiểu tìm kiếm nhị phân 🎉` : `Tìm thấy sau ${n} lần mở. Thử mở cửa ở giữa để nhanh hơn nhé!`)
      : `Tìm thấy sau ${n} lần mở. Cửa lộn xộn thì phải mở lần lượt!`, 'cheer', 'good');
    if (await game.wait(1800)) next();
    return;
  }
  game.tone(260, 0.15, { type: 'triangle' });
  if (r.search.sorted) {
    if (v < target) state.lo = Math.max(state.lo, i + 1);
    else state.hi = Math.min(state.hi, i - 1);
    game.say(`${v} ${v < target ? 'bé hơn' : 'lớn hơn'} ${target}, nên số cần tìm ở bên ${v < target ? 'phải' : 'trái'}. Mở cửa ở giữa phần còn lại nhé!`, 'happy', '');
  } else {
    game.say(`Sau cửa là ${v}, chưa phải ${target}. Mở cửa khác nhé!`, 'happy', '');
  }
  renderDoors();
}

function next() {
  state.ri++;
  if (state.ri < state.level.rounds.length) return showRound();
  game.rounds(state.ri, state.level.rounds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({ stars, eq: state.level.name, text: stars === 3 ? 'Không phí một bước nào. Bé nghĩ như máy tính!' : `Bé có ${state.mistakes} bước thừa. Chơi lại để được 3 sao nhé!` });
}
