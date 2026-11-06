// LEVELS-START (scripts/checks/tham-tu-de-bai.mjs đọc đoạn này để kiểm tra từng màn)
// Mỗi câu là một bài toán có lời văn, giải theo 3 bước như thám tử:
//   1. tìm manh mối: chạm vào các số cần dùng (từ màn 5 có số thừa, không cần dùng),
//   2. chọn phép tính đúng, 3. tính ra đáp số.
// Bài mẫu: t = đề bài, số viết {a}, {b}…; e = phép tính đúng; w = phép tính sai hay gặp;
// u = đơn vị đáp số; h = gợi ý khi chọn sai phép tính; g(rand) sinh các số.
const ROUNDS = 4;

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const ADD_1 = (rand) => { const a = ri(rand, 3, 9); return { a, b: ri(rand, 2, a - 1) }; };
const SUB_1 = (rand) => ({ a: ri(rand, 10, 19), b: ri(rand, 2, 9) });
const MORE_2 = (rand) => ({ a: ri(rand, 25, 80), b: ri(rand, 5, 19) });
const MUL = (rand) => { const a = ri(rand, 2, 9); let b = ri(rand, 2, 9); if (b === a) b = a === 9 ? 8 : a + 1; return { a, b }; };
const DIV = (rand) => { const b = ri(rand, 2, 9); let m = ri(rand, 2, 9); if (m === b) m = b === 9 ? 8 : b + 1; return { a: b * m, b }; };

