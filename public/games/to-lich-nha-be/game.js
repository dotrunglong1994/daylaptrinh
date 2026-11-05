// LEVELS-START (scripts/checks/to-lich-nha-be.mjs đọc đoạn này để kiểm tra từng màn)
// Lịch thật (năm 2025–2027), tuần bắt đầu từ thứ Hai như lịch Việt Nam.
// Loại câu: next = thứ của ngày mai / hôm qua / ngày kia; sheet = đọc tờ lịch bóc;
// weekday = ngày D là thứ mấy; tap = chạm vào một ngày trên lịch; count = tháng có mấy ngày Chủ nhật…;
// week = thứ này tuần sau / tuần trước; after = sau N ngày; daysIn = tháng có bao nhiêu ngày;
// untilEnd = còn mấy ngày đến ngày cuối tháng; birthday = còn mấy ngày đến sinh nhật (sang tháng sau).
const ROUNDS = 5;
const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const LEVELS = [
  { name: 'Các ngày trong tuần', kinds: ['next'], tip: 'Một tuần có 7 ngày: Thứ Hai, Thứ Ba, Thứ Tư, Thứ Năm, Thứ Sáu, Thứ Bảy, Chủ nhật.' },
  { name: 'Tờ lịch hôm nay', kinds: ['sheet'], tip: 'Tờ lịch bóc cho biết hôm nay là thứ mấy, ngày bao nhiêu, tháng mấy.' },
  { name: 'Xem lịch tháng', kinds: ['weekday', 'tap', 'count'], tip: 'Mỗi cột trên lịch là một thứ trong tuần. Tìm ngày rồi nhìn lên đầu cột để biết thứ.' },
  { name: 'Tuần trước, tuần sau', kinds: ['week', 'after'], tip: 'Cùng một thứ ở tuần sau thì cộng thêm 7 ngày, tuần trước thì bớt đi 7 ngày.' },
  { name: 'Tháng có bao nhiêu ngày', kinds: ['daysIn'], tip: 'Nắm tay lại: khớp xương nhô lên là tháng 31 ngày, chỗ lõm là tháng 30 ngày. Tháng 2 có 28 hoặc 29 ngày.' },
  { name: 'Đếm ngày', kinds: ['untilEnd', 'birthday'], tip: 'Đếm số ngày còn lại trong tháng, nếu sang tháng sau thì cộng thêm.' },
  { name: 'Thử thách', kinds: ['weekday', 'tap', 'week', 'after', 'daysIn', 'untilEnd', 'birthday'], tip: 'Màn cuối trộn mọi loại câu. Cố lên!' },
];

const ri = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const weekdayOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

// 4 số khác nhau, dương, có đáp án đúng
function nums(ans, near, max = Infinity) {
  const out = [ans];
  for (const x of near) if (Number.isInteger(x) && x > 0 && x <= max && !out.includes(x) && out.length < 4) out.push(x);
  for (let d = 1; out.length < 4; d++) {
    if (ans + d <= max && !out.includes(ans + d)) out.push(ans + d);
    if (out.length < 4 && ans - d > 0 && !out.includes(ans - d)) out.push(ans - d);
  }
  return out;
}
// 4 thứ khác nhau, có thứ đúng
function days4(ans, near) {
  const out = [ans];
  for (const x of [...near, ans + 3, ans + 4]) {
    const w = ((x % 7) + 7) % 7;
    if (!out.includes(w) && out.length < 4) out.push(w);
  }
  return out;
}

