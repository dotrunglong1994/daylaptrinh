// LEVELS-START (scripts/checks/xuong-hinh.mjs đọc đoạn này để kiểm tra từng màn)
// Hình học lớp 5: diện tích hình tam giác, hình thang, chu vi và diện tích hình tròn, tính ngược.
// Câu "tap": chạm vào đoạn thẳng đúng (đường cao, bán kính, đường kính) trên hình vẽ.
// Câu "calc": chọn công thức đã điền số rồi chọn kết quả. Mỗi công thức sai là một lỗi hay gặp
// (quên chia 2, lấy cạnh bên thay chiều cao, nhầm bán kính với đường kính…), kết quả của nó là một đáp án sai.
// Số đo tính bằng phần trăm (x100) để không lệch số thập phân: 17,5 cm² lưu là 1750.
const ROUNDS = 5;

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
// Bộ ba số Pi-ta-go: cạnh bên của tam giác, hình thang luôn là số tròn
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17]];
const RIGHT = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [4, 3, 5], [8, 6, 10], [12, 9, 15]];
const UNITS = ['cm', 'dm', 'm'];

// 17,5 → "17,5"; 1250 (x100) → "12,5"
const fmt = (n) => String(n).replace('.', ',');
const fmtH = (h) => fmt(Math.round(h) / 100);

