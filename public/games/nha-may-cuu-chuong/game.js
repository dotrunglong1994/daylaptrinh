// LEVELS-START (scripts/checks/nha-may-cuu-chuong.mjs đọc đoạn này để kiểm tra từng màn)
// Nhà máy đóng kẹo vào hộp. Theo SGK: "mỗi hộp 2 kẹo, 3 hộp" viết 2 × 3 = 6 (2 được lấy 3 lần).
// Loại câu: group = đếm kẹo trong các hộp, expr = viết tổng các số hạng bằng nhau thành phép nhân,
// fact = bảng nhân, div = chia đều kẹo vào hộp, missing = tìm số còn thiếu, remainder = chia có dư,
// word = toán có lời văn. Câu bé trả lời sai được hỏi lại một lần ở cuối màn.
const ROUNDS = 5;
const LEVELS = [
  { name: 'Nhân là cộng lặp lại', kinds: ['group', 'expr'], tables: [2, 5], tip: '2 + 2 + 2 là 2 được lấy 3 lần, viết thành 2 × 3.' },
  { name: 'Bảng nhân 2 và 5', kinds: ['fact'], tables: [2, 5], tip: 'Bảng 2 đếm thêm 2: 2, 4, 6, 8… Bảng 5 đếm thêm 5: 5, 10, 15…' },
  { name: 'Chia đều kẹo', kinds: ['div'], tables: [2, 5], tip: 'Chia đều là mỗi hộp được số kẹo bằng nhau. Bấm máy chia kẹo để xem nhé!' },
  { name: 'Bảng nhân 3 và 4', kinds: ['fact', 'div'], tables: [3, 4], tip: 'Bảng 4 gấp đôi bảng 2: 2 × 3 = 6 thì 4 × 3 = 12.' },
  { name: 'Bảng nhân 6 và 7', kinds: ['fact', 'div'], tables: [6, 7], tip: 'Quên thì lấy kết quả gần đó rồi cộng thêm: 6 × 5 = 30, nên 6 × 6 = 30 + 6 = 36.' },
  { name: 'Bảng nhân 8 và 9', kinds: ['fact', 'div'], tables: [8, 9], tip: 'Mẹo bảng 9: 9 × 4 = 40 − 4 = 36. Lấy 10 lần rồi bớt đi một lần.' },
  { name: 'Tìm số còn thiếu', kinds: ['missing'], tables: [2, 3, 4, 5, 6, 7, 8, 9], tip: 'Nhân và chia là bạn: 6 × 7 = 42 thì 42 : 6 = 7 và 42 : 7 = 6.' },
  { name: 'Chia có dư', kinds: ['remainder'], tables: [2, 3, 4, 5, 6, 7, 8, 9], tip: 'Đóng kẹo vào hộp, hộp nào cũng phải đầy. Kẹo còn thừa là số dư, số dư luôn bé hơn số chia.' },
  { name: 'Thử thách', kinds: ['fact', 'div', 'missing', 'remainder', 'word'], tables: [2, 3, 4, 5, 6, 7, 8, 9], tip: 'Màn cuối trộn đủ mọi loại câu, có cả bài toán có lời văn. Cố lên!' },
];

