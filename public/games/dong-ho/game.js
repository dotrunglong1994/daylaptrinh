// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Giờ viết "7:15". type: set = bé quay kim, read = bé đọc giờ, after = tính giờ (add phút, âm = trước đó).
// step: kim phút nhảy mấy phút một lần. style: 'ruoi' (7 giờ rưỡi), 'kem' (8 giờ kém 15 phút).
const LEVELS = [
  { name: 'Giờ đúng', step: 60, rounds: [
    { type: 'set', time: '3:00' }, { type: 'read', time: '6:00' }, { type: 'set', time: '9:00' }, { type: 'read', time: '12:00' },
  ], tip: 'Kim ngắn chỉ giờ, kim dài chỉ phút. Giờ đúng thì kim dài chỉ số 12!' },
  { name: 'Giờ rưỡi', step: 30, style: 'ruoi', rounds: [
    { type: 'set', time: '2:30' }, { type: 'read', time: '7:30' }, { type: 'set', time: '11:30' }, { type: 'read', time: '4:00' },
  ], tip: 'Rưỡi là 30 phút: kim dài chỉ số 6, kim ngắn nằm giữa hai số.' },
  { name: 'Mười lăm phút', step: 15, rounds: [
    { type: 'set', time: '8:15' }, { type: 'read', time: '5:45' }, { type: 'set', time: '10:45' }, { type: 'read', time: '1:15' },
  ], tip: 'Mỗi số trên mặt đồng hồ cách nhau 5 phút. Kim dài chỉ số 3 là 15 phút.' },
  { name: 'Năm phút', step: 5, rounds: [
    { type: 'set', time: '9:05' }, { type: 'read', time: '2:50' }, { type: 'set', time: '6:25' }, { type: 'read', time: '11:40' },
  ], tip: 'Đếm 5, 10, 15… theo các số mà kim dài đi qua.' },
  { name: 'Giờ kém', step: 5, style: 'kem', rounds: [
    { type: 'read', time: '7:45' }, { type: 'set', time: '3:50' }, { type: 'read', time: '10:55' }, { type: 'set', time: '5:40' },
  ], tip: '7 giờ 45 phút còn gọi là 8 giờ kém 15 phút: còn 15 phút nữa là 8 giờ.' },
  { name: 'Số La Mã', step: 5, roman: true, style: 'kem', rounds: [
    { type: 'set', time: '4:20' }, { type: 'read', time: '9:35' }, { type: 'read', time: '12:10' }, { type: 'set', time: '7:55' },
  ], tip: 'Đồng hồ này dùng số La Mã: I = 1, V = 5, X = 10. IV = 4, IX = 9, XII = 12.' },
  { name: 'Thời gian trôi', step: 5, rounds: [
    { type: 'after', from: '7:00', add: 30, story: 'Bé bắt đầu ăn sáng lúc {from} và ăn hết {add} phút. Bé ăn xong lúc mấy giờ?' },
    { type: 'after', from: '8:15', add: 45, story: 'Phim hoạt hình bắt đầu lúc {from}, dài {add} phút. Phim kết thúc lúc mấy giờ?' },
    { type: 'after', from: '2:40', add: 35, story: 'Bé đá bóng từ {from}, chơi {add} phút. Bé nghỉ lúc mấy giờ?' },
    { type: 'after', from: '7:00', add: -20, story: 'Trường vào học lúc {from}. Bé đi bộ tới trường mất {add} phút. Bé phải đi lúc mấy giờ?' },
  ], tip: 'Đồng hồ đang chỉ giờ bắt đầu. Bé quay kim thêm đúng số phút nhé!' },
  { name: 'Từng phút', step: 1, style: 'kem', rounds: [
    { type: 'set', time: '3:07' }, { type: 'read', time: '8:52' },
    { type: 'after', from: '10:48', add: 25, story: 'Xe buýt chạy lúc {from}, đi {add} phút thì tới nơi. Xe tới lúc mấy giờ?' },
    { type: 'read', time: '6:13' },
  ], tip: 'Mỗi vạch nhỏ là 1 phút. Đếm theo số tròn 5 rồi đếm thêm vạch lẻ.' },
];

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

// "7:15" → số phút tính từ 12:00 (0…719)
function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12 || Number(m[2]) > 59) throw new Error(`Giờ sai: ${text}`);
  return (Number(m[1]) % 12) * 60 + Number(m[2]);
}
const norm = (t) => ((t % 720) + 720) % 720;
const hourOf = (t) => Math.floor(norm(t) / 60) || 12;

