// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Mỗi biến là một hộp có tên. Lệnh "táo = táo + 2" nghĩa là: lấy số trong hộp táo, cộng 2, bỏ lại vào hộp táo.
// predict: đọc chương trình và đoán số trong hộp `ask`. build: ghép thẻ lệnh (dùng lại được) để các hộp có số như `target`.
// Dòng "lặp N lần:" lặp lại các dòng thụt vào 2 dấu cách bên dưới.
const ICONS = { táo: '🍎', lê: '🍐', xu: '🪙', điểm: '⭐', bước: '👣', đếm: '🔢', tổng: '➕', số: '#️⃣', A: '📦', B: '📦', C: '📦' };

const LEVELS = [
  { name: 'Hộp có tên', rounds: [
    { type: 'predict', code: ['táo = 4'], ask: 'táo' },
    { type: 'predict', code: ['táo = 3', 'táo = 5'], ask: 'táo' },
    { type: 'predict', code: ['táo = 2', 'táo = táo + 1'], ask: 'táo' },
  ], tip: 'Biến giống một cái hộp có dán tên. "táo = 4" là bỏ số 4 vào hộp táo.' },
  { name: 'Cộng dồn', rounds: [
    { type: 'predict', code: ['xu = 0', 'xu = xu + 5', 'xu = xu + 5'], ask: 'xu' },
    { type: 'predict', code: ['điểm = 10', 'điểm = điểm − 3', 'điểm = điểm + 1'], ask: 'điểm' },
    { type: 'build', start: { xu: 0 }, target: { xu: 7 }, cards: ['xu = xu + 5', 'xu = xu + 2', 'xu = xu + 1'], max: 2 },
  ], tip: '"xu = xu + 5": lấy số xu đang có, thêm 5, rồi cất lại vào hộp xu.' },
  { name: 'Hai cái hộp', rounds: [
    { type: 'predict', code: ['táo = 4', 'lê = táo'], ask: 'lê' },
    { type: 'predict', code: ['táo = 3', 'lê = táo + 2', 'táo = 1'], ask: 'lê' },
    { type: 'predict', code: ['táo = 2', 'lê = 6', 'táo = táo + lê'], ask: 'táo' },
  ], tip: '"lê = táo" là chép số trong hộp táo sang hộp lê. Sau đó hai hộp không dính gì nhau nữa.' },
  { name: 'Nhân đôi', rounds: [
    { type: 'predict', code: ['xu = 3', 'xu = xu × 2', 'xu = xu + 4'], ask: 'xu' },
    { type: 'build', start: { xu: 1 }, target: { xu: 8 }, cards: ['xu = xu + 1', 'xu = xu × 2'], max: 3 },
    { type: 'build', start: { xu: 0 }, target: { xu: 10 }, cards: ['xu = xu + 1', 'xu = xu × 2', 'xu = xu + 5'], max: 2 },
  ], tip: 'Chỉ được dùng ít lệnh thôi! Nhân đôi giúp số lớn lên rất nhanh.' },
  { name: 'Biến và vòng lặp', rounds: [
    { type: 'predict', code: ['điểm = 0', 'lặp 4 lần:', '  điểm = điểm + 5'], ask: 'điểm' },
    { type: 'predict', code: ['bước = 1', 'lặp 3 lần:', '  bước = bước × 2'], ask: 'bước' },
    { type: 'predict', code: ['táo = 10', 'lặp 3 lần:', '  táo = táo − 2'], ask: 'táo' },
  ], tip: 'Mỗi vòng lặp, rô-bốt chạy lại các dòng thụt vào bên trong. Đếm từng vòng nhé!' },
  { name: 'Biến đếm', rounds: [
    { type: 'predict', code: ['đếm = 0', 'lặp 3 lần:', '  đếm = đếm + 1', '  đếm = đếm + 1'], ask: 'đếm' },
    { type: 'predict', code: ['A = 1', 'B = 0', 'lặp 3 lần:', '  B = B + A', '  A = A + 1'], ask: 'B' },
    { type: 'predict', code: ['A = 1', 'B = 0', 'lặp 3 lần:', '  B = B + A', '  A = A + 1'], ask: 'A' },
  ], tip: 'Có thể viết số trong từng hộp ra giấy sau mỗi vòng lặp.' },
  { name: 'Đổi chỗ', rounds: [
    { type: 'predict', code: ['A = 3', 'B = 7', 'A = B', 'B = A'], ask: 'B' },
    { type: 'build', start: { A: 3, B: 7, C: 0 }, target: { A: 7, B: 3 }, cards: ['A = B', 'B = A', 'C = A', 'A = C', 'B = C'], max: 3 },
  ], tip: 'Đổi số của hai hộp A và B cho nhau. Coi chừng: ghi đè là mất số cũ!' },
  { name: 'Thử thách', rounds: [
    { type: 'predict', code: ['táo = 5', 'lê = táo × 2', 'táo = lê − táo'], ask: 'táo' },
    { type: 'predict', code: ['tổng = 0', 'số = 1', 'lặp 4 lần:', '  tổng = tổng + số', '  số = số + 2'], ask: 'tổng' },
    { type: 'build', start: { xu: 0 }, target: { xu: 20 }, cards: ['xu = xu + 3', 'xu = xu × 2', 'xu = xu + 1'], max: 5 },
  ], tip: 'Màn cuối! Đọc thật chậm từng dòng.' },
];