function makeRound(levelIdx, k, rand = Math.random) {
  const L = LEVELS[levelIdx];
  const kind = L.kinds.length > 3 ? pick(rand, L.kinds) : L.kinds[k % L.kinds.length];
  const y = ri(rand, 2025, 2027);
  const m = ri(rand, 1, 12);
  const last = daysIn(y, m);
  const base = { kind, y, m, last };
  if (kind === 'next') {
    const w = ri(rand, 0, 6);
    const step = pick(rand, [1, -1, 2]);
    const ans = (w + step + 7) % 7;
    return { ...base, w, step, ans, options: days4(ans, [w - step, w, w + step * 2]) };
  }
  if (kind === 'sheet') {
    const d = ri(rand, 2, last - 1);
    const ask = pick(rand, ['day', 'weekday', 'month', 'tomorrow']);
    const w = weekdayOf(y, m, d);
    if (ask === 'day') return { ...base, d, ask, ans: d, options: nums(d, [m, d + 1, d - 1, w || 7], last) };
    if (ask === 'month') return { ...base, d, ask, ans: m, options: nums(m, [m + 1, m - 1, d <= 12 ? d : 0], 12) };
    if (ask === 'weekday') return { ...base, d, ask, ans: w, options: days4(w, [w + 1, w - 1]) };
    return { ...base, d, ask, ans: d + 1, options: nums(d + 1, [d - 1, d, d + 2], last) };
  }
  if (kind === 'weekday') {
    const d = ri(rand, 1, last);
    const w = weekdayOf(y, m, d);
    return { ...base, d, ans: w, options: days4(w, [w + 1, w - 1]) };
  }
  if (kind === 'tap') {
    const target = pick(rand, ['first', 'last', 'date']);
    const w = ri(rand, 0, 6);
    let d;
    if (target === 'date') d = ri(rand, 1, last);
    else if (target === 'first') { d = 1; while (weekdayOf(y, m, d) !== w) d++; }
    else { d = last; while (weekdayOf(y, m, d) !== w) d--; }
    return { ...base, target, w, ans: d };
  }
  if (kind === 'count') {
    const w = ri(rand, 0, 6);
    let c = 0;
    for (let d = 1; d <= last; d++) if (weekdayOf(y, m, d) === w) c++;
    return { ...base, w, ans: c, options: [c, c === 4 ? 5 : 4, 3, 6] };
  }
  if (kind === 'week') {
    const dir = pick(rand, [7, -7]);
    const d = dir > 0 ? ri(rand, 1, last - 7) : ri(rand, 8, last);
    return { ...base, d, dir, w: weekdayOf(y, m, d), ans: d + dir, options: nums(d + dir, [d - dir, d + dir / 7, d + dir - 1, d + dir + 1], last) };
  }
  if (kind === 'after') {
    const n = ri(rand, 2, 6);
    const d = ri(rand, 1, last - n);
    return { ...base, d, n, ans: d + n, options: nums(d + n, [d + n - 1, d + n + 1, d - n, n], last) };
  }
  if (kind === 'daysIn') {
    // Hỏi tháng 2 thì nói rõ năm
    return { ...base, ans: last, options: [28, 29, 30, 31] };
  }
  if (kind === 'untilEnd') {
    const d = ri(rand, last - 12, last - 2);
    const ans = last - d;
    return { ...base, d, ans, options: nums(ans, [ans + 1, ans - 1, 30 - d === ans ? 31 - d : 30 - d]) };
  }
  // birthday: hôm nay ngày d tháng m, sinh nhật ngày e tháng sau
  const d = ri(rand, last - 6, last - 1);
  const e = ri(rand, 1, 7);
  const ans = last - d + e;
  const m2 = (m % 12) + 1;
  return { ...base, d, e, m2, ans, options: nums(ans, [e - d + 30 === ans ? e - d + 31 : e - d + 30, ans - 1, ans + 1, last - d]) };
}

// Câu hỏi hiển thị trên màn hình
function questionOf(r) {
  const W = (w) => WEEKDAYS[w];
  switch (r.kind) {
    case 'next': return `Hôm nay là ${W(r.w)}. ${r.step === 1 ? 'Ngày mai' : r.step === -1 ? 'Hôm qua' : 'Ngày kia'} là thứ mấy?`;
    case 'sheet':
      if (r.ask === 'day') return 'Tờ lịch cho biết hôm nay là ngày bao nhiêu?';
      if (r.ask === 'month') return 'Tờ lịch cho biết hôm nay là tháng mấy?';
      if (r.ask === 'weekday') return 'Tờ lịch cho biết hôm nay là thứ mấy?';
      return 'Bóc tờ lịch này đi thì tờ lịch ngày mai ghi ngày bao nhiêu?';
    case 'weekday': return `Ngày ${r.d} tháng ${r.m} là thứ mấy?`;
    case 'tap':
      if (r.target === 'date') return `Chạm vào ngày ${r.ans} trên tờ lịch.`;
      return `Chạm vào ngày ${W(r.w)} ${r.target === 'first' ? 'đầu tiên' : 'cuối cùng'} của tháng ${r.m}.`;
    case 'count': return `Tháng ${r.m} năm ${r.y} có mấy ngày ${W(r.w)}?`;
    case 'week': return `Hôm nay là ${W(r.w)} ngày ${r.d}. ${W(r.w)} ${r.dir > 0 ? 'tuần sau' : 'tuần trước'} là ngày bao nhiêu?`;
    case 'after': return `Hôm nay là ngày ${r.d}. ${r.n} ngày nữa là ngày bao nhiêu?`;
    case 'daysIn': return r.m === 2 ? `Tháng 2 năm ${r.y} có bao nhiêu ngày?` : `Tháng ${r.m} có bao nhiêu ngày?`;
    case 'untilEnd': return `Hôm nay là ngày ${r.d} tháng ${r.m}. Còn mấy ngày nữa là đến ngày cuối cùng của tháng ${r.m}?`;
    default: return `Hôm nay là ngày ${r.d} tháng ${r.m}. Sinh nhật bé là ngày ${r.e} tháng ${r.m2}. Còn mấy ngày nữa là đến sinh nhật bé?`;
  }
}