function digital(t) {
  return `${hourOf(t)}:${String(norm(t) % 60).padStart(2, '0')}`;
}

// Đọc giờ bằng lời: "7 giờ", "7 giờ rưỡi", "8 giờ kém 15 phút"
function timeText(t, style) {
  const h = hourOf(t);
  const m = norm(t) % 60;
  if (m === 0) return `${h} giờ`;
  if (m === 30 && style === 'ruoi') return `${h} giờ rưỡi`;
  if (m >= 40 && style === 'kem') return `${hourOf(t + 60)} giờ kém ${60 - m} phút`;
  return `${h} giờ ${m} phút`;
}

// Giờ đúng của một câu
const answerOf = (round) => (round.type === 'after' ? norm(parseTime(round.from) + round.add) : parseTime(round.time));

// 4 đáp án cho câu "read": nhầm kim giờ với kim phút, lệch 1 giờ, lệch vài phút
function readOptions(round, level) {
  const t = answerOf(round);
  const h = hourOf(t) % 12;
  const m = t % 60;
  const step = Math.max(level.step, 5);
  const swapped = (m % 5 === 0) ? (m / 5) * 60 + (h * 5) : null;
  const near = [swapped, t + 60, t - 60, t + step, t - step, t + 30, t + 2 * step]
    .filter((x) => x !== null && (level.step < 30 || x % level.step === 0)).map(norm);
  const opts = [t];
  for (const x of near) if (!opts.includes(x) && opts.length < 4) opts.push(x);
  return opts;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, round: 0, t: 0, mistakes: 0, busy: false, drag: null };

const game = createGame({
  id: 'dong-ho',
  title: '🕰️ Đồng Hồ Thần Kỳ',
  sub: 'Quay kim đồng hồ, đọc giờ và tính thời gian!',
  levels: LEVELS.length,
  winTitle: 'Bé xem giờ giỏi quá! 🕰️',
  start: startLevel,
});

/* ---------- Mặt đồng hồ ---------- */
function drawFace(roman) {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const a = (i / 60) * 2 * Math.PI;
    const r1 = big ? 76 : 80;
    ticks += `<line class="tick${big ? ' big' : ''}" x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * 85}" y2="${100 - Math.cos(a) * 85}" />`;
  }
  $('#ticks').innerHTML = ticks;
  $('#numbers').innerHTML = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 2 * Math.PI;
    const label = roman ? ROMAN[i] : i || 12;
    return `<text class="num${roman ? ' roman' : ''}" x="${100 + Math.sin(a) * 64}" y="${100 - Math.cos(a) * 64}">${label}</text>`;
  }).join('');
}

function drawHands() {
  const t = norm(state.t);
  $('#hourHand').setAttribute('transform', `rotate(${(t / 720) * 360} 100 100)`);
  $('#minuteHand').setAttribute('transform', `rotate(${((t % 60) / 60) * 360} 100 100)`);
}

/* ---------- Kéo kim ---------- */
function angleAt(e) {
  const box = $('#clock').getBoundingClientRect();
  const x = e.clientX - (box.left + box.width / 2);
  const y = e.clientY - (box.top + box.height / 2);
  return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
}

$('#clock').addEventListener('pointerdown', (e) => {
  const hand = e.target.closest('[data-hand]');
  if (!hand || !canSet()) return;
  // Màn giờ đúng: kim phút đứng yên ở số 12 (có thể nằm đè kim giờ), nên kéo kim nào cũng là quay kim giờ
  state.drag = state.level.step >= 60 ? 'hour' : hand.dataset.hand;
  $('#clock').setPointerCapture(e.pointerId);
});
$('#clock').addEventListener('pointermove', (e) => {
  if (!state.drag) return;
  const step = state.level.step;
  const a = angleAt(e);
  const m = norm(state.t) % 60;
  if (state.drag === 'minute') {
    // Kim phút: nhích theo bước, đi qua số 12 thì kim giờ cũng nhích theo
    const target = (Math.round(((a / 360) * 60) / Math.min(step, 60)) * Math.min(step, 60)) % 60;
    if (step >= 60) return;
    let delta = target - m;
    if (delta < -30) delta += 60;
    if (delta > 30) delta -= 60;
    if (delta) { state.t = norm(state.t + delta); game.sfx.tap(); }
  } else {
    // Kim giờ: chọn giờ gần nhất, giữ nguyên số phút
    const h = Math.round((a / 360) * 12 - m / 60) % 12;
    const t = norm(h * 60 + m);
    if (t !== state.t) { state.t = t; game.sfx.tap(); }
  }
  drawHands();
});
const endDrag = () => (state.drag = null);
$('#clock').addEventListener('pointerup', endDrag);
$('#clock').addEventListener('pointercancel', endDrag);