const KINDS = {
  // Chạm vào đường cao của tam giác
  triH: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    return { kind: 'tap', fig: { type: 'tri', a: p + ri(rand, 2, 6), p, h, s, plain: true }, ans: 'height', ask: 'Chạm vào đường cao của hình tam giác.' };
  },
  triArea: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    const a = p + ri(rand, 2, 8);
    const u = pick(rand, UNITS);
    return {
      kind: 'calc', fig: { type: 'tri', a, p, h, s, u }, u: `${u}²`, value: a * h * 50,
      q: 'Diện tích hình tam giác là bao nhiêu?',
      exprs: [`${a} × ${h} : 2`, `${a} × ${h}`, `${a} × ${s} : 2`, `(${a} + ${h}) × 2`],
      hint: 'Diện tích tam giác = đáy × chiều cao : 2. Chiều cao là đoạn nét đứt vuông góc với đáy, không phải cạnh bên.',
    };
  },
  rightArea: (rand) => {
    const [a, b, c] = pick(rand, RIGHT);
    const u = pick(rand, UNITS);
    return {
      kind: 'calc', fig: { type: 'right', a, b, c, u }, u: `${u}²`, value: a * b * 50,
      q: 'Diện tích hình tam giác vuông là bao nhiêu?',
      exprs: [`${a} × ${b} : 2`, `${a} × ${b}`, `${a} × ${c} : 2`, `(${a} + ${b}) × 2`],
      hint: 'Tam giác vuông: hai cạnh góc vuông là đáy và chiều cao. Diện tích = cạnh này × cạnh kia : 2.',
    };
  },
  trapH: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    return { kind: 'tap', fig: { type: 'trap', a: p + 6 + ri(rand, 0, 3), b: 6, p, h, s, plain: true }, ans: 'height', ask: 'Chạm vào đường cao của hình thang.' };
  },
  trapArea: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    const b = ri(rand, 3, 10);
    const a = p + b + ri(rand, 0, 4);
    const u = pick(rand, UNITS);
    return {
      kind: 'calc', fig: { type: 'trap', a, b, p, h, s, u }, u: `${u}²`, value: (a + b) * h * 50,
      q: 'Diện tích hình thang là bao nhiêu?',
      exprs: [`(${a} + ${b}) × ${h} : 2`, `(${a} + ${b}) × ${h}`, `(${a} + ${b}) × ${s} : 2`, `${a} × ${b} × ${h} : 2`],
      hint: 'Diện tích hình thang = (đáy lớn + đáy bé) × chiều cao : 2.',
    };
  },
  // Biết diện tích và đáy, tìm chiều cao tam giác
  triBack: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    const a = Math.max(4, p + ri(rand, 2, 8));
    const u = pick(rand, UNITS);
    const S = fmtH(a * h * 50);
    return {
      kind: 'calc', fig: { type: 'tri', a, p, h, s, u, hide: 'h' }, u, value: h * 100,
      q: `Diện tích hình tam giác là ${S} ${u}². Chiều cao dài bao nhiêu?`,
      exprs: [`${S} × 2 : ${a}`, `${S} : ${a}`, `${S} × ${a} : 2`, `${S} : 2 : ${a}`],
      hint: 'Diện tích = đáy × chiều cao : 2, nên chiều cao = diện tích × 2 : đáy.',
    };
  },
  // Biết diện tích và chiều cao hình thang, tìm tổng hai đáy
  trapBack: (rand) => {
    const [p, h, s] = pick(rand, TRIPLES);
    const b = ri(rand, 3, 10);
    const a = p + b + ri(rand, 0, 4);
    const u = pick(rand, UNITS);
    const S = fmtH((a + b) * h * 50);
    return {
      kind: 'calc', fig: { type: 'trap', a, b, p, h, s, u, hide: 'ab' }, u, value: (a + b) * 100,
      q: `Diện tích hình thang là ${S} ${u}², chiều cao ${h} ${u}. Tổng hai đáy dài bao nhiêu?`,
      exprs: [`${S} × 2 : ${h}`, `${S} : ${h}`, `${S} × ${h} : 2`, `${S} : 2 : ${h}`],
      hint: 'Diện tích = tổng hai đáy × chiều cao : 2, nên tổng hai đáy = diện tích × 2 : chiều cao.',
    };
  },
  // Chạm vào bán kính hoặc đường kính
  circleTap: (rand) => {
    const ans = pick(rand, ['radius', 'diameter']);
    return { kind: 'tap', fig: { type: 'circle', plain: true }, ans, ask: ans === 'radius' ? 'Chạm vào một bán kính của hình tròn.' : 'Chạm vào đường kính của hình tròn.' };
  },
  // Bán kính ↔ đường kính
  rd: (rand) => {
    const u = pick(rand, UNITS);
    if (rand() < 0.5) {
      const r = ri(rand, 3, 25);
      return {
        kind: 'calc', fig: { type: 'circle', r, u }, u, value: r * 200,
        q: `Bán kính hình tròn là ${r} ${u}. Đường kính dài bao nhiêu?`,
        exprs: [`${r} × 2`, `${r} : 2`, `${r} × 3,14`, `${r} + 2`],
        hint: 'Đường kính đi qua tâm, dài gấp đôi bán kính: d = r × 2.',
      };
    }
    const d = ri(rand, 3, 25) * 2;
    return {
      kind: 'calc', fig: { type: 'circle', d, u }, u, value: d * 50,
      q: `Đường kính hình tròn là ${d} ${u}. Bán kính dài bao nhiêu?`,
      exprs: [`${d} : 2`, `${d} × 2`, `${d} × 3,14`, `${d} − 2`],
      hint: 'Bán kính bằng một nửa đường kính: r = d : 2.',
    };
  },
  circC: (rand) => {
    const u = pick(rand, UNITS);
    if (rand() < 0.5) {
      const r = ri(rand, 3, 12);
      return {
        kind: 'calc', fig: { type: 'circle', r, u }, u, value: r * 2 * 314,
        q: 'Chu vi hình tròn là bao nhiêu?',
        exprs: [`${r} × 2 × 3,14`, `${r} × 3,14`, `${r} × ${r} × 3,14`, `${r} × 4 × 3,14`],
        hint: 'Chu vi = đường kính × 3,14 = bán kính × 2 × 3,14.',
      };
    }
    const d = ri(rand, 3, 12) * 2;
    return {
      kind: 'calc', fig: { type: 'circle', d, u }, u, value: d * 314,
      q: 'Chu vi hình tròn là bao nhiêu?',
      exprs: [`${d} × 3,14`, `${d} × 2 × 3,14`, `${d} : 2 × 3,14`, `${d} × ${d} × 3,14`],
      hint: 'Biết đường kính thì chu vi = đường kính × 3,14 (không nhân 2 nữa).',
    };
  },
  circS: (rand) => {
    const u = pick(rand, UNITS);
    if (rand() < 0.5) {
      const r = ri(rand, 3, 12);
      return {
        kind: 'calc', fig: { type: 'circle', r, u }, u: `${u}²`, value: r * r * 314,
        q: 'Diện tích hình tròn là bao nhiêu?',
        exprs: [`${r} × ${r} × 3,14`, `${r} × 2 × 3,14`, `${r} × 3,14`, `${r} × ${r}`],
        hint: 'Diện tích hình tròn = bán kính × bán kính × 3,14.',
      };
    }
    const r = ri(rand, 3, 12);
    const d = r * 2;
    return {
      kind: 'calc', fig: { type: 'circle', d, u }, u: `${u}²`, value: r * r * 314,
      q: `Diện tích hình tròn là bao nhiêu? (Nhớ: bán kính = ${d} : 2 = ${r} ${u})`,
      exprs: [`${r} × ${r} × 3,14`, `${d} × ${d} × 3,14`, `${d} × 3,14`, `${r} × 3,14`],
      hint: 'Đổi đường kính ra bán kính trước, rồi lấy bán kính × bán kính × 3,14.',
    };
  },
};