// Bài toán có lời văn: t là số trong mỗi nhóm, m là số nhóm
const STORIES = [
  { op: 'mul', text: 'Mỗi đĩa có {t} cái bánh. {m} đĩa như thế có tất cả bao nhiêu cái bánh?', unit: 'cái bánh' },
  { op: 'mul', text: 'Mỗi bó có {t} bông hoa. Mẹ mua {m} bó. Mẹ có bao nhiêu bông hoa?', unit: 'bông hoa' },
  { op: 'mul', text: 'Một hàng ghế có {t} bạn ngồi. {m} hàng như thế có bao nhiêu bạn?', unit: 'bạn' },
  { op: 'share', text: 'Có {n} quả cam chia đều vào {t} giỏ. Mỗi giỏ có mấy quả cam?', unit: 'quả cam' },
  { op: 'share', text: 'Cô có {n} quyển vở, chia đều cho {t} bạn. Mỗi bạn được mấy quyển?', unit: 'quyển vở' },
  { op: 'group', text: 'Có {n} cái bút, xếp vào các hộp, mỗi hộp {t} cái. Xếp được mấy hộp?', unit: 'hộp' },
  { op: 'group', text: 'Có {n} học sinh xếp thành các hàng, mỗi hàng {t} bạn. Xếp được mấy hàng?', unit: 'hàng' },
];

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// 4 số khác nhau, dương, có đáp án đúng; ưu tiên các lỗi bé hay mắc
function nums(ans, near) {
  const out = [ans];
  for (const x of near) if (Number.isInteger(x) && x > 0 && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) {
    if (!out.includes(ans + d)) out.push(ans + d);
    else if (ans - d > 0 && !out.includes(ans - d) && out.length < 4) out.push(ans - d);
  }
  return out;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds.length > 2 ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  const t = pick(rand, L.tables);
  if (kind === 'group') {
    const m = ri(rand, 2, 5);
    return { kind, t, m, ans: t * m, options: nums(t * m, [t * (m + 1), t * (m - 1), t + m, t * m + 1]) };
  }
  if (kind === 'expr') {
    const m = ri(rand, 3, 5);
    const ans = `${t} × ${m}`;
    // Không đưa "m × t" vào đáp án nhiễu: cùng kết quả, dễ làm bé rối
    const options = [ans, `${t} + ${m}`, `${t} × ${m + 1}`, `${t + 1} × ${m}`];
    return { kind, t, m, ans, options };
  }
  if (kind === 'fact') {
    const m = ri(rand, 1, 10);
    const p = t * m;
    return { kind, t, m, ans: p, options: nums(p, [t * (m + 1), t * (m - 1), (t + 1) * m, t + m, p + 1]) };
  }
  if (kind === 'div') {
    const m = ri(rand, 2, 10);
    const n = t * m;
    return { kind, n, t, ans: m, options: nums(m, [m + 1, m - 1, t, n - t]) };
  }
  if (kind === 'missing') {
    const m = ri(rand, 2, 10);
    const p = t * m;
    const form = pick(rand, ['a', 'b', 'div']);
    // a: ? × m = p (đáp án t); b: t × ? = p (đáp án m); div: p : ? = m (đáp án t)
    const ans = form === 'b' ? m : t;
    const other = form === 'b' ? t : m;
    return { kind, form, t, m, p, ans, options: nums(ans, [p - other, ans + 1, ans - 1, other]) };
  }
  if (kind === 'remainder') {
    const q = ri(rand, 2, 6);
    const r = ri(rand, 1, t - 1);
    const n = t * q + r;
    const ans = `${q} hộp, thừa ${r}`;
    const wrong = [`${q - 1} hộp, thừa ${r + t}`, `${q + 1} hộp, thừa 0`, `${q} hộp, thừa ${r + 1}`, `${q - 1} hộp, thừa ${r}`];
    const options = [ans];
    for (const w of wrong) if (!options.includes(w) && options.length < 4) options.push(w);
    return { kind, n, t, q, r, ans, options };
  }
  // word
  const s = pick(rand, STORIES);
  const m = ri(rand, 2, 9);
  const n = t * m;
  const text = s.text.replace('{t}', t).replace('{m}', m).replace('{n}', n);
  if (s.op === 'mul') return { kind, op: s.op, t, m, text, unit: s.unit, ans: n, options: nums(n, [t + m, t * (m + 1), n - t, n + 1]) };
  return { kind, op: s.op, t, n, text, unit: s.unit, ans: m, options: nums(m, [n - t, n + t, m + 1, m - 1]) };
}

// Câu hỏi hiển thị trên màn hình
function questionOf(r) {
  switch (r.kind) {
    case 'group': return `Mỗi hộp có ${r.t} kẹo. ${r.m} hộp có tất cả bao nhiêu kẹo?`;
    case 'expr': return `${Array(r.m).fill(r.t).join(' + ')} viết thành phép nhân là gì?`;
    case 'fact': return `${r.t} × ${r.m} = ?`;
    case 'div': return `Chia đều ${r.n} kẹo vào ${r.t} hộp. Mỗi hộp mấy kẹo? (${r.n} : ${r.t} = ?)`;
    case 'missing':
      if (r.form === 'a') return `? × ${r.m} = ${r.p}`;
      if (r.form === 'b') return `${r.t} × ? = ${r.p}`;
      return `${r.p} : ? = ${r.m}`;
    case 'remainder': return `Có ${r.n} kẹo, mỗi hộp đóng ${r.t} kẹo. Được mấy hộp đầy, thừa mấy kẹo?`;
    default: return r.text;
  }
}