const LEVELS = [
  { name: 'Thêm vào', tip: 'Thám tử đọc kĩ đề, tìm các số cần dùng, rồi mới chọn phép tính nhé!', problems: [
    { t: 'Lan có {a} quả bóng. Mẹ cho Lan thêm {b} quả bóng. Hỏi Lan có tất cả bao nhiêu quả bóng?', e: 'a + b', w: ['a − b'], u: 'quả bóng', h: 'Được cho thêm thì nhiều lên: làm phép cộng.', g: ADD_1 },
    { t: 'Trong vườn có {a} cây cam và {b} cây bưởi. Hỏi trong vườn có tất cả bao nhiêu cây?', e: 'a + b', w: ['a − b'], u: 'cây', h: '"Tất cả" là gộp lại: làm phép cộng.', g: ADD_1 },
    { t: 'Tổ Một có {a} bạn nam và {b} bạn nữ. Hỏi tổ Một có bao nhiêu bạn?', e: 'a + b', w: ['a − b'], u: 'bạn', h: 'Gộp bạn nam và bạn nữ lại: làm phép cộng.', g: ADD_1 },
  ] },
  { name: 'Bớt đi', tip: 'Bay đi, ăn mất, cho bớt thì còn lại ít hơn. Thêm vào thì nhiều hơn.', problems: [
    { t: 'Trên cành có {a} con chim. Có {b} con bay đi. Hỏi trên cành còn lại mấy con chim?', e: 'a − b', w: ['a + b'], u: 'con chim', h: 'Bay đi thì bớt đi: làm phép trừ.', g: SUB_1 },
    { t: 'Mẹ mua {a} quả trứng. Mẹ dùng {b} quả để làm bánh. Hỏi còn lại bao nhiêu quả trứng?', e: 'a − b', w: ['a + b'], u: 'quả trứng', h: 'Dùng mất thì còn lại ít hơn: làm phép trừ.', g: SUB_1 },
    { t: 'Bể có {a} con cá. Bố thả thêm {b} con cá nữa. Hỏi bể có bao nhiêu con cá?', e: 'a + b', w: ['a − b'], u: 'con cá', h: 'Thả thêm thì nhiều lên: làm phép cộng.', g: SUB_1 },
  ] },
  { name: 'Nhiều hơn, ít hơn', tip: 'Cẩn thận! "Nhiều hơn" thì cộng, "ít hơn" thì trừ. Hỏi "hơn bao nhiêu" thì lấy số lớn trừ số bé.', problems: [
    { t: 'An có {a} viên bi. Bình có nhiều hơn An {b} viên bi. Hỏi Bình có bao nhiêu viên bi?', e: 'a + b', w: ['a − b'], u: 'viên bi', h: 'Bình nhiều hơn An, nên lấy số bi của An cộng thêm.', g: MORE_2 },
    { t: 'Thùng thứ nhất có {a} lít dầu. Thùng thứ hai có ít hơn thùng thứ nhất {b} lít. Hỏi thùng thứ hai có bao nhiêu lít dầu?', e: 'a − b', w: ['a + b'], u: 'lít', h: 'Thùng thứ hai ít hơn, nên lấy số dầu thùng thứ nhất trừ đi.', g: MORE_2 },
    { t: 'Đội Xanh trồng được {a} cây. Đội Đỏ trồng được {b} cây. Hỏi đội Xanh trồng nhiều hơn đội Đỏ bao nhiêu cây?', e: 'a − b', w: ['a + b'], u: 'cây', h: 'Hỏi "nhiều hơn bao nhiêu" thì lấy số lớn trừ số bé.', g: MORE_2 },
  ] },
  { name: 'Nhân và chia', tip: 'Nhiều nhóm bằng nhau thì nhân. Chia đều hoặc chia thành nhóm thì chia.', problems: [
    { t: 'Mỗi hộp có {a} cái bánh. Hỏi {b} hộp như thế có bao nhiêu cái bánh?', e: 'a × b', w: ['a + b', 'a − b'], u: 'cái bánh', h: 'Có nhiều hộp, hộp nào cũng bằng nhau: làm phép nhân.', g: MUL },
    { t: 'Có {a} quả cam chia đều vào {b} đĩa. Hỏi mỗi đĩa có mấy quả cam?', e: 'a : b', w: ['a × b', 'a − b'], u: 'quả cam', h: 'Chia đều vào các đĩa: làm phép chia.', g: DIV },
    { t: 'Có {a} học sinh xếp thành các hàng, mỗi hàng {b} bạn. Hỏi xếp được mấy hàng?', e: 'a : b', w: ['a × b', 'a − b'], u: 'hàng', h: 'Chia thành các nhóm bằng nhau: làm phép chia.', g: DIV },
  ] },
  { name: 'Gấp lên, giảm đi', tip: 'Từ màn này có manh mối thừa! Không phải số nào trong đề cũng cần dùng.', problems: [
    { t: 'Em năm nay {x} tuổi. Em có {a} cái kẹo, chị có số kẹo gấp {b} lần số kẹo của em. Hỏi chị có bao nhiêu cái kẹo?', e: 'a × b', w: ['a + b', 'a × x'], u: 'cái kẹo', h: 'Gấp lên mấy lần thì nhân với số lần.', g: (rand) => ({ ...MUL(rand), x: ri(rand, 10, 15) }) },
    { t: 'Bao gạo to nặng {a} kg. Bao nhỏ nặng bằng bao to giảm đi {b} lần. Hỏi bao nhỏ nặng bao nhiêu ki-lô-gam?', e: 'a : b', w: ['a − b', 'a × b'], u: 'kg', h: 'Giảm đi mấy lần thì chia cho số lần.', g: DIV },
    { t: 'Nhà Nam nuôi {x} con chó. Đàn gà nhà Nam có {a} con gà trống, số gà mái gấp {b} lần số gà trống. Hỏi có bao nhiêu con gà mái?', e: 'a × b', w: ['a + b', 'x × b'], u: 'con gà mái', h: 'Số con chó không liên quan. Gà mái gấp mấy lần gà trống thì nhân.', g: (rand) => { const v = MUL(rand); return { ...v, x: v.a + v.b === 12 ? 11 : 12 }; } },
  ] },
  { name: 'Hai bước tính', tip: 'Bài này phải tính hai bước. Làm phép tính trong ngoặc trước nhé.', problems: [
    { t: 'Cửa hàng có {a} kg gạo. Buổi sáng bán được {b} kg, buổi chiều bán được {c} kg. Hỏi cửa hàng còn lại bao nhiêu ki-lô-gam gạo?', e: 'a − b − c', w: ['a − b + c', 'a − b', 'b + c'], u: 'kg', h: 'Bán hai lần, lần nào cũng bớt đi: trừ cả hai số.', g: (rand) => { const b = ri(rand, 10, 24); const c = ri(rand, 25, 35); let a = ri(rand, 60, 99); if (a === 2 * (b + c)) a++; return { a, b, c }; } },
    { t: 'Mỗi hộp có {a} cái bút. Cô mua {b} hộp, rồi cho các bạn {c} cái bút. Hỏi cô còn lại bao nhiêu cái bút?', e: 'a × b − c', w: ['a × b + c', 'a + b − c', 'a × b'], u: 'cái bút', h: 'Trước hết tính số bút trong các hộp (nhân), rồi trừ số bút đã cho.', g: (rand) => { const { a, b } = MUL(rand); return { a, b, c: pickC(rand, a, b) }; } },
    { t: 'Mỗi túi có {a} quả táo. Mẹ mua {b} túi, bà cho thêm {c} quả táo. Hỏi có tất cả bao nhiêu quả táo?', e: 'a × b + c', w: ['a × b − c', 'a + b + c', 'a × (b + c)'], u: 'quả táo', h: 'Tính số táo trong các túi trước (nhân), rồi cộng thêm số táo bà cho.', g: (rand) => { const { a, b } = MUL(rand); return { a, b, c: pickC(rand, a, b) }; } },
  ] },
  { name: 'Trung bình, tổng và hiệu', tip: 'Trung bình cộng: cộng tất cả rồi chia cho số bạn. Tổng và hiệu: số lớn = (tổng + hiệu) : 2.', problems: [
    { t: 'Ba bạn hái được {a} quả, {b} quả và {c} quả. Hỏi trung bình mỗi bạn hái được bao nhiêu quả?', e: '(a + b + c) : 3', w: ['a + b + c : 3', '(a + b + c) × 3', 'a + b + c'], u: 'quả', h: 'Cộng số quả của cả ba bạn trước, rồi chia cho 3.', g: (rand) => { const a = ri(rand, 10, 30); const b = ri(rand, 31, 50); let c = ri(rand, 12, 29); while ((a + b + c) % 3 || c === a || c === b) c++; return { a, b, c }; } },
    { t: 'Tổng của hai số là {s}. Hiệu của hai số là {d}. Tìm số lớn.', e: '(s + d) : 2', w: ['(s − d) : 2', 's + d', 's − d'], u: '', h: 'Số lớn = (tổng + hiệu) : 2.', g: SUM_DIFF },
    { t: 'Tổng của hai số là {s}. Hiệu của hai số là {d}. Tìm số bé.', e: '(s − d) : 2', w: ['(s + d) : 2', 's − d', 's : 2'], u: '', h: 'Số bé = (tổng − hiệu) : 2.', g: SUM_DIFF },
  ] },
  { name: 'Rút về đơn vị', tip: 'Tính một phần trước (phép chia), rồi tính nhiều phần (phép nhân).', problems: [
    { t: 'Mua {a} quyển vở hết {p} đồng. Hỏi mua {b} quyển vở như thế hết bao nhiêu tiền?', e: 'p : a × b', w: ['p × b', 'p : b × a', 'p : a + b'], u: 'đồng', h: 'Tìm giá một quyển vở trước: lấy số tiền chia cho số quyển.', g: (rand) => UNIT(rand, ri(rand, 2, 9) * 1000) },
    { t: 'Một xe chở {a} chuyến được {p} bao xi măng. Hỏi {b} chuyến như thế chở được bao nhiêu bao?', e: 'p : a × b', w: ['p × b', 'p : b × a', 'p : a + b'], u: 'bao', h: 'Tìm số bao trong một chuyến trước: lấy tổng số bao chia cho số chuyến.', g: (rand) => UNIT(rand, ri(rand, 11, 25)) },
    { t: 'Có {a} hộp bánh như nhau đựng {p} cái bánh. Hỏi {b} hộp như thế đựng bao nhiêu cái bánh?', e: 'p : a × b', w: ['p × b', 'p : b × a', 'p : a + b'], u: 'cái bánh', h: 'Một hộp có bao nhiêu cái? Lấy số bánh chia cho số hộp.', g: (rand) => UNIT(rand, ri(rand, 6, 12)) },
  ] },
];
// Màn cuối trộn các bài của màn 3–8
LEVELS.push({ name: 'Thử thách', tip: 'Màn cuối trộn mọi dạng bài. Nhớ: có thể có manh mối thừa!', problems: LEVELS.slice(2).flatMap((L) => L.problems) });

