// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Hũ kẹo viết bằng số kẹo mỗi màu: { r: 3, b: 2 } (r đỏ, b xanh, y vàng, g lục). Bé nhắm mắt bốc 1 viên.
// word: sự kiện "bốc được kẹo màu c" là chắc chắn / có thể / không thể.
// pair: hũ A hay hũ B dễ bốc được màu c hơn (hoặc như nhau). ratio: khả năng bốc được màu c là mấy phần?
// fill: bé tự bỏ kẹo vào hũ (ít nhất min viên, nhiều nhất 10) cho đúng yêu cầu want:
//   certain c / impossible c / possible c (có thể nhưng không chắc chắn) / equal [c1, c2] / more [c1, c2].
const NAMES = { r: 'đỏ', b: 'xanh', y: 'vàng', g: 'lục' };
const MAX_JAR = 10;

const LEVELS = [
  { name: 'Chắc chắn, có thể, không thể', rounds: [
    { type: 'word', jar: { r: 5 }, c: 'r' },
    { type: 'word', jar: { r: 3, b: 2 }, c: 'b' },
    { type: 'word', jar: { r: 3, b: 2 }, c: 'y' },
    { type: 'word', jar: { y: 4 }, c: 'r' },
  ], tip: 'Nhắm mắt bốc một viên kẹo. Nếu hũ chỉ toàn kẹo đỏ thì CHẮC CHẮN bốc được kẹo đỏ!' },
  { name: 'Nghĩ thật kỹ', rounds: [
    { type: 'word', jar: { r: 1, b: 7 }, c: 'r' },
    { type: 'word', jar: { g: 6 }, c: 'g' },
    { type: 'word', jar: { r: 2, y: 2, g: 2 }, c: 'b' },
    { type: 'word', jar: { b: 9, y: 1 }, c: 'b' },
    { type: 'word', jar: { r: 4, b: 4 }, c: 'g' },
  ], tip: 'Chỉ có 1 viên đỏ thì vẫn CÓ THỂ bốc được đỏ, dù rất khó!' },
  { name: 'Tự bỏ kẹo', rounds: [
    { type: 'fill', want: { certain: 'y' }, min: 3, palette: ['r', 'b', 'y'] },
    { type: 'fill', want: { impossible: 'r' }, min: 4, palette: ['r', 'b', 'y'] },
    { type: 'fill', want: { possible: 'b' }, min: 4, palette: ['r', 'b', 'y'] },
  ], tip: 'Chạm vào kẹo màu để bỏ vào hũ, chạm kẹo trong hũ để lấy ra.' },
  { name: 'Hũ nào dễ hơn?', rounds: [
    { type: 'pair', a: { r: 3, b: 1 }, b: { r: 1, b: 3 }, c: 'r' },
    { type: 'pair', a: { r: 2, b: 2 }, b: { r: 2, b: 6 }, c: 'r' },
    { type: 'pair', a: { r: 1, b: 1 }, b: { r: 3, b: 3 }, c: 'b' },
  ], tip: 'Không chỉ đếm kẹo đỏ! Hũ nào có ít kẹo màu khác hơn thì dễ bốc được đỏ hơn.' },
  { name: 'Cân bằng khả năng', rounds: [
    { type: 'fill', want: { equal: ['r', 'b'] }, min: 4, palette: ['r', 'b', 'y'] },
    { type: 'fill', want: { more: ['y', 'b'] }, min: 5, palette: ['r', 'b', 'y'] },
    { type: 'fill', want: { more: ['g', 'r'] }, min: 6, palette: ['r', 'g'], also: { possible: 'r' } },
  ], tip: 'Màu nào có nhiều viên hơn thì dễ bốc được hơn. Số viên bằng nhau thì khả năng như nhau.' },
  { name: 'Mấy phần?', rounds: [
    { type: 'ratio', jar: { r: 1, b: 3 }, c: 'r' },
    { type: 'ratio', jar: { r: 2, y: 3 }, c: 'y' },
    { type: 'ratio', jar: { r: 2, b: 2, g: 6 }, c: 'g' },
  ], tip: 'Có 4 viên, trong đó 1 viên đỏ: khả năng bốc được đỏ là 1 phần 4.' },
  { name: 'So sánh phân số', rounds: [
    { type: 'pair', a: { y: 2, r: 3 }, b: { y: 3, r: 7 }, c: 'y' },
    { type: 'ratio', jar: { b: 3, r: 5 }, c: 'b' },
    { type: 'pair', a: { g: 2, b: 4 }, b: { g: 3, b: 6 }, c: 'g' },
  ], tip: 'Đổi khả năng ra phân số rồi so sánh: 2/5 và 3/10, phân số nào lớn hơn?' },
  { name: 'Thử thách', rounds: [
    { type: 'word', jar: { r: 3, b: 3 }, c: 'r' },
    { type: 'fill', want: { equal: ['r', 'y'] }, min: 6, palette: ['r', 'b', 'y'], also: { possible: 'b' } },
    { type: 'ratio', jar: { y: 5, b: 3, r: 2 }, c: 'y' },
    { type: 'pair', a: { r: 4, b: 6 }, b: { r: 2, b: 3 }, c: 'r' },
  ], tip: 'Màn cuối! Dùng hết mọi điều đã học nhé.' },
];

