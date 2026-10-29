// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Vườn vẽ trên lưới, mỗi ô vuông cạnh 1 m. shape: các hàng, '#' là ô thuộc vườn.
// area = đếm ô; perim = đếm đoạn rào; compare = so sánh diện tích hai vườn (a, b);
// draw = bé tự vẽ vườn hình chữ nhật (chạm 2 góc) có area / perim / square cho trước;
// calc = tính bằng công thức. ask: area, perim, h (tìm chiều rộng khi biết diện tích), w (tìm cạnh hình vuông khi biết chu vi).
const GRID_W = 10;
const GRID_H = 7;

const LEVELS = [
  { name: 'Đếm ô vuông', rounds: [
    { type: 'area', shape: ['###', '###'] },
    { type: 'area', shape: ['####', '####', '####'] },
    { type: 'area', shape: ['#####', '#####'] },
  ], tip: 'Diện tích là số ô vuông bên trong vườn. Chạm vào ô để trồng hoa giúp đếm nhé!' },
  { name: 'Vườn hình lạ', rounds: [
    { type: 'area', shape: ['#..', '#..', '###'] },
    { type: 'area', shape: ['.##.', '####', '.##.'] },
    { type: 'area', shape: ['###.', '#.##', '####'] },
  ], tip: 'Vườn không phải hình chữ nhật cũng đếm được diện tích: đếm hết các ô màu xanh.' },
  { name: 'Hàng rào', rounds: [
    { type: 'perim', shape: ['##', '##'] },
    { type: 'perim', shape: ['####', '####'] },
    { type: 'perim', shape: ['#..', '#..', '###'] },
  ], tip: 'Chu vi là độ dài đường bao quanh vườn. Mỗi cạnh ô vuông là 1 m rào.' },
  { name: 'Vườn nào rộng hơn?', rounds: [
    { type: 'compare', a: ['####', '####'], b: ['###', '###', '###'] },
    { type: 'compare', a: ['######'], b: ['###', '###'] },
    { type: 'compare', a: ['##', '##', '##'], b: ['#..', '###', '..#'] },
  ], tip: 'Vườn nào có nhiều ô hơn thì rộng hơn, dù trông dài hay ngắn.' },
  { name: 'Tự vẽ vườn', rounds: [
    { type: 'draw', area: 12 },
    { type: 'draw', area: 10, perim: 14 },
    { type: 'draw', area: 9, square: true },
  ], tip: 'Chạm một ô làm góc thứ nhất, rồi chạm ô góc đối diện để vẽ vườn hình chữ nhật.' },
  { name: 'Công thức', rounds: [
    { type: 'calc', shape: 'rect', w: 5, h: 3, ask: 'area' },
    { type: 'calc', shape: 'rect', w: 6, h: 4, ask: 'perim' },
    { type: 'calc', shape: 'square', w: 7, h: 7, ask: 'area' },
    { type: 'calc', shape: 'square', w: 9, h: 9, ask: 'perim' },
  ], tip: 'Diện tích hình chữ nhật = dài × rộng. Chu vi = (dài + rộng) × 2.' },
  { name: 'Tính ngược', rounds: [
    { type: 'calc', shape: 'rect', w: 6, h: 4, ask: 'h' },
    { type: 'calc', shape: 'square', w: 5, h: 5, ask: 'w' },
    { type: 'draw', area: 8, perim: 12 },
    { type: 'calc', shape: 'rect', w: 8, h: 3, ask: 'h' },
  ], tip: 'Biết diện tích và chiều dài thì chiều rộng = diện tích : chiều dài.' },
  { name: 'Thử thách', rounds: [
    { type: 'draw', area: 16, perim: 16 },
    { type: 'compare', a: ['#####', '#####'], b: ['#######', '#.....#', '#######'] },
    { type: 'calc', shape: 'rect', w: 12, h: 5, ask: 'area' },
    { type: 'perim', shape: ['####', '#..#', '####'] },
  ], tip: 'Màn cuối! Cẩn thận: vườn có lỗ ở giữa cũng có rào bên trong.' },
];

const cellsOf = (shape) => shape.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? [x, y] : null)).filter(Boolean));
const areaOf = (shape) => cellsOf(shape).length;
const has = (shape, x, y) => shape[y]?.[x] === '#';
// Đếm cạnh ô vuông không giáp ô khác của vườn
function perimOf(shape) {
  return cellsOf(shape).reduce((s, [x, y]) =>
    s + [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !has(shape, x + dx, y + dy)).length, 0);
}

function answerOf(r) {
  if (r.type === 'area') return areaOf(r.shape);
  if (r.type === 'perim') return perimOf(r.shape);
  if (r.type === 'compare') return Math.sign(areaOf(r.a) - areaOf(r.b));
  if (r.type === 'calc') return { area: r.w * r.h, perim: (r.w + r.h) * 2, h: r.h, w: r.w }[r.ask];
  return null;
}

// Hình chữ nhật bé vẽ (w × h) có đúng yêu cầu không
const drawOk = (r, w, h) => w * h === r.area && (!r.perim || 2 * (w + h) === r.perim) && (!r.square || w === h);

