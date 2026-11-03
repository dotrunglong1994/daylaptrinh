// LEVELS-START (scripts/checks/chu-ech-nhay.mjs đọc đoạn này để kiểm tra từng màn)
// Ao 5 cột × 4 hàng. Ếch chỉ đứng được trên lá sen, nhảy xuống nước hay ra ngoài ao là "tõm".
// Loại câu: trace = đọc lệnh, chạm lá sen ếch sẽ tới; pattern / gap = tìm mũi tên theo quy luật;
// choose = chọn 1 trong 3 chương trình; write = tự xếp lệnh; fix = tìm và sửa một lệnh sai.
const COLS = 5;
const ROWS = 4;
const ROUNDS = 4;
const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const DIR_KEYS = Object.keys(DIRS);
const ICON = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
const DIR_TEXT = { up: 'lên', down: 'xuống', left: 'sang trái', right: 'sang phải' };

const LEVELS = [
  { name: 'Nhảy theo lệnh', kinds: ['trace'], len: [2, 2], extra: 4, tip: 'Nhìn từng mũi tên, mỗi mũi tên ếch nhảy một ô.' },
  { name: 'Đường dài hơn', kinds: ['trace'], len: [3, 4], extra: 5, tip: 'Lấy ngón tay dò theo từng bước nhé!' },
  { name: 'Quy luật', kinds: ['pattern'], patterns: ['AB', 'AAB', 'ABB'], tip: 'Các mũi tên lặp lại theo quy luật.' },
  { name: 'Quy luật khó', kinds: ['pattern', 'gap'], patterns: ['ABC', 'AABB', 'ABB', 'AAB'], tip: 'Tìm nhóm mũi tên lặp lại, rồi đoán chỗ còn thiếu.' },
  { name: 'Chọn đường đúng', kinds: ['choose'], len: [3, 4], extra: 3, tip: 'Thử từng đường trong đầu, đi theo từng mũi tên nhé.' },
  { name: 'Ếch đi bắt dế', kinds: ['write'], len: [3, 4], extra: 3, tip: 'Bấm các mũi tên để xếp lệnh, rồi bấm nút Nhảy.' },
  { name: 'Sửa lệnh sai', kinds: ['fix'], len: [3, 4], extra: 3, tip: 'Xem ếch nhảy. Bước nào làm ếch rơi xuống nước thì mũi tên đó sai.' },
  { name: 'Thử thách', kinds: ['trace', 'choose', 'fix', 'write'], len: [4, 5], extra: 4, tip: 'Màn cuối: đủ mọi loại câu. Cố lên!' },
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

function stepFrom(pos, dir) {
  const r = Math.floor(pos / COLS) + DIRS[dir][0];
  const c = (pos % COLS) + DIRS[dir][1];
  return r >= 0 && r < ROWS && c >= 0 && c < COLS ? r * COLS + c : -1;
}

// Cho ếch nhảy theo chương trình. cells = vị trí sau từng bước; fail = bước bị tõm (−1 nếu không tõm).
function simulate(pads, start, moves) {
  const cells = [];
  let pos = start;
  for (let i = 0; i < moves.length; i++) {
    const next = stepFrom(pos, moves[i]);
    if (next < 0 || !pads.includes(next)) return { cells, fail: i, splashAt: next };
    cells.push(next);
    pos = next;
  }
  return { cells, fail: -1, end: pos };
}
const reaches = (r, moves) => {
  const s = simulate(r.pads, r.start, moves);
  return s.fail < 0 && s.end === r.goal;
};

// Đường đi không quay lại ô cũ, rồi thêm vài lá sen nhử
function makePond(len, extra, rand) {
  for (;;) {
    const start = ri(rand, 0, COLS * ROWS - 1);
    const cells = [start];
    const moves = [];
    while (moves.length < len) {
      const options = DIR_KEYS.filter((d) => {
        const n = stepFrom(cells[cells.length - 1], d);
        return n >= 0 && !cells.includes(n);
      });
      if (!options.length) break;
      const d = pick(rand, options);
      moves.push(d);
      cells.push(stepFrom(cells[cells.length - 1], d));
    }
    if (moves.length < len) continue;
    const others = shuffled([...Array(COLS * ROWS).keys()].filter((i) => !cells.includes(i)), rand);
    const pads = [...cells, ...others.slice(0, extra)].sort((a, b) => a - b);
    return { start, moves, pads, goal: cells[cells.length - 1] };
  }
}

function otherDir(rand, not) {
  return pick(rand, DIR_KEYS.filter((d) => d !== not));
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds[k % L.kinds.length];
  if (kind === 'pattern' || kind === 'gap') {
    const pattern = pick(rand, L.patterns);
    const letters = [...new Set(pattern)];
    const dirs = shuffled(DIR_KEYS, rand).slice(0, letters.length);
    const unit = [...pattern].map((ch) => dirs[letters.indexOf(ch)]);
    if (kind === 'pattern') {
      // Hiện ít nhất 2 lần trọn nhóm rồi hỏi mũi tên kế tiếp
      const shown = unit.length * 2 + ri(rand, 0, unit.length - 1);
      return { kind, unit, seq: Array.from({ length: shown }, (_, i) => unit[i % unit.length]), gap: shown };
    }
    const total = unit.length * 3;
    return { kind, unit, seq: Array.from({ length: total }, (_, i) => unit[i % unit.length]), gap: ri(rand, unit.length, total - 1) };
  }
  for (;;) {
    const pond = makePond(ri(rand, L.len[0], L.len[1]), L.extra, rand);
    const r = { kind, ...pond };
    if (kind === 'trace' || kind === 'write') return r;
    if (kind === 'choose') {
      // Hai chương trình sai: đổi 1 lệnh, hoặc đảo 2 lệnh liền nhau
      const decoys = [];
      for (let t = 0; t < 30 && decoys.length < 2; t++) {
        const m = [...pond.moves];
        if (rand() < 0.5 && m.length > 1) {
          const i = ri(rand, 0, m.length - 2);
          [m[i], m[i + 1]] = [m[i + 1], m[i]];
        } else {
          const i = ri(rand, 0, m.length - 1);
          m[i] = otherDir(rand, m[i]);
        }
        const key = m.join();
        if (!reaches(r, m) && key !== pond.moves.join() && !decoys.some((x) => x.join() === key)) decoys.push(m);
      }
      if (decoys.length < 2) continue;
      return { ...r, programs: shuffled([pond.moves, ...decoys], rand) };
    }
    // fix: một lệnh sai làm ếch tõm ngay ở bước đó, và chỉ một mũi tên sửa được
    const i = ri(rand, 0, pond.moves.length - 1);
    const wrongs = DIR_KEYS.filter((d) => {
      if (d === pond.moves[i]) return false;
      const m = [...pond.moves];
      m[i] = d;
      return simulate(pond.pads, pond.start, m).fail === i;
    });
    if (!wrongs.length) continue;
    const fixes = DIR_KEYS.filter((d) => {
      const m = [...pond.moves];
      m[i] = d;
      return reaches(r, m);
    });
    if (fixes.length !== 1) continue;
    const buggy = [...pond.moves];
    buggy[i] = pick(rand, wrongs);
    return { ...r, buggy, bugAt: i };
  }
}

function answerOf(r) {
  switch (r.kind) {
    case 'trace': return r.goal;
    case 'pattern': case 'gap': return r.unit[r.gap % r.unit.length];
    case 'choose': return r.programs.findIndex((p) => reaches(r, p));
    case 'fix': return { at: r.bugAt, dir: r.moves[r.bugAt] };
    default: return r.moves; // write: một lời giải (bé có thể xếp đường khác cũng được)
  }
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const STEP_MS = 420;
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false, frog: 0, splash: -1, program: [], bugFound: false };

const game = createGame({
  id: 'chu-ech-nhay',
  title: '🐸 Chú Ếch Nhảy',
  sub: 'Đọc lệnh, tìm quy luật và giúp ếch nhảy qua lá sen!',
  levels: LEVELS.length,
  winTitle: 'Ếch nhảy giỏi quá! 🐸',
  start: startLevel,
});

/* ---------- Vẽ ao ---------- */
function drawPond({ tapPads = false } = {}) {
  const r = state.r;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const pad = r.pads.includes(i);
    let inner = '';
    if (i === state.frog) inner = '🐸';
    else if (i === state.splash) inner = '💦';
    else if (r.kind !== 'trace' && i === r.goal) inner = '🦗';
    const cls = ['cell', pad ? 'pad' : 'water', i === r.start && i !== state.frog ? 'start' : ''].join(' ');
    return tapPads && pad
      ? `<button class="${cls}" data-cell="${i}">${inner}</button>`
      : `<span class="${cls}">${inner}</span>`;
  }).join('');
  $('#pond').innerHTML = cells;
  $('#pond').classList.remove('hidden');
}