// Số bút cô cho đi: ít hơn số bút có, khác các số trong đề
function pickC(rand, a, b) {
  const ok = [];
  for (let c = 2; c < Math.min(a * b, 21); c++) if (c !== a && c !== b) ok.push(c);
  return pick(rand, ok);
}
function SUM_DIFF(rand) {
  const small = ri(rand, 10, 60);
  let d = ri(rand, 4, 30);
  // s = 3d thì (s + d) : 2 bằng s − d, hai phép tính ra cùng số
  if (2 * small + d === 3 * d) d++;
  return { s: 2 * small + d, d };
}
// Rút về đơn vị: one = giá trị một phần
function UNIT(rand, one) {
  const a = ri(rand, 2, 6);
  let b = ri(rand, 2, 9);
  if (b === a) b++;
  return { a, b, p: a * one };
}

const fmt = (n) => (Math.abs(n) >= 1000 ? n.toLocaleString('vi-VN') : String(n));
// "a × b − c" → "6 × 4 − 5"
const fill = (expr, v) => expr.replace(/[a-z]/g, (k) => fmt(v[k]));
// Giá trị của phép tính, theo thứ tự: trong ngoặc trước, nhân chia trước cộng trừ
function evaluate(expr, v) {
  const js = expr.replace(/[a-z]/g, (k) => `(${v[k]})`).replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-');
  return Function(`return (${js});`)();
}
const keysOf = (expr) => [...new Set(expr.match(/[a-z]/g))];
const placeholders = (text) => [...text.matchAll(/\{([a-z])\}/g)].map((m) => m[1]);

