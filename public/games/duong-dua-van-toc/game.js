// LEVELS-START (scripts/checks/duong-dua-van-toc.mjs đọc đoạn này để kiểm tra từng màn)
// s = quãng đường, v = vận tốc, t = thời gian. Loại câu:
// dist / speed / time = tìm s, v hoặc t; tune = chỉnh vận tốc để xe về đích đúng giờ;
// mixed = thời gian có phút (1 giờ 30 phút); walk = đi bộ theo m/phút;
// meet = hai xe đi ngược chiều gặp nhau; chase = xe sau đuổi kịp xe trước.
const ROUNDS = 4;
const LEVELS = [
  { name: 'Quãng đường', kinds: ['dist'], tip: 'Quãng đường = vận tốc × thời gian. Mỗi giờ xe đi được bằng vận tốc của xe.' },
  { name: 'Vận tốc', kinds: ['speed'], tip: 'Vận tốc = quãng đường : thời gian. Đó là số km xe đi trong một giờ.' },
  { name: 'Thời gian', kinds: ['time'], tip: 'Thời gian = quãng đường : vận tốc.' },
  { name: 'Chỉnh tốc độ', kinds: ['tune'], tip: 'Bấm nút để chọn vận tốc, rồi bấm Chạy. Xe phải về đích đúng lúc hết giờ!' },
  { name: 'Giờ và phút', kinds: ['mixed', 'walk'], tip: '30 phút là nửa giờ, viết là 0,5 giờ. 1 giờ 30 phút = 1,5 giờ.' },
  { name: 'Hai xe ngược chiều', kinds: ['meet'], tip: 'Hai xe chạy ngược chiều: mỗi giờ hai xe gần nhau thêm (vận tốc xe này + vận tốc xe kia) km.' },
  { name: 'Đuổi kịp', kinds: ['chase'], tip: 'Hai xe chạy cùng chiều: mỗi giờ xe nhanh đuổi gần thêm (vận tốc xe nhanh − vận tốc xe chậm) km.' },
  { name: 'Thử thách', kinds: ['dist', 'speed', 'time', 'tune', 'mixed', 'meet', 'chase'], tip: 'Màn cuối có đủ mọi loại câu. Cố lên!' },
];
const SPEEDS = [30, 35, 40, 45, 50, 55, 60, 65, 70];
const UNIT = { dist: 'km', speed: 'km/giờ', time: 'giờ', tune: 'km/giờ', mixed: 'km', walk: 'm', meet: 'giờ', chase: 'giờ' };

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// Đáp án đúng đứng đầu rồi 3 đáp án nhiễu là số nguyên dương khác nhau (giữ thứ tự ưu tiên)
function withDistractors(ans, list) {
  const out = [ans];
  for (const x of list) if (x > 0 && Number.isInteger(x) && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) if (!out.includes(ans + d)) out.push(ans + d);
  return out;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds.length > ROUNDS ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  if (kind === 'dist' || kind === 'speed' || kind === 'time' || kind === 'tune') {
    const v = pick(rand, SPEEDS);
    const t = kind === 'time' ? ri(rand, 2, 6) : ri(rand, 2, 5);
    const s = v * t;
    const r = { kind, v, t, s };
    if (kind === 'dist') return { ...r, ans: s, options: withDistractors(s, [v + t, s + v, s - v, s + 10]) };
    if (kind === 'speed') return { ...r, ans: v, options: withDistractors(v, [s - t, v + 5, v - 5, v + 10]) };
    if (kind === 'time') return { ...r, ans: t, options: withDistractors(t, [t + 1, t - 1, t + 2, s - v]) };
    return { ...r, ans: v, start: pick(rand, [10, 20, 90, 100].filter((x) => Math.abs(x - v) >= 20)) };
  }
  if (kind === 'mixed') {
    const v = pick(rand, [40, 50, 60, 70, 80]);
    const t = pick(rand, [0.5, 1.5, 2.5]);
    const s = v * t;
    const whole = Math.floor(t);
    // Nhầm thường gặp: 30 phút = 0,3 giờ, hoặc quên phần phút
    return { kind, v, t, s, ans: s, options: withDistractors(s, [Math.round(v * (whole + 0.3)), v * whole, v * (t + 0.5), s + 10]) };
  }
  if (kind === 'walk') {
    const v = pick(rand, [50, 60, 65, 70, 75, 80]);
    const t = ri(rand, 5, 15);
    const s = v * t;
    return { kind, v, t, s, ans: s, options: withDistractors(s, [s + v, s - v, v + t, s + 10]) };
  }
  if (kind === 'meet') {
    const v1 = pick(rand, [40, 45, 50, 55, 60]);
    const v2 = pick(rand, [25, 30, 35, 40]);
    const t = ri(rand, 1, 4);
    const s = (v1 + v2) * t;
    return { kind, v1, v2, t, s, ans: t, options: withDistractors(t, [s / (v1 - v2), t + 1, t * 2, t - 1, t + 2]) };
  }
  // chase: xe 1 chạy nhanh ở sau, xe 2 chạy chậm ở trước cách d km
  const v2 = pick(rand, [30, 35, 40, 45, 50]);
  const v1 = v2 + pick(rand, [10, 15, 20]);
  const t = ri(rand, 1, 5);
  const d = (v1 - v2) * t;
  return { kind, v1, v2, t, d, ans: t, options: withDistractors(t, [d / (v1 + v2), d / v2, t + 1, t * 2, t - 1]) };
}

