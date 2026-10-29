// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Đề sinh ngẫu nhiên theo từng màn. kinds:
// grid = tô p% bảng 100 ô; compare = so sánh hai số thập phân; add / sub = cộng trừ số thập phân (kg);
// off = được giảm bao nhiêu tiền; pay = giá sau khi giảm; pct = p% của một số; best = cửa hàng nào rẻ hơn.
// Số thập phân lưu bằng số nguyên phần nghìn (2,45 → 2450) để tính không bị sai số.
const LEVELS = [
  { name: 'Phần trăm là gì?', kinds: ['grid', 'grid', 'grid'], tip: 'Bảng có 100 ô. 35% nghĩa là 35 ô trên 100 ô. Chạm số bên trái để tô cả hàng 10 ô.' },
  { name: 'So sánh số thập phân', kinds: ['compare', 'compare', 'compare', 'compare'], tip: 'So phần nguyên trước, rồi so từng chữ số sau dấu phẩy: hàng phần mười, rồi phần trăm.' },
  { name: 'Cộng trừ số thập phân', kinds: ['add', 'sub', 'add', 'sub'], tip: 'Đặt các dấu phẩy thẳng cột, rồi cộng trừ như số tự nhiên.' },
  { name: 'Được giảm bao nhiêu?', kinds: ['off', 'off', 'off', 'off'], tip: 'Giảm 10% là giảm 10 đồng trên mỗi 100 đồng. 10% của 200 000 = 20 000.' },
  { name: 'Giá sau khi giảm', kinds: ['pay', 'pay', 'pay', 'pay'], tip: 'Giá phải trả = giá gốc − số tiền được giảm.' },
  { name: 'Tính phần trăm', kinds: ['grid', 'pct', 'pct', 'pct'], tip: 'Muốn tìm 20% của 50: lấy 50 : 100 × 20.' },
  { name: 'Chọn cửa hàng', kinds: ['best', 'best', 'pay', 'best'], tip: 'Tính số tiền phải trả ở mỗi cửa hàng rồi mới so sánh nhé.' },
  { name: 'Thử thách', kinds: ['compare', 'add', 'off', 'pay', 'best'], tip: 'Màn cuối! Tính cẩn thận, không vội nhé.' },
];

const ITEMS = [['👕', 'Áo phông'], ['👟', 'Giày'], ['🎒', 'Ba lô'], ['🧸', 'Gấu bông'], ['📚', 'Bộ sách'], ['⚽', 'Quả bóng'], ['🚲', 'Xe đạp'], ['🎮', 'Đồ chơi']];
const FOODS = [['🍎', 'táo'], ['🍇', 'nho'], ['🍊', 'cam'], ['🥕', 'cà rốt'], ['🍌', 'chuối'], ['🧀', 'phô mai']];
const PERCENTS = [10, 20, 25, 50, 30, 40, 5, 15];

// 2450 → "2,45" (bỏ số 0 thừa, trừ khi giữ places chữ số)
function fmtDec(v, places = 0) {
  const int = Math.floor(v / 1000);
  let frac = String(v % 1000).padStart(3, '0').replace(/0+$/, '');
  if (frac.length < places) frac = frac.padEnd(places, '0');
  return frac ? `${int},${frac}` : `${int}`;
}
const fmtMoney = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;

