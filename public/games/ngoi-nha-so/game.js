// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Mỗi màn 5 câu sinh ngẫu nhiên, loại câu lấy lần lượt trong `kinds`. Mọi số trong phạm vi 1–10 (lớp 1).
const ROUNDS = 5;
const LEVELS = [
  { name: 'Đếm đến 5', kinds: ['count'], max: 5, tip: 'Chạm vào từng bạn để đếm nhé!' },
  { name: 'Đếm đến 10', kinds: ['count'], max: 10, tip: 'Mỗi hàng có 5 ô. Đếm hết hàng trên rồi đếm tiếp hàng dưới.' },
  { name: 'Mời bạn vào nhà', kinds: ['build'], tip: 'Chạm vào các bạn ở sân để mời vào nhà.' },
  { name: 'Nhiều hơn, ít hơn', kinds: ['compare', 'compare', 'symbol'], tip: 'Đếm số bạn ở mỗi nhà rồi so sánh nhé!' },
  { name: 'Ngôi nhà tách số', kinds: ['split'], tip: 'Mái nhà ghi tổng số bạn. Hai phòng cộng lại bằng số trên mái.' },
  { name: 'Thêm bạn tới chơi', kinds: ['add'], tip: 'Thêm bạn thì số bạn nhiều lên. Đếm tiếp từ số bạn trong nhà nhé!' },
  { name: 'Bạn về nhà', kinds: ['sub'], tip: 'Bạn đi về thì số bạn ít đi. Che các bạn vẫy tay rồi đếm số còn lại.' },
  { name: 'Ai ở đâu?', kinds: ['floor', 'above', 'left', 'below', 'right'], tip: 'Tầng 1 ở dưới cùng. Trái, phải là theo tay của bé.' },
];

const ANIMALS = [
  ['🐔', 'gà'], ['🐱', 'mèo'], ['🐶', 'chó'], ['🐰', 'thỏ'], ['🐷', 'heo'],
  ['🐸', 'ếch'], ['🐭', 'chuột'], ['🦆', 'vịt'], ['🐻', 'gấu'], ['🐼', 'gấu trúc'],
];
const FLOORS = 3;
const COLS = 3;

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
function shuffled(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ô kề bên trong nhà 3 tầng × 3 phòng. grid[0] là tầng trên cùng.
const NEIGHBOR = { above: [-1, 0], below: [1, 0], left: [0, -1], right: [0, 1] };
function neighborOf(pos, rel) {
  const [dr, dc] = NEIGHBOR[rel];
  const r = Math.floor(pos / COLS) + dr;
  const c = (pos % COLS) + dc;
  return r >= 0 && r < FLOORS && c >= 0 && c < COLS ? r * COLS + c : -1;
}
const floorOf = (pos) => FLOORS - Math.floor(pos / COLS);

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds[k % L.kinds.length];
  const animal = ri(rand, 0, ANIMALS.length - 1);
  switch (kind) {
    case 'count': return { kind, animal, n: ri(rand, L.max > 5 ? 4 : 1, L.max) };
    case 'build': return { kind, animal, n: ri(rand, 3, 10) };
    case 'compare':
    case 'symbol': {
      const a = ri(rand, 1, 10);
      // Khoảng 1/5 số câu hai nhà bằng nhau
      const b = rand() < 0.2 ? a : ri(rand, 1, 10);
      return { kind, animal, a, b, ask: rand() < 0.5 ? 'more' : 'less' };
    }
    case 'split': {
      const total = ri(rand, 3, 10);
      return { kind, animal, total, a: ri(rand, 1, total - 1) };
    }
    case 'add': {
      const a = ri(rand, 1, 8);
      return { kind, animal, a, b: ri(rand, 1, 10 - a) };
    }
    case 'sub': {
      const a = ri(rand, 3, 10);
      return { kind, animal, a, b: ri(rand, 1, a - 1) };
    }
    default: {
      // floor / above / below / left / right: 9 bạn khác nhau ở 9 phòng
      const grid = shuffled(ANIMALS.map((_, i) => i), rand).slice(0, FLOORS * COLS);
      const cells = grid.map((_, i) => i).filter((i) => kind === 'floor' || neighborOf(i, kind) >= 0);
      return { kind, grid, target: cells[ri(rand, 0, cells.length - 1)] };
    }
  }
}

