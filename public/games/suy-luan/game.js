// 🧩 Suy Luận Thứ Tự — đọc các manh mối so sánh rồi xếp mọi người đúng thứ tự. 120 giây.

// LEVELS-START
const TIME = 120;
const MIN_N = 3;
const MAX_N = 6;
const NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Khoa', 'Lan', 'Minh', 'Ngọc', 'Phong'];
// [hơn, kém, yêu cầu xếp]
const THEMES = [
  ['cao hơn', 'thấp hơn', 'Xếp từ CAO nhất đến THẤP nhất'],
  ['chạy nhanh hơn', 'chạy chậm hơn', 'Xếp từ NHANH nhất đến CHẬM nhất'],
  ['nhiều tuổi hơn', 'ít tuổi hơn', 'Xếp từ NHIỀU tuổi nhất đến ÍT tuổi nhất'],
  ['đến sớm hơn', 'đến muộn hơn', 'Xếp từ người đến SỚM nhất đến người đến MUỘN nhất'],
];

function shuffled(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// order[0] đứng đầu (cao nhất…). Manh mối: mỗi cặp liền nhau một câu, viết xuôi ("A cao hơn B") hoặc ngược
// ("B thấp hơn A"); từ 5 người thêm một manh mối thừa giữa hai người không liền nhau để đánh lạc hướng.
function makePuzzle(n, rand = Math.random) {
  const theme = THEMES[Math.floor(rand() * THEMES.length)];
  const order = shuffled(NAMES, rand).slice(0, n);
  const pairs = order.slice(0, -1).map((a, i) => [a, order[i + 1]]);
  if (n >= 5) {
    const i = Math.floor(rand() * (n - 2));
    pairs.push([order[i], order[i + 2 + Math.floor(rand() * (n - i - 2))]]);
  }
  const clues = shuffled(pairs, rand).map(([hi, lo]) => (rand() < 0.5 ? `${hi} ${theme[0]} ${lo}` : `${lo} ${theme[1]} ${hi}`));
  return { theme, order, pairs, clues };
}

// Đúng liền 2 câu thì thêm 1 người, sai thì bớt 1 người
function nextN(n, streak, ok) {
  if (!ok) return Math.max(MIN_N, n - 1);
  return streak >= 2 ? Math.min(MAX_N, n + 1) : n;
}
const puzzleScore = (n) => n * 10;
// LEVELS-END

const S = { n: MIN_N, streak: 0, p: null, picked: [], score: 0, solved: 0, tried: 0, best: 0, lock: true, left: TIME };
const $ = (s) => document.querySelector(s);

const game = createBrainGame({
  id: 'suy-luan',
  title: '🧩 Suy Luận Thứ Tự',
  skill: 'Logic',
  intro: '<p>Đọc các manh mối như <b>"An cao hơn Bình"</b>, rồi chạm tên theo đúng thứ tự từ đầu đến cuối.</p>'
    + '<p>Đúng liền 2 câu thì thêm một người, sai thì bớt một người. Bạn có <b>120 giây</b>.</p>',
  start: startRun,
});

function hud() {
  game.hud(`<div><span>Giờ</span> ${S.left}s</div><div><span>Người</span> ${S.n}</div><div><span>Điểm</span> ${S.score}</div>`);
}

function startRun() {
  Object.assign(S, { n: MIN_N, streak: 0, score: 0, solved: 0, tried: 0, best: 0, left: TIME });
  newPuzzle();
  game.timer(TIME, (left) => {
    S.left = left;
    hud();
  }).then((done) => done && finish());
}

function newPuzzle() {
  S.p = makePuzzle(S.n);
  S.picked = [];
  S.lock = false;
  $('#ask').textContent = S.p.theme[2];
  $('#clues').innerHTML = S.p.clues.map((c) => `<li>${c}</li>`).join('');
  $('#names').innerHTML = shuffled(S.p.order, Math.random).map((name) => `<button class="name" data-name="${name}">${name}</button>`).join('');
  drawSlots();
  $('#status').textContent = '';
  hud();
}

function drawSlots(reveal = false) {
  const list = reveal ? S.p.order : S.picked;
  $('#slots').innerHTML = Array.from({ length: S.n }, (_, i) => {
    const name = list[i];
    const cls = reveal ? (S.picked[i] === name ? 'ok' : 'fix') : name ? 'filled' : '';
    return `<li class="${cls}"><small>${i + 1}</small>${name ?? ''}</li>`;
  }).join('');
}

$('#names').addEventListener('pointerdown', async (e) => {
  const b = e.target.closest('.name');
  if (!b || S.lock || b.disabled || !game.alive()) return;
  e.preventDefault();
  S.picked.push(b.dataset.name);
  b.disabled = true;
  game.sfx.tick();
  drawSlots();
  if (S.picked.length < S.n) return;
  S.lock = true;
  S.tried++;
  const ok = S.picked.every((name, i) => name === S.p.order[i]);
  if (ok) {
    S.solved++;
    S.streak++;
    S.best = Math.max(S.best, S.n);
    S.score += puzzleScore(S.n);
    game.sfx.good();
    $('#status').textContent = `Chính xác! +${puzzleScore(S.n)}`;
  } else {
    S.streak = 0;
    game.sfx.bad();
    $('#status').textContent = 'Chưa đúng. Thứ tự đúng ở trên.';
    drawSlots(true);
  }
  const n = nextN(S.n, S.streak, ok);
  if (n !== S.n) S.streak = 0;
  hud();
  if (!(await game.wait(ok ? 800 : 2000))) return;
  S.n = n;
  newPuzzle();
});

$('#undo').addEventListener('click', () => {
  if (S.lock || !S.picked.length) return;
  const name = S.picked.pop();
  const b = [...document.querySelectorAll('#names .name')].find((x) => x.dataset.name === name);
  if (b) b.disabled = false;
  drawSlots();
});

function finish() {
  S.lock = true;
  game.end(S.score, [
    ['Câu đúng', `${S.solved}/${S.tried}`],
    ['Nhiều người nhất', S.best ? `${S.best} người` : '—'],
    ['Điểm mỗi câu', '10 × số người'],
  ]);
}