// 4 đáp án số: nhầm diện tích với chu vi, lệch 1–2
function numberOptions(r) {
  const ans = answerOf(r);
  let mix;
  if (r.type === 'area') mix = perimOf(r.shape);
  else if (r.type === 'perim') mix = areaOf(r.shape);
  else if (r.ask === 'area') mix = (r.w + r.h) * 2;
  else if (r.ask === 'perim') mix = r.w * r.h;
  else mix = r.ask === 'h' ? r.w * r.h - r.w : r.w * 4 - r.w;
  const extra = r.type === 'calc' && r.ask === 'perim' ? r.w + r.h : ans * 2;
  const opts = [ans];
  for (const v of [mix, extra, ans + 1, ans - 1, ans + 2, ans - 2]) if (opts.length < 4 && v > 0 && !opts.includes(v)) opts.push(v);
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, ri: 0, mistakes: 0, busy: false, corner: null, rect: null };

const game = createGame({
  id: 'khu-vuon-dien-tich',
  title: '🌻 Khu Vườn Diện Tích',
  sub: 'Đếm ô, rào vườn, tự thiết kế khu vườn của bé!',
  levels: LEVELS.length,
  winTitle: 'Khu vườn tuyệt đẹp! 🌻',
  start: startLevel,
});

const round = () => state.level.rounds[state.ri];

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.ri = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

/* ---------- Vẽ lưới ---------- */
function gridHtml(shape, { small = false, fence = false, id = '' } = {}) {
  const h = shape.length;
  const w = Math.max(...shape.map((r) => r.length));
  let html = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = has(shape, x, y);
      let cls = inside ? ' in' : '';
      if (inside && fence) {
        if (!has(shape, x, y - 1)) cls += ' ft';
        if (!has(shape, x, y + 1)) cls += ' fb';
        if (!has(shape, x - 1, y)) cls += ' fl';
        if (!has(shape, x + 1, y)) cls += ' fr';
      }
      html += `<button class="cell${cls}" data-x="${x}" data-y="${y}"></button>`;
    }
  }
  return `<div class="grid${small ? ' small' : ''}" ${id ? `id="${id}"` : ''} style="--cols:${w}">${html}</div>`;
}

function showRound() {
  const r = round();
  state.busy = false;
  state.corner = null;
  state.rect = null;
  game.rounds(state.ri, state.level.rounds.length);
  const isDraw = r.type === 'draw';
  $('#drawRow').classList.toggle('hidden', !isDraw);
  $('#choices').classList.toggle('hidden', isDraw);

  if (r.type === 'area' || r.type === 'perim') {
    $('#question').textContent = r.type === 'area' ? 'Vườn rộng bao nhiêu ô vuông? (diện tích)' : 'Cần bao nhiêu mét rào để rào quanh vườn? (chu vi)';
    $('#board').innerHTML = `<div class="plot-card">${gridHtml(r.shape, { fence: r.type === 'perim', id: 'garden' })}<div class="size-note" id="note"></div></div>`;
    askNumber(r, r.type === 'area' ? 'ô vuông' : 'm');
  } else if (r.type === 'compare') {
    $('#question').textContent = 'Vườn nào rộng hơn (có diện tích lớn hơn)?';
    $('#board').innerHTML = `<div class="plot-card"><h3>Vườn A</h3>${gridHtml(r.a, { small: true })}</div><div class="plot-card"><h3>Vườn B</h3>${gridHtml(r.b, { small: true })}</div>`;
    const vals = [1, -1, 0];
    renderChoices($('#choices'), ['Vườn A', 'Vườn B', 'Bằng nhau'], (i) => {
      const ok = vals[i] === answerOf(r);
      if (ok) correct(`Vườn A: ${areaOf(r.a)} ô, vườn B: ${areaOf(r.b)} ô`);
      else wrong('Đếm số ô của từng vườn rồi so sánh nhé.');
      return ok;
    });
  } else if (r.type === 'calc') {
    showCalc(r);
  } else {
    const req = [`diện tích ${r.area} ô vuông`];
    if (r.perim) req.push(`chu vi ${r.perim} m`);
    $('#question').textContent = `Vẽ vườn ${r.square ? 'hình vuông' : 'hình chữ nhật'} có ${req.join(' và ')}`;
    const empty = Array.from({ length: GRID_H }, () => '.'.repeat(GRID_W));
    $('#board').innerHTML = `<div class="plot-card">${gridHtml(empty, { id: 'garden' })}<div class="size-note" id="note">Chạm ô góc thứ nhất</div></div>`;
  }
}