const arrows = (moves, attrs = () => '') =>
  moves.map((d, i) => `<span class="arrow" ${attrs(i)}>${ICON[d]}</span>`).join('');

function drawProgram(moves, { editable = false, tap = false } = {}) {
  const el = $('#program');
  el.classList.remove('hidden');
  if (tap) {
    el.innerHTML = moves.map((d, i) => `<button class="arrow${state.bugFound && i === state.r.bugAt ? ' marked' : ''}" data-i="${i}">${ICON[d]}</button>`).join('');
    return;
  }
  const slots = editable ? Math.max(state.r.moves.length + 2, moves.length) : moves.length;
  el.innerHTML = arrows(moves) + (editable ? '<span class="arrow slot"></span>'.repeat(Math.max(0, slots - moves.length)) : '');
}

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  showRound();
}

function questionOf(r) {
  switch (r.kind) {
    case 'trace': return 'Ếch nhảy theo các mũi tên. Ếch sẽ dừng ở lá sen nào? Chạm vào lá sen đó.';
    case 'pattern': return 'Mũi tên nào đến tiếp theo?';
    case 'gap': return 'Chỗ dấu hỏi là mũi tên nào?';
    case 'choose': return 'Đường nào đưa ếch tới chú dế?';
    case 'write': return 'Xếp mũi tên để ếch nhảy tới chú dế nhé!';
    default: return 'Ếch bị rơi xuống nước! Chạm vào mũi tên sai.';
  }
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  state.frog = r.start ?? -1;
  state.splash = -1;
  state.program = [];
  state.bugFound = false;
  game.rounds(state.round, ROUNDS);
  for (const id of ['#pond', '#program', '#palette', '#choices', '#runRow']) $(id).classList.add('hidden');
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);

  if (r.kind === 'pattern' || r.kind === 'gap') {
    $('#program').classList.remove('hidden');
    const seq = r.kind === 'pattern' ? [...r.seq, null] : r.seq.map((d, i) => (i === r.gap ? null : d));
    $('#program').innerHTML = seq.map((d) => `<span class="arrow${d ? '' : ' ask'}">${d ? ICON[d] : '?'}</span>`).join('');
    return choose(DIR_KEYS.map((d) => `<span class="big-arrow">${ICON[d]}</span>`), (i) => DIR_KEYS[i] === answerOf(r), () => {
      $('#program .ask').textContent = ICON[answerOf(r)];
      $('#program .ask').classList.add('ok');
    });
  }
  if (r.kind === 'trace') {
    drawPond({ tapPads: true });
    drawProgram(r.moves);
    return;
  }
  drawPond();
  if (r.kind === 'choose') {
    return choose(r.programs.map((p) => `<span class="mini">${p.map((d) => ICON[d]).join('')}</span>`), (i) => i === answerOf(r), () => hop(r.moves));
  }
  if (r.kind === 'write') {
    drawProgram([], { editable: true });
    $('#palette').classList.remove('hidden');
    $('#backBtn2').classList.remove('hidden');
    $('#runRow').classList.remove('hidden');
    return;
  }
  // fix: xem ếch nhảy theo chương trình sai trước
  drawProgram(r.buggy);
  state.busy = true;
  hop(r.buggy).then((ok) => {
    if (!ok) return;
    state.busy = false;
    drawProgram(r.buggy, { tap: true });
  });
}

