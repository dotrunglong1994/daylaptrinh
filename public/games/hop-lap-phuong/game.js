// LEVELS-START (scripts/checks/hop-lap-phuong.mjs đọc đoạn này để kiểm tra từng màn)
// Hộp a × b × c: a khối theo chiều dài, b theo chiều rộng, c tầng. Loại câu:
// count = đếm khối của hộp xếp đầy; fill = hộp đã xếp một phần, cần thêm bao nhiêu khối;
// formula = thể tích hình hộp chữ nhật (cm³); cube = thể tích hình lập phương; reverse = biết thể tích, tìm chiều cao;
// unit = đổi cm³ – dm³ – m³ – lít; tank = bể cá có nước cao h dm, chứa bao nhiêu lít.
const ROUNDS = 4;
const LEVELS = [
  { name: 'Đếm khối', kinds: ['count'], size: [[2, 3], [1, 2], [1, 2]], tip: 'Mỗi viên là một khối lập phương nhỏ. Nhớ đếm cả những khối bị che phía sau nhé!' },
  { name: 'Đếm theo tầng', kinds: ['count'], size: [[2, 4], [2, 3], [2, 3]], tip: 'Đếm một tầng trước: dài × rộng. Rồi nhân với số tầng.' },
  { name: 'Xếp cho đầy', kinds: ['fill'], size: [[2, 4], [2, 3], [2, 4]], tip: 'Tính cả hộp chứa bao nhiêu khối, rồi trừ đi số khối đã xếp.' },
  { name: 'Công thức thể tích', kinds: ['formula'], tip: 'Thể tích hình hộp chữ nhật = chiều dài × chiều rộng × chiều cao.' },
  { name: 'Hình lập phương', kinds: ['cube'], tip: 'Hình lập phương có 3 cạnh bằng nhau. Thể tích = cạnh × cạnh × cạnh.' },
  { name: 'Tìm chiều cao', kinds: ['reverse'], tip: 'Lấy thể tích chia cho diện tích đáy (dài × rộng) là ra chiều cao.' },
  { name: 'Đổi đơn vị', kinds: ['unit'], tip: '1 dm³ = 1000 cm³ = 1 lít. 1 m³ = 1000 dm³.' },
  { name: 'Bể cá', kinds: ['tank'], tip: '1 dm³ nước là 1 lít. Chỉ tính phần có nước, không tính cả bể.' },
  { name: 'Thử thách', kinds: ['count', 'fill', 'formula', 'reverse', 'tank', 'cube'], size: [[2, 4], [2, 3], [2, 3]], tip: 'Màn cuối có đủ mọi loại câu. Cố lên!' },
];
const UNIT_KINDS = ['dm-cm', 'cm-dm', 'dm-l', 'm-dm'];

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// Đáp án đúng đứng đầu, rồi 3 đáp án nhiễu khác nhau (giữ thứ tự ưu tiên), đều là số dương
function withDistractors(ans, list) {
  const out = [ans];
  for (const x of list) if (x > 0 && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) if (!out.includes(ans + d)) out.push(ans + d);
  return out;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  // Màn có nhiều loại câu hơn số câu thì chọn ngẫu nhiên loại câu
  const kind = L.kinds.length > ROUNDS ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  const size = L.size || [[2, 4], [2, 3], [2, 3]];
  if (kind === 'count' || kind === 'fill') {
    let [a, b, c] = size.map(([lo, hi]) => ri(rand, lo, hi));
    if (kind === 'fill' && c < 2) c = 2;
    const total = a * b * c;
    if (kind === 'count') {
      const hidden = (a - 1) * (b - 1) * (c - 1);
      return { kind, a, b, c, ans: total, options: withDistractors(total, [total - hidden, a * b, total + a, total - b, total + 1]) };
    }
    // Đã xếp m tầng đầy và j hàng của tầng kế tiếp (xếp từ phía sau ra)
    const m = ri(rand, 1, c - 1);
    const j = ri(rand, 0, b - 1);
    const placed = m * a * b + j * a;
    const ans = total - placed;
    return { kind, a, b, c, placed, ans, options: withDistractors(ans, [total, placed, ans + a, ans - a, ans + a * b]) };
  }
  if (kind === 'formula') {
    const a = ri(rand, 3, 12), b = ri(rand, 2, 8), c = ri(rand, 2, 10);
    const ans = a * b * c;
    return { kind, a, b, c, ans, options: withDistractors(ans, [a * b, a + b + c, a * b + c, (a + b) * 2 * c, ans + 10]) };
  }
  if (kind === 'cube') {
    const a = ri(rand, 2, 10);
    const ans = a * a * a;
    return { kind, a, b: a, c: a, ans, options: withDistractors(ans, [a * a, a * 3, 6 * a * a, a * a * 2]) };
  }
  if (kind === 'reverse') {
    const a = ri(rand, 3, 10), b = ri(rand, 2, 8), c = ri(rand, 2, 12);
    const v = a * b * c;
    return { kind, a, b, c, v, ans: c, options: withDistractors(c, [v - a * b, c * 2, c + 2, c - 2, a * b]) };
  }
  if (kind === 'unit') {
    const u = pick(rand, UNIT_KINDS);
    if (u === 'dm-cm') {
      const n = ri(rand, 2, 9);
      return { kind, u, n, ans: n * 1000, options: withDistractors(n * 1000, [n * 100, n * 10, n * 10000]) };
    }
    if (u === 'cm-dm') {
      const ans = ri(rand, 2, 9) + pick(rand, [0, 0.5]);
      return { kind, u, n: ans * 1000, ans, options: withDistractors(ans, [ans * 10, ans * 100, ans / 10]) };
    }
    if (u === 'dm-l') {
      const n = ri(rand, 2, 30);
      return { kind, u, n, ans: n, options: withDistractors(n, [n * 1000, n * 10, n * 100]) };
    }
    const n = ri(rand, 1, 5);
    return { kind, u, n, ans: n * 1000, options: withDistractors(n * 1000, [n * 100, n * 10, n * 10000]) };
  }
  // tank: bể a × b × c dm, nước cao h dm
  const a = ri(rand, 3, 8), b = ri(rand, 2, 5), c = ri(rand, 3, 6);
  const h = ri(rand, 1, c - 1);
  const ans = a * b * h;
  return { kind, a, b, c, h, ans, options: withDistractors(ans, [a * b * c, a * b * (c - h), ans * 1000, a + b + h]) };
}