function answerOf(r) {
  switch (r.kind) {
    case 'count': case 'build': return r.n;
    case 'split': return r.total - r.a;
    case 'add': return r.a + r.b;
    case 'sub': return r.a - r.b;
    case 'compare': {
      if (r.a === r.b) return 'equal';
      return (r.a > r.b) === (r.ask === 'more') ? 'left' : 'right';
    }
    case 'symbol': return r.a > r.b ? '>' : r.a < r.b ? '<' : '=';
    case 'floor': return floorOf(r.target);
    default: return r.grid[neighborOf(r.target, r.kind)];
  }
}

// Các đáp án để bé chọn (chưa xáo trộn)
function optionsOf(r) {
  const ans = answerOf(r);
  if (r.kind === 'compare') return ['left', 'equal', 'right'];
  if (r.kind === 'symbol') return ['>', '=', '<'];
  if (r.kind === 'floor') return [1, 2, 3];
  if (r.grid) {
    // Bạn được hỏi cũng là một đáp án nhử, rồi tới các bạn khác trong nhà
    const pool = [ans, r.grid[r.target], ...r.grid];
    return [...new Set(pool)].slice(0, 4);
  }
  const near = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 3, ans - 3].filter((x) => x >= 1 && x <= 10);
  return [ans, ...near.slice(0, 3)];
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false, inside: 0, counted: 0 };

const game = createGame({
  id: 'ngoi-nha-so',
  title: '🏠 Ngôi Nhà Số',
  sub: 'Đếm các bạn thú, tách gộp số và tìm xem ai ở đâu!',
  levels: LEVELS.length,
  winTitle: 'Bé đếm giỏi quá! 🏠',
  start: startLevel,
});

const emoji = (i) => ANIMALS[i][0];
const name = (i) => `bạn ${ANIMALS[i][1]}`;
const SYMBOL_TEXT = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' };
const REL_TEXT = { above: 'ở ngay trên', below: 'ở ngay dưới', left: 'ở ngay bên trái', right: 'ở ngay bên phải' };

/* ---------- Vẽ nhà ---------- */
// Xếp bạn thú theo khung 10 ô (2 hàng × 5) để bé dễ đếm
function crowd(n, a, extra = () => '') {
  return `<div class="frame">${Array.from({ length: n }, (_, i) =>
    `<span class="pet${extra(i)}" data-pet>${emoji(a)}</span>`).join('')}</div>`;
}
const room = (inner, cls = '') => `<div class="room ${cls}">${inner}</div>`;
const house = (rooms, roof = '', cls = '') =>
  `<div class="house ${cls}"><div class="roof"><span>${roof}</span></div><div class="rooms">${rooms}</div></div>`;

