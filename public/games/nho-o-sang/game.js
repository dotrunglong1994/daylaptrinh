// 🟦 Nhớ Ô Sáng — một dãy ô lần lượt sáng lên, người chơi bấm lại đúng thứ tự.

// LEVELS-START
const START_LEN = 3;   // dãy đầu tiên
const LIVES = 3;       // số mạng
const SHOW_MS = 600;   // mỗi ô sáng
const GAP_MS = 250;    // nghỉ giữa hai ô

// Cạnh lưới theo độ dài dãy: 3×3 khi ≤ 5, 4×4 khi 6–8, 5×5 từ 9.
function gridSizeFor(len) {
  return len <= 5 ? 3 : len <= 8 ? 4 : 5;
}

// Dãy chỉ số ô (0..n*n-1), không ô nào trùng ngay ô trước nó.
function makeSequence(len, rand = Math.random) {
  const cells = gridSizeFor(len) ** 2;
  const seq = [];
  for (let i = 0; i < len; i++) {
    if (!i) { seq.push(Math.floor(rand() * cells)); continue; }
    let c = Math.floor(rand() * (cells - 1));
    if (c >= seq[i - 1]) c++;
    seq.push(c);
  }
  return seq;
}

// Điểm = tổng độ dài các dãy đã hoàn thành × 10.
function scoreOf(completed) {
  return completed.reduce((a, b) => a + b, 0) * 10;
}

// Độ chính xác (%) theo số lần bấm.
function accuracyOf(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}
// LEVELS-END

const S = {
  len: START_LEN, lives: LIVES, seq: [], pos: 0, phase: 'idle',
  completed: [], taps: 0, correctTaps: 0, round: 0,
};

const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
let cells = [];

const game = createBrainGame({
  id: 'nho-o-sang',
  title: '🟦 Nhớ Ô Sáng',
  skill: 'Trí nhớ',
  intro: '<p>Các ô sẽ <b>lần lượt sáng lên</b>. Ghi nhớ rồi <b>bấm lại đúng thứ tự</b>.</p>'
    + '<p>Đúng thì dãy dài thêm 1 ô, lưới cũng lớn dần. Sai mất 1 trong <b>3 mạng</b> <span class="heart">♥</span>.</p>',
  start: startRun,
});

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = `status ${cls}`;
}

function updateHud() {
  const hearts = Array.from({ length: LIVES }, (_, i) => (i < S.lives ? '♥' : '<span class="lost">♥</span>')).join('');
  game.hud(`<div><span>Dãy</span> ${S.len}</div><div class="lives">${hearts}</div><div><span>Điểm</span> ${scoreOf(S.completed)}</div>`);
}

function buildGrid(size) {
  if (cells.length !== size * size) {
    gridEl.style.setProperty('--n', size);
    gridEl.innerHTML = '';
    cells = Array.from({ length: size * size }, (_, i) => {
      const b = document.createElement('button');
      b.className = 'cell';
      b.type = 'button';
      b.setAttribute('aria-label', `Ô ${i + 1}`);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
      gridEl.appendChild(b);
      return b;
    });
  }
  for (const c of cells) c.className = 'cell';
}

function renderProgress() {
  progressEl.innerHTML = S.seq.map((_, i) => `<i class="${i < S.pos ? 'done' : ''}"></i>`).join('');
}

function lock(on) {
  gridEl.classList.toggle('locked', on);
}

function startRun() {
  Object.assign(S, { len: START_LEN, lives: LIVES, seq: [], pos: 0, phase: 'idle', completed: [], taps: 0, correctTaps: 0 });
  cells = [];
  playRound();
}

async function playRound() {
  const round = ++S.round;
  S.phase = 'show';
  S.pos = 0;
  S.seq = makeSequence(S.len);
  buildGrid(gridSizeFor(S.len));
  lock(true);
  updateHud();
  renderProgress();
  setStatus('Hãy ghi nhớ…', 'watch');
  if (!(await game.wait(600)) || round !== S.round) return;
  for (const idx of S.seq) {
    cells[idx].classList.add('lit');
    game.sfx.tick();
    if (!(await game.wait(SHOW_MS)) || round !== S.round) return;
    cells[idx].classList.remove('lit');
    if (!(await game.wait(GAP_MS)) || round !== S.round) return;
  }
  S.phase = 'input';
  lock(false);
  setStatus(`Đến lượt bạn: bấm lại ${S.len} ô`, 'go');
}

async function tap(i) {
  if (S.phase !== 'input' || !game.alive()) return;
  const round = S.round;
  const cell = cells[i];
  S.taps++;
  if (i === S.seq[S.pos]) {
    S.correctTaps++;
    S.pos++;
    renderProgress();
    cell.classList.remove('tap');
    void cell.offsetWidth;
    cell.classList.add('tap');
    setTimeout(() => cell.classList.remove('tap'), 180);
    if (S.pos < S.seq.length) { game.sfx.tick(); return; }
    // Hoàn thành dãy
    S.phase = 'wait';
    lock(true);
    S.completed.push(S.len);
    game.sfx.good();
    setStatus(`Chính xác! +${S.len * 10} điểm`, 'ok');
    gridEl.classList.add('flash-good');
    updateHud();
    if (!(await game.wait(800)) || round !== S.round) return;
    gridEl.classList.remove('flash-good');
    S.len++;
    playRound();
    return;
  }
  // Bấm sai: ô đó lóe đỏ, hiện ô đúng
  S.phase = 'wait';
  lock(true);
  S.lives--;
  game.sfx.bad();
  cell.classList.add('wrong');
  cells[S.seq[S.pos]].classList.add('answer');
  setStatus(S.lives ? `Sai rồi! Ô đúng là ô viền xanh. Còn ${S.lives} mạng` : 'Hết mạng!', 'no');
  updateHud();
  if (!(await game.wait(1300)) || round !== S.round) return;
  if (S.lives <= 0) return finish();
  playRound();
}

function finish() {
  S.phase = 'idle';
  const longest = S.completed.length ? Math.max(...S.completed) : 0;
  game.end(scoreOf(S.completed), [
    ['Dãy dài nhất', longest ? `${longest} ô` : '—'],
    ['Dãy đúng', S.completed.length],
    ['Độ chính xác', `${accuracyOf(S.correctTaps, S.taps)}%`],
  ]);
}