// Nút đáp án; right(i) → đúng không; reveal() hiện lời giải trước khi khen
function choose(labels, right, reveal) {
  $('#choices').classList.remove('hidden');
  $('#choices').classList.toggle('stack', state.r.kind === 'choose');
  renderChoices($('#choices'), labels, (i) => {
    if (state.busy) return false;
    const ok = right(i);
    if (ok) correct(reveal); else wrong();
    return ok;
  });
}

/* ---------- Ếch nhảy ---------- */
// Nhảy từng bước; trả về false nếu bé rời màn giữa chừng
async function hop(moves) {
  const r = state.r;
  state.frog = r.start;
  state.splash = -1;
  drawPond();
  const sim = simulate(r.pads, r.start, moves);
  for (let i = 0; i < moves.length; i++) {
    if (!(await game.wait(STEP_MS))) return false;
    if (i === sim.fail) {
      state.frog = -1;
      state.splash = sim.splashAt;
      game.sfx.bad();
      drawPond();
      if (!(await game.wait(900))) return false;
      state.frog = r.start;
      state.splash = -1;
      drawPond();
      return true;
    }
    state.frog = sim.cells[i];
    game.sfx.pop();
    drawPond();
    $('#pond').querySelectorAll('.cell')[state.frog]?.classList.add('jump');
  }
  return true;
}

