// LEVELS-START (scripts/checks/thuoc-do-goc.mjs đọc đoạn này để kiểm tra từng màn)
// Đỉnh góc ở giữa cạnh dưới, tia gốc nằm ngang (base: right = tia gốc sang phải, left = sang trái).
// Loại câu: name = gọi tên góc; read = đọc số đo trên thước; set = xoay tia cho đúng số đo;
// clock = góc giữa hai kim đồng hồ lúc giờ đúng; missing = góc còn thiếu để đủ góc vuông / góc bẹt.
const ROUNDS = 5;
const KIND_NAMES = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];
const LEVELS = [
  { name: 'Gọi tên góc', kinds: ['name'], step: 5, bases: ['right', 'left'], tip: 'Góc vuông giống góc quyển vở. Nhỏ hơn góc vuông là góc nhọn, lớn hơn là góc tù. Hai tia thẳng hàng là góc bẹt.' },
  { name: 'Đọc thước đo góc', kinds: ['read'], step: 10, bases: ['right'], tip: 'Tia gốc nằm ở số 0 bên phải, nên đọc vòng số màu đỏ ở bên trong.' },
  { name: 'Vạch 5 độ', kinds: ['read'], step: 5, bases: ['right'], tip: 'Vạch dài vừa nằm giữa hai số là 5 độ. Ví dụ giữa 40 và 50 là 45.' },
  { name: 'Tia gốc bên trái', kinds: ['read'], step: 5, bases: ['left'], tip: 'Tia gốc nằm bên trái thì đọc vòng số màu xanh ở bên ngoài, vòng có số 0 ở bên trái.' },
  { name: 'Xoay tia', kinds: ['set'], step: 10, bases: ['right'], tip: 'Kéo tia màu cam, hoặc bấm nút, cho tới số đo đề bài rồi bấm Kiểm tra.' },
  { name: 'Vẽ góc chính xác', kinds: ['set'], step: 5, bases: ['right', 'left'], tip: 'Xem tia gốc ở bên nào để chọn vòng số có số 0 ở bên đó nhé.' },
  { name: 'Góc kim đồng hồ', kinds: ['clock'], tip: 'Mặt đồng hồ chia 12 khoảng bằng nhau. Mỗi khoảng giữa hai số là 30 độ.' },
  { name: 'Góc còn thiếu', kinds: ['missing'], tip: 'Góc vuông là 90°, góc bẹt là 180°. Lấy cả góc trừ đi phần đã biết.' },
  { name: 'Thử thách', kinds: ['name', 'read', 'set', 'clock', 'missing'], step: 5, bases: ['right', 'left'], tip: 'Màn cuối có đủ mọi loại câu. Cố lên!' },
];

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// 0 nhọn, 1 vuông, 2 tù, 3 bẹt
const kindOf = (deg) => (deg < 90 ? 0 : deg === 90 ? 1 : deg < 180 ? 2 : 3);

// Lấy 3 đáp án nhiễu khác nhau, khác đáp án đúng, nằm trong khoảng hợp lệ (giữ thứ tự ưu tiên)
function distractors(ans, list, ok = (x) => x > 0 && x <= 180) {
  const out = [];
  for (const x of list) if (ok(x) && x !== ans && !out.includes(x) && out.length < 3) out.push(x);
  return [ans, ...out];
}