// Phép tính đầy đủ, nói sau khi bé trả lời đúng
function equationOf(r) {
  switch (r.kind) {
    case 'group': case 'expr': case 'fact': return `${r.t} × ${r.m} = ${r.t * r.m}`;
    case 'div': return `${r.n} : ${r.t} = ${r.ans}`;
    case 'missing': return `${r.t} × ${r.m} = ${r.p}`;
    case 'remainder': return `${r.n} : ${r.t} = ${r.q} (dư ${r.r})`;
    default: return r.op === 'mul' ? `${r.t} × ${r.m} = ${r.ans}` : `${r.n} : ${r.t} = ${r.ans}`;
  }
}

const answerOf = (r) => r.ans;
// Phiếu bài tập in ra giấy (Góc phụ huynh): một câu chữ và lời giải của màn levelIdx, null nếu câu cần hình
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- trang /phieu-bai-tap gọi hàm này
function printRound(levelIdx, rand = Math.random) {
  const r = makeRound(levelIdx, Math.floor(rand() * ROUNDS), rand);
  return { q: questionOf(r), a: equationOf(r) };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, queue: [], pos: 0, r: null, mistakes: 0, busy: false, machine: null };

const game = createGame({
  id: 'nha-may-cuu-chuong',
  title: '🏭 Nhà Máy Cửu Chương',
  sub: 'Đóng kẹo vào hộp để học bảng nhân, bảng chia và chia có dư!',
  levels: LEVELS.length,
  winTitle: 'Bé thuộc cửu chương rồi! 🏭',
  start: startLevel,
});

// Giọng đọc không đọc được dấu × và :, nên đổi thành chữ
const spoken = (text) => text.replace(/×/g, 'nhân').replace(/ : /g, ' chia ').replace(/(^|\s)\?(?=\s|\)|$)/g, '$1mấy').replace(/=/g, 'bằng');

/* ---------- Vẽ hộp kẹo ---------- */
function candies(n) {
  return '<i class="candy"></i>'.repeat(n);
}

function drawBoxes(count, per, { open = false } = {}) {
  $('#belt').innerHTML = Array.from({ length: count }, (_, i) =>
    `<div class="box new${open ? ' open' : ''}" data-i="${i}"><div class="dots">${candies(per)}</div><small>${open ? '' : per}</small></div>`).join('');
}

function drawVisual(r) {
  const showBelt = ['group', 'expr', 'fact', 'div', 'remainder'].includes(r.kind);
  $('#factory').classList.toggle('hidden', !showBelt);
  $('#machineRow').classList.add('hidden');
  $('#pile').innerHTML = '';
  state.machine = null;
  if (!showBelt) return;
  if (r.kind === 'div') {
    // Kẹo nằm trên băng chuyền, bé bấm máy để chia mỗi hộp một kẹo
    state.machine = { mode: 'share', left: r.n, boxes: Array(r.t).fill(0), per: 0 };
  } else if (r.kind === 'remainder') {
    // Máy đóng đầy từng hộp một
    state.machine = { mode: 'group', left: r.n, boxes: [], per: r.t };
  } else {
    drawBoxes(r.m, r.t);
    return;
  }
  $('#machineRow').classList.remove('hidden');
  $('#machineBtn').disabled = false;
  $('#machineBtn').textContent = r.kind === 'div' ? '⚙️ Chia mỗi hộp 1 kẹo' : `⚙️ Đóng 1 hộp ${r.t} kẹo`;
  drawMachine();
}

function drawMachine() {
  const mc = state.machine;
  $('#pile').innerHTML = mc.left ? `<span class="pile-label">Kẹo chưa đóng: ${mc.left}</span><div class="dots loose">${candies(mc.left)}</div>` : '';
  // Hộp vừa đóng xong thì rơi xuống băng chuyền
  const fresh = mc.mode === 'group' ? mc.boxes.length - 1 : -1;
  $('#belt').innerHTML = mc.boxes.map((c, i) => `<div class="box open${i === fresh ? ' new' : ''}"><div class="dots">${candies(c)}</div><small>${c}</small></div>`).join('')
    || '<p class="empty">Bấm máy để đóng kẹo vào hộp nhé!</p>';
}