const LEVELS = [
  { name: 'Đường cao tam giác', kinds: ['triH', 'triArea', 'triH', 'triArea', 'triArea'],
    tip: 'Đường cao là đoạn nét đứt, đi từ đỉnh xuống vuông góc với đáy. Diện tích tam giác = đáy × chiều cao : 2.' },
  { name: 'Tam giác vuông', kinds: ['rightArea'],
    tip: 'Tam giác vuông có sẵn chiều cao: chính là cạnh góc vuông. Đừng lấy cạnh dài nhất nhé!' },
  { name: 'Diện tích hình thang', kinds: ['trapH', 'trapArea', 'trapArea', 'trapH', 'trapArea'],
    tip: 'Hình thang có hai đáy song song. Diện tích = (đáy lớn + đáy bé) × chiều cao : 2.' },
  { name: 'Tìm chiều cao, tìm đáy', kinds: ['triBack', 'trapBack'],
    tip: 'Tính ngược: nhân diện tích với 2 rồi chia cho số đo đã biết.' },
  { name: 'Bán kính, đường kính', kinds: ['circleTap', 'rd', 'circleTap', 'rd', 'rd'],
    tip: 'Bán kính nối tâm với một điểm trên đường tròn. Đường kính đi qua tâm, dài gấp đôi bán kính.' },
  { name: 'Chu vi hình tròn', kinds: ['circC'],
    tip: 'Chu vi hình tròn = đường kính × 3,14.' },
  { name: 'Diện tích hình tròn', kinds: ['circS'],
    tip: 'Diện tích hình tròn = bán kính × bán kính × 3,14.' },
  { name: 'Thử thách', kinds: ['triArea', 'rightArea', 'trapArea', 'triBack', 'trapBack', 'circC', 'circS'], mix: true,
    tip: 'Màn cuối trộn mọi dạng. Nhìn kĩ hình rồi mới chọn công thức!' },
];

// Giá trị một công thức (x100, làm tròn)
function evaluate(expr) {
  const js = expr.replace(/,/g, '.').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-');
  return Math.round(Function(`return (${js});`)() * 100);
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.mix ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  // Sinh lại nếu hai công thức ra cùng kết quả (hiếm, vd. (a + h) × 2 = a × h : 2)
  for (let tries = 0; ; tries++) {
    const r = { ...KINDS[kind](rand), name: kind };
    if (r.kind === 'tap') return r;
    const values = r.exprs.map(evaluate);
    if (new Set(values).size === values.length && values.every((v) => v > 0) || tries > 50) {
      return { ...r, answer: r.exprs[0], options: values };
    }
  }
}