const answerOf = (r) => r.ans;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false };
const num = (n) => String(n).replace('.', ',');
const UNIT_TEXT = { 'dm-cm': ['dm³', 'cm³'], 'cm-dm': ['cm³', 'dm³'], 'dm-l': ['dm³', 'lít'], 'm-dm': ['m³', 'dm³'] };

const game = createGame({
  id: 'hop-lap-phuong',
  title: '🧊 Kho Hộp Lập Phương',
  sub: 'Xếp khối lập phương, tính thể tích hình hộp và bể nước!',
  levels: LEVELS.length,
  winTitle: 'Bé tính thể tích giỏi quá! 🧊',
  start: startLevel,
});

/* ---------- Vẽ hình hộp kiểu ba chiều ---------- */
const W = 320, H = 250;
function projector(a, b, c) {
  const k = 0.866;
  const s = Math.min(230 / ((a + b) * k), 180 / (c + (a + b) / 2));
  const ox = W / 2 - ((a - b) * k * s) / 2;
  const oy = H / 2 - (((a + b) / 2 - c) * s) / 2;
  return (x, y, z) => [ox + (x - y) * k * s, oy + (x + y) * 0.5 * s - z * s];
}
const poly = (P, pts, cls) => `<polygon class="${cls}" points="${pts.map((p) => P(...p).map((v) => v.toFixed(1)).join(',')).join(' ')}" />`;