function makeRound(levelIdx, k, rand = Math.random) {
  const kind = LEVELS[levelIdx].kinds[k];
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pickOf = (arr) => arr[int(0, arr.length - 1)];
  // Giá tròn chục nghìn sao cho tiền giảm tròn nghìn
  const priceFor = (p) => {
    for (;;) {
      const price = int(5, 50) * 10000;
      if ((price * p) % 100000 === 0) return price;
    }
  };
  if (kind === 'grid') return { kind, p: pickOf([10, 30, 50, 25, 75, 45, 60, 15, 5, 90]) };
  if (kind === 'compare') {
    const a = int(1, 9) * 1000 + int(1, 9) * 100;
    // Mỗi câu trong màn một kiểu bẫy khác nhau
    const variant = k % 4;
    let b;
    let bPlaces = 2;
    if (variant === 0) b = a - 100 + int(1, 9) * 10;       // 2,5 và 2,45: nhiều chữ số hơn chưa chắc lớn hơn
    else if (variant === 1) { b = a; bPlaces = 2; }        // 0,7 và 0,70: bằng nhau
    else if (variant === 2) b = a + int(1, 9) * 10;        // 2,5 và 2,53
    else { b = a - 1000 + int(1, 9) * 100; bPlaces = 1; }   // 3,4 và 2,8
    const swap = rand() < 0.5;
    const A = { v: a, s: fmtDec(a, 1) };
    const B = { v: b, s: fmtDec(b, bPlaces) };
    return swap ? { kind, a: B, b: A } : { kind, a: A, b: B };
  }
  if (kind === 'add' || kind === 'sub') {
    const [x, y] = [pickOf(FOODS), pickOf(FOODS.filter((f) => f !== FOODS[0]))];
    let a = int(1, 3) * 1000 + int(1, 9) * 100;
    let b = int(0, 1) * 1000 + int(1, 9) * 100 + int(1, 9) * 10;
    if (kind === 'sub' && b >= a) [a, b] = [b + 1000, a];
    return { kind, a, b, foods: [x, y === x ? FOODS[1] : y] };
  }
  if (kind === 'pct') {
    const p = pickOf([10, 20, 25, 50, 75]);
    let n;
    do n = int(2, 40) * 10; while ((n * p) % 100 !== 0);
    return { kind, p, n };
  }
  if (kind === 'best') {
    for (;;) {
      const p = pickOf([10, 20, 25, 30]);
      const price = priceFor(p);
      const cut = int(1, Math.max(1, Math.round(price / 20000))) * 5000;
      const payA = price - (price * p) / 100;
      const payB = price - cut;
      if (payA !== payB && cut < price) return { kind, item: pickOf(ITEMS), price, p, cut, payA, payB };
    }
  }
  const p = pickOf(PERCENTS);
  return { kind, item: pickOf(ITEMS), price: priceFor(p), p };
}

function answerOf(r) {
  if (r.kind === 'grid') return r.p;
  if (r.kind === 'compare') return Math.sign(r.a.v - r.b.v);
  if (r.kind === 'add') return r.a + r.b;
  if (r.kind === 'sub') return r.a - r.b;
  if (r.kind === 'off') return (r.price * r.p) / 100;
  if (r.kind === 'pay') return r.price - (r.price * r.p) / 100;
  if (r.kind === 'pct') return (r.n * r.p) / 100;
  return r.payA < r.payB ? 'A' : 'B';
}

// 4 đáp án số cho add, sub, off, pay, pct
function numberOptions(r) {
  const ans = answerOf(r);
  let near;
  if (r.kind === 'add' || r.kind === 'sub') {
    // Lỗi hay gặp: không đặt thẳng dấu phẩy (cộng phần thập phân như số tự nhiên)
    const fa = Math.round((r.a % 1000) / 100);
    const fb = (r.b % 1000) / 10;
    const ia = Math.floor(r.a / 1000);
    const ib = Math.floor(r.b / 1000);
    const wrongAlign = r.kind === 'add' ? (ia + ib) * 1000 + Math.min(999, (fa + fb) * 10) : (ia - ib) * 1000 + Math.abs(fa - fb) * 10;
    near = [wrongAlign, ans + 100, ans - 100, ans + 1000, ans - 10];
  } else if (r.kind === 'pct') near = [r.n - ans, r.p, ans * 2, ans + 5, ans - 5];
  else {
    const off = (r.price * r.p) / 100;
    near = r.kind === 'off'
      ? [r.price - off, off * 2, off / 2, off + 10000, r.p * 1000]
      : [off, r.price - off * 2, r.price - r.p * 1000, r.price + off, r.price - off + 10000];
  }
  near.push(ans + (r.kind === 'pct' ? 10 : 10000), ans + (r.kind === 'pct' ? 1 : 1000), ans * 3);
  const opts = [ans];
  for (const v of near) if (opts.length < 4 && v > 0 && Number.isInteger(v) && !opts.includes(v)) opts.push(v);
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, ri: 0, r: null, mistakes: 0, busy: false, cells: new Set() };