const answerOf = (r) => (r.kind === 'tap' ? r.ans : r.value);
// Câu hỏi viết đủ số đo (không cần nhìn hình): dùng cho phiếu bài tập in ra giấy và Sổ tay lỗi sai
function describe(r) {
  if (r.kind === 'tap') return r.ask;
  const f = r.fig;
  const m = (v) => `${fmt(v)} ${f.u}`;
  if (r.name === 'triArea') return `Hình tam giác có đáy ${m(f.a)}, chiều cao ${m(f.h)}. Tính diện tích.`;
  if (r.name === 'rightArea') return `Tam giác vuông có hai cạnh góc vuông dài ${m(f.a)} và ${m(f.b)}. Tính diện tích.`;
  if (r.name === 'trapArea') return `Hình thang có đáy lớn ${m(f.a)}, đáy bé ${m(f.b)}, chiều cao ${m(f.h)}. Tính diện tích.`;
  if (r.name === 'triBack') return r.q.replace('. Chiều cao', `, đáy ${m(f.a)}. Chiều cao`);
  if (r.name === 'circC' || r.name === 'circS') {
    const given = f.r ? `bán kính ${m(f.r)}` : `đường kính ${m(f.d)}`;
    return `Hình tròn có ${given}. Tính ${r.name === 'circC' ? 'chu vi' : 'diện tích'}.`;
  }
  return r.q;
}

// Phiếu bài tập in ra giấy (Góc phụ huynh): một câu chữ và lời giải của màn levelIdx, null nếu câu cần hình
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- trang /phieu-bai-tap gọi hàm này
function printRound(levelIdx, rand = Math.random) {
  const r = makeRound(levelIdx, Math.floor(rand() * ROUNDS), rand);
  if (r.kind === 'tap') return null;
  return { q: describe(r), a: `${r.answer} = ${fmtH(r.value)} ${r.u}` };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, step: 1, mistakes: 0, busy: false };

const game = createGame({
  id: 'xuong-hinh',
  title: '🔺 Xưởng Hình Lớp 5',
  sub: 'Tính diện tích tam giác, hình thang, chu vi và diện tích hình tròn!',
  levels: LEVELS.length,
  winTitle: 'Bé là thợ cả xưởng hình! 🔺',
  start: startLevel,
});

// Giọng đọc không đọc được các dấu phép tính
const spoken = (text) => text.replace(/×/g, ' nhân ').replace(/ : /g, ' chia ').replace(/−/g, ' trừ ').replace(/\+/g, ' cộng ')
  .replace(/[()]/g, ' ').replace(/²/g, ' vuông');
const unitText = (r, h) => `${fmtH(h)} ${r.u}`;

/* ---------- Vẽ hình ---------- */
const NAMES = { height: 'đường cao', base: 'đáy', side: 'cạnh bên', top: 'đáy bé', radius: 'bán kính', diameter: 'đường kính', chord: 'dây cung' };