const totalOf = (jar) => Object.values(jar).reduce((s, v) => s + v, 0);
const countOf = (jar, c) => jar[c] || 0;

// word: 0 = chắc chắn, 1 = có thể, 2 = không thể
function wordAnswer(jar, c) {
  const n = countOf(jar, c);
  return n === totalOf(jar) ? 0 : n > 0 ? 1 : 2;
}
// pair: 1 = hũ A, -1 = hũ B, 0 = như nhau (so sánh phân số bằng nhân chéo)
function pairAnswer(r) {
  return Math.sign(countOf(r.a, r.c) * totalOf(r.b) - countOf(r.b, r.c) * totalOf(r.a));
}
function meets(jar, want) {
  const n = totalOf(jar);
  const [k, v] = Object.entries(want)[0];
  if (k === 'certain') return n > 0 && countOf(jar, v) === n;
  if (k === 'impossible') return countOf(jar, v) === 0;
  if (k === 'possible') return countOf(jar, v) > 0 && countOf(jar, v) < n;
  if (k === 'equal') return countOf(jar, v[0]) === countOf(jar, v[1]) && countOf(jar, v[0]) > 0;
  return countOf(jar, v[0]) > countOf(jar, v[1]);
}
const fillOk = (r, jar) => totalOf(jar) >= r.min && totalOf(jar) <= MAX_JAR && meets(jar, r.want) && (!r.also || meets(jar, r.also));

// ratio: 4 đáp án phân số "a/b"
function ratioOptions(r) {
  const n = countOf(r.jar, r.c);
  const t = totalOf(r.jar);
  const opts = [`${n}/${t}`];
  for (const f of [`${n}/${t - n}`, `${t - n}/${t}`, `1/${t}`, `${n}/${t + 1}`, `1/${n}`]) {
    if (opts.length < 4 && !opts.includes(f) && !f.endsWith('/0')) opts.push(f);
  }
  return opts;
}

function wantText(want) {
  const [k, v] = Object.entries(want)[0];
  return {
    certain: `chắc chắn bốc được kẹo ${NAMES[v]}`,
    impossible: `không thể bốc được kẹo ${NAMES[v]}`,
    possible: `có thể bốc được kẹo ${NAMES[v]} (nhưng không chắc chắn)`,
    equal: `khả năng bốc được kẹo ${NAMES[v[0]]} bằng kẹo ${NAMES[v[1]]}`,
    more: `dễ bốc được kẹo ${NAMES[v[0]]} hơn kẹo ${NAMES[v[1]]}`,
  }[k];
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, ri: 0, mistakes: 0, busy: false, jar: {}, tally: {}, drawJar: null };

const game = createGame({
  id: 'hu-keo-may-man',
  title: '🍬 Hũ Kẹo May Mắn',
  sub: 'Chắc chắn, có thể hay không thể? Đoán khả năng bốc kẹo!',
  levels: LEVELS.length,
  winTitle: 'Bé đoán giỏi quá! 🍬',
  start: startLevel,
});