function cubeFaces(P, x, y, z, cls) {
  return poly(P, [[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], `face left ${cls}`)
    + poly(P, [[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], `face right ${cls}`)
    + poly(P, [[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], `face top ${cls}`);
}

// Ba mặt nhìn thấy của một khối hộp lớn
const boxFaces = (P, a, b, c, cls, z0 = 0) =>
  poly(P, [[0, b, z0], [a, b, z0], [a, b, c], [0, b, c]], `face left ${cls}`)
  + poly(P, [[a, 0, z0], [a, b, z0], [a, b, c], [a, 0, c]], `face right ${cls}`)
  + poly(P, [[0, 0, c], [a, 0, c], [a, b, c], [0, b, c]], `face top ${cls}`);

function edgesOf(P, a, b, c, cls) {
  const corners = [];
  for (const x of [0, a]) for (const y of [0, b]) for (const z of [0, c]) corners.push([x, y, z]);
  let s = '';
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const diff = corners[i].filter((v, d) => v !== corners[j][d]).length;
      if (diff !== 1) continue;
      const [p, q] = [P(...corners[i]), P(...corners[j])];
      s += `<line class="${cls}" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" />`;
    }
  }
  return s;
}

// Nhãn số đo đặt cạnh trung điểm một cạnh, đẩy ra ngoài một chút
function edgeLabel(P, from, to, text, dx, dy) {
  const p = P(...from), q = P(...to);
  return `<text class="dim" x="${(p[0] + q[0]) / 2 + dx}" y="${(p[1] + q[1]) / 2 + dy}">${text}</text>`;
}
function dims(P, a, b, c, unit, labels = [a, b, c]) {
  return edgeLabel(P, [0, b, 0], [a, b, 0], `${labels[0]}${unit}`, -16, 16)
    + edgeLabel(P, [a, 0, 0], [a, b, 0], `${labels[1]}${unit}`, 18, 16)
    + edgeLabel(P, [a, 0, 0], [a, 0, c], `${labels[2]}${unit}`, 26, 0);
}

function drawBox(r, done = false) {
  const svg = $('#box');
  svg.parentElement.classList.toggle('hidden', r.kind === 'unit');
  if (r.kind === 'unit') return;
  const P = projector(r.a, r.b, r.c);
  let s = '';
  if (r.kind === 'count' || r.kind === 'fill') {
    const count = r.kind === 'fill' && !done ? r.placed : r.a * r.b * r.c;
    const cubes = [];
    // Xếp từng tầng, mỗi tầng xếp từ hàng sau (y nhỏ) ra hàng trước
    for (let z = 0; z < r.c; z++) for (let y = 0; y < r.b; y++) for (let x = 0; x < r.a; x++) cubes.push([x, y, z]);
    if (r.kind === 'fill') s += edgesOf(P, r.a, r.b, r.c, 'wire');
    const placed = cubes.slice(0, count).map((p, i) => [...p, i]);
    placed.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]) || p[2] - q[2]);
    for (const [x, y, z, i] of placed) s += cubeFaces(P, x, y, z, r.kind === 'fill' && i >= r.placed ? 'new' : `c${z % 3}`);
    if (r.kind === 'fill') s += dims(P, r.a, r.b, r.c, '');
  } else if (r.kind === 'tank') {
    s += edgesOf(P, r.a, r.b, r.c, 'wire');
    s += boxFaces(P, r.a, r.b, r.h, 'water');
    s += boxFaces(P, r.a, r.b, r.c, 'glass');
    s += dims(P, r.a, r.b, r.c, ' dm');
    s += `<text class="dim water-lbl" x="${P(0, r.b, r.h / 2)[0] - 8}" y="${P(0, r.b, r.h / 2)[1]}">nước ${r.h} dm</text>`;
  } else {
    s += boxFaces(P, r.a, r.b, r.c, r.kind === 'cube' ? 'solid cube' : 'solid');
    s += edgesOf(P, r.a, r.b, r.c, 'edge');
    if (r.kind === 'cube') s += edgeLabel(P, [r.a, 0, 0], [r.a, 0, r.c], `${r.a} cm`, 30, 0);
    else s += dims(P, r.a, r.b, r.c, ' cm', [r.a, r.b, r.kind === 'reverse' && !done ? '?' : r.c]);
  }
  svg.innerHTML = s;
}

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  state.busy = false;
  showRound();
}