// Số đo cho câu đọc / xoay: màn bước 5 ưu tiên số lẻ 5 (15°, 45°…)
function measure(rand, step) {
  return step === 10 ? ri(rand, 1, 17) * 10 : ri(rand, 1, 16) * 10 + 5;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds[k % L.kinds.length];
  const base = L.bases ? pick(rand, L.bases) : 'right';
  if (kind === 'name') {
    const type = pick(rand, [0, 0, 1, 2, 2, 3]);
    const deg = [ri(rand, 4, 15) * 5, 90, ri(rand, 21, 33) * 5, 180][type];
    return { kind, base, deg, options: [...KIND_NAMES] };
  }
  if (kind === 'read' || kind === 'set') {
    const step = L.step;
    const deg = measure(rand, step);
    let start = deg;
    while (Math.abs(start - deg) < 30) start = ri(rand, 0, 180 / step) * step;
    const r = { kind, base, deg, step, start };
    if (kind === 'read') r.options = distractors(deg, [180 - deg, deg + step, deg - step, deg + 10, deg - 10, deg + 20, deg - 20], (x) => x > 0 && x < 180);
    return r;
  }
  if (kind === 'clock') {
    const hour = ri(rand, 1, 11);
    const deg = 30 * Math.min(hour, 12 - hour);
    return { kind, hour, deg, options: distractors(deg, [30 * hour, deg + 30, deg - 30, hour * 5, deg + 60, deg - 60], (x) => x > 0 && x < 360) };
  }
  // missing
  const whole = pick(rand, [90, 180]);
  const known = whole === 90 ? ri(rand, 2, 16) * 5 : ri(rand, 3, 33) * 5;
  const ans = whole - known;
  const other = whole === 90 ? 180 - known : 90 - known;
  return { kind, whole, known, deg: ans, options: distractors(ans, [other, known, ans + 10, ans - 10, ans + 5, ans - 5]) };
}

const answerOf = (r) => (r.kind === 'name' ? KIND_NAMES[kindOf(r.deg)] : r.deg);
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, deg: 0, mistakes: 0, busy: false, drag: false };

const game = createGame({
  id: 'thuoc-do-goc',
  title: '📐 Thước Đo Góc',
  sub: 'Gọi tên góc, đo góc và vẽ góc bằng thước đo độ!',
  levels: LEVELS.length,
  winTitle: 'Bé đo góc giỏi quá! 📐',
  start: startLevel,
});

/* ---------- Vẽ ---------- */
const V = { x: 180, y: 182 };
const R = 165;
// Góc a tính ngược chiều kim đồng hồ từ hướng sang phải
const pt = (a, r) => [V.x + r * Math.cos((a * Math.PI) / 180), V.y - r * Math.sin((a * Math.PI) / 180)];
const xy = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const stdAngle = (deg, base) => (base === 'left' ? 180 - deg : deg);

// Vạch thước nằm dưới các tia, số nằm trên để tia không che số 0 và 180
function drawProtractor() {
  let lbl = '';
  let s = `<path class="proto-bg" d="M ${xy(pt(0, R))} A ${R} ${R} 0 0 0 ${xy(pt(180, R))} Z" />`;
  for (let a = 0; a <= 180; a += 5) {
    const big = a % 10 === 0;
    const len = big ? 14 : 9;
    s += `<line class="tick${big ? ' big' : ' mid'}" x1="${pt(a, R)[0]}" y1="${pt(a, R)[1]}" x2="${pt(a, R - len)[0]}" y2="${pt(a, R - len)[1]}" />`;
    if (big) {
      const o = pt(a, R - 23);
      const i = pt(a, R - 38);
      lbl += `<text class="lbl outer" x="${o[0]}" y="${o[1]}">${180 - a}</text>`;
      lbl += `<text class="lbl inner" x="${i[0]}" y="${i[1]}">${a}</text>`;
    }
  }
  $('#proto').innerHTML = s;
  $('#protoLbl').innerHTML = lbl;
}
drawProtractor();

function sector(a1, a2, r, cls) {
  if (a2 - a1 < 0.5) return '';
  return `<path class="arc ${cls}" d="M ${V.x} ${V.y} L ${xy(pt(a1, r))} A ${r} ${r} 0 0 0 ${xy(pt(a2, r))} Z" />`;
}
const ray = (a, cls, len = R + 10) => {
  const [x, y] = pt(a, len);
  return `<line class="ray ${cls}" x1="${V.x}" y1="${V.y}" x2="${x}" y2="${y}" />`;
};
const label = (a, text, r = 52) => {
  const p = pt(a, r);
  return `<text class="arc-label" x="${p[0]}" y="${p[1]}">${text}</text>`;
};

