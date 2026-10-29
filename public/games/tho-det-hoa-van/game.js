// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Chương trình là cây khối: ['bead', màu] đặt một hạt, ['nl'] xuống hàng, ['loop', số lần, [...]] lặp,
// ['call', tên] gọi hàm khai báo trong funcs. Ô '?' (màu) và '#' (số lần) là chỗ bé phải điền.
// solution: giá trị các ô trống theo thứ tự đọc (hàm trước, rồi chương trình chính; số lần lặp trước các khối bên trong).
// hideTarget: màn đoán quy luật, không cho xem mẫu (bé phải tự tìm hạt tiếp theo).
const COLORS = ['r', 'b', 'y', 'g', 'p', 'w'];
const MAX_LOOP = 6;

const LEVELS = [
  { name: 'Hạt tiếp theo', hideTarget: true, palette: ['r', 'b'], target: ['rbrbrbrb'],
    main: [['bead', 'r'], ['bead', 'b'], ['bead', 'r'], ['bead', 'b'], ['bead', 'r'], ['bead', 'b'], ['bead', '?'], ['bead', '?']],
    solution: ['r', 'b'], tip: 'Hoa văn lặp lại theo quy luật. Hai hạt cuối phải màu gì?' },
  { name: 'Quy luật ba hạt', hideTarget: true, palette: ['r', 'y', 'b'], target: ['ryyryyryy'],
    main: [['bead', 'r'], ['bead', 'y'], ['bead', 'y'], ['bead', 'r'], ['bead', 'y'], ['bead', 'y'], ['bead', '?'], ['bead', '?'], ['bead', '?']],
    solution: ['r', 'y', 'y'], tip: 'Tìm nhóm hạt lặp đi lặp lại, rồi điền tiếp ba hạt cuối.' },
  { name: 'Vòng lặp', palette: ['r', 'b', 'y'], target: ['rbrbrbrb'],
    main: [['loop', '#', [['bead', '?'], ['bead', '?']]]],
    solution: [4, 'r', 'b'], tip: 'Không cần đặt 8 hạt! Tìm nhóm lặp lại, rồi cho vòng lặp chạy đủ số lần.' },
  { name: 'Nhóm ba màu', palette: ['g', 'y', 'r'], target: ['gyygyygyy'],
    main: [['loop', '#', [['bead', '?'], ['bead', '?'], ['bead', '?']]]],
    solution: [3, 'g', 'y', 'y'], tip: 'Nhóm lặp lại có ba hạt. Cả tấm có mấy nhóm?' },
  { name: 'Lặp lồng nhau', palette: ['r', 'b', 'p'], target: ['pppp', 'pppp', 'pppp'],
    main: [['loop', '#', [['loop', '#', [['bead', '?']]], ['nl']]]],
    solution: [3, 4, 'p'], tip: 'Vòng lặp bên trong dệt một hàng. Vòng lặp bên ngoài lặp lại cả hàng đó.' },
  { name: 'Bàn cờ', palette: ['r', 'b', 'w'], target: ['rbrb', 'brbr', 'rbrb', 'brbr'],
    main: [['loop', '#', [['loop', '#', [['bead', '?'], ['bead', '?']]], ['nl'], ['loop', '#', [['bead', '?'], ['bead', '?']]], ['nl']]]],
    solution: [2, 2, 'r', 'b', 2, 'b', 'r'], tip: 'Hai hàng khác nhau xen kẽ. Vòng lặp ngoài lặp lại cặp hai hàng.' },
  { name: 'Hàm', palette: ['r', 'y', 'g'], target: ['ryrgryrgryrg'],
    funcs: { '🌸': [['bead', '?'], ['bead', '?'], ['bead', '?']] },
    main: [['loop', '#', [['call', '🌸'], ['bead', '?']]]],
    solution: ['r', 'y', 'r', 3, 'g'], tip: 'Hàm 🌸 là một nhóm lệnh có tên. Gọi 🌸 là chạy cả nhóm đó!' },
  { name: 'Hàm và lặp lồng nhau', palette: ['b', 'r', 'y'], target: ['bbbbb', 'rrrrr', 'bbbbb', 'rrrrr'],
    funcs: { '🌊': [['loop', '#', [['bead', '?']]], ['nl']] },
    main: [['loop', '#', [['call', '🌊'], ['loop', '#', [['bead', '?']]], ['nl']]]],
    solution: [5, 'b', 2, 5, 'r'], tip: 'Hàm 🌊 dệt một hàng xanh. Chương trình chính dùng 🌊 rồi tự dệt hàng đỏ.' },
];

