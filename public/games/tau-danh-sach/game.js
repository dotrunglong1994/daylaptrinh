// LEVELS-START (scripts/checks/tau-danh-sach.mjs đọc đoạn này để kiểm tra từng màn)
// Đoàn tàu là một danh sách: mỗi toa một phần tử, đánh số từ 1 (toa gần đầu máy là toa 1).
// Loại câu: tap = chạm vào toa thứ k; find = món đồ ở toa thứ mấy; length = sau các lệnh tàu còn mấy toa;
// edit = sau các lệnh thêm / xóa, đoàn tàu trông thế nào; sum / count / max = duyệt danh sách bằng vòng lặp.
const ROUNDS = 4;
const GOODS = ['🍎', '🍌', '🍓', '🍇', '🥕', '🍉', '🧸', '⚽'];
const LEVELS = [
  { name: 'Toa thứ mấy', kinds: ['tap', 'find'], tip: 'Danh sách là một đoàn tàu. Toa ngay sau đầu máy là toa thứ 1.' },
  { name: 'Độ dài danh sách', kinds: ['length'], tip: 'Độ dài là số toa. Thêm một toa thì dài thêm 1, xóa một toa thì bớt 1.' },
  { name: 'Thêm toa', kinds: ['edit'], ops: ['push', 'unshift'], tip: '"Thêm vào cuối" gắn toa sau cùng, "thêm vào đầu" gắn toa ngay sau đầu máy.' },
  { name: 'Xóa toa', kinds: ['edit'], ops: ['push', 'pop', 'removeAt'], tip: 'Xóa một toa thì các toa phía sau dồn lên một chỗ, số thứ tự của chúng giảm đi 1.' },
  { name: 'Tính tổng', kinds: ['sum'], tip: 'Vòng lặp đi qua từng toa, cộng số trên toa vào biến tổng.' },
  { name: 'Đếm theo điều kiện', kinds: ['count'], tip: 'Chỉ cộng 1 vào biến đếm khi toa thỏa điều kiện NẾU.' },
  { name: 'Tìm số lớn nhất', kinds: ['max'], tip: 'Biến lớn nhất giữ số lớn nhất đã gặp. Gặp số lớn hơn thì thay vào.' },
  { name: 'Thử thách', kinds: ['find', 'length', 'edit', 'sum', 'count', 'max'], ops: ['push', 'unshift', 'pop', 'removeAt'], tip: 'Màn cuối có đủ mọi loại câu. Cố lên!' },
];

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
function shuffled(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Một lệnh trên danh sách → danh sách mới
function apply(list, op) {
  if (op.type === 'push') return [...list, op.v];
  if (op.type === 'unshift') return [op.v, ...list];
  if (op.type === 'pop') return list.slice(0, -1);
  return list.filter((_, i) => i !== op.k - 1); // removeAt: k đếm từ 1
}
function opText(op) {
  if (op.type === 'push') return `thêm ${op.v} vào cuối`;
  if (op.type === 'unshift') return `thêm ${op.v} vào đầu`;
  if (op.type === 'pop') return 'xóa toa cuối';
  return `xóa toa thứ ${op.k}`;
}
const run = (list, ops) => ops.reduce(apply, list);

function nums(ans, list) {
  const out = [ans];
  for (const x of list) if (Number.isInteger(x) && x >= 0 && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) if (!out.includes(ans + d)) out.push(ans + d);
  return out;
}

function randomOps(rand, types, n, len) {
  const ops = [];
  let size = len;
  for (let i = 0; i < n; i++) {
    const type = pick(rand, size > 2 ? types : types.filter((t) => t === 'push' || t === 'unshift'));
    const op = { type };
    if (type === 'push' || type === 'unshift') op.v = pick(rand, GOODS);
    if (type === 'removeAt') op.k = ri(rand, 1, size);
    size += type === 'push' || type === 'unshift' ? 1 : -1;
    ops.push(op);
  }
  return ops;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds.length > ROUNDS ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  if (kind === 'tap' || kind === 'find') {
    const list = shuffled(GOODS, rand).slice(0, ri(rand, 4, 6));
    const at = ri(rand, 1, list.length);
    if (kind === 'tap') return { kind, list, at, ans: at - 1 };
    return { kind, list, at, ans: at, options: nums(at, [at + 1, at - 1, list.length - at + 1, at + 2]) };
  }
  if (kind === 'length' || kind === 'edit') {
    const list = Array.from({ length: ri(rand, 3, 4) }, () => pick(rand, GOODS));
    const types = L.ops ?? ['push', 'unshift', 'pop', 'removeAt'];
    const ops = randomOps(rand, types, kind === 'length' ? ri(rand, 3, 4) : ri(rand, 2, 3), list.length);
    const result = run(list, ops);
    if (kind === 'length') return { kind, list, ops, ans: result.length, options: nums(result.length, [list.length + ops.length, list.length, result.length + 1, result.length - 1]) };
    // Đáp án nhiễu: làm lệnh theo thứ tự ngược, nhầm đầu với cuối, bỏ qua lệnh cuối
    const swapEnds = ops.map((o) => (o.type === 'push' ? { ...o, type: 'unshift' } : o.type === 'unshift' ? { ...o, type: 'push' } : o));
    const wrong = [run(list, [...ops].reverse()), run(list, swapEnds), run(list, ops.slice(0, -1)), [...result].reverse()];
    const options = [result.join('')];
    for (const w of wrong) if (!options.includes(w.join('')) && options.length < 3) options.push(w.join(''));
    if (options.length < 3) return makeRound(levelIdx, k, rand);
    return { kind, list, ops, ans: result.join(''), options };
  }
  const list = Array.from({ length: ri(rand, 4, 6) }, () => ri(rand, 1, 9));
  if (kind === 'sum') {
    const s = list.reduce((a, b) => a + b, 0);
    return { kind, list, ans: s, options: nums(s, [s - list[list.length - 1], s + list[0], list.length, s + 2]) };
  }
  if (kind === 'count') {
    const limit = ri(rand, 3, 6);
    const c = list.filter((x) => x > limit).length;
    return { kind, list, limit, ans: c, options: nums(c, [list.length - c, list.filter((x) => x >= limit).length, c + 1, c - 1]) };
  }
  const m = Math.max(...list);
  return { kind, list, ans: m, options: nums(m, [list[list.length - 1], list[0], Math.min(...list), m - 1]) };
}

const answerOf = (r) => r.ans;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false };