const game = createGame({
  id: 'cua-hang-giam-gia',
  title: '🏷️ Cửa Hàng Giảm Giá',
  sub: 'Số thập phân, phần trăm và săn hàng giảm giá!',
  levels: LEVELS.length,
  winTitle: 'Bé mua sắm thông minh! 🛍️',
  start: startLevel,
});

function startLevel(idx) {
  state.idx = idx;
  state.level = LEVELS[idx];
  state.ri = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

function showRound() {
  const r = makeRound(state.idx, state.ri);
  state.r = r;
  state.busy = false;
  game.rounds(state.ri, state.level.kinds.length);
  const grid = r.kind === 'grid';
  $('#gridRow').classList.toggle('hidden', !grid);
  $('#choices').classList.toggle('hidden', grid);

  if (grid) {
    state.cells = new Set();
    $('#question').textContent = `Tô màu ${r.p}% tấm bảng`;
    renderGrid();
    return;
  }
  if (r.kind === 'compare') {
    $('#question').textContent = 'Túi nào nặng hơn?';
    $('#board').innerHTML = `<div class="item"><div class="em">🛍️</div><div class="name">Túi A</div><div class="price">${r.a.s} kg</div></div>
      <div class="item"><div class="em">🛍️</div><div class="name">Túi B</div><div class="price">${r.b.s} kg</div></div>`;
    const vals = [1, -1, 0];
    renderChoices($('#choices'), ['Túi A', 'Túi B', 'Bằng nhau'], (i) => {
      const ok = vals[i] === answerOf(r);
      if (ok) correct(`${r.a.s} ${['=', '>', '<'][[0, 1, -1].indexOf(answerOf(r))]} ${r.b.s}`);
      else wrong('So phần nguyên trước, rồi so hàng phần mười. Thêm số 0 vào cuối không làm số thay đổi.');
      return ok;
    });
    return;
  }
  if (r.kind === 'best') {
    $('#question').textContent = `Mua ${r.item[1].toLowerCase()} ở cửa hàng nào rẻ hơn?`;
    $('#board').innerHTML = [['A', `Giảm ${r.p}%`], ['B', `Giảm ${fmtMoney(r.cut)}`]].map(([s, tag]) =>
      `<div class="item"><span class="tag">${tag}</span><div class="shop">Cửa hàng ${s}</div><div class="em">${r.item[0]}</div><div class="price">${fmtMoney(r.price)}</div></div>`).join('');
    renderChoices($('#choices'), ['Cửa hàng A', 'Cửa hàng B'], (i) => {
      const ok = ['A', 'B'][i] === answerOf(r);
      if (ok) correct(`A: ${fmtMoney(r.payA)}, B: ${fmtMoney(r.payB)}`);
      else wrong(`Tính thử: ${r.p}% của ${fmtMoney(r.price)} là bao nhiêu tiền? So với ${fmtMoney(r.cut)} nhé.`);
      return ok;
    });
    return;
  }

  let unit = (v) => fmtMoney(v);
  if (r.kind === 'add' || r.kind === 'sub') {
    const [x, y] = r.foods;
    $('#question').textContent = r.kind === 'add'
      ? `Mua ${fmtDec(r.a, 1)} kg ${x[1]} và ${fmtDec(r.b, 2)} kg ${y[1]}. Tất cả nặng bao nhiêu?`
      : `Có ${fmtDec(r.a, 1)} kg ${x[1]}, bán đi ${fmtDec(r.b, 2)} kg. Còn lại bao nhiêu?`;
    $('#board').innerHTML = `<div class="item"><div class="em">${x[0]}</div><div class="price">${fmtDec(r.a, 1)} kg</div></div>
      <span class="plus">${r.kind === 'add' ? '+' : '−'}</span>
      <div class="item"><div class="em">${r.kind === 'add' ? y[0] : x[0]}</div><div class="price">${fmtDec(r.b, 2)} kg</div></div>`;
    unit = (v) => `${fmtDec(v)} kg`;
  } else if (r.kind === 'pct') {
    $('#question').textContent = `${r.p}% của ${r.n} là bao nhiêu?`;
    $('#board').innerHTML = `<div class="item"><div class="em">🧮</div><div class="price">${r.p}% × ${r.n}</div></div>`;
    unit = (v) => String(v);
  } else {
    $('#question').textContent = r.kind === 'off'
      ? `${r.item[1]} giá ${fmtMoney(r.price)}, giảm ${r.p}%. Bé được giảm bao nhiêu tiền?`
      : `${r.item[1]} giá ${fmtMoney(r.price)}, giảm ${r.p}%. Bé phải trả bao nhiêu tiền?`;
    $('#board').innerHTML = `<div class="item"><span class="tag">-${r.p}%</span><div class="em">${r.item[0]}</div><div class="name">${r.item[1]}</div><div class="price">${fmtMoney(r.price)}</div></div>`;
  }
  const opts = window.shuffle(numberOptions(r));
  const ans = answerOf(r);
  renderChoices($('#choices'), opts.map(unit), (i) => {
    const ok = opts[i] === ans;
    if (ok) correct(unit(ans));
    else wrong({
      add: 'Đặt các dấu phẩy thẳng cột rồi mới cộng nhé.',
      sub: 'Đặt các dấu phẩy thẳng cột rồi mới trừ nhé.',
      off: `Tìm ${r.p}% của ${fmtMoney(r.price)}: chia cho 100 rồi nhân ${r.p}.`,
      pay: 'Tính số tiền được giảm trước, rồi lấy giá gốc trừ đi.',
      pct: `Lấy ${r.n} : 100 × ${r.p}.`,
    }[r.kind]);
    return ok;
  });
}

/* ---------- Bảng 100 ô ---------- */
function renderGrid() {
  let html = '';
  for (let row = 0; row < 10; row++) {
    html += `<button class="rowbtn" data-row="${row}">+10</button>`;
    for (let c = 0; c < 10; c++) {
      const i = row * 10 + c;
      html += `<button class="sq${state.cells.has(i) ? ' on' : ''}" data-i="${i}"></button>`;
    }
  }
  $('#board').innerHTML = `<div class="hundred">${html}</div><div class="count-note">Đã tô ${state.cells.size} / 100 ô = ${state.cells.size}%</div>`;
}
$('#board').addEventListener('click', (e) => {
  if (state.busy || state.r?.kind !== 'grid') return;
  const sq = e.target.closest('.sq');
  const row = e.target.closest('.rowbtn');
  if (sq) {
    const i = Number(sq.dataset.i);
    if (state.cells.has(i)) state.cells.delete(i); else state.cells.add(i);
  } else if (row) {
    const cells = Array.from({ length: 10 }, (_, c) => Number(row.dataset.row) * 10 + c);
    const full = cells.every((i) => state.cells.has(i));
    for (const i of cells) if (full) state.cells.delete(i); else state.cells.add(i);
  } else return;
  game.sfx.tap();
  renderGrid();
});
$('#clearBtn').addEventListener('click', () => {
  if (state.busy) return;
  state.cells = new Set();
  renderGrid();
});
$('#checkBtn').addEventListener('click', () => {
  if (state.busy) return;
  const n = state.cells.size;
  if (n === state.r.p) return correct(`${n} ô trên 100 ô = ${n}%`);
  wrong(n < state.r.p ? `Mới tô ${n} ô, cần ${state.r.p} ô.` : `Tô ${n} ô là nhiều quá, chỉ cần ${state.r.p} ô.`);
});

/* ---------- Đúng / sai ---------- */
async function correct(eq) {
  state.busy = true;
  game.sfx.good();
  game.say(`Đúng rồi! ${eq}`, 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  state.ri++;
  if (state.ri < state.level.kinds.length) return showRound();
  game.rounds(state.ri, state.level.kinds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({ stars, eq: state.level.name, text: stars === 3 ? 'Không sai lần nào. Bé tính tiền giỏi quá!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!` });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