// Danh sách ô trống theo thứ tự đọc: { node, at } (at = 1 là vị trí giá trị trong mảng khối)
function slotsOf(level) {
  const out = [];
  const walk = (nodes) => nodes.forEach((n) => {
    if (n[0] === 'bead' && n[1] === '?') out.push({ node: n, kind: 'color' });
    if (n[0] === 'loop') {
      if (n[1] === '#') out.push({ node: n, kind: 'count' });
      walk(n[2]);
    }
  });
  Object.values(level.funcs || {}).forEach(walk);
  walk(level.main);
  return out;
}

// Dệt: trả về các hàng hạt. vals = giá trị đã điền cho các ô trống (cùng thứ tự với slotsOf)
function weave(level, vals) {
  const slots = slotsOf(level);
  const valueOf = (n) => {
    const i = slots.findIndex((s) => s.node === n);
    return i < 0 ? n[1] : vals[i];
  };
  const rows = [''];
  let beads = 0;
  const run = (nodes, depth) => {
    if (depth > 8) throw new Error('Gọi hàm lồng quá sâu');
    for (const n of nodes) {
      if (n[0] === 'bead') {
        rows[rows.length - 1] += valueOf(n) || '.';
        if (++beads > 120) throw new Error('Quá nhiều hạt');
      } else if (n[0] === 'nl') rows.push('');
      else if (n[0] === 'loop') for (let i = 0; i < (valueOf(n) || 0); i++) run(n[2], depth);
      else if (n[0] === 'call') run(level.funcs[n[1]], depth + 1);
    }
  };
  run(level.main, 0);
  if (rows.length > 1 && rows.at(-1) === '') rows.pop();
  return rows;
}

const sameRows = (a, b) => a.length === b.length && a.every((r, i) => r === b[i]);
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, slots: [], vals: [], mistakes: 0, busy: false };

const game = createGame({
  id: 'tho-det-hoa-van',
  title: '🧵 Thợ Dệt Hoa Văn',
  sub: 'Tìm quy luật, dùng vòng lặp và hàm để dệt hoa văn!',
  levels: LEVELS.length,
  winTitle: 'Tấm vải đẹp quá! 🧵',
  start: startLevel,
});

const dots = (rows, { cls = '', wrong = [] } = {}) => rows.map((r, ri) =>
  `<div class="row">${[...r].map((c, ci) => `<i class="dot c-${c}${cls}${wrong.some(([a, b]) => a === ri && b === ci) ? ' wrong' : ''}"></i>`).join('')}</div>`).join('');

function startLevel(idx) {
  const L = LEVELS[idx];
  state.level = L;
  state.slots = slotsOf(L);
  state.vals = state.slots.map(() => null);
  state.mistakes = 0;
  state.busy = false;
  $('#stage').classList.remove('running');
  $('#targetCard').classList.toggle('hidden', !!L.hideTarget);
  $('#target').innerHTML = dots(L.target);
  $('#result').innerHTML = '';
  renderProgram();
  game.say(L.tip);
}