const answerOf = (r) => r.ans;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, v: 0, mistakes: 0, busy: false };
const num = (n) => String(n).replace('.', ',');
const HOUR_MS = 600;

const game = createGame({
  id: 'duong-dua-van-toc',
  title: '🏎️ Đường Đua Vận Tốc',
  sub: 'Tính quãng đường, vận tốc, thời gian và chỉnh tốc độ cho xe đua!',
  levels: LEVELS.length,
  winTitle: 'Bé lái xe giỏi quá! 🏁',
  start: startLevel,
});

/* ---------- Đường đua ---------- */
// "1 giờ 30 phút", "45 phút"
function hoursText(h) {
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  if (!min) return `${whole} giờ`;
  return whole ? `${whole} giờ ${min} phút` : `${min} phút`;
}

// cars: [{ id, from, to, flip }] vị trí tính theo phần trăm đường đua; chừa hai đầu để xe không lấn ra ngoài
const pos = (pct) => `${4 + pct * 0.92}%`;
function placeCars(cars) {
  $('#road').querySelectorAll('.car').forEach((el) => el.remove());
  for (const c of cars) {
    $('#road').insertAdjacentHTML('beforeend', `<span class="car${c.flip ? ' flip' : ''}" data-car="${c.id}" style="left:${pos(c.from)}">${c.emoji}</span>`);
  }
}

function drawTrack(r, done = false) {
  const unit = r.kind === 'walk' ? 'm' : 'km';
  let left = '0 ' + unit;
  let right = '';
  let cars;
  if (r.kind === 'meet') {
    right = `${r.s} km`;
    cars = [
      { id: 'a', emoji: '🚙', from: 0, to: ((r.v1 * r.t) / r.s) * 100, flip: true },
      { id: 'b', emoji: '🚗', from: 100, to: ((r.v1 * r.t) / r.s) * 100 },
    ];
  } else if (r.kind === 'chase') {
    const len = r.v1 * r.t;
    left = `cách ${r.d} km`;
    right = done ? `gặp nhau sau ${r.t} giờ` : '';
    cars = [
      { id: 'a', emoji: '🏎️', from: 0, to: 100, flip: true },
      { id: 'b', emoji: '🚜', from: (r.d / len) * 100, to: 100, flip: true },
    ];
  } else {
    const showS = done || ['speed', 'time', 'tune'].includes(r.kind);
    right = `${showS ? num(r.s) : '?'} ${unit}`;
    cars = [{ id: 'a', emoji: r.kind === 'walk' ? '🚶' : '🏎️', from: 0, to: 100, flip: r.kind !== 'walk' }];
  }
  $('#startLbl').textContent = left;
  $('#endLbl').textContent = right;
  $('#flag').classList.toggle('hidden', r.kind === 'meet' || r.kind === 'chase');
  $('#timer').textContent = '⏱ 0 giờ';
  placeCars(cars);
  return cars;
}

