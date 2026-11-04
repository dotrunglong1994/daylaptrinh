// LEVELS-START (scripts/checks/cong-logic.mjs đọc đoạn này để kiểm tra từng màn)
// Cổng thần kỳ chỉ mở cho bạn nào thỏa luật. Luật ghép từ "có mũ", "có ô"… bằng VÀ, HOẶC, KHÔNG.
// Loại câu: pass = bạn này qua được không; select = chạm chọn mọi bạn qua được; truth = biểu thức Đúng hay Sai;
// rule = nhìn ai qua / không qua, tìm đúng luật của cổng.
const ROUNDS = 4;
const ATTRS = {
  hat: { emoji: '🎩', name: 'mũ' },
  umb: { emoji: '☂️', name: 'ô' },
  bag: { emoji: '🎒', name: 'ba lô' },
  glass: { emoji: '👓', name: 'kính' },
};
const ATTR_KEYS = Object.keys(ATTRS);
const ANIMALS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐯', '🐸', '🐵'];
const FACTS = ['Trời đang mưa', 'Bé mang ô', 'Hôm nay là Chủ Nhật', 'Bé đã làm xong bài tập', 'Bé đói bụng'];
const PASS = ['✅ Được qua', '⛔ Không qua'];
const TF = ['Đúng', 'Sai'];

