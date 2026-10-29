// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Mỗi món có nhiều bước. tool: scale (cân đồng hồ, g/kg), jug (ca đong, ml/l), quiz (đổi đơn vị, trả lời bằng `unit`).
// Lượng viết như "1kg200g", "500g", "1l250ml". scoops: các muỗng/cốc bé được dùng (mỗi loại dùng nhiều lần).
// tick: khoảng cách giữa hai vạch có số. hide: không hiện số, bé phải đọc kim/vạch.
const LEVELS = [
  { dish: ['🍉', 'Sinh tố dưa hấu'], steps: [
    { tool: 'scale', item: ['🍉', 'dưa hấu'], amount: '2kg', scoops: ['1kg'], max: '5kg', tick: '1kg' },
    { tool: 'jug', item: ['💧', 'nước'], amount: '3l', scoops: ['1l'], max: '5l', tick: '1l' },
  ], tip: 'Ki-lô-gam (kg) đo nặng nhẹ, lít (l) đo nước. Bấm cho đủ rồi chọn "Đủ rồi".' },
  { dish: ['🍞', 'Bánh mì'], steps: [
    { tool: 'scale', item: ['🌾', 'bột mì'], amount: '500g', scoops: ['100g'], max: '1kg', tick: '100g' },
    { tool: 'jug', item: ['🥛', 'sữa'], amount: '300ml', scoops: ['100ml'], max: '1l', tick: '100ml' },
  ], tip: 'Gam (g) nhỏ hơn ki-lô-gam nhiều: 1 kg = 1000 g. Mỗi muỗng là 100 g.' },
  { dish: ['🍪', 'Bánh quy'], steps: [
    { tool: 'scale', item: ['🌾', 'bột mì'], amount: '450g', scoops: ['200g', '50g'], max: '1kg', tick: '100g' },
    { tool: 'scale', item: ['🧈', 'bơ'], amount: '150g', scoops: ['100g', '50g'], max: '1kg', tick: '100g' },
    { tool: 'jug', item: ['🥛', 'sữa'], amount: '650ml', scoops: ['200ml', '50ml'], max: '1l', tick: '100ml' },
  ], tip: 'Có muỗng to và muỗng nhỏ. Tính xem cần mấy muỗng mỗi loại!' },
  { dish: ['🧁', 'Bánh nướng nhỏ'], steps: [
    { tool: 'scale', item: ['🍬', 'đường'], amount: '750g', scoops: ['100g', '50g'], max: '1kg', tick: '100g', hide: true },
    { tool: 'jug', item: ['🥛', 'sữa'], amount: '400ml', scoops: ['100ml', '50ml'], max: '1l', tick: '100ml', hide: true },
  ], tip: 'Cân không hiện số nữa! Nhìn kim chỉ vào vạch nào để biết đã đủ chưa.' },
  { dish: ['🍜', 'Nồi phở'], steps: [
    { tool: 'quiz', amount: '1kg200g', unit: 'g' },
    { tool: 'scale', item: ['🥩', 'thịt bò'], amount: '1kg200g', scoops: ['500g', '100g'], max: '2kg', tick: '200g' },
    { tool: 'jug', item: ['💧', 'nước dùng'], amount: '1l750ml', scoops: ['500ml', '250ml'], max: '2l', tick: '250ml' },
  ], tip: '1 kg 200 g nghĩa là 1000 g cộng thêm 200 g.' },
  { dish: ['🍹', 'Nước cam'], steps: [
    { tool: 'quiz', amount: '2l', unit: 'ml' },
    { tool: 'jug', item: ['🍊', 'nước cam'], amount: '1l500ml', scoops: ['500ml', '100ml'], max: '2l', tick: '250ml', liquid: 'juice' },
    { tool: 'quiz', amount: '3kg50g', unit: 'g' },
    { tool: 'scale', item: ['🍬', 'đường'], amount: '1kg50g', scoops: ['500g', '50g'], max: '2kg', tick: '200g' },
  ], tip: '1 l = 1000 ml. Cẩn thận với số 0 khi đổi đơn vị nhé!' },
  { dish: ['🎂', 'Bánh sinh nhật'], steps: [
    { tool: 'scale', item: ['🌾', 'bột mì'], amount: '1kg300g', scoops: ['500g', '100g'], max: '2kg', tick: '200g', hide: true },
    { tool: 'jug', item: ['🥛', 'sữa'], amount: '1l200ml', scoops: ['500ml', '100ml'], max: '2l', tick: '200ml', hide: true, liquid: 'milk' },
    { tool: 'quiz', amount: '1l200ml', unit: 'ml' },
  ], tip: 'Không có số trên màn hình. Đếm vạch cẩn thận: mỗi vạch có số cách nhau 200!' },
  { dish: ['🍲', 'Lẩu thập cẩm'], steps: [
    { tool: 'quiz', amount: '2kg5g', unit: 'g' },
    { tool: 'scale', item: ['🦐', 'tôm'], amount: '850g', scoops: ['200g', '50g'], max: '1kg', tick: '100g', hide: true },
    { tool: 'jug', item: ['💧', 'nước'], amount: '1l750ml', scoops: ['500ml', '250ml'], max: '2l', tick: '250ml', hide: true },
    { tool: 'scale', item: ['🥬', 'rau'], amount: '1kg600g', scoops: ['500g', '200g', '100g'], max: '2kg', tick: '200g' },
  ], tip: 'Món khó nhất! Đổi đơn vị, đọc cân, đọc ca đong.' },
];