const round = () => state.level.rounds[state.ri];
const candies = (jar) => Object.entries(jar).flatMap(([c, n]) => Array(n).fill(c));
const fracHtml = (f) => {
  const [a, b] = f.split('/');
  return `<span class="frac">${a}<i>${b}</i></span>`;
};

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.ri = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

function jarHtml(jar, { title = '', edit = false, id = '' } = {}) {
  const list = candies(jar);
  return `<div class="jar-wrap">${title ? `<h3>${title}</h3>` : ''}<div class="jar${edit ? ' edit' : ''}" ${id ? `id="${id}"` : ''}>
    ${list.map((c, i) => `<button class="candy k-${c}" data-c="${c}" data-i="${i}"></button>`).join('')}</div></div>`;
}

function showRound() {
  const r = round();
  state.busy = false;
  state.tally = {};
  game.rounds(state.ri, state.level.rounds.length);
  const fill = r.type === 'fill';
  $('#palette').classList.toggle('hidden', !fill);
  $('#fillRow').classList.toggle('hidden', !fill);
  $('#choices').classList.toggle('hidden', fill);

  if (r.type === 'word' || r.type === 'ratio') {
    state.drawJar = r.jar;
    $('#jars').innerHTML = jarHtml(r.jar, { id: 'jar0' });
  } else if (r.type === 'pair') {
    state.drawJar = null;
    $('#jars').innerHTML = jarHtml(r.a, { title: 'Hũ A', id: 'jarA' }) + jarHtml(r.b, { title: 'Hũ B', id: 'jarB' });
  } else {
    state.jar = {};
    state.drawJar = state.jar;
    $('#palette').innerHTML = r.palette.map((c) => `<button class="add" data-c="${c}"><i class="candy k-${c}"></i> + ${NAMES[c]}</button>`).join('');
    renderFill();
  }
  renderTally();

  if (r.type === 'word') {
    $('#question').textContent = `Nhắm mắt bốc 1 viên. Bốc được kẹo ${NAMES[r.c]} là…`;
    const ans = wordAnswer(r.jar, r.c);
    renderChoices($('#choices'), ['✅ Chắc chắn', '🤔 Có thể', '🚫 Không thể'], (i) => {
      const ok = i === ans;
      if (ok) correct(['Hũ toàn kẹo màu đó!', 'Trong hũ có cả kẹo màu khác.', 'Trong hũ không có viên nào màu đó.'][ans]);
      else wrong(`Đếm xem trong hũ có mấy viên ${NAMES[r.c]}, và có kẹo màu khác không nhé.`);
      return ok;
    }, (i) => i === ans);
  } else if (r.type === 'pair') {
    $('#question').textContent = `Bốc ở hũ nào thì dễ được kẹo ${NAMES[r.c]} hơn?`;
    const vals = [1, -1, 0];
    renderChoices($('#choices'), ['Hũ A', 'Hũ B', 'Như nhau'], (i) => {
      const ok = vals[i] === pairAnswer(r);
      const f = (jar) => `${countOf(jar, r.c)}/${totalOf(jar)}`;
      if (ok) correct(`Hũ A: ${f(r.a)}, hũ B: ${f(r.b)}`);
      else wrong('So sánh số kẹo màu đó với TỔNG số kẹo trong mỗi hũ nhé.');
      return ok;
    }, (i) => vals[i] === pairAnswer(r));
  } else if (r.type === 'ratio') {
    $('#question').textContent = `Khả năng bốc được kẹo ${NAMES[r.c]} là mấy phần?`;
    const opts = window.shuffle(ratioOptions(r));
    const ans = `${countOf(r.jar, r.c)}/${totalOf(r.jar)}`;
    renderChoices($('#choices'), opts.map(fracHtml), (i) => {
      const ok = opts[i] === ans;
      if (ok) correct(`${countOf(r.jar, r.c)} viên ${NAMES[r.c]} trên tổng ${totalOf(r.jar)} viên`);
      else wrong('Tử số là số viên màu đó, mẫu số là TỔNG số viên trong hũ.');
      return ok;
    }, (i) => opts[i] === ans);
  } else {
    const extra = r.also ? `, và ${wantText(r.also)}` : '';
    $('#question').textContent = `Bỏ ít nhất ${r.min} viên kẹo vào hũ sao cho ${wantText(r.want)}${extra}`;
  }
}