$('#machineBtn').addEventListener('click', () => {
  const mc = state.machine;
  if (!mc) return;
  if (mc.mode === 'share') {
    if (mc.left < mc.boxes.length) return;
    mc.boxes = mc.boxes.map((c) => c + 1);
    mc.left -= mc.boxes.length;
  } else {
    if (mc.left < mc.per) return;
    mc.boxes.push(mc.per);
    mc.left -= mc.per;
  }
  game.sfx.pop();
  drawMachine();
  const done = mc.mode === 'share' ? mc.left < mc.boxes.length : mc.left < mc.per;
  if (done) {
    $('#machineBtn').disabled = true;
    game.say(mc.left
      ? `Còn ${mc.left} kẹo, không đủ đóng thêm một hộp đầy. Đó là số kẹo thừa!`
      : mc.mode === 'share' ? `Hết kẹo rồi! Mỗi hộp có ${mc.boxes[0]} kẹo.` : `Hết kẹo rồi! Được ${mc.boxes.length} hộp.`);
  }
});

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = idx;
  state.queue = Array.from({ length: ROUNDS }, (_, k) => makeRound(idx, k));
  state.pos = 0;
  state.mistakes = 0;
  state.busy = false;
  showRound();
}

function showRound() {
  const r = (state.r = state.queue[state.pos]);
  state.busy = false;
  r.missed = false;
  game.rounds(state.pos, state.queue.length);
  drawVisual(r);
  const q = questionOf(r);
  $('#question').textContent = q;
  const intro = r.retry ? 'Mình làm lại câu lúc nãy nhé. ' : state.pos === 0 ? `${LEVELS[state.level].tip} ` : '';
  game.say(spoken(intro + q));
  const opts = window.shuffle(r.options);
  $('#choices').classList.toggle('wide', r.kind === 'remainder' || r.kind === 'expr');
  const label = (o) => (r.kind === 'word' ? `${o} ${r.unit}` : String(o));
  renderChoices($('#choices'), opts.map(label), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(r);
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

function hintFor(r) {
  switch (r.kind) {
    case 'group': return `Đếm thêm ${r.t} mỗi hộp: ${Array.from({ length: r.m }, (_, i) => r.t * (i + 1)).slice(0, 3).join(', ')}…`;
    case 'expr': return `Số ${r.t} được lấy ${r.m} lần. Số được lấy viết trước, số lần viết sau dấu nhân.`;
    case 'fact': return r.m > 1 ? `${r.t} × ${r.m - 1} = ${r.t * (r.m - 1)}. Cộng thêm ${r.t} nữa là được!` : `Số nào nhân với 1 cũng bằng chính nó.`;
    case 'div': return `Bấm máy chia kẹo, hoặc nhẩm: ${r.t} nhân mấy bằng ${r.n}?`;
    case 'missing': return r.form === 'div' ? `Nhẩm: ${r.m} nhân mấy bằng ${r.p}?` : `Nhẩm: ${r.p} chia cho ${r.form === 'a' ? r.m : r.t} bằng mấy?`;
    case 'remainder': return `Bấm máy đóng hộp để xem. Nhớ là số kẹo thừa phải ít hơn ${r.t}.`;
    default: return r.op === 'mul' ? 'Mỗi nhóm bằng nhau, có nhiều nhóm: bài này dùng phép nhân.' : 'Chia đều hoặc chia thành nhóm: bài này dùng phép chia.';
  }
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  const eq = equationOf(r);
  $('#question').textContent = eq;
  // Chia đều xong thì cho máy chạy hết để bé thấy kết quả
  if (state.machine) {
    while (!$('#machineBtn').disabled) {
      $('#machineBtn').click();
      if (!(await game.wait(260))) return;
    }
  }
  game.say(spoken(`Đúng rồi! ${eq}`), 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  state.pos++;
  if (state.pos < state.queue.length) return showRound();
  game.rounds(state.pos, state.queue.length);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé là thợ cả của nhà máy!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(r) {
  state.mistakes++;
  game.sfx.bad();
  game.say(spoken(hintFor(r)), 'sad', 'soft');
  // Câu sai được hỏi lại một lần ở cuối màn (tối đa 3 câu hỏi lại)
  const retries = state.queue.filter((q) => q.retry).length;
  if (!r.missed && !r.retry && retries < 3) {
    r.missed = true;
    state.queue.push({ ...r, retry: true });
    game.rounds(state.pos, state.queue.length);
  }
}