$('#pond').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cell]');
  if (!btn || state.busy || state.r.kind !== 'trace') return;
  const cell = Number(btn.dataset.cell);
  if (cell === state.r.goal) return correct(() => hop(state.r.moves));
  btn.classList.add('wrong-pad');
  wrong();
});

$('#palette').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-dir]');
  if (!btn || state.busy) return;
  const r = state.r;
  if (r.kind === 'write') {
    if (btn.dataset.dir === 'back') state.program.pop();
    else if (state.program.length < r.moves.length + 2) state.program.push(btn.dataset.dir);
    game.sfx.tap();
    drawProgram(state.program, { editable: true });
    if (btn.dataset.dir !== 'back') window.speak?.(DIR_TEXT[btn.dataset.dir]);
    return;
  }
  // fix: đã chạm đúng mũi tên sai, giờ chọn mũi tên thay thế
  if (r.kind !== 'fix' || !state.bugFound || btn.dataset.dir === 'back') return;
  const m = [...r.buggy];
  m[r.bugAt] = btn.dataset.dir;
  if (reaches(r, m)) {
    r.buggy = m;
    return correct(async () => { drawProgram(m); await hop(m); });
  }
  wrong('Chưa đúng. Ô ếch cần nhảy tới phải là lá sen, và từ đó đi tiếp được tới chú dế.');
});

$('#program').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-i]');
  const r = state.r;
  if (!btn || state.busy || r.kind !== 'fix' || state.bugFound) return;
  if (Number(btn.dataset.i) !== r.bugAt) {
    btn.classList.add('wrong-pad');
    return wrong('Mũi tên đó vẫn đúng. Tìm bước làm ếch rơi xuống nước nhé!');
  }
  state.bugFound = true;
  game.sfx.good();
  drawProgram(r.buggy, { tap: true });
  $('#palette').classList.remove('hidden');
  $('#backBtn2').classList.add('hidden');
  game.say('Đúng là mũi tên này! Ếch phải nhảy theo hướng nào?', 'happy');
});

$('#runBtn').addEventListener('click', async () => {
  const r = state.r;
  if (state.busy || r.kind !== 'write' || !state.program.length) return;
  state.busy = true;
  const moves = [...state.program];
  if (!(await hop(moves))) return;
  if (reaches(r, moves)) return correct(null);
  const sim = simulate(r.pads, r.start, moves);
  state.busy = false;
  wrong(sim.fail >= 0
    ? `Tõm! Ếch rơi xuống nước ở bước ${sim.fail + 1}. Bé sửa lại nhé.`
    : 'Ếch chưa tới chỗ chú dế. Thêm hoặc bớt mũi tên nhé!');
});

$('#clearBtn').addEventListener('click', () => {
  if (state.busy || state.r.kind !== 'write') return;
  state.program = [];
  drawProgram([], { editable: true });
});

$('#question').addEventListener('click', () => window.speak?.($('#question').textContent));

async function correct(reveal) {
  state.busy = true;
  game.sfx.good();
  game.say('Đúng rồi! 🎉', 'cheer', 'good');
  if (reveal && (await reveal()) === false) return;
  if (!(await game.wait(1100))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai lần nào. Bé là lập trình viên nhí!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function hint(r) {
  switch (r.kind) {
    case 'trace': return 'Chưa đúng. Bắt đầu từ chỗ ếch, đi theo từng mũi tên một nhé.';
    case 'pattern': case 'gap': return 'Chưa đúng. Tìm nhóm mũi tên lặp đi lặp lại nhé.';
    case 'choose': return 'Đường đó làm ếch rơi xuống nước hoặc không tới chú dế. Thử đường khác nhé!';
    default: return 'Chưa đúng, thử lại nhé!';
  }
}

function wrong(text) {
  state.mistakes++;
  game.sfx.bad();
  game.say(text || hint(state.r), 'sad', 'soft');
}