function drawBoard({ showLabel = false } = {}) {
  const r = state.r;
  let s = '';
  if (r.kind === 'missing') {
    const end = r.whole;
    s += sector(0, r.known, 44, 'known') + sector(r.known, end, 60, '');
    s += ray(0, 'base') + ray(r.known, 'part') + ray(end, 'base');
    s += label(r.known / 2, `${r.known}°`, 70) + label((r.known + end) / 2, showLabel ? `${r.deg}°` : '?', 88);
  } else {
    const a0 = stdAngle(0, r.base);
    const a1 = stdAngle(state.deg, r.base);
    const [lo, hi] = a0 < a1 ? [a0, a1] : [a1, a0];
    s += sector(lo, hi, 40, '');
    s += ray(a0, 'base') + ray(a1, 'move');
    if (r.kind === 'set') s += `<circle class="knob" cx="${pt(a1, R + 4)[0]}" cy="${pt(a1, R + 4)[1]}" r="11" />`;
    if (showLabel) s += label((lo + hi) / 2, `${state.deg}°`, 62);
  }
  s += `<circle class="vertex" cx="${V.x}" cy="${V.y}" r="6" />`;
  $('#shapes').innerHTML = s;
}

function drawClock(hour, showArc) {
  const a = (hour % 12) * 30;
  const p = (deg, r) => [100 + Math.sin((deg * Math.PI) / 180) * r, 100 - Math.cos((deg * Math.PI) / 180) * r];
  let s = '<circle cx="100" cy="100" r="94" class="rim" /><circle cx="100" cy="100" r="86" class="face" />';
  if (showArc) {
    // Tô phần góc nhỏ giữa hai kim
    const [from, to] = a <= 180 ? [0, a] : [a, 360];
    s += `<path class="arc" d="M 100 100 L ${xy(p(from, 40))} A 40 40 0 0 1 ${xy(p(to, 40))} Z" />`;
  }
  for (let i = 1; i <= 12; i++) {
    const q = p(i * 30, 70);
    s += `<text class="num" x="${q[0]}" y="${q[1]}">${i}</text>`;
  }
  const h = p(a, 48);
  s += `<line class="hand hour" x1="100" y1="100" x2="${h[0]}" y2="${h[1]}" />`;
  s += '<line class="hand minute" x1="100" y1="100" x2="100" y2="26" /><circle cx="100" cy="100" r="6" fill="#23395b" />';
  $('#clock').innerHTML = s;
}

/* ---------- Xoay tia ---------- */
function setDeg(deg) {
  const d = Math.max(0, Math.min(180, deg));
  if (d === state.deg) return;
  state.deg = d;
  game.sfx.tap();
  drawBoard();
}
const canSet = () => !state.busy && state.r?.kind === 'set';

$('#board').addEventListener('pointerdown', (e) => {
  if (!canSet()) return;
  state.drag = true;
  $('#board').setPointerCapture(e.pointerId);
  dragTo(e);
});
$('#board').addEventListener('pointermove', (e) => state.drag && dragTo(e));
const endDrag = () => (state.drag = false);
$('#board').addEventListener('pointerup', endDrag);
$('#board').addEventListener('pointercancel', endDrag);

function dragTo(e) {
  const box = $('#board').getBoundingClientRect();
  const x = ((e.clientX - box.left) * 360) / box.width - V.x;
  const y = V.y - ((e.clientY - box.top) * 200) / box.height;
  let a = (Math.atan2(y, x) * 180) / Math.PI;
  if (a < 0) a = a < -90 ? 180 : 0; // kéo xuống dưới cạnh thước thì giữ ở đầu gần nhất
  const deg = stdAngle(a, state.r.base);
  setDeg(Math.round(deg / state.r.step) * state.r.step);
}

$('#setControls').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-turn]');
  if (btn && canSet()) setDeg(state.deg + Number(btn.dataset.turn) * state.r.step);
});

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  state.busy = false;
  state.drag = false;
  showRound();
}