// 4 đáp số khác nhau, dương, có đáp số đúng
function nums(ans, near) {
  const out = [ans];
  for (const x of near) if (Number.isInteger(x) && x > 0 && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) {
    if (!out.includes(ans + d)) out.push(ans + d);
    if (out.length < 4 && ans - d > 0 && !out.includes(ans - d)) out.push(ans - d);
  }
  return out;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  // Màn thường: mỗi dạng bài ít nhất một lần; màn thử thách: chọn ngẫu nhiên
  const p = levelIdx === LEVELS.length - 1 ? pick(rand, L.problems) : (k < L.problems.length ? L.problems[k] : pick(rand, L.problems));
  const v = p.g(rand);
  const ans = evaluate(p.e, v);
  const exprs = [p.e, ...p.w];
  const wrongValues = p.w.map((w) => evaluate(w, v));
  const needed = keysOf(p.e);
  return {
    p, v, ans, needed,
    extras: placeholders(p.t).filter((key) => !needed.includes(key)),
    exprOptions: exprs.map((x) => fill(x, v)),
    answer: fill(p.e, v),
    options: nums(ans, [...wrongValues, ans + 10, ans - 10, ans + 1]),
  };
}

const answerOf = (r) => r.ans;
// Phiếu bài tập in ra giấy (Góc phụ huynh): một câu chữ và lời giải của màn levelIdx, null nếu câu cần hình
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- trang /phieu-bai-tap gọi hàm này
function printRound(levelIdx, rand = Math.random) {
  const r = makeRound(levelIdx, Math.floor(rand() * ROUNDS), rand);
  const unit = r.p.u ? ` ${r.p.u}` : '';
  return { q: r.p.t.replace(/\{([a-z])\}/g, (_, k) => fmt(r.v[k])), a: `${r.answer} = ${fmt(r.ans)}${unit}` };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, step: 1, found: [], mistakes: 0, busy: false };

const game = createGame({
  id: 'tham-tu-de-bai',
  title: '🕵️ Thám Tử Đề Bài',
  sub: 'Đọc kĩ đề, tìm manh mối, chọn phép tính đúng rồi tìm đáp số!',
  levels: LEVELS.length,
  winTitle: 'Bé phá án giỏi quá! 🕵️',
  start: startLevel,
});