// Chữ trên nút đáp án
function labelOf(r, v) {
  if (r.kind === 'next' || r.kind === 'weekday' || (r.kind === 'sheet' && r.ask === 'weekday')) return WEEKDAYS[v];
  if (r.kind === 'sheet' && r.ask === 'month') return `Tháng ${v}`;
  if (['sheet', 'week', 'after', 'tap'].includes(r.kind)) return `Ngày ${v}`;
  return `${v} ngày`;
}

const answerOf = (r) => r.ans;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: 0, round: 0, r: null, mistakes: 0, busy: false };

const game = createGame({
  id: 'to-lich-nha-be',
  title: '📅 Tờ Lịch Nhà Bé',
  sub: 'Xem thứ, ngày, tháng trên tờ lịch và đếm ngày đến sinh nhật!',
  levels: LEVELS.length,
  winTitle: 'Bé xem lịch giỏi quá! 📅',
  start: startLevel,
});

/* ---------- Vẽ ---------- */
// Cột lịch: Thứ Hai … Chủ nhật
const COLS = [1, 2, 3, 4, 5, 6, 0];
const SHORT = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

function drawWeek(r) {
  $('#week').innerHTML = COLS.map((w) => `<div class="day${w === r.w ? ' today' : ''}" data-w="${w}">${WEEKDAYS[w]}${w === r.w ? '<small>hôm nay</small>' : ''}</div>`).join('');
}

function drawSheet(r) {
  const w = weekdayOf(r.y, r.m, r.d);
  $('#sheet').innerHTML = `<div class="sheet-top">Tháng ${r.m} · ${r.y}</div><div class="sheet-day${w === 0 ? ' sunday' : ''}">${r.d}</div><div class="sheet-wd">${WEEKDAYS[w]}</div>`;
}

function drawCalendar(r, { tap = false, today = null } = {}) {
  const lead = (weekdayOf(r.y, r.m, 1) + 6) % 7; // số ô trống trước ngày 1
  const cells = Array(lead).fill('<span class="blank"></span>');
  for (let d = 1; d <= r.last; d++) {
    const tag = tap ? 'button' : 'span';
    const sunday = weekdayOf(r.y, r.m, d) === 0 ? ' sunday' : '';
    cells.push(`<${tag} class="date${sunday}${d === today ? ' today' : ''}" data-d="${d}">${d}</${tag}>`);
  }
  $('#cal').innerHTML = `<div class="cal-title">Tháng ${r.m} năm ${r.y}</div>`
    + `<div class="cal-grid">${COLS.map((w) => `<b class="${w === 0 ? 'sunday' : ''}">${SHORT[w]}</b>`).join('')}${cells.join('')}</div>`;
}

// Mẹo nắm tay: tháng nằm trên khớp xương nhô lên có 31 ngày, tháng nằm ở chỗ lõm có 30 ngày (tháng 2 ít hơn)
const KNUCKLES = [[1, 'up'], [2, 'down'], [3, 'up'], [4, 'down'], [5, 'up'], [6, 'down'], [7, 'up'], [8, 'up'], [9, 'down'], [10, 'up'], [11, 'down'], [12, 'up']];
function drawFist(r) {
  $('#fist').innerHTML = '<div class="fist-title">✊ Mẹo nắm tay</div><div class="knuckles">'
    + KNUCKLES.map(([m, h], i) => `<span class="k ${h}${m === r.m ? ' now' : ''}${i === 7 ? ' again' : ''}">${m}</span>`).join('') + '</div>';
}

function drawVisual(r) {
  const show = (id, on) => $(id).classList.toggle('hidden', !on);
  show('#week', r.kind === 'next');
  show('#sheet', r.kind === 'sheet');
  show('#cal', ['weekday', 'tap', 'count', 'week', 'after', 'untilEnd', 'birthday'].includes(r.kind));
  show('#fist', r.kind === 'daysIn');
  if (r.kind === 'next') drawWeek(r);
  if (r.kind === 'sheet') drawSheet(r);
  if (r.kind === 'daysIn') drawFist(r);
  if (!$('#cal').classList.contains('hidden')) drawCalendar(r, { tap: r.kind === 'tap', today: r.d ?? null });
}

