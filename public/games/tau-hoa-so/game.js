// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Đề sinh ngẫu nhiên theo từng màn. kinds: các loại câu trong màn.
// build = xếp hàng hóa lên toa nghìn/trăm/chục/đơn vị cho đúng số; words = đề viết bằng chữ ("ba trăm linh năm").
// compare = so sánh hai số; order = xếp 4 đoàn tàu từ bé đến lớn; round = làm tròn tới ga gần nhất (to = 10, 100, 1000).
const LEVELS = [
  { name: 'Số đến 20', kinds: ['build'], min: 11, max: 20, places: [10, 1], tip: 'Toa chục chở các bó 10 que, toa đơn vị chở que lẻ. 14 = 1 chục và 4 đơn vị.' },
  { name: 'Đọc số đến 100', kinds: ['build'], min: 21, max: 99, places: [10, 1], words: true, tip: 'Nghe đọc số rồi xếp hàng lên toa. "Hai mươi mốt" là 2 chục và 1 đơn vị.' },
  { name: 'So sánh đến 100', kinds: ['compare', 'compare', 'order'], min: 10, max: 99, tip: 'So sánh hàng chục trước. Hàng chục bằng nhau thì mới so hàng đơn vị.' },
  { name: 'Số đến 1000', kinds: ['build'], min: 101, max: 999, places: [100, 10, 1], words: true, tip: 'Một tấm vuông là 100. "Linh" nghĩa là hàng chục bằng 0, như ba trăm linh năm.' },
  { name: 'So sánh đến 1000', kinds: ['compare', 'order', 'compare', 'order'], min: 100, max: 999, tip: 'Số nào có hàng trăm lớn hơn thì lớn hơn.' },
  { name: 'Làm tròn hàng chục', kinds: ['round'], min: 11, max: 999, to: 10, tip: 'Đoàn tàu dừng ở ga gần nhất. Chữ số hàng đơn vị từ 5 trở lên thì đi tiếp tới ga sau.' },
  { name: 'Số đến 10 000', kinds: ['build', 'compare'], min: 1001, max: 9999, places: [1000, 100, 10, 1], words: true, tip: 'Khối lớn là 1 nghìn = 10 trăm. Đọc theo nghìn, trăm, chục, đơn vị.' },
  { name: 'Làm tròn số lớn', kinds: ['round', 'round', 'round', 'round', 'round'], min: 1001, max: 99999, toList: [100, 1000], tip: 'Làm tròn đến hàng trăm thì nhìn chữ số hàng chục; đến hàng nghìn thì nhìn hàng trăm.' },
];
const ROUNDS_PER_LEVEL = 5;
const PLACE_NAMES = { 1000: 'Nghìn', 100: 'Trăm', 10: 'Chục', 1: 'Đơn vị' };

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
// Đọc số 0…999; full = luôn đọc hàng trăm (dùng sau chữ "nghìn")
function read3(n, full) {
  const h = Math.floor(n / 100);
  const t = Math.floor(n / 10) % 10;
  const u = n % 10;
  const parts = [];
  if (h || full) parts.push(`${DIGITS[h]} trăm`);
  if (t === 0) {
    if (u && (h || full)) parts.push(`linh ${DIGITS[u]}`);
    else if (u || !parts.length) parts.push(DIGITS[u]);
  } else if (t === 1) {
    parts.push(u ? `mười ${u === 5 ? 'lăm' : DIGITS[u]}` : 'mười');
  } else {
    const tail = { 0: '', 1: ' mốt', 4: ' tư', 5: ' lăm' }[u] ?? ` ${DIGITS[u]}`;
    parts.push(`${DIGITS[t]} mươi${tail}`);
  }
  return parts.join(' ');
}
function readNumber(n) {
  if (n < 1000) return read3(n, false);
  const k = Math.floor(n / 1000);
  const rest = n % 1000;
  return `${read3(k, false)} nghìn${rest ? ` ${read3(rest, true)}` : ''}`;
}

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const roundTo = (n, to) => Math.floor((n + to / 2) / to) * to;

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds[k % L.kinds.length];
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = () => int(L.min, L.max);
  if (kind === 'build') {
    let n = pick();
    // Hay cho số có chữ số 0 ở giữa để bé luyện "linh", "không trăm"
    if (L.words && L.places.length >= 3 && rand() < 0.35) n -= Math.floor(n / 10) % 10 * 10;
    return { kind, n: Math.max(L.min, n) };
  }
  if (kind === 'compare') {
    const a = pick();
    const r = rand();
    if (r < 0.15) return { kind, a, b: a };
    // Đổi một chữ số để hai số gần nhau (dễ nhầm)
    const digits = String(a).split('');
    const i = int(0, digits.length - 1);
    let d = int(i === 0 ? 1 : 0, 9);
    if (String(d) === digits[i]) d = (d + 1) % 10 || (i === 0 ? 1 : 0);
    digits[i] = String(d);
    let b = Number(digits.join(''));
    if (b === a || b < L.min || b > L.max) b = Math.min(L.max, a + int(1, 9));
    if (b === a) b = a - 1;
    return rand() < 0.5 ? { kind, a, b } : { kind, a: b, b: a };
  }
  if (kind === 'order') {
    const base = pick();
    const nums = new Set();
    while (nums.size < 4) nums.add(Math.min(L.max, Math.max(L.min, base + int(-30, 30) * (L.max > 100 ? 3 : 1))));
    return { kind, nums: [...nums] };
  }
  const to = L.toList ? L.toList[int(0, L.toList.length - 1)] : L.to;
  let n = pick();
  if (n % to === 0) n += int(1, to - 1);
  // Hay hỏi đúng trường hợp chữ số 5
  if (rand() < 0.25) n = Math.floor(n / to) * to + to / 2;
  return { kind, n, to };
}