// Đọc chương trình thành cây lệnh: { line, set, expr } hoặc { line, loop, body }
function parse(code) {
  const root = [];
  let loop = null;
  code.forEach((text, line) => {
    const inner = text.startsWith('  ');
    const t = text.trim();
    const m = /^lặp (\d+) lần:$/.exec(t);
    if (m) {
      loop = { line, loop: Number(m[1]), body: [] };
      root.push(loop);
      return;
    }
    const a = /^(\S+) = (\S+)(?: ([+−×]) (\S+))?$/.exec(t);
    if (!a) throw new Error(`Lệnh sai: ${text}`);
    const node = { line, set: a[1], expr: a.slice(2) };
    if (inner && loop) loop.body.push(node);
    else { loop = null; root.push(node); }
  });
  return root;
}

function value(token, vars) {
  if (/^\d+$/.test(token)) return Number(token);
  if (!(token in vars)) throw new Error(`Hộp ${token} chưa có số`);
  return vars[token];
}

// Chạy chương trình; trả về các bước (dòng đang chạy + các hộp sau dòng đó)
function run(code, start = {}) {
  const vars = { ...start };
  const steps = [];
  const exec = (nodes) => {
    for (const n of nodes) {
      if (n.loop) {
        for (let i = 0; i < n.loop; i++) {
          steps.push({ line: n.line, vars: { ...vars }, loopTurn: i + 1 });
          exec(n.body);
        }
        continue;
      }
      const [x, op, y] = n.expr;
      let v = value(x, vars);
      if (op === '+') v += value(y, vars);
      if (op === '−') v -= value(y, vars);
      if (op === '×') v *= value(y, vars);
      vars[n.set] = v;
      steps.push({ line: n.line, vars: { ...vars }, changed: n.set });
    }
  };
  exec(parse(code));
  return { vars, steps };
}

const answerOf = (round) => run(round.code).vars[round.ask];

// 4 đáp án: số đúng, số trong hộp ở các bước giữa, lệch 1…
function predictOptions(round) {
  const { vars, steps } = run(round.code);
  const ans = vars[round.ask];
  const seen = steps.filter((s) => round.ask in s.vars).map((s) => s.vars[round.ask]);
  const others = Object.values(vars);
  const literals = round.code.flatMap((l) => (l.match(/\b\d+\b/g) || []).map(Number));
  const opts = [ans];
  for (const v of [...seen.reverse(), ...literals, ...others, ans + 1, ans - 1, ans + 2, ans * 2, ans + 5]) {
    if (opts.length < 4 && v >= 0 && !opts.includes(v)) opts.push(v);
  }
  return opts;
}