// Sau khi trả lời đúng: tô ngày đáp án trên lịch
function markAnswer(r) {
  if (r.kind === 'next') return $(`#week [data-w="${r.ans}"]`)?.classList.add('answer');
  if (r.kind === 'weekday') return $(`#cal [data-d="${r.d}"]`)?.classList.add('answer');
  if (['tap', 'week', 'after'].includes(r.kind)) return $(`#cal [data-d="${r.ans}"]`)?.classList.add('answer');
  if (r.kind === 'count') for (const el of document.querySelectorAll('#cal .date')) if (weekdayOf(r.y, r.m, Number(el.dataset.d)) === r.w) el.classList.add('answer');
  if (r.kind === 'untilEnd' || r.kind === 'birthday') for (const el of document.querySelectorAll('#cal .date')) if (Number(el.dataset.d) > r.d) el.classList.add('answer');
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
  game.rounds(state.round, ROUNDS);
  drawVisual(r);
  const q = questionOf(r);
  $('#question').textContent = q;
  game.say(state.round === 0 ? `${LEVELS[state.level].tip} ${q}` : q);
  $('#choices').classList.toggle('hidden', r.kind === 'tap');
  if (r.kind === 'tap') return;
  const opts = window.shuffle(r.options);
  renderChoices($('#choices'), opts.map((v) => labelOf(r, v)), (i) => {
    if (state.busy) return false;
    const ok = opts[i] === answerOf(r);
    if (ok) correct();
    else wrong(hintFor(r));
    return ok;
  }, (i) => opts[i] === answerOf(r));
}

$('#cal').addEventListener('click', (e) => {
  const btn = e.target.closest('button.date');
  const r = state.r;
  if (!btn || state.busy || r?.kind !== 'tap') return;
  if (Number(btn.dataset.d) === answerOf(r)) return correct();
  btn.classList.add('wrong-date');
  setTimeout(() => btn.classList.remove('wrong-date'), 400);
  wrong(hintFor(r));
});

function hintFor(r) {
  const W = (w) => WEEKDAYS[w];
  switch (r.kind) {
    case 'next': return r.step === -1 ? `Hôm qua là ngày ngay trước ${W(r.w)}.` : `Đọc lần lượt các ngày trong tuần, bắt đầu từ ${W(r.w)}.`;
    case 'sheet': return r.ask === 'tomorrow' ? 'Ngày mai thì số ngày tăng thêm 1.' : 'Nhìn kĩ tờ lịch: số to là ngày, dòng trên là tháng, dòng dưới là thứ.';
    case 'weekday': return `Tìm ngày ${r.d} trên lịch, rồi nhìn lên đầu cột của ngày đó.`;
    case 'tap': return r.target === 'date' ? `Tìm số ${r.ans} trên tờ lịch nhé.` : `Tìm cột ${SHORT[r.w]} trên lịch, rồi xem ngày ${r.target === 'first' ? 'trên cùng' : 'dưới cùng'} của cột đó.`;
    case 'count': return `Đếm các ngày trong cột ${SHORT[r.w]} nhé.`;
    case 'week': return `Một tuần có 7 ngày: ${r.d} ${r.dir > 0 ? '+' : '−'} 7.`;
    case 'after': return `Đếm tiếp từ ngày ${r.d}: thêm ${r.n} ngày nữa.`;
    case 'daysIn': return r.m === 2 ? 'Tháng 2 năm nhuận có 29 ngày, năm thường có 28 ngày. Năm nhuận chia hết cho 4.' : 'Nắm tay lại, đếm tháng trên các khớp xương: khớp nhô lên là 31 ngày, chỗ lõm là 30 ngày.';
    case 'untilEnd': return `Tháng ${r.m} có ${r.last} ngày. Lấy ${r.last} trừ ${r.d}.`;
    default: return `Còn ${r.last - r.d} ngày nữa là hết tháng ${r.m}, rồi cộng thêm ${r.e} ngày của tháng ${r.m2}.`;
  }
}

async function correct() {
  state.busy = true;
  game.sfx.good();
  const r = state.r;
  markAnswer(r);
  game.say(`Đúng rồi! ${labelOf(r, r.ans)}. 🎉`, 'cheer', 'good');
  if (!(await game.wait(1600))) return;
  state.round++;
  if (state.round < ROUNDS) return showRound();
  game.rounds(state.round, ROUNDS);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: LEVELS[state.level].name,
    text: stars === 3 ? 'Không sai câu nào. Bé xem lịch như người lớn rồi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  game.say(hint, 'sad', 'soft');
}