const LEVELS = [
  { name: 'Cổng VÀ', kinds: ['pass'], forms: ['and'], tip: 'Luật VÀ: phải có ĐỦ cả hai thứ mới được qua.' },
  { name: 'Cổng HOẶC', kinds: ['pass'], forms: ['or'], tip: 'Luật HOẶC: chỉ cần có MỘT trong hai thứ là được qua.' },
  { name: 'Cổng KHÔNG', kinds: ['pass'], forms: ['not'], tip: 'KHÔNG đảo ngược: "KHÔNG có mũ" nghĩa là bạn nào không đội mũ mới đúng.' },
  { name: 'Chọn bạn qua cổng', kinds: ['select'], forms: ['and', 'or'], tip: 'Chạm vào mọi bạn được qua cổng, rồi bấm Kiểm tra.' },
  { name: 'Đúng hay Sai', kinds: ['truth'], tip: 'VÀ đúng khi cả hai đều đúng. HOẶC đúng khi ít nhất một cái đúng. KHÔNG đổi Đúng thành Sai.' },
  { name: 'Tìm luật cổng', kinds: ['rule'], forms: ['and', 'or', 'not'], tip: 'Xem bạn nào qua, bạn nào không. Luật đúng phải khớp với TẤT CẢ các bạn.' },
  { name: 'Thử thách', kinds: ['pass', 'select', 'truth', 'rule'], forms: ['and', 'or', 'not', 'mix'], tip: 'Màn cuối có đủ mọi loại câu. Cố lên!' },
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

// Luật: { op: 'has', a } | { op: 'not', c } | { op: 'and' | 'or', l, r }
const has = (a) => ({ op: 'has', a });
function evalRule(c, attrs) {
  if (c.op === 'has') return attrs.includes(c.a);
  if (c.op === 'not') return !evalRule(c.c, attrs);
  if (c.op === 'and') return evalRule(c.l, attrs) && evalRule(c.r, attrs);
  return evalRule(c.l, attrs) || evalRule(c.r, attrs);
}
function ruleText(c) {
  if (c.op === 'has') return `có ${ATTRS[c.a].name} ${ATTRS[c.a].emoji}`;
  if (c.op === 'not') return `KHÔNG ${ruleText(c.c)}`;
  return `${ruleText(c.l)} ${c.op === 'and' ? 'VÀ' : 'HOẶC'} ${ruleText(c.r)}`;
}

function makeRule(rand, form) {
  const [a, b] = shuffled(ATTR_KEYS, rand);
  if (form === 'mix') form = pick(rand, ['and', 'or', 'not', 'and-not', 'or-not']);
  if (form === 'and') return { op: 'and', l: has(a), r: has(b) };
  if (form === 'or') return { op: 'or', l: has(a), r: has(b) };
  if (form === 'not') form = pick(rand, ['not1', 'and-not']);
  if (form === 'not1') return { op: 'not', c: has(a) };
  if (form === 'and-not') return { op: 'and', l: has(a), r: { op: 'not', c: has(b) } };
  return { op: 'or', l: has(a), r: { op: 'not', c: has(b) } };
}

const randomAttrs = (rand) => ATTR_KEYS.filter(() => rand() < 0.5);
// Một bạn có (pass = true) hoặc không thỏa luật
function friendFor(rand, rule, pass) {
  for (;;) {
    const attrs = randomAttrs(rand);
    if (evalRule(rule, attrs) === pass) return attrs;
  }
}

// Mọi luật đơn giản để làm đáp án nhiễu khi tìm luật
const ALL_RULES = ATTR_KEYS.flatMap((a) => [
  { op: 'not', c: has(a) },
  ...ATTR_KEYS.filter((b) => b !== a).flatMap((b) => [
    { op: 'and', l: has(a), r: has(b) },
    { op: 'or', l: has(a), r: has(b) },
    { op: 'and', l: has(a), r: { op: 'not', c: has(b) } },
  ]),
]);

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds[k % L.kinds.length];
  if (kind === 'truth') {
    const [a, b] = shuffled(FACTS, rand);
    const va = rand() < 0.5, vb = rand() < 0.5;
    const form = pick(rand, ['and', 'or', 'not', 'and-not', 'not-or']);
    const expr = {
      and: [`(${a}) VÀ (${b})`, va && vb],
      or: [`(${a}) HOẶC (${b})`, va || vb],
      not: [`KHÔNG (${a})`, !va],
      'and-not': [`(${a}) VÀ KHÔNG (${b})`, va && !vb],
      'not-or': [`KHÔNG (${a}) HOẶC (${b})`, !va || vb],
    }[form];
    const facts = form === 'not' ? [[a, va]] : [[a, va], [b, vb]];
    return { kind, form, facts, expr: expr[0], ans: expr[1] ? 0 : 1, options: TF };
  }
  const rule = makeRule(rand, pick(rand, L.forms));
  if (kind === 'pass') {
    const pass = rand() < 0.5;
    return { kind, rule, friends: [{ animal: pick(rand, ANIMALS), attrs: friendFor(rand, rule, pass) }], ans: pass ? 0 : 1, options: PASS };
  }
  // select / rule: 4 bạn, có bạn qua và có bạn không qua
  const passCount = ri(rand, 1, 3);
  const animals = shuffled(ANIMALS, rand).slice(0, 4);
  const friends = shuffled([true, true, true, false, false, false].slice(3 - passCount, 7 - passCount), rand)
    .map((p, i) => ({ animal: animals[i], attrs: friendFor(rand, rule, p) }));
  const marks = friends.map((f) => evalRule(rule, f.attrs));
  if (kind === 'select') return { kind, rule, friends, ans: marks.map((m, i) => (m ? i : -1)).filter((i) => i >= 0).join(',') };
  const text = ruleText(rule);
  const wrong = shuffled(ALL_RULES, rand).filter((c) => friends.some((f, i) => evalRule(c, f.attrs) !== marks[i]) && ruleText(c) !== text);
  const options = [text, ruleText(wrong[0]), ruleText(wrong.find((c) => ruleText(c) !== ruleText(wrong[0])))];
  return { kind, rule, friends, marks, ans: text, options };
}

const answerOf = (r) => r.ans;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false, picked: new Set() };

const game = createGame({
  id: 'cong-logic',
  title: '🚪 Cổng Logic',
  sub: 'Cổng thần kỳ chỉ mở khi đúng luật VÀ, HOẶC, KHÔNG. Ai được qua nào?',
  levels: LEVELS.length,
  winTitle: 'Bé mở cổng logic giỏi quá! 🚪',
  start: startLevel,
});

/* ---------- Vẽ ---------- */
function friendHtml(f, i, { tap = false, mark = null } = {}) {
  const tag = tap ? 'button' : 'div';
  const icons = ATTR_KEYS.map((a) => `<span class="${f.attrs.includes(a) ? '' : 'missing'}">${ATTRS[a].emoji}</span>`).join('');
  const markHtml = mark === null ? '' : `<span class="mark">${mark ? '✅' : '⛔'}</span>`;
  return `<${tag} class="friend" data-i="${i}">${markHtml}<span class="animal">${f.animal}</span><span class="attrs">${icons}</span></${tag}>`;
}