function drawScene() {
  const r = state.r;
  let html = '';
  switch (r.kind) {
    case 'count':
      html = house(room(crowd(r.n, r.animal)));
      break;
    case 'build': {
      const slots = Array.from({ length: 10 }, (_, i) =>
        i < state.inside ? `<button class="pet in" data-in>${emoji(r.animal)}</button>` : '<span class="pet empty"></span>').join('');
      const yard = Array.from({ length: 10 - state.inside }, () =>
        `<button class="pet" data-out>${emoji(r.animal)}</button>`).join('');
      html = house(room(`<div class="frame">${slots}</div>`), r.n) + `<div class="yard">${yard}</div>`;
      break;
    }
    case 'compare':
    case 'symbol': {
      const roof = (n) => (r.kind === 'symbol' ? n : '');
      const sign = r.kind === 'symbol' ? `<b class="sign" id="sign">?</b>` : '<b class="sign"></b>';
      html = `<div class="pair">${house(room(crowd(r.a, r.animal)), roof(r.a), 'small')}${sign}${house(room(crowd(r.b, r.animal)), roof(r.b), 'small')}</div>`;
      break;
    }
    case 'split':
      html = house(
        room(crowd(r.a, r.animal) + `<b class="tag">${r.a}</b>`) +
        room(`<div class="frame" id="hidden"></div><b class="tag" id="mystery">?</b>`, 'mystery'),
        r.total,
      );
      break;
    case 'add':
      html = `<div class="pair">${house(room(crowd(r.a, r.animal)))}<b class="sign">+</b><div class="visitors">${crowd(r.b, r.animal, () => ' arrive')}</div></div>
        <p class="eq">${r.a} + ${r.b} = <b id="result">?</b></p>`;
      break;
    case 'sub':
      html = house(room(crowd(r.a, r.animal, (i) => (i >= r.a - r.b ? ' leaving' : ''))))
        + `<p class="eq">${r.a} − ${r.b} = <b id="result">?</b></p>`;
      break;
    default: {
      const floors = Array.from({ length: FLOORS }, (_, f) => {
        const cells = r.grid.slice(f * COLS, f * COLS + COLS).map((a, c) => {
          const pos = f * COLS + c;
          return `<span class="cell${pos === r.target ? ' target' : ''}">${emoji(a)}</span>`;
        }).join('');
        return `<div class="floor"><small>Tầng ${FLOORS - f}</small>${cells}</div>`;
      }).join('');
      html = `<div class="house tall"><div class="roof"><span></span></div><div class="floors">${floors}</div></div>`;
    }
  }
  $('#scene').innerHTML = html;
}

/* ---------- Câu hỏi ---------- */
function questionOf(r) {
  switch (r.kind) {
    case 'count': return `Trong nhà có mấy ${name(r.animal)}?`;
    case 'build': return `Mời ${r.n} ${name(r.animal)} vào nhà nhé!`;
    case 'compare': return `Nhà nào có ${r.ask === 'more' ? 'nhiều' : 'ít'} bạn hơn?`;
    case 'symbol': return `${r.a} và ${r.b}: chọn dấu lớn hơn, bé hơn hay bằng.`;
    case 'split': return `Nhà số ${r.total} có ${r.total} bạn. Một phòng có ${r.a} bạn. Phòng kia có mấy bạn?`;
    case 'add': return `Trong nhà có ${r.a} bạn, thêm ${r.b} bạn tới chơi. Có tất cả mấy bạn?`;
    case 'sub': return `Trong nhà có ${r.a} bạn, ${r.b} bạn đi về. Còn lại mấy bạn?`;
    case 'floor': return `${capital(name(r.grid[r.target]))} ở tầng mấy?`;
    default: return `Ai ${REL_TEXT[r.kind]} ${name(r.grid[r.target])}?`;
  }
}
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function labelOf(r, opt) {
  if (r.kind === 'compare') return { left: '⬅️ Nhà này', right: 'Nhà này ➡️', equal: '🟰 Bằng nhau' }[opt];
  if (r.kind === 'symbol') return `${opt}<br><small>${SYMBOL_TEXT[opt]}</small>`;
  if (r.kind === 'floor') return `Tầng ${opt}`;
  if (r.grid) return `<span class="big-emoji">${emoji(opt)}</span>`;
  return `<span class="big-num">${opt}</span>`;
}

function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  showRound();
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  state.inside = 0;
  state.counted = 0;
  game.rounds(state.round, ROUNDS);
  drawScene();
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);

  const isBuild = r.kind === 'build';
  $('#checkRow').classList.toggle('hidden', !isBuild);
  $('#choices').classList.toggle('hidden', isBuild);
  if (isBuild) return;
  // Câu 3 đáp án giữ thứ tự cố định (nút trái nằm dưới nhà trái) và luôn xếp 3 cột
  const fixed = r.kind === 'compare' || r.kind === 'symbol' || r.kind === 'floor';
  const opts = fixed ? optionsOf(r) : window.shuffle(optionsOf(r));
  $('#choices').classList.toggle('three', fixed);
  renderChoices($('#choices'), opts.map((o) => labelOf(r, o)), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct(); else wrong();
    return ok;
  });
}

$('#question').addEventListener('click', () => window.speak?.($('#question').textContent));

