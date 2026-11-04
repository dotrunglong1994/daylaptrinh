// 🃏 Lật Thẻ Nhớ — lật hai thẻ, giống nhau thì giữ lại. Xong một bàn thì sang bàn lớn hơn. 90 giây.

// LEVELS-START
const TIME = 90;
const PEEK_MS = 1200; // đầu mỗi bàn được nhìn nhanh tất cả các thẻ
const BOARDS = [[4, 3], [4, 4], [5, 4], [6, 4]]; // [cột, hàng], bàn sau cùng lặp lại
const SYMBOLS = ['🍎', '🚗', '🎸', '🌵', '🐙', '⚽', '🎈', '🦋', '🍕', '🚀', '🌙', '🎲', '🐢', '🔔', '🍩', '🌻'];

const boardAt = (i) => BOARDS[Math.min(i, BOARDS.length - 1)];

// Bộ bài: mỗi hình xuất hiện đúng 2 lần, trộn ngẫu nhiên
function makeDeck(pairs, rand = Math.random) {
  const picks = [...SYMBOLS.keys()];
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  const deck = picks.slice(0, pairs).flatMap((s) => [s, s]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Điểm một cặp: 10, tìm liền nhiều cặp không lật sai thì cộng thêm 5 mỗi cặp (tối đa +20)
const pairScore = (streak) => 10 + 5 * Math.min(Math.max(streak - 1, 0), 4);
// Xong một bàn được thưởng theo số cặp của bàn
const boardBonus = (pairs) => pairs * 5;
// LEVELS-END

const S = { board: 0, deck: [], open: [], matched: new Set(), score: 0, streak: 0, pairs: 0, misses: 0, boards: 0, lock: true, left: TIME };
const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');

const game = createBrainGame({
  id: 'lat-the',
  title: '🃏 Lật Thẻ Nhớ',
  skill: 'Trí nhớ hình ảnh',
  intro: '<p>Mỗi bàn có các cặp thẻ giống nhau. Đầu bàn được <b>nhìn nhanh</b> tất cả, rồi thẻ úp lại.</p>'
    + '<p>Lật <b>hai thẻ</b> một lần: giống nhau thì giữ lại. Tìm liền nhiều cặp được cộng thêm điểm. Bạn có <b>90 giây</b>.</p>',
  start: startRun,
});

function hud() {
  game.hud(`<div><span>Giờ</span> ${S.left}s</div><div><span>Bàn</span> ${S.board + 1}</div><div><span>Điểm</span> ${S.score}</div>`);
}

function startRun() {
  Object.assign(S, { board: 0, score: 0, streak: 0, pairs: 0, misses: 0, boards: 0, left: TIME });
  newBoard();
  game.timer(TIME, (left) => {
    S.left = left;
    hud();
  }).then((done) => done && finish());
}

async function newBoard() {
  const [cols, rows] = boardAt(S.board);
  S.deck = makeDeck((cols * rows) / 2);
  S.open = [];
  S.matched = new Set();
  S.lock = true;
  gridEl.style.setProperty('--cols', cols);
  gridEl.innerHTML = S.deck.map((s, i) => `<button class="card up" data-i="${i}"><span>${SYMBOLS[s]}</span></button>`).join('');
  statusEl.textContent = 'Nhìn nhanh…';
  hud();
  if (!(await game.wait(PEEK_MS))) return;
  for (const c of gridEl.children) c.classList.remove('up');
  statusEl.textContent = 'Tìm các cặp giống nhau';
  S.lock = false;
}

gridEl.addEventListener('pointerdown', async (e) => {
  const card = e.target.closest('.card');
  if (!card || S.lock || !game.alive()) return;
  e.preventDefault();
  const i = Number(card.dataset.i);
  if (S.matched.has(i) || S.open.includes(i)) return;
  card.classList.add('up');
  S.open.push(i);
  game.sfx.tick();
  if (S.open.length < 2) return;
  const [a, b] = S.open;
  const cards = [gridEl.children[a], gridEl.children[b]];
  if (S.deck[a] === S.deck[b]) {
    S.matched.add(a).add(b);
    S.open = [];
    S.streak++;
    S.pairs++;
    S.score += pairScore(S.streak);
    cards.forEach((c) => c.classList.add('done'));
    game.sfx.good();
    statusEl.textContent = S.streak > 1 ? `Liền ${S.streak} cặp! +${pairScore(S.streak)}` : `+${pairScore(S.streak)}`;
    hud();
    if (S.matched.size === S.deck.length) {
      S.lock = true;
      S.boards++;
      S.score += boardBonus(S.deck.length / 2);
      statusEl.textContent = `Xong bàn! +${boardBonus(S.deck.length / 2)}`;
      hud();
      if (!(await game.wait(700))) return;
      S.board++;
      newBoard();
    }
    return;
  }
  // Sai: úp lại sau một chút
  S.lock = true;
  S.streak = 0;
  S.misses++;
  game.sfx.bad();
  cards.forEach((c) => c.classList.add('miss'));
  if (!(await game.wait(650))) return;
  cards.forEach((c) => c.classList.remove('up', 'miss'));
  S.open = [];
  S.lock = false;
});

function finish() {
  S.lock = true;
  const flips = S.pairs + S.misses;
  game.end(S.score, [
    ['Cặp tìm được', S.pairs],
    ['Bàn hoàn thành', S.boards],
    ['Lật trúng', flips ? `${Math.round((S.pairs / flips) * 100)}%` : '—'],
  ]);
}