function seg(id, [x1, y1], [x2, y2], { dash = false, cls = '' } = {}) {
  const line = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;
  return `<g class="seg ${cls}" data-id="${id}"><line ${line} class="vis${dash ? ' dash' : ''}"/><line ${line} class="hit"/></g>`;
}
const text = (x, y, t, cls = '') => `<text x="${x}" y="${y}" class="lbl ${cls}" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
const len = (v, u, hide) => (hide ? '?' : `${fmt(v)} ${u}`);
const rightMark = (x, y, dx, dy) => `<path d="M${x + dx * 12} ${y} L${x + dx * 12} ${y + dy * 12} L${x} ${y + dy * 12}" class="mark"/>`;

function figure(r) {
  const f = r.fig;
  const tap = r.kind === 'tap';
  let body = '';
  if (f.type === 'tri' || f.type === 'trap') {
    const top = f.type === 'trap' ? f.b : 0;
    const sc = Math.min(260 / f.a, 150 / f.h);
    const ox = (320 - f.a * sc) / 2;
    const by = 180;
    const P = (x, y) => [Math.round(ox + x * sc), Math.round(by - y * sc)];
    const A = P(0, 0), B = P(f.a, 0), D = P(f.p, f.h), C = P(f.p + top, f.h), H = P(f.p, 0);
    const fill = f.type === 'tri' ? `${A} ${B} ${D}` : `${A} ${B} ${C} ${D}`;
    body += `<polygon points="${fill}" class="shape"/>`;
    body += seg('base', A, B);
    body += seg('side', A, D);
    body += f.type === 'tri' ? seg('side', B, D) : seg('side', B, C) + seg('top', D, C);
    body += seg('height', D, H, { dash: true });
    body += rightMark(H[0], H[1], 1, -1);
    if (!f.plain) {
      const hideAB = f.hide === 'ab';
      body += text((A[0] + B[0]) / 2, by + 18, len(f.a, f.u, hideAB));
      if (f.type === 'trap') body += text((D[0] + C[0]) / 2, D[1] - 14, len(f.b, f.u, hideAB));
      body += text(H[0] + 8 + 22, (D[1] + H[1]) / 2, len(f.h, f.u, f.hide === 'h'), 'h');
      body += text((A[0] + D[0]) / 2 - 30, (A[1] + D[1]) / 2, len(f.s, f.u), 'muted');
    }
  } else if (f.type === 'right') {
    const sc = Math.min(240 / f.a, 150 / f.b);
    const ox = (320 - f.a * sc) / 2;
    const A = [Math.round(ox), 180], B = [Math.round(ox + f.a * sc), 180], C = [Math.round(ox), Math.round(180 - f.b * sc)];
    body += `<polygon points="${A} ${B} ${C}" class="shape"/>`;
    body += seg('base', A, B) + seg('height', A, C) + seg('side', B, C);
    body += rightMark(A[0], A[1], 1, -1);
    body += text((A[0] + B[0]) / 2, 198, len(f.a, f.u));
    body += text(A[0] - 28, (A[1] + C[1]) / 2, len(f.b, f.u));
    body += text((B[0] + C[0]) / 2 + 28, (B[1] + C[1]) / 2 - 10, len(f.c, f.u), 'muted');
  } else {
    const O = [160, 105], R = 82;
    const at = (deg) => [Math.round(O[0] + R * Math.cos(deg * Math.PI / 180)), Math.round(O[1] - R * Math.sin(deg * Math.PI / 180))];
    body += `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" class="shape"/>`;
    if (tap) {
      body += seg('radius', O, at(60));
      body += seg('diameter', at(200), at(20));
      body += seg('chord', at(115), at(250));
    } else if (f.r) {
      body += seg('radius', O, at(30));
      body += text((O[0] + at(30)[0]) / 2 + 4, (O[1] + at(30)[1]) / 2 - 14, `r = ${fmt(f.r)} ${f.u}`);
    } else {
      body += seg('diameter', at(180), at(0));
      body += text(O[0], O[1] - 16, `d = ${fmt(f.d)} ${f.u}`);
    }
    body += `<circle cx="${O[0]}" cy="${O[1]}" r="4" class="dot"/>` + text(O[0] - 4, O[1] + 16, 'O', 'muted');
  }
  return `<svg viewBox="0 0 320 210" class="${tap ? 'tapping' : ''}" role="img" aria-label="Hình vẽ">${body}</svg>`;
}