/* ---------- Tự bỏ kẹo ---------- */
function renderFill() {
  $('#jars').innerHTML = jarHtml(state.jar, { edit: true, id: 'jar0' });
}
$('#palette').addEventListener('click', (e) => {
  const b = e.target.closest('.add');
  if (!b || state.busy) return;
  if (totalOf(state.jar) >= MAX_JAR) return game.say(`Hũ đầy rồi (${MAX_JAR} viên)! Lấy bớt ra nhé.`, 'sad', 'soft');
  const c = b.dataset.c;
  state.jar[c] = (state.jar[c] || 0) + 1;
  game.sfx.pop();
  renderFill();
  state.tally = {};
  renderTally();
});
$('#jars').addEventListener('click', (e) => {
  const c = e.target.closest('.jar.edit .candy');
  if (!c || state.busy) return;
  state.jar[c.dataset.c]--;
  if (!state.jar[c.dataset.c]) delete state.jar[c.dataset.c];
  game.sfx.tap();
  renderFill();
  state.tally = {};
  renderTally();
});
$('#checkBtn').addEventListener('click', () => {
  if (state.busy) return;
  const r = round();
  if (totalOf(state.jar) < r.min) return wrong(`Cần ít nhất ${r.min} viên kẹo trong hũ.`);
  if (fillOk(r, state.jar)) return correct('Hũ kẹo đúng yêu cầu!');
  wrong(`Chưa đúng: hũ này chưa làm ${wantText(meets(state.jar, r.want) ? r.also : r.want)}.`);
});

/* ---------- Bốc thử ---------- */
function renderTally() {
  const entries = Object.entries(state.tally);
  $('#tally').innerHTML = entries.length
    ? entries.map(([c, n]) => `<span><i class="candy k-${c}"></i>× ${n}</span>`).join('')
    : '<span style="opacity:.6">Bốc thử để xem kẹo nào hay ra nhất</span>';
  $('#drawBtn').disabled = !state.drawJar && round().type !== 'pair';
}
$('#drawBtn').addEventListener('click', () => {
  const r = round();
  // Hai hũ: bốc mỗi hũ một viên
  const jars = r.type === 'pair' ? [['jarA', r.a], ['jarB', r.b]] : [['jar0', state.drawJar]];
  for (const [id, jar] of jars) {
    const list = candies(jar);
    if (!list.length) return game.say('Hũ trống không, chưa có gì để bốc!', 'sad', 'soft');
    const i = Math.floor(Math.random() * list.length);
    const key = r.type === 'pair' ? `${id === 'jarA' ? 'A' : 'B'}${list[i]}` : list[i];
    state.tally[key] = (state.tally[key] || 0) + 1;
    const el = document.querySelectorAll(`#${id} .candy`)[i];
    document.querySelectorAll(`#${id} .candy.drawn`).forEach((x) => x.classList.remove('drawn'));
    el?.classList.add('drawn');
  }
  game.tone(600, 0.1, { type: 'triangle', to: 900 });
  if (r.type === 'pair') {
    const sum = (p) => Object.entries(state.tally).filter(([k]) => k.startsWith(p)).reduce((s, [, n]) => s + n, 0);
    const hit = (p) => state.tally[`${p}${r.c}`] || 0;
    $('#tally').innerHTML = `<span>Hũ A: ${hit('A')}/${sum('A')} lần ra ${NAMES[r.c]}</span><span>Hũ B: ${hit('B')}/${sum('B')} lần ra ${NAMES[r.c]}</span>`;
  } else renderTally();
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
  game.win({ stars, eq: state.level.name, text: stars === 3 ? 'Không sai lần nào. Thầy bói kẹo đây rồi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!` });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
