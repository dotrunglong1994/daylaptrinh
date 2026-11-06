// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// chart: 'tranh' (biểu đồ tranh) hoặc 'cot' (biểu đồ cột). scale: mỗi hình / mỗi ô ứng với mấy con.
// read: true = biểu đồ vẽ sẵn (số con quá nhiều để đếm), bé chỉ đọc và trả lời.
// Câu hỏi: most, least, count (a), diff (a nhiều hơn b bao nhiêu), total, avg (trung bình mỗi loại).
const ANIMALS = {
  cow: ['🐄', 'Bò'], chicken: ['🐔', 'Gà'], pig: ['🐖', 'Lợn'], duck: ['🦆', 'Vịt'],
  rabbit: ['🐇', 'Thỏ'], sheep: ['🐑', 'Cừu'], horse: ['🐎', 'Ngựa'],
};

const LEVELS = [
  { name: 'Biểu đồ tranh', chart: 'tranh', scale: 1, counts: { cow: 3, chicken: 5, pig: 2 },
    questions: [{ q: 'most' }, { q: 'count', a: 'chicken' }, { q: 'diff', a: 'chicken', b: 'pig' }],
    tip: 'Đếm từng loại con vật (chạm vào con đã đếm), rồi bấm ➕ để vẽ biểu đồ tranh.' },
  { name: 'Bốn loại con vật', chart: 'tranh', scale: 1, counts: { duck: 4, rabbit: 6, sheep: 3, cow: 5 },
    questions: [{ q: 'least' }, { q: 'total' }, { q: 'diff', a: 'rabbit', b: 'duck' }],
    tip: 'Bốn loại con vật! Đếm cẩn thận để không bỏ sót con nào.' },
  { name: 'Biểu đồ cột', chart: 'cot', scale: 1, counts: { chicken: 7, duck: 4, pig: 5 },
    questions: [{ q: 'most' }, { q: 'diff', a: 'chicken', b: 'duck' }, { q: 'total' }],
    tip: 'Biểu đồ cột: cột càng cao thì càng nhiều con. Bấm ➕ để nâng cột lên.' },
  { name: 'Mỗi hình 2 con', chart: 'tranh', scale: 2, counts: { chicken: 8, duck: 6, rabbit: 4 },
    questions: [{ q: 'count', a: 'duck' }, { q: 'diff', a: 'chicken', b: 'rabbit' }, { q: 'total' }],
    tip: 'Mỗi hình bây giờ ứng với 2 con! 8 con gà thì vẽ 4 hình.' },
  { name: 'Mỗi ô cột 2 con', chart: 'cot', scale: 2, counts: { cow: 6, sheep: 10, pig: 4, horse: 8 },
    questions: [{ q: 'most' }, { q: 'least' }, { q: 'diff', a: 'sheep', b: 'pig' }, { q: 'total' }],
    tip: 'Mỗi lần bấm ➕, cột cao thêm 2 con. Nhìn số bên trái để biết cột cao bao nhiêu.' },
  { name: 'Đọc biểu đồ', chart: 'cot', scale: 5, read: true, counts: { chicken: 35, duck: 20, rabbit: 15, cow: 10 },
    questions: [{ q: 'most' }, { q: 'count', a: 'rabbit' }, { q: 'diff', a: 'chicken', b: 'duck' }, { q: 'total' }],
    tip: 'Trang trại lớn quá, không đếm nổi! Bác nông dân đã vẽ biểu đồ, bé đọc và trả lời nhé.' },
  { name: 'Trung bình cộng', chart: 'cot', scale: 10, read: true, counts: { pig: 40, cow: 30, chicken: 50, duck: 20 },
    questions: [{ q: 'least' }, { q: 'diff', a: 'chicken', b: 'cow' }, { q: 'total' }, { q: 'avg' }],
    tip: 'Trung bình = tổng số con chia cho số loại con vật.' },
  { name: 'Tự vẽ, tính trung bình', chart: 'cot', scale: 1, counts: { pig: 6, cow: 4, sheep: 8 },
    questions: [{ q: 'least' }, { q: 'total' }, { q: 'avg' }, { q: 'diff', a: 'sheep', b: 'cow' }],
    tip: 'Màn cuối: tự đếm, tự vẽ biểu đồ cột, rồi tính trung bình!' },
];

const nameOf = (k) => ANIMALS[k][1].toLowerCase();
const total = (counts) => Object.values(counts).reduce((s, v) => s + v, 0);