/* ---------- Câu hỏi ---------- */
function setStep(n) {
  state.step = n;
  for (const li of document.querySelectorAll('#steps li')) {
    const s = Number(li.dataset.s);
    li.classList.toggle('now', s === n);
    li.classList.toggle('done', s < n);
  }
}

function startLevel(idx) {
  state.level = idx;
  state.round = 0;
  state.mistakes = 0;
  state.busy = false;
  showRound();
}

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  game.rounds(state.round, ROUNDS);
  $('#fig').innerHTML = figure(r);
  $('#solution').classList.add('hidden');
  $('#choices').innerHTML = '';
  const lead = state.round === 0 ? `${LEVELS[state.level].tip} ` : '';
  if (r.kind === 'tap') {
    $('#steps').classList.add('hidden');
    $('#question').textContent = r.ask;
    $('#printQ').textContent = describe(r);
    $('#choices').classList.add('hidden');
    game.say(spoken(lead + r.ask));
    return;
  }
  $('#steps').classList.remove('hidden');
  $('#question').textContent = r.q;
  $('#printQ').textContent = describe(r);
  setStep(1);
  game.say(spoken(`${lead}${r.q} Bé chọn công thức đúng trước nhé.`));
  const opts = window.shuffle(r.exprs);
  $('#choices').classList.remove('hidden');
  $('#choices').classList.add('wide');
  renderChoices($('#choices'), opts, (i) => {
    if (state.busy) return false;
    const ok = opts[i] === r.answer;
    if (ok) showAnswerStep();
    else wrong(r.hint);
    return ok;
  }, (i) => opts[i] === r.answer);
}

$('#fig').addEventListener('click', (e) => {
  const g = e.target.closest('.seg');
  const r = state.r;
  if (!g || state.busy || r?.kind !== 'tap') return;
  const id = g.dataset.id;
  if (id === r.ans) {
    g.classList.add('right');
    return correct();
  }
  g.classList.add('wrong');
  setTimeout(() => g.classList.remove('wrong'), 700);
  const hint = r.ans === 'height'
    ? 'Đường cao là đoạn nét đứt, vuông góc với đáy (có dấu góc vuông).'
    : r.ans === 'radius' ? 'Bán kính nối tâm O với một điểm trên đường tròn.' : 'Đường kính đi qua tâm O, nối hai điểm trên đường tròn.';
  wrong(`Đó là ${NAMES[id]}. ${hint}`);
});

async function showAnswerStep() {
  const r = state.r;
  state.busy = true;
  game.sfx.good();
  $('#solution').classList.remove('hidden');
  $('#solution').innerHTML = `Công thức: <b>${r.answer} = ?</b>`;
  if (!(await game.wait(700))) return;
  state.busy = false;
  setStep(2);
  game.say(spoken(`Đúng công thức rồi! ${r.answer} bằng bao nhiêu?`), 'cheer', 'good');
  const opts = window.shuffle(r.options);
  $('#choices').classList.remove('wide');
  renderChoices($('#choices'), opts.map((h) => unitText(r, h)), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong('Tính lại cẩn thận nhé: trong ngoặc trước, rồi nhân chia từ trái sang phải. Nhân với 3,14 thì đặt tính cho thẳng hàng.');
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

async function correct() {
  const r = state.r;
  state.busy = true;
  setStep(3);
  game.sfx.good();
  if (r.kind === 'tap') {
    game.say(`Đúng rồi, đó là ${NAMES[r.ans]}!`, 'cheer', 'good');
  } else {
    $('#solution').innerHTML = `<b>${r.answer} = ${unitText(r, r.value)}</b>`;
    game.say(spoken(`Chính xác! Kết quả là ${unitText(r, r.value)}.`), 'cheer', 'good');
  }
  if (!(await game.wait(r.kind === 'tap' ? 1300 : 2000))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai lần nào. Bé là thợ cả của xưởng hình!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(spoken(hint), 'sad', 'soft');
}