/* ---------- Vẽ chương trình ---------- */
function renderProgram() {
  const L = state.level;
  const slotIndex = (n) => state.slots.findIndex((s) => s.node === n);
  const block = (n) => {
    const i = slotIndex(n);
    if (n[0] === 'bead') {
      const c = i < 0 ? n[1] : state.vals[i];
      return `<button class="bead ${c ? `c-${c}` : ''}${i >= 0 ? ' slot' : ' fixed'}${i >= 0 && !c ? ' unset' : ''}" ${i >= 0 ? `data-slot="${i}"` : ''}>${c ? '' : '❓'}</button>`;
    }
    if (n[0] === 'nl') return '<span class="blk nl">↵ xuống hàng</span>';
    if (n[0] === 'call') return `<span class="blk call">${n[1]} gọi hàm</span>`;
    const v = i < 0 ? n[1] : state.vals[i];
    return `<div class="blk loop"><div class="head">🔁 lặp <button class="count${i >= 0 ? ' slot' : ' fixed'}${v ? '' : ' unset'}" ${i >= 0 ? `data-slot="${i}"` : ''}>${v || '?'}</button> lần</div>
      <div class="blocks">${n[2].map(block).join('')}</div></div>`;
  };
  const funcs = Object.entries(L.funcs || {}).map(([name, body]) =>
    `<div class="func">Hàm ${name}:<div class="blocks">${body.map(block).join('')}</div></div>`).join('');
  $('#program').innerHTML = `${funcs}<div class="main">${L.funcs ? '▶ Chương trình chính:' : ''}<div class="blocks">${L.main.map(block).join('')}</div></div>`;
}

$('#program').addEventListener('click', (e) => {
  const b = e.target.closest('[data-slot]');
  if (!b || state.busy) return;
  const i = Number(b.dataset.slot);
  const slot = state.slots[i];
  if (slot.kind === 'color') {
    const pal = state.level.palette;
    state.vals[i] = pal[(pal.indexOf(state.vals[i]) + 1) % pal.length];
  } else {
    state.vals[i] = (state.vals[i] || 0) % MAX_LOOP + 1;
  }
  game.sfx.tap();
  renderProgram();
});

/* ---------- Dệt thử ---------- */
$('#weaveBtn').addEventListener('click', async () => {
  if (state.busy) return;
  const L = state.level;
  if (state.vals.some((v) => v === null)) return game.say('Còn ô ❓ chưa điền. Chạm vào để chọn nhé!', 'sad', 'soft');
  state.busy = true;
  $('#stage').classList.add('running');
  const rows = weave(L, state.vals);
  $('#result').innerHTML = '';
  // Dệt từng hạt cho bé thấy máy chạy
  const shown = [];
  const total = rows.reduce((s, r) => s + r.length, 0);
  const delay = Math.max(40, Math.min(160, 2400 / Math.max(total, 1)));
  for (const r of rows) {
    shown.push('');
    for (const c of r) {
      shown[shown.length - 1] += c;
      $('#result').innerHTML = dots(shown);
      game.tone(500 + COLORS.indexOf(c) * 80, 0.06, { type: 'triangle', vol: 0.06 });
      if (!(await game.wait(delay))) return;
    }
  }
  $('#stage').classList.remove('running');
  state.busy = false;
  if (sameRows(rows, L.target)) {
    state.busy = true;
    game.sfx.good();
    game.say('Giống hệt mẫu! 🎉', 'cheer', 'good');
    const blocks = JSON.stringify([L.main, L.funcs]).match(/"(bead|nl|call|loop)"/g).length;
    const beads = L.target.join('').length;
    const stars = game.starsFor(state.mistakes, 1);
    return game.win({
      stars,
      eq: `${beads} hạt chỉ với ${blocks} khối lệnh`,
      text: stars === 3 ? 'Dệt đúng ngay lần đầu. Thợ dệt tài ba!' : `Bé dệt ${state.mistakes + 1} lần mới giống mẫu. Cố lên!`,
    });
  }
  state.mistakes++;
  game.sfx.bad();
  const wrong = [];
  if (!L.hideTarget) rows.forEach((r, ri) => [...r].forEach((c, ci) => { if (L.target[ri]?.[ci] !== c) wrong.push([ri, ci]); }));
  $('#result').innerHTML = dots(rows, { wrong });
  let hint = 'Chưa giống mẫu. Xem các hạt viền đỏ nhé!';
  if (rows.length !== L.target.length) hint = `Mẫu có ${L.target.length} hàng, tấm vải của bé có ${rows.length} hàng.`;
  else if (rows.some((r, i) => r.length !== L.target[i].length)) hint = 'Số hạt trong hàng chưa đúng. Xem lại số lần lặp nhé!';
  if (L.hideTarget) hint = 'Chưa đúng quy luật. Đọc to màu các hạt từ đầu xem nhóm nào lặp lại!';
  game.say(hint, 'sad', 'soft');
});