const game = createGame({
  id: 'tau-danh-sach',
  title: '🚃 Tàu Danh Sách',
  sub: 'Danh sách giống đoàn tàu: thêm toa, xóa toa, duyệt từng toa bằng vòng lặp!',
  levels: LEVELS.length,
  winTitle: 'Bé lái tàu danh sách giỏi quá! 🚃',
  start: startLevel,
});

/* ---------- Vẽ ---------- */
function drawTrain(list, { tap = false } = {}) {
  $('#train').innerHTML = '<span class="engine">🚂</span>' + list.map((v, i) => {
    const tag = tap ? 'button' : 'div';
    return `<${tag} class="wagon" data-i="${i}"><b>${v}</b><small>${i + 1}</small></${tag}>`;
  }).join('');
}

function drawProgram(r) {
  let lines = [];
  if (r.ops) lines = r.ops.map(opText);
  else if (r.kind === 'sum') lines = ['tổng = 0', 'LẶP với mỗi toa:', '    tổng = tổng + số trên toa', 'nói tổng'];
  else if (r.kind === 'count') lines = ['đếm = 0', 'LẶP với mỗi toa:', `    NẾU số trên toa > ${r.limit} THÌ đếm = đếm + 1`, 'nói đếm'];
  else if (r.kind === 'max') lines = ['lớn nhất = số trên toa 1', 'LẶP với mỗi toa:', '    NẾU số trên toa > lớn nhất THÌ lớn nhất = số trên toa', 'nói lớn nhất'];
  $('#program').classList.toggle('hidden', !lines.length);
  $('#program').innerHTML = lines.map((l, i) => `<li data-line="${i}">${l.replace(/^ +/, (m) => '&nbsp;'.repeat(m.length))}</li>`).join('');
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
    case 'tap': return `Chạm vào toa thứ ${r.at}.`;
    case 'find': return `Món ${r.list[r.at - 1]} ở toa thứ mấy?`;
    case 'length': return 'Chạy hết các lệnh. Cuối cùng đoàn tàu có mấy toa?';
    case 'edit': return 'Chạy hết các lệnh. Đoàn tàu cuối cùng trông thế nào?';
    default: return 'Chương trình chạy xong sẽ nói số nào?';
  }
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  game.rounds(state.round, ROUNDS);
  drawTrain(r.list, { tap: r.kind === 'tap' });
  drawProgram(r);
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);
  $('#choices').classList.toggle('hidden', r.kind === 'tap');
  if (r.kind === 'tap') return;
  const opts = window.shuffle(r.options);
  const labelOf = (o) => (r.kind === 'edit' ? `<span class="mini-train">🚂${o}</span>` : r.kind === 'find' ? `Toa ${o}` : r.kind === 'length' ? `${o} toa` : String(o));
  $('#choices').classList.toggle('stack', r.kind === 'edit');
  renderChoices($('#choices'), opts.map(labelOf), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(hintFor(r));
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

$('#train').addEventListener('click', (e) => {
  const w = e.target.closest('button.wagon');
  const r = state.r;
  if (!w || state.busy || r?.kind !== 'tap') return;
  if (Number(w.dataset.i) === answerOf(r)) {
    w.classList.add('ok');
    return correct();
  }
  w.classList.add('wrong-wagon');
  setTimeout(() => w.classList.remove('wrong-wagon'), 400);
  wrong(`Đếm từ toa ngay sau đầu máy 🚂: 1, 2, 3… tới ${r.at}.`);
});

function hintFor(r) {
  switch (r.kind) {
    case 'find': return 'Đếm từ toa ngay sau đầu máy, toa đầu tiên là toa thứ 1.';
    case 'length': return `Lúc đầu có ${r.list.length} toa. Mỗi lệnh thêm thì +1, mỗi lệnh xóa thì −1.`;
    case 'edit': return 'Làm từng lệnh theo thứ tự từ trên xuống, vẽ lại đoàn tàu sau mỗi lệnh nhé.';
    case 'sum': return 'Cộng lần lượt số trên từng toa, từ toa 1 tới toa cuối.';
    case 'count': return `Chỉ đếm những toa có số lớn hơn ${r.limit} (bằng ${r.limit} thì không tính).`;
    default: return 'Đi qua từng toa, nhớ số lớn nhất đã gặp.';
  }
}

// Sau khi trả lời đúng: chạy lại từng lệnh trên đoàn tàu để bé thấy
async function replay(r) {
  if (r.ops) {
    let list = r.list;
    for (let i = 0; i < r.ops.length; i++) {
      $('#program [data-line].now')?.classList.remove('now');
      $(`#program [data-line="${i}"]`).classList.add('now');
      list = apply(list, r.ops[i]);
      drawTrain(list);
      game.sfx.pop();
      if (!(await game.wait(650))) return false;
    }
    $('#program [data-line].now')?.classList.remove('now');
    return true;
  }
  if (['sum', 'count', 'max'].includes(r.kind)) {
    for (const w of document.querySelectorAll('#train .wagon')) {
      w.classList.add('visit');
      game.sfx.tap();
      if (!(await game.wait(300))) return false;
    }
  }
  return true;
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  game.say('Đúng rồi! 🎉 Xem đoàn tàu chạy lại nhé.', 'cheer', 'good');
  if (!(await replay(r))) return;
  if (!(await game.wait(700))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé hiểu danh sách như lập trình viên rồi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