const unitText = (r, n) => `${fmt(n)}${r.p.u ? ` ${r.p.u}` : ''}`;
// Giọng đọc không đọc được các dấu phép tính
const spoken = (text) => text.replace(/×/g, ' nhân ').replace(/ : /g, ' chia ').replace(/−/g, ' trừ ').replace(/\+/g, ' cộng ').replace(/[()]/g, ' ');

/* ---------- Vẽ đề bài ---------- */
function drawStory(r) {
  $('#story').innerHTML = r.p.t.split(/\{([a-z])\}/).map((part, i) =>
    (i % 2 ? `<button class="clue" data-k="${part}">${fmt(r.v[part])}</button>` : `<span>${part}</span>`)).join('');
}

function setStep(n) {
  state.step = n;
  for (const li of document.querySelectorAll('#steps li')) {
    const s = Number(li.dataset.s);
    li.classList.toggle('now', s === n);
    li.classList.toggle('done', s < n);
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

function showRound() {
  const r = (state.r = makeRound(state.level, state.round));
  state.busy = false;
  state.found = [];
  game.rounds(state.round, ROUNDS);
  drawStory(r);
  $('#story').classList.add('hunting');
  $('#solution').classList.add('hidden');
  $('#choices').innerHTML = '';
  $('#choices').classList.add('hidden');
  setStep(1);
  const lead = state.round === 0 ? `${LEVELS[state.level].tip} ` : '';
  game.say(spoken(`${lead}${r.p.t} Bé chạm vào các số cần dùng để giải bài nhé.`));
}

$('#story').addEventListener('click', (e) => {
  const btn = e.target.closest('.clue');
  const r = state.r;
  if (!btn || state.busy || state.step !== 1 || btn.classList.contains('found')) return;
  const key = btn.dataset.k;
  if (!r.needed.includes(key)) {
    btn.classList.add('extra');
    return wrong('Số này không cần dùng để trả lời câu hỏi. Đọc kĩ câu hỏi ở cuối đề nhé!');
  }
  btn.classList.add('found');
  state.found.push(key);
  game.sfx.pop();
  if (state.found.length === r.needed.length) {
    game.sfx.good();
    showExprStep();
  } else {
    game.say(`Đúng manh mối! Còn ${r.needed.length - state.found.length} số nữa.`, 'happy', 'good');
  }
});

function showExprStep() {
  const r = state.r;
  setStep(2);
  $('#story').classList.remove('hunting');
  game.say('Tìm đủ manh mối rồi! Bây giờ chọn phép tính đúng.', 'cheer', 'good');
  const opts = window.shuffle(r.exprOptions);
  $('#choices').classList.remove('hidden');
  $('#choices').classList.add('wide');
  renderChoices($('#choices'), opts, (i) => {
    if (state.busy) return false;
    const ok = opts[i] === r.answer;
    if (ok) showAnswerStep();
    else wrong(r.p.h);
    return ok;
  }, (i) => opts[i] === r.answer);
}

async function showAnswerStep() {
  const r = state.r;
  state.busy = true;
  game.sfx.good();
  $('#solution').classList.remove('hidden');
  $('#solution').innerHTML = `Phép tính: <b>${r.answer} = ?</b>`;
  if (!(await game.wait(700))) return;
  state.busy = false;
  setStep(3);
  game.say(spoken(`Đúng phép tính rồi! ${r.answer} bằng bao nhiêu?`), 'cheer', 'good');
  const opts = window.shuffle(r.options);
  $('#choices').classList.remove('wide');
  renderChoices($('#choices'), opts.map((n) => unitText(r, n)), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong('Tính lại cẩn thận nhé. Có ngoặc thì tính trong ngoặc trước, rồi nhân chia trước, cộng trừ sau.');
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

async function correct() {
  const r = state.r;
  state.busy = true;
  setStep(4);
  game.sfx.good();
  $('#solution').innerHTML = `Bài giải: <b>${r.answer} = ${fmt(r.ans)}</b><br>Đáp số: <b>${unitText(r, r.ans)}</b>`;
  game.say(spoken(`Phá án thành công! Đáp số: ${unitText(r, r.ans)}.`), 'cheer', 'good');
  if (!(await game.wait(2000))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai lần nào. Bé là thám tử tài ba!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(spoken(hint), 'sad', 'soft');
}
