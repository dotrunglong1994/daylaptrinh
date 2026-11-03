// LEVELS-START
// Logic thuần (không DOM) — scripts/checks/nho-lui.mjs kiểm tra hàng nghìn khối.
const CELLS = 9;          // lưới 3×3, vị trí 0..8
const SCORED = 20;        // số bước chấm được trong một khối (khối dài SCORED + N bước)
const TARGETS = 6;        // số bước "trùng" mỗi khối (30% của 20)
const BLOCKS = 3;         // số khối mỗi lượt
const START_N = 1;
const MAX_N = 9;
const UP_AT = 0.8;        // độ chính xác ≥ 80% → N + 1
const DOWN_BELOW = 0.5;   // độ chính xác < 50% → N − 1

// Bước i là "trùng" khi vị trí giống vị trí cách đó n bước.
function isTarget(seq, i, n) {
  return i >= n && seq[i] === seq[i - n];
}

// Dãy vị trí cho một khối: đúng TARGETS bước trùng trong SCORED bước chấm, không có trùng ngoài ý muốn.
function makeBlock(n, rand = Math.random) {
  const len = SCORED + n;
  const pick = (k) => Math.floor(rand() * k);
  const idx = Array.from({ length: SCORED }, (_, k) => k + n);
  for (let k = idx.length - 1; k > 0; k--) {
    const j = pick(k + 1);
    [idx[k], idx[j]] = [idx[j], idx[k]];
  }
  const targets = new Set(idx.slice(0, TARGETS));
  const seq = [];
  for (let i = 0; i < len; i++) {
    if (i < n) seq.push(pick(CELLS));
    else if (targets.has(i)) seq.push(seq[i - n]);
    else {
      // chọn một ô khác ô cách đó n bước (8 lựa chọn)
      const v = pick(CELLS - 1);
      seq.push(v >= seq[i - n] ? v + 1 : v);
    }
  }
  return seq;
}

// presses[i] = true nếu người chơi bấm "Trùng!" ở bước i. Các bước i < n không chấm.
function scoreBlock(seq, n, presses) {
  let hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0;
  for (let i = n; i < seq.length; i++) {
    const t = isTarget(seq, i, n);
    const p = !!presses[i];
    if (t && p) hits++;
    else if (t) misses++;
    else if (p) falseAlarms++;
    else correctRejections++;
  }
  const scored = seq.length - n;
  const accuracy = scored > 0 ? (hits + correctRejections) / scored : 0;
  const points = hits * 10 * n - falseAlarms * 5 * n;
  return { hits, misses, falseAlarms, correctRejections, accuracy, points };
}

function nextN(n, accuracy) {
  if (accuracy >= UP_AT) return Math.min(MAX_N, n + 1);
  if (accuracy < DOWN_BELOW) return Math.max(1, n - 1);
  return n;
}
// LEVELS-END

/* ---------- Giao diện ---------- */
// Thời gian (ms) để trong object: khi kiểm thử có thể đổi TIMING.step cho nhanh.
const TIMING = { step: 2500, flash: 500, missFlash: 600 };

const $ = (s) => document.querySelector(s);
const grid = $('#grid');
const cells = Array.from({ length: CELLS }, () => {
  const c = document.createElement('div');
  c.className = 'cell';
  grid.appendChild(c);
  return c;
});

// Trạng thái lượt chơi (đọc được qua Runtime.evaluate khi kiểm thử).
const S = {
  phase: 'idle',   // 'show' (đang chạy khối) | 'break' (nghỉ giữa khối) | 'idle'
  run: 0,          // tăng mỗi lượt mới, vòng lặp cũ tự dừng
  block: 0, n: START_N, maxN: START_N,
  seq: [], step: -1, presses: [],
  liveHits: 0, liveFA: 0,
  total: 0, hits: 0, misses: 0, falseAlarms: 0,
  results: [],     // [{ n, hits, misses, falseAlarms, correctRejections, accuracy, points, nextN }]
};

const fmtPct = (a) => `${Math.round(a * 100)}%`;
const liveScore = () => S.total + S.liveHits * 10 * S.n - S.liveFA * 5 * S.n;

function renderHud() {
  const len = S.seq.length || SCORED + S.n;
  game.hud(
    `<div><span>N</span> ${S.n}</div>` +
    `<div><span>Khối</span> ${S.block + 1}/${BLOCKS}</div>` +
    `<div><span>Bước</span> ${Math.max(0, S.step + 1)}/${len}</div>` +
    `<div><span>Điểm</span> ${Math.max(0, liveScore())}</div>`,
  );
}

function setStatus(text, cls = '') {
  const el = $('#status');
  el.textContent = text;
  el.className = `status ${cls}`;
}

function setRule() {
  $('#rule').innerHTML = S.n === 1
    ? 'Bấm <b>Trùng!</b> khi ô sáng giống ô <b>ngay trước đó</b>.'
    : `Bấm <b>Trùng!</b> khi ô sáng giống ô <b>${S.n} bước trước</b>.`;
}

function clearCells() {
  for (const c of cells) c.classList.remove('lit', 'hit', 'fa', 'miss');
}

function showBoard(on) {
  $('#board').classList.toggle('hidden', !on);
  $('#rule').classList.toggle('hidden', !on);
  $('#pause').classList.toggle('hidden', on);
}