function draw(r) {
  $('#gate').classList.toggle('hidden', r.kind === 'truth' || r.kind === 'rule');
  $('#gateRule').textContent = r.rule && r.kind !== 'rule' ? ruleText(r.rule) : '';
  $('#facts').classList.toggle('hidden', r.kind !== 'truth');
  if (r.kind === 'truth') {
    $('#facts').innerHTML = r.facts.map(([f, v]) => `<li><span>${f}</span><b class="${v ? 't' : 'f'}">${v ? 'Đúng' : 'Sai'}</b></li>`).join('')
      + `<li class="expr">${r.expr}</li>`;
  }
  $('#crowd').classList.toggle('hidden', !r.friends);
  if (r.friends) {
    $('#crowd').innerHTML = r.friends.map((f, i) => friendHtml(f, i, { tap: r.kind === 'select', mark: r.kind === 'rule' ? r.marks[i] : null })).join('');
  }
}

/* ---------- Câu hỏi ---------- */
function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  state.busy = false;
  showRound();
}

function questionOf(r) {
  switch (r.kind) {
    case 'pass': return 'Bạn này có được qua cổng không?';
    case 'select': return 'Chạm vào TẤT CẢ các bạn được qua cổng, rồi bấm Kiểm tra.';
    case 'truth': return 'Câu cuối cùng Đúng hay Sai?';
    default: return 'Cổng đã cho ✅ các bạn qua và chặn ⛔ các bạn khác. Luật của cổng là gì?';
  }
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  state.picked = new Set();
  game.rounds(state.round, ROUNDS);
  draw(r);
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);
  const isSelect = r.kind === 'select';
  $('#checkRow').classList.toggle('hidden', !isSelect);
  $('#choices').classList.toggle('hidden', isSelect);
  if (isSelect) return;
  // Đúng/Sai và Qua/Không qua giữ nguyên thứ tự; luật thì trộn
  const order = r.kind === 'rule' ? window.shuffle([0, 1, 2]) : [0, 1];
  const isRight = (i) => (r.kind === 'rule' ? r.options[order[i]] === answerOf(r) : order[i] === answerOf(r));
  $('#choices').classList.toggle('stack', r.kind === 'rule');
  renderChoices($('#choices'), order.map((i) => r.options[i]), (i) => {
    if (state.busy) return false;
    const ok = isRight(i);
    if (ok) correct();
    else wrong(hintFor(r));
    return ok;
  }, isRight);
}

$('#crowd').addEventListener('click', (e) => {
  const b = e.target.closest('button.friend');
  if (!b || state.busy || state.r?.kind !== 'select') return;
  const i = Number(b.dataset.i);
  if (state.picked.has(i)) state.picked.delete(i);
  else state.picked.add(i);
  b.classList.toggle('picked', state.picked.has(i));
  game.sfx.tap();
});

$('#checkBtn').addEventListener('click', () => {
  const r = state.r;
  if (state.busy || r?.kind !== 'select') return;
  const picked = [...state.picked].sort().join(',');
  if (picked === answerOf(r)) return correct();
  wrong(`Xét từng bạn với luật "${ruleText(r.rule)}". Có bạn chọn thiếu hoặc chọn thừa.`);
});

function hintFor(r) {
  if (r.kind === 'truth') return 'Thay mỗi câu bằng Đúng hoặc Sai trước, rồi mới tính VÀ, HOẶC, KHÔNG.';
  if (r.kind === 'rule') return 'Thử luật đó với từng bạn. Chỉ cần sai với một bạn là luật đó không đúng.';
  const f = r.friends[0];
  const list = ATTR_KEYS.filter((a) => f.attrs.includes(a)).map((a) => ATTRS[a].name);
  return `Bạn này ${list.length ? `có ${list.join(', ')}` : 'không có gì cả'}. Đọc lại luật: ${ruleText(r.rule)}.`;
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  if (r.friends && r.kind !== 'rule') {
    // Mở cổng: bạn được qua sáng lên, bạn bị chặn mờ đi
    document.querySelectorAll('#crowd .friend').forEach((el, i) => {
      el.classList.add(evalRule(r.rule, r.friends[i].attrs) ? 'through' : 'blocked');
    });
    $('#gate').classList.add('open');
  }
  game.say('Đúng rồi! 🎉', 'cheer', 'good');
  if (!(await game.wait(1500))) return;
  $('#gate').classList.remove('open');
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé là người gác cổng logic tài ba!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