/* ---------- Chạm để đếm, mời bạn vào nhà ---------- */
$('#scene').addEventListener('click', (e) => {
  if (state.busy) return;
  const r = state.r;
  if (r.kind === 'build') {
    if (e.target.closest('[data-out]') && state.inside < 10) state.inside++;
    else if (e.target.closest('[data-in]')) state.inside--;
    else return;
    game.sfx.pop();
    drawScene();
    if (e.target.closest('[data-out]')) window.speak?.(String(state.inside));
    return;
  }
  // Các câu khác: chạm vào bạn thú để đánh số 1, 2, 3…
  const pet = e.target.closest('[data-pet]');
  if (!pet || pet.dataset.n) return;
  pet.dataset.n = ++state.counted;
  game.sfx.tap();
  window.speak?.(String(state.counted));
});

$('#checkBtn').addEventListener('click', () => {
  if (state.busy || state.r.kind !== 'build') return;
  if (state.inside === state.r.n) return correct();
  wrong(state.inside < state.r.n
    ? `Trong nhà mới có ${state.inside} bạn. Cần ${state.r.n} bạn, mời thêm nhé!`
    : `Trong nhà có ${state.inside} bạn, nhiều hơn ${state.r.n} rồi. Chạm vào bạn trong nhà để mời ra sân.`);
});

function praise(r) {
  const ans = answerOf(r);
  switch (r.kind) {
    case 'count': case 'build': return `Đúng rồi! Có ${ans} ${name(r.animal)}.`;
    case 'compare': return r.a === r.b ? `Đúng rồi! Hai nhà đều có ${r.a} bạn.` : `Đúng rồi! ${r.a} bạn và ${r.b} bạn.`;
    case 'symbol': return `Đúng rồi! ${r.a} ${SYMBOL_TEXT[ans]} ${r.b}.`;
    case 'split': return `Đúng rồi! ${r.a} và ${ans} là ${r.total}.`;
    case 'add': return `Đúng rồi! ${r.a} cộng ${r.b} bằng ${ans}.`;
    case 'sub': return `Đúng rồi! ${r.a} trừ ${r.b} bằng ${ans}.`;
    case 'floor': return `Đúng rồi! ${capital(name(r.grid[r.target]))} ở tầng ${ans}.`;
    default: return `Đúng rồi! ${capital(name(ans))} ${REL_TEXT[r.kind]} ${name(r.grid[r.target])}.`;
  }
}

function hint(r) {
  switch (r.kind) {
    case 'count': return 'Chưa đúng. Chạm vào từng bạn để đếm nhé!';
    case 'compare': return 'Chưa đúng. Đếm số bạn ở từng nhà rồi so sánh nhé!';
    case 'symbol': return 'Chưa đúng. Miệng dấu luôn há về phía số lớn hơn.';
    case 'split': return `Chưa đúng. Đếm tiếp từ ${r.a} cho tới ${r.total}, xem phải đếm thêm mấy số.`;
    case 'add': return `Chưa đúng. Bắt đầu từ ${r.a}, đếm tiếp ${r.b} bạn tới chơi.`;
    case 'sub': return 'Chưa đúng. Đếm các bạn không vẫy tay, đó là các bạn còn ở lại.';
    case 'floor': return 'Chưa đúng. Tầng 1 ở dưới cùng, đếm lên trên nhé!';
    default: return 'Chưa đúng. Tìm bạn có khung sáng trước, rồi nhìn sang ô bên cạnh.';
  }
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  // Hiện lời giải ngay trên hình
  if (r.kind === 'split') {
    $('#hidden').outerHTML = crowd(answerOf(r), r.animal);
    $('#mystery').textContent = answerOf(r);
  } else if (r.kind === 'symbol') $('#sign').textContent = answerOf(r);
  else if (r.kind === 'add' || r.kind === 'sub') $('#result').textContent = answerOf(r);
  $('#scene').classList.add('ok');
  game.say(praise(r), 'cheer', 'good');
  if (!(await game.wait(2200))) return;
  $('#scene').classList.remove('ok');
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé giỏi quá!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(text) {
  state.mistakes++;
  game.sfx.bad();
  $('#scene').classList.remove('shake');
  void $('#scene').offsetWidth;
  $('#scene').classList.add('shake');
  game.say(text || hint(state.r), 'sad', 'soft');
}