function questionText(level, q) {
  const kinds = Object.keys(level.counts);
  return {
    most: 'Con vật nào nhiều nhất?',
    least: 'Con vật nào ít nhất?',
    count: `Có bao nhiêu con ${q.a && nameOf(q.a)}?`,
    diff: `Số ${q.a && nameOf(q.a)} nhiều hơn số ${q.b && nameOf(q.b)} bao nhiêu con?`,
    total: 'Tất cả có bao nhiêu con vật?',
    avg: `Trung bình mỗi loại (${kinds.length} loại) có bao nhiêu con?`,
  }[q.q];
}

function answerOf(level, q) {
  const c = level.counts;
  const keys = Object.keys(c);
  if (q.q === 'most') return keys.reduce((a, b) => (c[b] > c[a] ? b : a));
  if (q.q === 'least') return keys.reduce((a, b) => (c[b] < c[a] ? b : a));
  if (q.q === 'count') return c[q.a];
  if (q.q === 'diff') return c[q.a] - c[q.b];
  if (q.q === 'total') return total(c);
  return total(c) / keys.length;
}

// Đáp án: tên con vật (most/least) hoặc 4 con số gần nhau
function questionOptions(level, q) {
  const ans = answerOf(level, q);
  if (q.q === 'most' || q.q === 'least') return Object.keys(level.counts);
  const s = level.scale;
  const c = level.counts;
  // Nhầm hay gặp: đếm số hình mà quên nhân (count), cộng thay vì trừ (diff)
  const slip = q.q === 'count' && s > 1 ? ans / s : q.q === 'diff' ? c[q.a] + c[q.b] : null;
  const near = [slip, ans + s, ans - s, ans + 2 * s, ans - 2 * s, ans + 1, ans - 1, ans + 3 * s];
  const opts = [ans];
  for (const v of near) if (opts.length < 4 && v !== null && v > 0 && Number.isInteger(v) && !opts.includes(v)) opts.push(v);
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, built: {}, qi: -1, mistakes: 0, busy: false };

const game = createGame({
  id: 'nong-trai-bieu-do',
  title: '🐄 Nông Trại Biểu Đồ',
  sub: 'Đếm con vật, vẽ biểu đồ và trả lời câu hỏi!',
  levels: LEVELS.length,
  winTitle: 'Bác nông dân cảm ơn bé! 🌾',
  start: startLevel,
});

function startLevel(idx) {
  const L = LEVELS[idx];
  state.level = L;
  state.mistakes = 0;
  state.qi = -1;
  state.busy = false;
  state.built = Object.fromEntries(Object.keys(L.counts).map((k) => [k, L.read ? L.counts[k] : 0]));
  $('#field').classList.toggle('hidden', !!L.read);
  $('#chartTitle').textContent = `${L.chart === 'tranh' ? '🖼️ Biểu đồ tranh' : '📊 Biểu đồ cột'}: số con vật ở nông trại`;
  $('.chart-card').classList.toggle('ok', !!L.read);
  if (!L.read) scatter();
  renderChart();
  game.say(L.tip);
  if (L.read) nextQuestion();
  else {
    $('#question').textContent = 'Đếm con vật trên cánh đồng rồi vẽ biểu đồ';
    $('#chartControls').classList.remove('hidden');
    $('#choices').classList.add('hidden');
    game.rounds(0, L.questions.length + 1);
  }
}

// Rải con vật lên cánh đồng, mỗi con một ô lưới để không chồng lên nhau
function scatter() {
  const items = window.shuffle(Object.entries(state.level.counts).flatMap(([k, n]) => Array(n).fill(k)));
  const cols = 8;
  const rows = Math.ceil(30 / cols);
  const cells = window.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, items.length);
  $('#field').innerHTML = items.map((k, i) => {
    const c = cells[i];
    const x = ((c % cols) + 0.5 + (Math.random() - 0.5) * 0.5) / cols * 100;
    const y = (Math.floor(c / cols) + 0.5 + (Math.random() - 0.5) * 0.4) / rows * 100;
    return `<button class="ani" style="left:${x}%;top:${y}%">${ANIMALS[k][0]}</button>`;
  }).join('');
}
$('#field').addEventListener('click', (e) => {
  const a = e.target.closest('.ani');
  if (!a) return;
  a.classList.toggle('counted');
  game.sfx.tap();
});