function questionOf(r) {
  switch (r.kind) {
    case 'name': return 'Đây là góc gì?';
    case 'read': return 'Góc màu cam bao nhiêu độ? Nhìn thước đo góc nhé.';
    case 'set': return `Xoay tia màu cam để được góc ${r.deg}°`;
    case 'clock': return `Lúc ${r.hour} giờ, kim giờ và kim phút tạo thành góc bao nhiêu độ? (góc nhỏ được tô màu)`;
    default: return `Góc ${r.whole === 90 ? 'vuông (90°)' : 'bẹt (180°)'} được chia làm hai. Một phần là ${r.known}°. Phần còn lại bao nhiêu độ?`;
  }
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  state.deg = r.kind === 'set' ? r.start : r.deg;
  game.rounds(state.round, ROUNDS);
  const isSet = r.kind === 'set';
  $('#board').classList.toggle('hidden', r.kind === 'clock');
  $('#board').classList.toggle('can-drag', isSet);
  $('#board').classList.remove('ok');
  $('#clock').classList.toggle('hidden', r.kind !== 'clock');
  for (const id of ['#proto', '#protoLbl']) $(id).classList.toggle('hidden', r.kind !== 'read' && r.kind !== 'set');
  $('#setControls').classList.toggle('hidden', !isSet);
  $('#checkRow').classList.toggle('hidden', !isSet);
  $('#choices').classList.toggle('hidden', isSet);
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);

  if (r.kind === 'clock') drawClock(r.hour, true);
  else drawBoard();
  if (isSet) {
    $('#minusBtn').textContent = `➖ Bớt ${r.step}°`;
    $('#plusBtn').textContent = `➕ Thêm ${r.step}°`;
    return;
  }
  const opts = window.shuffle(r.options);
  renderChoices($('#choices'), opts.map((o) => (typeof o === 'number' ? `${o}°` : o)), (i) => {
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(hintFor(r, opts[i]));
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

function hintFor(r, picked) {
  const side = r.base === 'left' ? 'trái' : 'phải';
  switch (r.kind) {
    case 'name': return 'Chưa đúng. So với góc vuông (góc quyển vở) thì góc này nhỏ hơn, bằng hay lớn hơn?';
    case 'read':
      return picked === 180 - r.deg
        ? `Bé đọc nhầm vòng số rồi. Tia gốc ở bên ${side}, nên đọc vòng có số 0 ở bên ${side}.`
        : 'Chưa đúng. Bắt đầu từ số 0 ở tia gốc, đếm theo các vạch tới tia màu cam nhé.';
    case 'clock': return 'Đếm xem giữa hai kim có mấy khoảng số, mỗi khoảng là 30°.';
    default: return `Chưa đúng. Tính ${r.whole}° − ${r.known}° nhé.`;
  }
}

$('#checkBtn').addEventListener('click', () => {
  if (!canSet()) return;
  const r = state.r;
  if (state.deg === r.deg) return correct();
  const side = r.base === 'left' ? 'trái' : 'phải';
  if (state.deg === 180 - r.deg) return wrong(`Bé đọc nhầm vòng số rồi. Tia gốc ở bên ${side}, nên dùng vòng có số 0 ở bên ${side}.`);
  wrong(state.deg < r.deg ? 'Góc còn nhỏ quá, mở rộng tia cam thêm nhé.' : 'Góc lớn quá rồi, thu tia cam lại một chút.');
});

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  if (r.kind === 'clock') drawClock(r.hour, true);
  else {
    $('#board').classList.add('ok');
    drawBoard({ showLabel: true });
  }
  const kindName = KIND_NAMES[kindOf(r.deg)].toLowerCase();
  const text = {
    name: () => `Đúng rồi! Đây là ${kindName}${r.deg === 90 || r.deg === 180 ? '' : ` (${r.deg}°)`}.`,
    read: () => `Đúng rồi! Góc ${r.deg}°.`,
    set: () => `Chính xác! Góc ${r.deg}°, là ${kindName}.`,
    clock: () => `Đúng rồi! ${Math.min(r.hour, 12 - r.hour)} khoảng × 30° = ${r.deg}°.`,
    missing: () => `Đúng rồi! ${r.whole}° − ${r.known}° = ${r.deg}°.`,
  }[r.kind]();
  game.say(`${text} 🎉`, 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé đo góc như kỹ sư rồi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  const el = state.r.kind === 'clock' ? $('#clock') : $('#board');
  el.classList.remove('shake');
  void el.getBoundingClientRect();
  el.classList.add('shake');
  game.say(hint, 'sad', 'soft');
}
