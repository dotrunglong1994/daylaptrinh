// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Mỗi bóng đèn ứng với 1, 2, 4, 8, 16 chấm (giống hoạt động "Đếm chấm" của CS Unplugged).
// Bóng sáng = 1, bóng tắt = 0. make: bật tắt cho ra số n (from = các bóng đang sáng lúc đầu);
// read: đọc số từ dãy bit; letter: đọc số rồi tra bảng chữ cái (A = 1, B = 2, …) để giải mật thư.
// dots: hiện chấm trên bóng; sum: hiện tổng đang sáng.
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const LEVELS = [
  { name: 'Ba bóng đèn', bits: 3, dots: true, sum: true, rounds: [{ make: 5 }, { make: 3 }, { make: 6 }, { make: 7 }],
    tip: 'Mỗi bóng có số chấm gấp đôi bóng bên phải. Bật bóng để cộng số chấm cho đúng số cần tìm!' },
  { name: 'Bốn bóng đèn', bits: 4, dots: true, sum: true, rounds: [{ make: 9 }, { make: 12 }, { make: 10 }, { make: 15 }],
    tip: 'Thêm bóng 8 chấm! Bắt đầu từ bóng lớn nhất: cần bóng đó không?' },
  { name: 'Đọc số nhị phân', bits: 4, dots: true, rounds: [{ read: '0110' }, { read: '1001' }, { read: '1011' }, { read: '0111' }],
    tip: 'Máy tính chỉ hiểu 0 và 1. Cộng số chấm của các bóng sáng (số 1) để đọc số.' },
  { name: 'Tự cộng số chấm', bits: 4, dots: true, rounds: [{ make: 13 }, { make: 6 }, { make: 11 }, { make: 14 }],
    tip: 'Không hiện tổng nữa! Bé tự cộng nhé.' },
  { name: 'Năm bóng đèn', bits: 5, dots: true, rounds: [{ make: 19 }, { make: 25 }, { make: 30 }, { make: 17 }],
    tip: 'Năm bóng đèn đếm được tới 31!' },
  { name: 'Đọc số không có chấm', bits: 5, rounds: [{ read: '10101' }, { read: '11000' }, { read: '01111' }, { read: '11111' }],
    tip: 'Không còn chấm, chỉ còn số trên bóng: 16, 8, 4, 2, 1.' },
  { name: 'Giải mật thư', bits: 5, rounds: [{ letter: '01101' }, { letter: '00101' }, { letter: '01111' }], word: 'MEO',
    tip: 'Mật thư! Đọc mỗi dãy bóng ra số, rồi tra bảng: 1 = A, 2 = B, 3 = C…' },
  { name: 'Đếm tiếp bằng bóng đèn', bits: 5, rounds: [{ make: 8, from: '00111' }, { make: 16, from: '01111' }, { make: 12, from: '01011' }, { make: 24, from: '10111' }],
    tip: 'Đếm tiếp bằng bóng đèn: đang là một số, hãy biến nó thành số tiếp theo!' },
];

const placeValues = (bits) => Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i));
const valueOf = (bitStr) => [...bitStr].reduce((s, b) => s * 2 + Number(b), 0);
const toBits = (n, bits) => n.toString(2).padStart(bits, '0');
const answerOf = (r) => r.make ?? valueOf(r.read ?? r.letter);

// 4 đáp án cho câu đọc: số đúng, đếm số bóng sáng, lệch một bóng
function readOptions(r, bits) {
  const s = r.read ?? r.letter;
  const ans = valueOf(s);
  const lit = [...s].filter((b) => b === '1').length;
  const flips = placeValues(bits).map((p) => ans ^ p);
  const opts = [ans];
  for (const v of [lit, ...flips, ans + 1, ans - 1]) if (opts.length < 4 && v > 0 && !opts.includes(v)) opts.push(v);
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, ri: 0, on: [], mistakes: 0, busy: false, word: '' };

const game = createGame({
  id: 'bong-den-nhi-phan',
  title: '💡 Bóng Đèn Nhị Phân',
  sub: 'Bật tắt bóng đèn để viết số như máy tính!',
  levels: LEVELS.length,
  winTitle: 'Bé nói được tiếng máy tính! 💡',
  start: startLevel,
});