const UNITS = { kg: 1000, g: 1, l: 1000, ml: 1 };

// "1kg200g" → 1200 (đơn vị nhỏ: g hoặc ml)
function parseAmt(text) {
  const parts = [...text.matchAll(/(\d+)(kg|g|ml|l)/g)];
  if (!parts.length || parts.map((p) => p[0]).join('') !== text) throw new Error(`Lượng sai: ${text}`);
  return parts.reduce((s, [, n, u]) => s + Number(n) * UNITS[u], 0);
}
const isLiquid = (text) => /l/.test(text);

// 1200 → "1 kg 200 g"; liquid = true → "1 l 200 ml"
function fmtAmt(v, liquid) {
  const [big, small] = liquid ? ['l', 'ml'] : ['kg', 'g'];
  const a = Math.floor(v / 1000);
  const b = v % 1000;
  return [a ? `${a} ${big}` : '', b || !a ? `${b} ${small}` : ''].filter(Boolean).join(' ');
}

// Đáp án cho câu đổi đơn vị: số đúng và các lỗi hay gặp với số 0
function quizOptions(step) {
  const v = parseAmt(step.amount);
  const a = Math.floor(v / 1000);
  const b = v % 1000;
  const opts = [v];
  for (const x of [Number(`${a}${b}`), a * 1000 + b / 10, a * 1000 + b / 100, a * 1000 + b * 10, a * 100 + b, v * 10, v + 100, v - 100]) {
    if (opts.length < 4 && x > 0 && Number.isInteger(x) && !opts.includes(x)) opts.push(x);
  }
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, si: 0, added: [], mistakes: 0, busy: false };

const game = createGame({
  id: 'bep-can-dong',
  title: '🧁 Bếp Cân Đong',
  sub: 'Cân bột, đong sữa thật chuẩn để nấu món ngon!',
  levels: LEVELS.length,
  unit: 'món',
  winTitle: 'Món ăn hoàn thành! 🍽️',
  start: startLevel,
});

const step = () => state.level.steps[state.si];
const amount = () => state.added.reduce((s, v) => s + v, 0);

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.si = 0;
  state.mistakes = 0;
  $('#dish').textContent = `${state.level.dish[0]} Món ${state.level.dish[1]}`;
  game.say(state.level.tip);
  showStep();
}

function renderRecipe() {
  $('#steps').innerHTML = state.level.steps.map((s, i) => {
    const cls = i < state.si ? 'done' : i === state.si ? 'now' : '';
    const text = s.tool === 'quiz' ? `🧮 Đổi đơn vị` : `${s.item[0]} ${fmtAmt(parseAmt(s.amount), isLiquid(s.amount))} ${s.item[1]}`;
    return `<li class="${cls}">${text}</li>`;
  }).join('');
}

function showStep() {
  const s = step();
  state.added = [];
  state.busy = false;
  $('#stage').classList.remove('running');
  renderRecipe();
  game.rounds(state.si, state.level.steps.length);
  const quiz = s.tool === 'quiz';
  for (const id of ['#tool', '#readout', '#scoopRow', '#doneRow']) $(id).classList.toggle('hidden', quiz);
  $('#choices').classList.toggle('hidden', !quiz);
  const liquid = isLiquid(s.amount);

  if (quiz) {
    $('#question').textContent = `${fmtAmt(parseAmt(s.amount), liquid)} = ? ${s.unit}`;
    const opts = window.shuffle(quizOptions(s));
    const ans = parseAmt(s.amount);
    renderChoices($('#choices'), opts.map((v) => `${v} ${s.unit}`), (i) => {
      const ok = opts[i] === ans;
      if (ok) done(`${fmtAmt(ans, liquid)} = ${ans} ${s.unit}`);
      else wrong(liquid ? 'Nhớ: 1 l = 1000 ml.' : 'Nhớ: 1 kg = 1000 g.');
      return ok;
    });
    return;
  }

  $('#question').textContent = `${s.tool === 'scale' ? 'Cân' : 'Đong'} ${fmtAmt(parseAmt(s.amount), liquid)} ${s.item[1]}`;
  $('#scoopRow').innerHTML = s.scoops.map((sc) => `<button class="scoop" data-v="${parseAmt(sc)}">+ ${fmtAmt(parseAmt(sc), liquid)}</button>`).join('');
  renderTool();
}