// 4 đáp án cho câu làm tròn: ga trước, ga sau, và làm tròn nhầm hàng
function roundOptions(r) {
  const lo = Math.floor(r.n / r.to) * r.to;
  const opts = [roundTo(r.n, r.to)];
  const smaller = r.to >= 100 ? roundTo(r.n, r.to / 10) : null;
  for (const v of [lo, lo + r.to, smaller, lo - r.to, lo + 2 * r.to, lo + 3 * r.to]) {
    if (v !== null && v >= 0 && v !== r.n && opts.length < 4 && !opts.includes(v)) opts.push(v);
  }
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, round: 0, r: null, mistakes: 0, counts: {}, picked: [], busy: false };

const game = createGame({
  id: 'tau-hoa-so',
  title: '🚂 Tàu Hỏa Số',
  sub: 'Xếp hàng lên toa, so sánh và làm tròn số!',
  levels: LEVELS.length,
  winTitle: 'Tàu về ga rồi! 🚂',
  start: startLevel,
});

const COLORS = { 1000: '#7048e8', 100: '#e03131', 10: '#f08c00', 1: '#2f9e44' };

function startLevel(idx) {
  state.idx = idx;
  state.level = LEVELS[idx];
  state.round = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

function showRound() {
  state.busy = false;
  state.r = makeRound(state.idx, state.round);
  game.rounds(state.round, ROUNDS_PER_LEVEL);
  const { kind } = state.r;
  $('#buildControls').classList.toggle('hidden', kind !== 'build');
  $('#choices').classList.toggle('hidden', kind === 'build' || kind === 'order');
  ({ build: showBuild, compare: showCompare, order: showOrder, round: showRoundLine })[kind]();
}

/* ---------- Xếp hàng lên toa ---------- */
function showBuild() {
  const { n } = state.r;
  state.counts = Object.fromEntries(state.level.places.map((p) => [p, 0]));
  $('#question').innerHTML = state.level.words
    ? `Xếp hàng cho số: <b>“${readNumber(n)}”</b>`
    : `Xếp hàng lên tàu để được số <b>${fmt(n)}</b>`;
  renderTrain();
}

function renderTrain() {
  $('#board').innerHTML = `<div class="card"><div class="train"><span class="engine">🚂</span>${state.level.places.map((p) => {
    const c = state.counts[p];
    return `<div class="wagon" style="--wc:${COLORS[p]}">
      <div class="place">${PLACE_NAMES[p]}</div>
      <div class="cargo">${`<i class="p${p}"></i>`.repeat(c)}</div>
      <div class="pm"><button data-p="${p}" data-d="-1">−</button><button data-p="${p}" data-d="1">+</button></div>
    </div>`;
  }).join('')}</div></div>`;
}

$('#board').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]');
  if (b && !state.busy) {
    const p = b.dataset.p;
    state.counts[p] = Math.max(0, Math.min(9, state.counts[p] + Number(b.dataset.d)));
    game.sfx.tap();
    renderTrain();
    return;
  }
  const card = e.target.closest('[data-n]');
  if (card && !state.busy) pickOrder(card);
});

const built = () => Object.entries(state.counts).reduce((s, [p, c]) => s + Number(p) * c, 0);

$('#checkBtn').addEventListener('click', () => {
  if (state.busy || state.r.kind !== 'build') return;
  const n = state.r.n;
  const got = built();
  if (got === n) return correct(`${fmt(n)} = ${state.level.places.map((p) => `${Math.floor(n / p) % 10} ${PLACE_NAMES[p].toLowerCase()}`).join(', ')}`);
  const wrongPlace = state.level.places.find((p) => Math.floor(got / p) % 10 !== Math.floor(n / p) % 10);
  wrong(`Tàu đang chở ${fmt(got)}. Xem lại toa ${PLACE_NAMES[wrongPlace].toLowerCase()} nhé!`);
});