// Cho xe chạy hết `hours` giờ; trả về false nếu bé rời màn giữa chừng
async function race(cars, hours, label = hoursText) {
  const steps = Math.round(hours * 2);
  const ms = Math.min(4000, hours * HOUR_MS);
  void $('#road').offsetWidth;
  for (const c of cars) {
    const el = $(`[data-car="${c.id}"]`);
    el.style.transition = `left ${ms}ms linear`;
    el.style.left = pos(c.to);
  }
  game.sfx.pop();
  for (let i = 1; i <= steps; i++) {
    if (!(await game.wait(ms / steps))) return false;
    $('#timer').textContent = `⏱ ${label(i / 2)}`;
  }
  return true;
}

/* ---------- Chỉnh tốc độ ---------- */
function showSpeed() {
  $('#speedVal').textContent = `${state.v} km/giờ`;
}
$('#speedControls').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-dv]');
  if (!btn || state.busy) return;
  state.v = Math.max(5, Math.min(120, state.v + Number(btn.dataset.dv)));
  game.sfx.tap();
  showSpeed();
});

$('#runBtn').addEventListener('click', async () => {
  const r = state.r;
  if (state.busy || r?.kind !== 'tune') return;
  state.busy = true;
  const cars = drawTrack(r);
  const reach = (state.v * r.t) / r.s;
  cars[0].to = Math.min(reach, 1.08) * 100;
  if (!(await race(cars, r.t))) return;
  if (state.v === r.v) return correct();
  state.busy = false;
  wrong(state.v > r.v
    ? `Nhanh quá! Hết ${r.t} giờ xe đi được ${state.v * r.t} km, vượt qua đích rồi. Giảm vận tốc nhé.`
    : `Chậm quá! Hết ${r.t} giờ xe mới đi được ${state.v * r.t} km, còn thiếu ${r.s - state.v * r.t} km.`);
});

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
    case 'dist': return `Xe đua chạy ${r.v} km mỗi giờ, chạy trong ${r.t} giờ. Xe đi được bao nhiêu km?`;
    case 'speed': return `Xe đua chạy ${r.s} km hết ${r.t} giờ. Vận tốc của xe là bao nhiêu?`;
    case 'time': return `Đường đua dài ${r.s} km, xe chạy ${r.v} km/giờ. Xe chạy hết bao lâu?`;
    case 'tune': return `Đường dài ${r.s} km. Chọn vận tốc để xe về đích đúng sau ${r.t} giờ!`;
    case 'mixed': return `Xe chạy ${r.v} km/giờ trong ${hoursText(r.t)}. Xe đi được bao nhiêu km?`;
    case 'walk': return `Bé đi bộ mỗi phút ${r.v} m, đi trong ${r.t} phút. Bé đi được bao nhiêu mét?`;
    case 'meet': return `Hai xe ở hai đầu đường dài ${r.s} km, cùng chạy lại gặp nhau. Xe xanh ${r.v1} km/giờ, xe đỏ ${r.v2} km/giờ. Sau mấy giờ hai xe gặp nhau?`;
    default: return `Máy cày chạy ${r.v2} km/giờ, đi trước xe đua ${r.d} km. Xe đua chạy ${r.v1} km/giờ đuổi theo. Sau mấy giờ xe đua đuổi kịp?`;
  }
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  game.rounds(state.round, ROUNDS);
  drawTrack(r);
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);
  const isTune = r.kind === 'tune';
  $('#speedControls').classList.toggle('hidden', !isTune);
  $('#runRow').classList.toggle('hidden', !isTune);
  $('#choices').classList.toggle('hidden', isTune);
  if (isTune) {
    state.v = r.start;
    return showSpeed();
  }
  const opts = window.shuffle(r.options);
  renderChoices($('#choices'), opts.map((o) => `${num(o)} ${UNIT[r.kind]}`), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(hintFor(r, opts[i]));
    return ok;
  });
}