function questionOf(r) {
  switch (r.kind) {
    case 'count': return 'Hình hộp này có bao nhiêu khối lập phương nhỏ?';
    case 'fill': return `Hộp dài ${r.a} khối, rộng ${r.b} khối, cao ${r.c} tầng. Cần thêm bao nhiêu khối nữa để xếp đầy hộp?`;
    case 'formula': return `Hình hộp chữ nhật dài ${r.a} cm, rộng ${r.b} cm, cao ${r.c} cm. Thể tích là bao nhiêu?`;
    case 'cube': return `Hình lập phương có cạnh ${r.a} cm. Thể tích là bao nhiêu?`;
    case 'reverse': return `Hình hộp có thể tích ${r.v} cm³, dài ${r.a} cm, rộng ${r.b} cm. Chiều cao là bao nhiêu?`;
    case 'unit': {
      const [from, to] = UNIT_TEXT[r.u];
      return `${num(r.n)} ${from} = ? ${to}`;
    }
    default: return `Bể cá dài ${r.a} dm, rộng ${r.b} dm, cao ${r.c} dm. Nước trong bể cao ${r.h} dm. Trong bể có bao nhiêu lít nước?`;
  }
}

function unitOf(r) {
  if (r.kind === 'count' || r.kind === 'fill') return ' khối';
  if (r.kind === 'reverse') return ' cm';
  if (r.kind === 'unit') return ` ${UNIT_TEXT[r.u][1]}`;
  if (r.kind === 'tank') return ' lít';
  return ' cm³';
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  game.rounds(state.round, ROUNDS);
  $('#question').textContent = questionOf(r);
  $('#question').classList.toggle('big', r.kind === 'unit');
  drawBox(r);
  const q = questionOf(r);
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);
  const opts = window.shuffle(r.options);
  renderChoices($('#choices'), opts.map((o) => `${num(o)}${unitOf(r)}`), (i) => {
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(hintFor(r, opts[i]));
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

function hintFor(r, picked) {
  switch (r.kind) {
    case 'count':
      return picked === r.ans - (r.a - 1) * (r.b - 1) * (r.c - 1)
        ? 'Bé mới đếm những khối nhìn thấy. Còn các khối bị che ở bên trong nữa!'
        : `Đếm một tầng trước: ${r.a} × ${r.b} = ? khối. Hộp có ${r.c} tầng.`;
    case 'fill':
      return picked === r.a * r.b * r.c ? 'Đó là số khối của cả hộp. Trong hộp đã có sẵn một số khối rồi!' : 'Hộp đầy có dài × rộng × cao khối. Trừ đi số khối đã xếp nhé.';
    case 'formula': return `Thể tích = ${r.a} × ${r.b} × ${r.c}. Nhân lần lượt từng số nhé.`;
    case 'cube': return `Thể tích = ${r.a} × ${r.a} × ${r.a}, nhân ba lần chứ không phải nhân với 3.`;
    case 'reverse': return `Diện tích đáy là ${r.a} × ${r.b} = ${r.a * r.b} cm². Lấy ${r.v} chia cho ${r.a * r.b}.`;
    case 'unit': return LEVELS[6].tip;
    default:
      return picked === r.a * r.b * r.c ? 'Bể chưa đầy nước đâu! Chỉ tính phần nước cao ' + r.h + ' dm thôi.' : `Nước là một hình hộp ${r.a} × ${r.b} × ${r.h} dm³, mà 1 dm³ = 1 lít.`;
  }
}

function explain(r) {
  switch (r.kind) {
    case 'count': return `${r.a} × ${r.b} × ${r.c} = ${r.ans} khối`;
    case 'fill': return `${r.a * r.b * r.c} − ${r.placed} = ${r.ans} khối`;
    case 'formula': return `${r.a} × ${r.b} × ${r.c} = ${r.ans} cm³`;
    case 'cube': return `${r.a} × ${r.a} × ${r.a} = ${r.ans} cm³`;
    case 'reverse': return `${r.v} : (${r.a} × ${r.b}) = ${r.ans} cm`;
    case 'unit': return `${num(r.n)} ${UNIT_TEXT[r.u][0]} = ${num(r.ans)} ${UNIT_TEXT[r.u][1]}`;
    default: return `${r.a} × ${r.b} × ${r.h} = ${r.ans} dm³ = ${r.ans} lít`;
  }
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  drawBox(r, true);
  $('#question').textContent = explain(r);
  game.say(`Đúng rồi! ${explain(r)} 🎉`, 'cheer', 'good');
  if (!(await game.wait(1700))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé là thủ kho giỏi nhất!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  const el = $('#box');
  el.classList.remove('shake');
  void el.getBoundingClientRect();
  el.classList.add('shake');
  game.say(hint, 'sad', 'soft');
}