/* ---------- So sánh ---------- */
function showCompare() {
  const { a, b } = state.r;
  $('#question').textContent = 'Điền dấu đúng vào giữa hai đoàn tàu';
  $('#board').innerHTML = `<div class="card vs">
    <div class="num-train"><span class="engine">🚂</span><span class="plate">${fmt(a)}</span></div>
    <div class="mid" id="sign">?</div>
    <div class="num-train"><span class="engine">🚃</span><span class="plate">${fmt(b)}</span></div></div>`;
  const signs = ['>', '<', '='];
  const want = a > b ? '>' : a < b ? '<' : '=';
  renderChoices($('#choices'), ['&gt; lớn hơn', '&lt; bé hơn', '= bằng'], (i) => {
    const ok = signs[i] === want;
    if (ok) {
      $('#sign').textContent = want;
      correct(`${fmt(a)} ${want} ${fmt(b)}`);
    } else wrong('Chưa đúng. So sánh từ chữ số bên trái sang nhé!');
    return ok;
  });
}

/* ---------- Sắp xếp ---------- */
function showOrder() {
  state.picked = [];
  $('#question').textContent = 'Chạm các đoàn tàu theo thứ tự từ BÉ đến LỚN';
  renderOrder();
}
function renderOrder() {
  $('#board').innerHTML = `<div class="order">${state.r.nums.map((n) => {
    const k = state.picked.indexOf(n);
    return `<button data-n="${n}" class="${k >= 0 ? 'picked' : ''}"><small>🚃</small>${fmt(n)}${k >= 0 ? `<span class="badge">${k + 1}</span>` : ''}</button>`;
  }).join('')}</div>`;
}
function pickOrder(card) {
  const n = Number(card.dataset.n);
  if (state.picked.includes(n)) return;
  const want = [...state.r.nums].sort((x, y) => x - y)[state.picked.length];
  if (n !== want) {
    wrong(`${fmt(n)} chưa phải số bé nhất trong các số còn lại. Thử lại nhé!`);
    state.picked = [];
    renderOrder();
    return;
  }
  state.picked.push(n);
  game.sfx.pop();
  renderOrder();
  if (state.picked.length === 4) correct(state.picked.map(fmt).join(' < '));
}

/* ---------- Làm tròn ---------- */
function showRoundLine() {
  const { n, to } = state.r;
  const lo = Math.floor(n / to) * to;
  const pos = ((n - lo) / to) * 100;
  const placeName = { 10: 'chục', 100: 'trăm', 1000: 'nghìn' }[to];
  $('#question').innerHTML = `Làm tròn số <b>${fmt(n)}</b> đến hàng ${placeName}: tàu về ga nào?`;
  $('#board').innerHTML = `<div class="card line-card"><div class="numline">
    <div class="rail"></div>
    <div class="tick" style="left:0"></div><div class="tick mid" style="left:50%"></div><div class="tick" style="left:100%"></div>
    <div class="st" style="left:0">🚉 ${fmt(lo)}</div><div class="st mid" style="left:50%">${fmt(lo + to / 2)}</div><div class="st" style="left:100%">🚉 ${fmt(lo + to)}</div>
    <div class="marker" style="left:${pos}%"><span>🚂</span><b>${fmt(n)}</b></div>
  </div></div>`;
  const opts = window.shuffle(roundOptions(state.r));
  const want = roundTo(n, to);
  renderChoices($('#choices'), opts.map((v) => `🚉 ${fmt(v)}`), (i) => {
    const ok = opts[i] === want;
    if (ok) {
      const m = document.querySelector('.marker');
      if (m) m.style.left = want === lo ? '0%' : '100%';
      correct(`${fmt(n)} ≈ ${fmt(want)}`);
    } else {
      const digit = Math.floor(n / (to / 10)) % 10;
      wrong(`Chữ số đứng ngay sau hàng ${placeName} là ${digit}. ${digit >= 5 ? 'Từ 5 trở lên thì làm tròn lên.' : 'Bé hơn 5 thì làm tròn xuống.'}`);
    }
    return ok;
  });
}

/* ---------- Đúng / sai ---------- */
async function correct(eq) {
  state.busy = true;
  game.sfx.good();
  game.say(`Đúng rồi! ${eq}`, 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  state.round++;
  if (state.round < ROUNDS_PER_LEVEL) return showRound();
  game.rounds(state.round, ROUNDS_PER_LEVEL);
  const stars = game.starsFor(state.mistakes);
  game.win({ stars, eq: state.level.name, text: stars === 3 ? 'Không sai lần nào. Lái tàu cừ khôi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!` });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