/* ---------- Vẽ cân và ca đong ---------- */
function renderTool() {
  const s = step();
  const liquid = isLiquid(s.amount);
  const max = parseAmt(s.max);
  const tick = parseAmt(s.tick);
  const v = Math.min(amount(), max);
  $('#readout').textContent = s.hide ? '🙈 Màn hình không hiện số' : fmtAmt(amount(), liquid);
  $('#readout').classList.toggle('secret', !!s.hide);
  const label = (x) => (tick % 1000 === 0 ? `${x / 1000}` : `${x}`);
  const unitLabel = tick % 1000 === 0 ? (liquid ? 'l' : 'kg') : liquid ? 'ml' : 'g';

  if (s.tool === 'scale') {
    const cx = 100, cy = 112, r = 74;
    const pt = (x, rad) => {
      const a = (-90 + (180 * x) / max) * (Math.PI / 180);
      return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
    };
    let marks = '';
    for (let x = 0; x <= max + 1e-9; x += tick / 2) {
      const major = x % tick === 0;
      const [x1, y1] = pt(x, major ? r - 12 : r - 7);
      const [x2, y2] = pt(x, r);
      marks += `<line class="tk${major ? ' major' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      if (major) {
        const [lx, ly] = pt(x, r - 22);
        marks += `<text class="lb" x="${lx}" y="${ly + 3}">${label(x)}</text>`;
      }
    }
    const angle = -90 + (180 * v) / max;
    $('#tool').innerHTML = `<div class="scale"><svg viewBox="0 0 200 150">
      <text class="bowl" x="100" y="30">${'🥣'}</text>
      <rect class="body" x="14" y="34" width="172" height="112" rx="22" />
      <path class="dial" d="M ${cx - r - 6} ${cy} A ${r + 6} ${r + 6} 0 0 1 ${cx + r + 6} ${cy} Z" />
      ${marks}
      <text class="unit" x="${cx}" y="${cy - 18}">${unitLabel}</text>
      <line class="needle" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r + 4}" style="transform-origin:${cx}px ${cy}px;transform:rotate(${angle}deg)" />
      <circle cx="${cx}" cy="${cy}" r="6" fill="#23395b" />
    </svg></div>`;
    return;
  }
  let marks = '';
  for (let x = tick / 2; x <= max + 1e-9; x += tick / 2) {
    const major = x % tick === 0;
    marks += `<i class="mark${major ? '' : ' minor'}" style="bottom:${(x / max) * 100}%">${major ? `<span>${label(x)} ${unitLabel}</span>` : ''}</i>`;
  }
  $('#tool').innerHTML = `<div class="jug"><div class="glass">${marks}<div class="water ${s.liquid || (s.item[1] === 'sữa' ? 'milk' : '')}" style="height:${(v / max) * 100}%"></div></div><div class="handle"></div></div>`;
}

$('#scoopRow').addEventListener('click', (e) => {
  const b = e.target.closest('.scoop');
  if (!b || state.busy) return;
  const v = Number(b.dataset.v);
  if (amount() + v > parseAmt(step().max)) return game.say('Đầy quá rồi, không thêm được nữa!', 'sad', 'soft');
  state.added.push(v);
  game.tone(step().tool === 'jug' ? 300 : 200, 0.25, { type: 'sine', to: step().tool === 'jug' ? 600 : 260, vol: 0.1 });
  renderTool();
});
$('#undoBtn').addEventListener('click', () => {
  if (state.busy || !state.added.length) return;
  state.added.pop();
  game.sfx.tap();
  renderTool();
});
$('#doneBtn').addEventListener('click', () => {
  if (state.busy) return;
  const s = step();
  const want = parseAmt(s.amount);
  const got = amount();
  const liquid = isLiquid(s.amount);
  if (got === want) return done(`${s.item[0]} ${fmtAmt(want, liquid)} ${s.item[1]}`);
  const diff = fmtAmt(Math.abs(want - got), liquid);
  wrong(s.hide
    ? (got < want ? 'Chưa đủ đâu! Nhìn kỹ kim / mực nước so với vạch cần đạt.' : 'Nhiều quá rồi! Bớt ra một chút nhé.')
    : got < want ? `Còn thiếu ${diff}.` : `Thừa ${diff} rồi, bớt ra nhé.`);
});

async function done(eq) {
  state.busy = true;
  $('#stage').classList.add('running');
  game.sfx.good();
  game.say(`Chuẩn rồi! ${eq}`, 'cheer', 'good');
  if (!(await game.wait(1300))) return;
  state.si++;
  if (state.si < state.level.steps.length) return showStep();
  renderRecipe();
  game.rounds(state.si, state.level.steps.length);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: `${state.level.dish[0]} ${state.level.dish[1]}`,
    text: stars === 3 ? 'Cân đong chuẩn từng gam. Đầu bếp giỏi quá!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