/* ---------- Biểu đồ ---------- */
function renderChart() {
  const L = state.level;
  const keys = Object.keys(L.counts);
  const editable = !L.read && state.qi < 0;
  const pm = (k) => (editable ? `<span class="pm"><button data-k="${k}" data-d="-1">−</button><button data-k="${k}" data-d="1">+</button></span>` : '');
  if (L.chart === 'tranh') {
    $('#chart').innerHTML = `<div class="pic-rows">${keys.map((k) =>
      `<div class="pic-row"><span class="name">${ANIMALS[k][1]}</span><span class="icons">${ANIMALS[k][0].repeat(state.built[k] / L.scale)}</span>${pm(k)}</div>`).join('')}</div>
      <div class="legend">Mỗi ${ANIMALS[keys[0]][0]} = ${L.scale} con</div>`;
    return;
  }
  const maxVal = Math.max(...Object.values(L.counts)) + L.scale * 2;
  const rows = Math.ceil(maxVal / L.scale);
  const top = rows * L.scale;
  const h = Math.max(180, Math.min(260, rows * 22));
  const labels = Array.from({ length: rows + 1 }, (_, i) => `<span class="yl" style="bottom:${(i / rows) * 100}%">${i * L.scale}</span>`).join('');
  $('#chart').innerHTML = `<div class="plot">
    <div class="plot-area" style="--h:${h}px;--rows:${rows}">${labels}${keys.map((k, i) =>
      `<div class="bar c${i}" style="height:${(state.built[k] / top) * 100}%"></div>`).join('')}</div>
    <div class="x-axis">${keys.map((k) => `<div><span class="em">${ANIMALS[k][0]}</span><small>${ANIMALS[k][1]}</small>${pm(k)}</div>`).join('')}</div>
  </div>`;
}

$('#chart').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b || state.qi >= 0) return;
  const k = b.dataset.k;
  const s = state.level.scale;
  state.built[k] = Math.max(0, Math.min(30, state.built[k] + Number(b.dataset.d) * s));
  game.sfx.pop();
  renderChart();
});

$('#checkBtn').addEventListener('click', async () => {
  if (state.busy || state.qi >= 0) return;
  const L = state.level;
  const wrongKey = Object.keys(L.counts).find((k) => state.built[k] !== L.counts[k]);
  if (wrongKey) {
    state.mistakes++;
    game.sfx.bad();
    const got = state.built[wrongKey];
    return game.say(`Hàng ${nameOf(wrongKey)} chưa đúng: biểu đồ đang ghi ${got} con. Đếm lại ${nameOf(wrongKey)} nhé!`, 'sad', 'soft');
  }
  state.busy = true;
  game.sfx.good();
  $('.chart-card').classList.add('ok');
  game.say('Biểu đồ đúng rồi! Giờ trả lời câu hỏi nhé.', 'cheer', 'good');
  if (!(await game.wait(1200))) return;
  nextQuestion();
});

/* ---------- Câu hỏi ---------- */
function nextQuestion() {
  const L = state.level;
  state.qi++;
  state.busy = false;
  const offset = L.read ? 0 : 1;
  game.rounds(state.qi + offset, L.questions.length + offset);
  if (state.qi >= L.questions.length) {
    const stars = game.starsFor(state.mistakes);
    return game.win({
      stars,
      eq: L.chart === 'tranh' ? 'Biểu đồ tranh' : 'Biểu đồ cột',
      text: stars === 3 ? 'Không sai lần nào. Bé đọc biểu đồ giỏi quá!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
    });
  }
  $('#chartControls').classList.add('hidden');
  $('#choices').classList.remove('hidden');
  renderChart();
  const q = L.questions[state.qi];
  $('#question').textContent = questionText(L, q);
  const opts = q.q === 'most' || q.q === 'least' ? questionOptions(L, q) : window.shuffle(questionOptions(L, q));
  const labels = opts.map((o) => (typeof o === 'string' ? `${ANIMALS[o][0]} ${ANIMALS[o][1]}` : `${o} con`));
  const ans = answerOf(L, q);
  renderChoices($('#choices'), labels, (i) => {
    const ok = opts[i] === ans;
    if (ok) {
      game.sfx.good();
      game.say('Đúng rồi! 🎉', 'cheer', 'good');
      state.busy = true;
      game.wait(1100).then((alive) => alive && nextQuestion());
    } else {
      state.mistakes++;
      game.sfx.bad();
      const hint = { most: 'Tìm hàng dài nhất / cột cao nhất.', least: 'Tìm hàng ngắn nhất / cột thấp nhất.', count: L.scale > 1 ? `Nhớ mỗi hình / mỗi ô là ${L.scale} con.` : 'Đếm lại số hình nhé.',
        diff: 'Lấy số lớn trừ số bé.', total: 'Cộng số con của tất cả các loại.', avg: 'Cộng tất cả lại rồi chia cho số loại.' }[q.q];
      game.say(`Chưa đúng. ${hint}`, 'sad', 'soft');
    }
    return ok;
  }, (i) => opts[i] === ans);
}