function hintFor(r, picked) {
  switch (r.kind) {
    case 'dist': return `Mỗi giờ xe đi ${r.v} km. ${r.t} giờ thì đi ${r.v} × ${r.t} km.`;
    case 'speed': return `Chia đều ${r.s} km cho ${r.t} giờ: ${r.s} : ${r.t}.`;
    case 'time': return `Mỗi giờ xe đi ${r.v} km. Cần mấy giờ để đi hết ${r.s} km? Tính ${r.s} : ${r.v}.`;
    case 'mixed':
      return picked === Math.round(r.v * (Math.floor(r.t) + 0.3)) ? '30 phút là nửa giờ (0,5 giờ), không phải 0,3 giờ đâu!' : `${hoursText(r.t)} = ${num(r.t)} giờ. Tính ${r.v} × ${num(r.t)}.`;
    case 'walk': return `Mỗi phút đi ${r.v} m. Tính ${r.v} × ${r.t}.`;
    case 'meet':
      return picked === r.s / (r.v1 - r.v2) ? 'Hai xe chạy ngược chiều nên phải cộng hai vận tốc, không phải trừ.' : `Mỗi giờ hai xe gần nhau thêm ${r.v1} + ${r.v2} = ${r.v1 + r.v2} km.`;
    default:
      return picked === r.d / (r.v1 + r.v2) ? 'Hai xe chạy cùng chiều nên phải trừ hai vận tốc, không phải cộng.' : `Mỗi giờ xe đua gần máy cày thêm ${r.v1} − ${r.v2} = ${r.v1 - r.v2} km.`;
  }
}

function explain(r) {
  switch (r.kind) {
    case 'dist': return `${r.v} × ${r.t} = ${r.s} km`;
    case 'speed': return `${r.s} : ${r.t} = ${r.v} km/giờ`;
    case 'time': return `${r.s} : ${r.v} = ${r.t} giờ`;
    case 'tune': return `${r.v} × ${r.t} = ${r.s} km, về đích đúng giờ`;
    case 'mixed': return `${r.v} × ${num(r.t)} = ${r.s} km`;
    case 'walk': return `${r.v} × ${r.t} = ${r.s} m`;
    case 'meet': return `${r.s} : (${r.v1} + ${r.v2}) = ${r.t} giờ`;
    default: return `${r.d} : (${r.v1} − ${r.v2}) = ${r.t} giờ`;
  }
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  game.say(`Đúng rồi! ${explain(r)} 🎉`, 'cheer', 'good');
  if (r.kind !== 'tune') {
    const cars = drawTrack(r, true);
    // Đi bộ tính bằng phút: cho chạy trong thời gian như 1 giờ
    const walk = r.kind === 'walk';
    if (!(await race(cars, walk ? 1 : r.t, walk ? (h) => `${Math.round(h * r.t)} phút` : hoursText))) return;
  }
  $('#endLbl').textContent = r.kind === 'chase' ? `đuổi kịp sau ${r.t} giờ 🎉` : r.kind === 'meet' ? `gặp nhau sau ${r.t} giờ 🎉` : `${num(r.s)} ${r.kind === 'walk' ? 'm' : 'km'} 🏁`;
  if (!(await game.wait(1400))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé là tay đua tính nhanh nhất!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  const el = $('#road');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  game.say(hint, 'sad', 'soft');
}