function press() {
  if (!game.alive()) return;
  if (S.phase === 'break') return nextBlock();
  if (S.phase !== 'show' || S.step < 0 || S.presses[S.step]) return;
  const i = S.step;
  S.presses[i] = true;
  const btn = $('#matchBtn');
  btn.classList.add('down');
  setTimeout(() => btn.classList.remove('down'), 120);
  if (i < S.n) { setStatus(`Chưa đủ ${S.n} bước để so`, ''); return; }
  const cell = cells[S.seq[i]];
  if (isTarget(S.seq, i, S.n)) {
    S.liveHits++;
    cell.classList.add('hit');
    setStatus('Trúng!', 'good');
    game.sfx.good();
  } else {
    S.liveFA++;
    cell.classList.add('fa');
    setStatus('Báo nhầm', 'bad');
    game.sfx.bad();
  }
  renderHud();
}

let resumeBreak = null;
function nextBlock() {
  if (S.phase !== 'break' || !resumeBreak) return;
  const r = resumeBreak;
  resumeBreak = null;
  r();
}

async function runBlock(run) {
  S.phase = 'show';
  S.seq = makeBlock(S.n);
  S.presses = new Array(S.seq.length).fill(false);
  S.step = -1;
  S.liveHits = 0;
  S.liveFA = 0;
  clearCells();
  setStatus('');
  setRule();
  showBoard(true);
  $('#matchBtn').disabled = false;
  renderHud();
  if (!(await game.wait(400)) || run !== S.run) return false;

  for (let i = 0; i < S.seq.length; i++) {
    clearCells();
    setStatus('');
    S.step = i;
    renderHud();
    const cell = cells[S.seq[i]];
    cell.classList.add('lit');
    if (!(await game.wait(TIMING.flash)) || run !== S.run) return false;
    cell.classList.remove('lit');
    if (!(await game.wait(Math.max(0, TIMING.step - TIMING.flash))) || run !== S.run) return false;
    if (isTarget(S.seq, i, S.n) && !S.presses[i]) {
      // bỏ lỡ: lóe nhẹ ô lẽ ra phải bấm
      cell.classList.remove('miss');
      void cell.offsetWidth;
      cell.classList.add('miss');
      setStatus('Bỏ lỡ', 'miss');
      if (!(await game.wait(Math.min(TIMING.missFlash, TIMING.step))) || run !== S.run) return false;
    }
  }
  return true;
}

async function startRun() {
  const run = ++S.run;
  resumeBreak = null;
  Object.assign(S, {
    phase: 'idle', block: 0, n: START_N, maxN: START_N, seq: [], step: -1, presses: [],
    liveHits: 0, liveFA: 0, total: 0, hits: 0, misses: 0, falseAlarms: 0, results: [],
  });

  for (let b = 0; b < BLOCKS; b++) {
    S.block = b;
    if (!(await runBlock(run))) return;
    const r = scoreBlock(S.seq, S.n, S.presses);
    const n2 = nextN(S.n, r.accuracy);
    S.results.push({ n: S.n, ...r, nextN: n2 });
    S.total += r.points;
    S.hits += r.hits;
    S.misses += r.misses;
    S.falseAlarms += r.falseAlarms;
    S.liveHits = 0;
    S.liveFA = 0;
    S.step = -1;
    clearCells();
    $('#matchBtn').disabled = true;

    if (b === BLOCKS - 1) break;

    // Màn nghỉ giữa các khối
    $('#pauseTitle').textContent = `Xong khối ${b + 1}/${BLOCKS} · N = ${S.n}`;
    $('#pauseAcc').textContent = fmtPct(r.accuracy);
    $('#pauseStats').innerHTML = [['Trúng', r.hits], ['Bỏ lỡ', r.misses], ['Báo nhầm', r.falseAlarms]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const msg = n2 > S.n ? `Rất tốt! N tăng lên <b>${n2}</b>.`
      : n2 < S.n ? `Hơi khó, N giảm còn <b>${n2}</b>.`
      : `Giữ nguyên N = <b>${n2}</b>.`;
    $('#pauseNext').innerHTML = `${msg}<br>Khối tới: bấm khi ô giống ô ${n2 === 1 ? 'ngay trước đó' : `<b>${n2} bước</b> trước`}.`;
    S.n = n2;
    S.maxN = Math.max(S.maxN, n2);
    S.block = b + 1;   // HUD báo khối sắp chơi
    S.seq = [];
    S.phase = 'break';
    showBoard(false);
    renderHud();
    game.sfx.done();
    await new Promise((resolve) => { resumeBreak = resolve; });
    if (!game.alive() || run !== S.run) return;
  }

  S.phase = 'idle';
  game.end(Math.max(0, S.total), [
    ['N cao nhất', S.maxN],
    ['Trúng', S.hits],
    ['Bỏ lỡ', S.misses],
    ['Báo nhầm', S.falseAlarms],
  ]);
}

const game = createBrainGame({
  id: 'nho-lui',
  title: '🔁 Nhớ Lùi N Bước',
  skill: 'Trí nhớ làm việc',
  intro:
    '<p>Mỗi bước một ô trong lưới 3×3 sáng lên. Bấm <b>Trùng!</b> (hoặc phím <b>Space</b>) khi ô đó ' +
    'giống ô sáng <b>N bước trước</b>; không trùng thì để yên.</p>' +
    '<p>Ví dụ N = 2: góc trái → giữa → <b>góc trái</b> ⇒ bước 3 trùng (giống bước 1).</p>' +
    '<p>3 khối, bắt đầu N = 1. Đúng ≥ 80% thì N tăng, dưới 50% thì N giảm. N càng cao điểm càng nhiều.</p>',
  start: startRun,
});

$('#matchBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
$('#matchBtn').addEventListener('click', (e) => { if (e.detail === 0) press(); }); // bàn phím / trợ năng
$('#nextBtn').addEventListener('click', nextBlock);
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
  if (!game.alive()) return;
  e.preventDefault();
  if (e.repeat) return;
  if (e.key === 'Enter' && S.phase !== 'break') return;
  press();
});