$('#setControls').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-step]');
  if (!btn || !canSet()) return;
  const n = Number(btn.dataset.step);
  state.t = norm(state.t + (Math.abs(n) === 1 ? n * Math.min(state.level.step, 60) : n));
  game.sfx.tap();
  drawHands();
});

/* ---------- Các câu hỏi ---------- */
const round = () => state.level.rounds[state.round];
const canSet = () => !state.busy && round() && round().type !== 'read';

function startLevel(idx) {
  state.level = LEVELS[idx];
  state.round = 0;
  state.mistakes = 0;
  drawFace(!!state.level.roman);
  const step = Math.min(state.level.step, 60);
  $('#minusBtn').textContent = step === 60 ? '⏪ 1 giờ' : `◀ ${step} phút`;
  $('#plusBtn').textContent = step === 60 ? '1 giờ ⏩' : `${step} phút ▶`;
  // Bước 60 phút: hai nút giữa trùng với hai nút ngoài nên ẩn bớt
  for (const b of document.querySelectorAll('[data-step="-60"], [data-step="60"]')) b.classList.toggle('hidden', step === 60);
  game.say(state.level.tip);
  showRound();
}

function showRound() {
  const r = round();
  const style = state.level.style;
  state.busy = false;
  $('#clock').classList.remove('ok');
  game.rounds(state.round, state.level.rounds.length);
  const isRead = r.type === 'read';
  $('#setControls').classList.toggle('hidden', isRead);
  $('#checkRow').classList.toggle('hidden', isRead);
  $('#choices').classList.toggle('hidden', !isRead);
  $('#clock').classList.toggle('can-drag', !isRead);

  if (r.type === 'set') {
    // Kim bắt đầu ở 12 giờ (hoặc 6 giờ nếu đề hỏi 12 giờ)
    state.t = parseTime(r.time) === 0 ? 360 : 0;
    $('#question').textContent = `Quay kim chỉ ${timeText(parseTime(r.time), style)} (${r.time})`;
  } else if (r.type === 'read') {
    state.t = parseTime(r.time);
    $('#question').textContent = 'Đồng hồ đang chỉ mấy giờ?';
    const opts = window.shuffle(readOptions(r, state.level));
    renderChoices($('#choices'), opts.map((t) => (state.level.step >= 60 ? timeText(t, style) : `${digital(t)}<br><small>${timeText(t, style)}</small>`)), (i) => {
      const ok = opts[i] === answerOf(r);
      if (ok) correct(); else wrong(`Chưa đúng. Nhìn kim ngắn trước để biết giờ, rồi xem kim dài nhé.`);
      return ok;
    }, (i) => opts[i] === answerOf(r));
  } else {
    state.t = parseTime(r.from);
    $('#question').textContent = r.story.replace('{from}', timeText(state.t, style)).replace('{add}', Math.abs(r.add));
  }
  drawHands();
}

$('#checkBtn').addEventListener('click', () => {
  if (!canSet()) return;
  const r = round();
  const want = answerOf(r);
  if (norm(state.t) === want) return correct();
  const now = norm(state.t);
  let hint = `Đồng hồ đang chỉ ${timeText(now, state.level.style)}.`;
  if (now % 60 === want % 60) hint += ' Kim phút đúng rồi, xem lại kim giờ nhé!';
  else if (hourOf(now) === hourOf(want)) hint += ' Kim giờ đúng rồi, xem lại kim phút nhé!';
  wrong(hint);
});

async function correct() {
  state.busy = true;
  game.sfx.good();
  $('#clock').classList.add('ok');
  const r = round();
  const t = answerOf(r);
  game.say(`Đúng rồi! ${timeText(t, state.level.style)} 🎉`, 'cheer', 'good');
  if (!(await game.wait(1300))) return;
  state.round++;
  if (state.round < state.level.rounds.length) return showRound();
  game.rounds(state.round, state.level.rounds.length);
  const stars = game.starsFor(state.mistakes);
  game.win({
    stars,
    eq: state.level.name,
    text: stars === 3 ? 'Không sai câu nào. Bé xem giờ như người lớn rồi!' : `Bé sai ${state.mistakes} lần. Chơi lại để được 3 sao nhé!`,
  });
}

function wrong(hint) {
  state.mistakes++;
  game.sfx.bad();
  $('#clock').classList.remove('shake');
  void $('#clock').offsetWidth;
  $('#clock').classList.add('shake');
  game.say(hint, 'sad', 'soft');
}