const round = () => state.level.rounds[state.ri];

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.ri = 0;
  state.mistakes = 0;
  state.word = '';
  const L = state.level;
  $('#alphabet').classList.toggle('hidden', !L.word);
  $('#secret').classList.toggle('hidden', !L.word);
  $('#alphabet').innerHTML = [...LETTERS].map((c, i) => `<span><b>${c}</b>${i + 1}</span>`).join('');
  game.say(L.tip);
  showRound();
}

function showRound() {
  const L = state.level;
  const r = round();
  state.busy = false;
  game.rounds(state.ri, L.rounds.length);
  const make = r.make !== undefined;
  $('#makeRow').classList.toggle('hidden', !make);
  $('#choices').classList.toggle('hidden', make);
  const start = make ? r.from || '0'.repeat(L.bits) : r.read ?? r.letter;
  state.on = [...start].map((b) => b === '1');
  if (L.word) $('#secret').textContent = state.word.padEnd(L.word.length, '?');

  if (make) {
    $('#question').textContent = r.from
      ? `Bóng đang chỉ số ${valueOf(r.from)}. Bật tắt để thành số ${r.make}!`
      : `Bật bóng đèn để được số ${r.make}`;
  } else {
    $('#question').textContent = r.letter ? 'Dãy bóng này là số mấy, ứng với chữ nào?' : 'Dãy bóng này là số mấy?';
    const opts = window.shuffle(readOptions(r, L.bits));
    const ans = answerOf(r);
    renderChoices($('#choices'), opts.map((v) => (r.letter ? `${v} → ${LETTERS[v - 1] ?? '?'}` : String(v))), (i) => {
      const ok = opts[i] === ans;
      if (ok) {
        if (r.letter) state.word += LETTERS[ans - 1];
        correct(r.letter ? `${start} = ${ans} = ${LETTERS[ans - 1]}` : `${start} = ${ans}`);
      } else wrong('Chưa đúng. Chỉ cộng số của các bóng đang sáng thôi nhé.');
      return ok;
    }, (i) => opts[i] === ans);
  }
  renderBulbs(!make);
}

function renderBulbs(locked) {
  const L = state.level;
  const values = placeValues(L.bits);
  $('#bulbs').innerHTML = values.map((v, i) =>
    `<button class="bulb${state.on[i] ? ' on' : ''}${locked ? ' locked' : ''}" data-i="${i}">
      <span class="glass">💡</span>
      ${L.dots ? `<span class="dots">${'<i></i>'.repeat(v)}</span>` : ''}
      <span class="val">${v}</span>
    </button>`).join('');
  $('#bits').innerHTML = state.on.map((b) => `<span>${b ? 1 : 0}</span>`).join('');
  const total = values.reduce((s, v, i) => s + (state.on[i] ? v : 0), 0);
  $('#sum').textContent = L.sum && !locked ? `Đang sáng: ${total}` : '';
}

$('#bulbs').addEventListener('click', (e) => {
  const b = e.target.closest('.bulb');
  if (!b || state.busy || b.classList.contains('locked')) return;
  const i = Number(b.dataset.i);
  state.on[i] = !state.on[i];
  game.tone(state.on[i] ? 880 : 330, 0.08, { type: 'square', vol: 0.05 });
  renderBulbs(false);
});

$('#checkBtn').addEventListener('click', () => {
  if (state.busy) return;
  const r = round();
  const values = placeValues(state.level.bits);
  const total = values.reduce((s, v, i) => s + (state.on[i] ? v : 0), 0);
  if (total === r.make) return correct(`${toBits(r.make, state.level.bits)} = ${r.make}`);
  wrong(total > r.make ? `Các bóng sáng cộng lại là ${total}, nhiều quá rồi!` : `Các bóng sáng cộng lại là ${total}, còn thiếu ${r.make - total}.`);
});

async function correct(eq) {
  state.busy = true;
  game.sfx.good();
  game.say(`Đúng rồi! ${eq}`, 'cheer', 'good');
  if (state.level.word) $('#secret').textContent = state.word.padEnd(state.level.word.length, '?');
  if (!(await game.wait(1400))) return;
  state.ri++;
  if (state.ri < state.level.rounds.length) return showRound();
  game.rounds(state.ri, state.level.rounds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: state.level.word ? `Mật thư: ${state.level.word} 🐱` : `${state.level.bits} bóng đèn = số từ 0 đến ${2 ** state.level.bits - 1}`,
    text: stars === 3 ? 'Không sai lần nào. Bé giỏi số nhị phân quá!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