function askNumber(r, unit) {
  const opts = window.shuffle(numberOptions(r));
  renderChoices($('#choices'), opts.map((v) => `${v} ${unit}`), (i) => {
    const ok = opts[i] === answerOf(r);
    if (ok) {
      if (r.type === 'perim') $('#garden')?.querySelectorAll('.cell.in').forEach((c) => c.classList.add('planted'));
      correct(`${answerOf(r)} ${unit}`);
    } else {
      wrong(r.type === 'area' ? 'Chưa đúng. Trồng hoa vào từng ô để đếm nhé!'
        : r.type === 'perim' ? 'Chưa đúng. Đếm từng đoạn rào màu nâu quanh vườn, kể cả góc nhé.'
        : { area: 'Diện tích = dài × rộng.', perim: 'Chu vi = (dài + rộng) × 2.', h: 'Chiều rộng = diện tích : chiều dài.', w: 'Cạnh hình vuông = chu vi : 4.' }[r.ask]);
    }
    return ok;
  });
}

function showCalc(r) {
  const unit = { area: 'm²', perim: 'm', h: 'm', w: 'm' }[r.ask];
  const name = r.shape === 'square' ? 'hình vuông' : 'hình chữ nhật';
  const scale = Math.min(22, 240 / Math.max(r.w, r.h));
  let top = `${r.w} m`;
  let left = r.shape === 'square' ? '' : `${r.h} m`;
  let info = '';
  let q;
  if (r.ask === 'area') q = `Vườn ${name} này có diện tích bao nhiêu?`;
  else if (r.ask === 'perim') q = `Cần bao nhiêu mét rào quanh vườn ${name} này?`;
  else if (r.ask === 'h') { left = '? m'; info = `Diện tích: ${r.w * r.h} m²`; q = 'Chiều rộng của vườn là bao nhiêu?'; }
  else { top = '? m'; info = `Chu vi: ${r.w * 4} m`; q = 'Cạnh của vườn hình vuông dài bao nhiêu?'; }
  $('#question').textContent = q;
  $('#board').innerHTML = `<div class="plot-card"><div class="calc">
    <div class="shape" style="width:${r.w * scale}px;height:${r.h * scale}px">🌻</div>
    <span class="side top${top.startsWith('?') ? ' q' : ''}">${top}</span>
    ${left ? `<span class="side left${left.startsWith('?') ? ' q' : ''}">${left}</span>` : ''}
    ${info ? `<span class="info">${info}</span>` : ''}
  </div></div>`;
  askNumber(r, unit);
}

/* ---------- Chạm ô ---------- */
$('#board').addEventListener('click', (e) => {
  const c = e.target.closest('.cell');
  if (!c || state.busy) return;
  const r = round();
  if (r.type === 'area' && c.classList.contains('in')) {
    c.classList.toggle('planted');
    game.sfx.tap();
    const n = document.querySelectorAll('#garden .planted').length;
    $('#note').textContent = n ? `Đã trồng ${n} 🌷` : '';
    return;
  }
  if (r.type !== 'draw') return;
  const x = Number(c.dataset.x);
  const y = Number(c.dataset.y);
  if (!state.corner || state.rect) {
    state.corner = [x, y];
    state.rect = null;
  } else {
    const [x0, y0] = state.corner;
    state.rect = [Math.min(x, x0), Math.min(y, y0), Math.abs(x - x0) + 1, Math.abs(y - y0) + 1];
  }
  game.sfx.pop();
  paintDraw();
});

function paintDraw() {
  for (const c of document.querySelectorAll('#garden .cell')) {
    const x = Number(c.dataset.x);
    const y = Number(c.dataset.y);
    const inRect = state.rect && x >= state.rect[0] && x < state.rect[0] + state.rect[2] && y >= state.rect[1] && y < state.rect[1] + state.rect[3];
    c.classList.toggle('sel', !!inRect);
    c.classList.toggle('pick', !state.rect && state.corner && x === state.corner[0] && y === state.corner[1]);
  }
  if (state.rect) {
    const [, , w, h] = state.rect;
    $('#note').textContent = `Vườn ${w} × ${h} ô`;
  } else $('#note').textContent = 'Chạm ô góc đối diện';
}

$('#checkBtn').addEventListener('click', () => {
  if (state.busy) return;
  const r = round();
  if (!state.rect) return game.say('Chạm hai ô ở hai góc đối diện để vẽ vườn trước nhé!', 'sad', 'soft');
  const [, , w, h] = state.rect;
  if (drawOk(r, w, h)) return correct(`${w} × ${h} = ${w * h} ô, chu vi ${2 * (w + h)} m`);
  const bits = [`Vườn của bé có diện tích ${w * h} ô`];
  if (r.perim) bits.push(`chu vi ${2 * (w + h)} m`);
  if (r.square && w !== h) bits.push('và chưa phải hình vuông');
  wrong(`${bits.join(', ')}. Thử lại nhé!`);
});

/* ---------- Đúng / sai ---------- */
async function correct(eq) {
  state.busy = true;
  game.sfx.good();
  game.say(`Đúng rồi! ${eq}`, 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  state.ri++;
  if (state.ri < state.level.rounds.length) return showRound();
  game.rounds(state.ri, state.level.rounds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({ stars, eq: state.level.name, text: stars === 3 ? 'Không sai lần nào. Kiến trúc sư nhí!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!` });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