const reached = (vars, target) => Object.entries(target).every(([k, v]) => vars[k] === v);
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, round: 0, mistakes: 0, program: [], busy: false };

const game = createGame({
  id: 'robot-nha-kho',
  title: '📦 Rô-bốt Nhà Kho',
  sub: 'Giúp rô-bốt cất số vào các hộp có tên: đó là biến!',
  levels: LEVELS.length,
  winTitle: 'Nhà kho gọn gàng rồi! 📦',
  start: startLevel,
});

const round = () => state.level.rounds[state.round];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pretty = (line) => esc(line)
  .replace(/^(\s*)(lặp) (\d+) (lần:)/, '$1<span class="kw">$2</span> <span class="num">$3</span> <span class="kw">$4</span>')
  .replace(/(= |[+−×] )(\d+)/g, '$1<span class="num">$2</span>');

/* ---------- Vẽ ---------- */
function renderBoxes(vars, { names, ask, target, changed } = {}) {
  const list = names || Object.keys(vars);
  $('#boxes').innerHTML = list.map((n) => {
    const has = n in vars;
    const val = has ? vars[n] : '?';
    const goal = target && n in target ? `<small>cần: ${target[n]}</small>` : '';
    return `<div class="box${n === ask || (target && n in target) ? ' goal' : ''}${n === changed ? ' changed' : ''}">
      <span class="tag">${ICONS[n] || '📦'} ${n}</span><span class="val${has ? '' : ' secret'}">${val}</span>${goal}</div>`;
  }).join('');
}

function renderCode(lines, { now = -1, removable = false } = {}) {
  if (!lines.length) {
    $('#code').innerHTML = '<li class="empty">Chưa có lệnh nào. Chạm thẻ lệnh bên dưới để thêm.</li>';
    return;
  }
  $('#code').innerHTML = lines.map((l, i) =>
    `<li data-i="${i}" class="${i === now ? 'now' : ''}${l.trim().startsWith('lặp') ? ' loop' : ''}${removable ? ' removable' : ''}">${pretty(l)}</li>`).join('');
}

const namesIn = (code) => [...new Set(code.map((l) => /^\s*(\S+) =/.exec(l)?.[1]).filter(Boolean))];

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = LEVELS[idx];
  state.round = 0;
  state.mistakes = 0;
  game.say(state.level.tip);
  showRound();
}

function showRound() {
  const r = round();
  state.busy = false;
  $('#stage').classList.remove('running');
  game.rounds(state.round, state.level.rounds.length);
  const build = r.type === 'build';
  $('#buildArea').classList.toggle('hidden', !build);
  $('#choices').classList.toggle('hidden', build);

  if (build) {
    state.program = [];
    const want = Object.entries(r.target).map(([k, v]) => `${k} = ${v}`).join(', ');
    $('#question').textContent = `Ghép tối đa ${r.max} lệnh để có ${want}`;
    $('#codeLabel').textContent = `📜 Chương trình (${state.program.length}/${r.max} lệnh)`;
    renderBoxes(r.start, { target: r.target });
    renderCode([], { removable: true });
    $('#cards').innerHTML = r.cards.map((c, i) => `<button class="cmd" data-i="${i}">${esc(c)}</button>`).join('');
    return;
  }

  $('#question').textContent = `Chạy xong chương trình, hộp ${ICONS[r.ask] || '📦'} ${r.ask} có số mấy?`;
  $('#codeLabel').textContent = '📜 Chương trình của rô-bốt';
  renderBoxes({}, { names: namesIn(r.code), ask: r.ask });
  renderCode(r.code);
  const opts = window.shuffle(predictOptions(r));
  renderChoices($('#choices'), opts.map(String), (i) => {
    const ok = opts[i] === answerOf(r);
    if (ok) playAndNext();
    else {
      state.mistakes++;
      game.sfx.bad();
      game.say('Chưa đúng. Bé đọc lại từng dòng, nhớ số trong mỗi hộp sau mỗi dòng nhé.', 'sad', 'soft');
    }
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

// Cho rô-bốt chạy từng dòng để bé thấy số trong hộp thay đổi thế nào
async function animateRun(code, start, opts) {
  const { steps } = run(code, start);
  const names = [...new Set([...Object.keys(start), ...namesIn(code)])];
  renderBoxes(start, { names, ...opts });
  for (const s of steps) {
    renderCode(code, { now: s.line });
    renderBoxes(s.vars, { names, ...opts, changed: s.changed });
    $('#robot').classList.remove('work');
    void $('#robot').offsetWidth;
    $('#robot').classList.add('work');
    game.tone(s.loopTurn ? 300 : 440, 0.1, { type: 'triangle', vol: 0.1 });
    if (!(await game.wait(steps.length > 10 ? 450 : 700))) return null;
  }
  renderCode(code, { removable: round().type === 'build' });
  return steps.at(-1)?.vars || start;
}

async function playAndNext() {
  state.busy = true;
  const r = round();
  game.sfx.good();
  game.say(`Đúng rồi! Xem rô-bốt chạy nhé 🤖`, 'cheer', 'good');
  const end = await animateRun(r.code, {}, { ask: r.ask });
  if (!end) return;
  game.say(`Hộp ${r.ask} có ${end[r.ask]}. Giỏi quá!`, 'cheer', 'good');
  if (!(await game.wait(1100))) return;
  nextRound();
}

function nextRound() {
  state.round++;
  if (state.round < state.level.rounds.length) return showRound();
  game.rounds(state.round, state.level.rounds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: state.level.name,
    text: stars === 3 ? 'Không sai lần nào. Bé hiểu biến rồi đó!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

/* ---------- Ghép lệnh ---------- */
$('#cards').addEventListener('click', (e) => {
  const b = e.target.closest('.cmd');
  const r = round();
  if (!b || state.busy || r.type !== 'build') return;
  if (state.program.length >= r.max) return game.say(`Chỉ được ${r.max} lệnh thôi! Chạm vào một dòng để gỡ bớt.`, 'sad', 'soft');
  state.program.push(r.cards[Number(b.dataset.i)]);
  game.sfx.pop();
  $('#codeLabel').textContent = `📜 Chương trình (${state.program.length}/${r.max} lệnh)`;
  renderCode(state.program, { removable: true });
});
$('#code').addEventListener('click', (e) => {
  const li = e.target.closest('li.removable');
  if (!li || state.busy) return;
  state.program.splice(Number(li.dataset.i), 1);
  game.sfx.tap();
  $('#codeLabel').textContent = `📜 Chương trình (${state.program.length}/${round().max} lệnh)`;
  renderCode(state.program, { removable: true });
});
$('#clearBtn').addEventListener('click', () => {
  if (state.busy) return;
  state.program = [];
  renderCode([], { removable: true });
  renderBoxes(round().start, { target: round().target });
});
$('#runBtn').addEventListener('click', async () => {
  const r = round();
  if (state.busy || r.type !== 'build') return;
  if (!state.program.length) return game.say('Chưa có lệnh nào! Chạm thẻ lệnh để thêm nhé.', 'sad', 'soft');
  state.busy = true;
  $('#stage').classList.add('running');
  const end = await animateRun(state.program, r.start, { target: r.target });
  if (!end) return;
  $('#stage').classList.remove('running');
  if (reached(end, r.target)) {
    game.sfx.good();
    game.say('Đúng hết rồi! Rô-bốt cảm ơn bé 🎉', 'cheer', 'good');
    if (!(await game.wait(1200))) return;
    return nextRound();
  }
  state.busy = false;
  state.mistakes++;
  game.sfx.bad();
  const diff = Object.entries(r.target).filter(([k, v]) => end[k] !== v).map(([k, v]) => `hộp ${k} có ${end[k]}, cần ${v}`);
  game.say(`Chưa được: ${diff.join('; ')}. Sửa lại chương trình nhé!`, 'sad', 'soft');
});
