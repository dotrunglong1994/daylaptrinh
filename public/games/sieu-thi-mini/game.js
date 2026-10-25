const ROUNDS = 5; // số khách mỗi lượt chơi, mỗi khách có 2 bước: tính tổng + thối tiền
const ITEMS = [
  { emoji: '🍎', name: 'Táo' }, { emoji: '🍌', name: 'Chuối' }, { emoji: '🥛', name: 'Sữa' },
  { emoji: '🍞', name: 'Bánh mì' }, { emoji: '🥚', name: 'Trứng' }, { emoji: '🍬', name: 'Kẹo' },
  { emoji: '✏️', name: 'Bút chì' }, { emoji: '📒', name: 'Vở' }, { emoji: '🧃', name: 'Nước ép' },
  { emoji: '🍦', name: 'Kem' }, { emoji: '🥕', name: 'Cà rốt' }, { emoji: '🍉', name: 'Dưa hấu' },
];
const CUSTOMERS = [
  { face: '🐰', name: 'Thỏ' }, { face: '🐻', name: 'Gấu' }, { face: '🐱', name: 'Mèo' }, { face: '🐶', name: 'Cún' },
  { face: '🦊', name: 'Cáo' }, { face: '🐼', name: 'Gấu trúc' }, { face: '🐷', name: 'Heo' }, { face: '🐨', name: 'Koala' },
];
// Mệnh giá tính bằng nghìn đồng; màu chỉ để phân biệt, không mô phỏng tờ tiền thật
const BILL_COLORS = { 1: '#a8956a', 2: '#9c7350', 5: '#4f6fb0', 10: '#c49a1c', 20: '#2f80c2', 50: '#cf5689', 100: '#3f9460' };
const LEVELS = {
  1: { items: [2, 2], price: [1, 4], pays: [10], bills: [1, 2, 5] },
  2: { items: [2, 3], price: [1, 9], pays: [10, 20, 50], bills: [1, 2, 5, 10, 20] },
  3: { items: [3, 4], price: [2, 20], pays: [50, 100], bills: [1, 2, 5, 10, 20, 50] },
};
const PRAISE = ['Giỏi quá!', 'Chính xác!', 'Tuyệt vời!', 'Bé tính nhanh ghê!'];

const $ = (s) => document.querySelector(s);
const state = {
  level: 1, sound: true, voice: true,
  round: 0, score: 0, firstTry: 0, wrongs: 0, phase: 'total', order: null, tray: [], locked: false, timer: 0,
};

/* ---------- Tiện ích ---------- */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const money = (k) => `${(k * 1000).toLocaleString('vi-VN')}đ`;
const billHtml = (k, tag = 'div', attrs = '') =>
  `<${tag} class="bill" style="--c:${BILL_COLORS[k]}" ${attrs}><span>${(k * 1000).toLocaleString('vi-VN')}<small>đ</small></span></${tag}>`;

function loadBest() {
  try { return JSON.parse(localStorage.getItem('stm-best') || '{}'); } catch { return {}; }
}
function saveBest(best) {
  try { localStorage.setItem('stm-best', JSON.stringify(best)); } catch {}
}

/* ---------- Âm thanh ---------- */
let actx;
function tone(freq, dur, { type = 'sine', vol = 0.15, to = null, delay = 0 } = {}) {
  if (!state.sound) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}
const sfx = {
  tap: () => tone(700, 0.06, { type: 'triangle', vol: 0.1 }),
  // tiếng "ting" của máy tính tiền
  register: () => { tone(1320, 0.25, { vol: 0.12 }); tone(1760, 0.35, { vol: 0.1, delay: 0.08 }); },
  wrong: () => tone(260, 0.3, { type: 'square', to: 140, vol: 0.05 }),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, { type: 'triangle', delay: i * 0.14, vol: 0.12 })),
};

/* ---------- Đọc bằng giọng tiếng Việt (nếu máy có) ---------- */
let viVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  viVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('vi')) || null;
}
pickVoice();
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;
function speak(text) {
  if (!state.voice || !viVoice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = viVoice;
  u.lang = viVoice.lang;
  u.rate = 0.95;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

/* ---------- Tạo đơn hàng ---------- */
function makeOrder() {
  const L = LEVELS[state.level];
  const count = rand(...L.items);
  const items = shuffle(ITEMS.slice()).slice(0, count).map((it) => ({ ...it, price: rand(...L.price) }));
  const total = items.reduce((s, it) => s + it.price, 0);
  // Khách đưa tờ tiền nhỏ nhất lớn hơn tổng, để luôn có tiền thối
  const paid = L.pays.find((p) => p > total) ?? Math.ceil((total + 1) / 10) * 10;
  return { customer: pick(CUSTOMERS), items, total, paid, change: paid - total };
}

function totalOptions(order) {
  const { total, items } = order;
  const cands = [total + 1, total - 1, total + 2, total - 2, total - items[0].price, total + 10, total - 10];
  const out = new Set();
  for (const v of shuffle(cands)) {
    if (out.size >= 3) break;
    if (v > 0 && v !== total) out.add(v);
  }
  return shuffle([total, ...out]);
}

/* ---------- Điều hướng ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}
function renderMenuBest() {
  const best = loadBest()[state.level];
  $('#menuBest').textContent = best ? `🏆 Kỷ lục mức này: ${best} điểm` : '';
}
document.querySelector('.levels').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  btn.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  state.level = Number(btn.dataset.level);
  renderMenuBest();
});

/* ---------- Vòng chơi ---------- */
function startGame() {
  clearTimeout(state.timer);
  Object.assign(state, { round: 0, score: 0, firstTry: 0 });
  show('game');
  renderDrawer();
  nextCustomer();
}

function nextCustomer() {
  if (state.round >= ROUNDS) return endGame();
  state.round++;
  const o = (state.order = makeOrder());
  const c = $('#customer');
  c.classList.remove('leave', 'enter');
  void c.offsetWidth; // chạy lại animation
  c.classList.add('enter');
  $('#customerFace').textContent = o.customer.face;
  $('#customerName').textContent = `Bạn ${o.customer.name}`;
  $('#paid').innerHTML = '';
  $('#items').innerHTML = o.items.map((it) =>
    `<div class="item"><span class="emoji">${it.emoji}</span><span class="label">${it.name}</span><span class="price">${money(it.price)}</span></div>`
  ).join('');
  updateHud();
  startTotalPhase();
}

function startTotalPhase() {
  const o = state.order;
  state.phase = 'total';
  state.wrongs = 0;
  state.locked = false;
  $('#customerSay').textContent = 'Cho mình mua mấy món này nhé!';
  $('#receipt').innerHTML = '🧾 Tổng cộng: <b>?</b>';
  $('#question').textContent = 'Tổng cộng bao nhiêu tiền?';
  $('#hint').textContent = '';
  $('#changeArea').classList.add('hidden');
  const opts = $('#options');
  opts.classList.remove('hidden');
  opts.innerHTML = totalOptions(o).map((v) => `<button data-v="${v}">${money(v)}</button>`).join('');
  window.mascotSay('Cộng giá các món lại nhé!', null, '', 0);
  readQuestion();
}

function readQuestion() {
  const o = state.order;
  if (!o) return;
  if (state.phase === 'total') {
    speak(`${o.items.map((it) => `${it.name} ${it.price} nghìn`).join(', ')}. Tổng cộng bao nhiêu tiền?`);
  } else {
    speak(`Khách đưa ${o.paid} nghìn đồng. Bé thối lại bao nhiêu?`);
  }
}

$('#options').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled || state.locked) return;
  const v = Number(btn.dataset.v);
  const o = state.order;
  if (v === o.total) {
    state.locked = true;
    btn.classList.add('right');
    sfx.register();
    award();
    $('#receipt').innerHTML = `🧾 Tổng cộng: <b class="ok">${money(o.total)}</b>`;
    window.mascotSay(pick(PRAISE), 'happy', 'good', 0);
    state.timer = setTimeout(startChangePhase, 1000);
  } else {
    btn.disabled = true;
    btn.classList.add('wrong');
    miss();
    if (state.wrongs >= 2) $('#hint').textContent = `Gợi ý: ${o.items.map((it) => money(it.price)).join(' + ')}`;
  }
});

function startChangePhase() {
  const o = state.order;
  state.phase = 'change';
  state.wrongs = 0;
  state.locked = false;
  state.tray = [];
  $('#customerSay').textContent = `Mình gửi ${money(o.paid)} nhé!`;
  $('#paid').innerHTML = billHtml(o.paid);
  $('#question').textContent = `Bạn ${o.customer.name} đưa ${money(o.paid)}. Bé thối lại bao nhiêu?`;
  $('#hint').textContent = '';
  $('#options').classList.add('hidden');
  $('#changeArea').classList.remove('hidden');
  renderTray();
  window.mascotSay('Lấy tiền trong ngăn kéo để thối cho khách nhé!', null, '', 0);
  readQuestion();
}

function renderDrawer() {
  $('#drawer').innerHTML = LEVELS[state.level].bills.map((k) => billHtml(k, 'button', `data-k="${k}"`)).join('');
}

function renderTray() {
  $('#tray').innerHTML = state.tray.map((k, i) => billHtml(k, 'button', `data-i="${i}" title="Bỏ ra"`)).join('');
  $('#traySum').textContent = money(state.tray.reduce((s, k) => s + k, 0));
}

$('#drawer').addEventListener('click', (e) => {
  const btn = e.target.closest('.bill');
  if (!btn || state.locked) return;
  if (state.tray.length >= 12) return window.mascotSay('Nhiều tiền quá rồi, bỏ bớt ra nhé!', 'sad', 'soft', 0);
  state.tray.push(Number(btn.dataset.k));
  sfx.tap();
  renderTray();
});

$('#tray').addEventListener('click', (e) => {
  const btn = e.target.closest('.bill');
  if (!btn || state.locked) return;
  state.tray.splice(Number(btn.dataset.i), 1);
  sfx.tap();
  renderTray();
});

$('#giveBtn').addEventListener('click', () => {
  if (state.locked) return;
  const o = state.order;
  const sum = state.tray.reduce((s, k) => s + k, 0);
  if (!sum) return window.mascotSay('Bé chọn tiền trong ngăn kéo trước nhé!', 'sad', 'soft', 0);
  if (sum === o.change) {
    state.locked = true;
    sfx.register();
    award();
    $('#customerSay').textContent = 'Cảm ơn bé nhiều! 💕';
    $('#paid').innerHTML = '';
    window.mascotSay(`Đúng rồi! Thối ${money(o.change)}. ${pick(PRAISE)}`, 'cheer', 'good', 0);
    speak('Cảm ơn bé nhiều!');
    state.timer = setTimeout(() => {
      $('#customer').classList.remove('enter');
      $('#customer').classList.add('leave');
      state.timer = setTimeout(nextCustomer, 700);
    }, 1100);
  } else {
    miss(sum > o.change ? 'Ối, thối nhiều quá rồi! Bỏ bớt ra nhé.' : 'Còn thiếu một chút, thêm tiền nhé!');
    if (state.wrongs >= 3) $('#hint').textContent = `Gợi ý: ${money(o.paid)} − ${money(o.total)} = ${money(o.change)}`;
    else if (state.wrongs >= 2) $('#hint').textContent = `Gợi ý: lấy ${money(o.paid)} trừ đi ${money(o.total)}`;
  }
});

function award() {
  state.score += state.wrongs === 0 ? 10 : 5;
  if (state.wrongs === 0) state.firstTry++;
  updateHud();
}

function miss(text = pick(['Chưa đúng, thử lại nhé!', 'Gần đúng rồi!', 'Bé tính lại xem nào!'])) {
  state.wrongs++;
  sfx.wrong();
  window.mascotSay(text, 'sad', 'soft', 0);
}

function endGame() {
  const total = ROUNDS * 2;
  const stars = state.firstTry >= total - 1 ? 3 : state.firstTry >= total * 0.6 ? 2 : 1;
  const best = loadBest();
  const prev = best[state.level] || 0;
  const isRecord = state.score > prev;
  if (isRecord) { best[state.level] = state.score; saveBest(best); }

  $('#resultTitle').textContent = stars === 3 ? 'Thu ngân giỏi nhất! 🎉' : stars === 2 ? 'Giỏi lắm! 👏' : 'Cố lên nhé! 💪';
  $('#stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#rCorrect').innerHTML = `Đúng ngay lần đầu: <b>${state.firstTry}</b>/${total}`;
  $('#rScore').textContent = state.score;
  $('#rBest').textContent = isRecord ? '🏆 Kỷ lục mới!' : `🏆 Kỷ lục: ${prev} điểm`;
  show('result');
  sfx.fanfare();
  confetti(stars * 30);
  window.reportResult?.({ gameId: 'sieu-thi-mini', stars, score: state.score });
  speak(stars === 3 ? 'Tuyệt vời! Bé là thu ngân giỏi nhất!' : `Bé được ${stars} sao. Cố lên nhé!`);
}

function confetti(count) {
  const colors = Object.values(BILL_COLORS);
  for (let i = 0; i < count; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};` +
      `animation-duration:${2 + Math.random() * 2}s;animation-delay:${Math.random() * 0.8}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function updateHud() {
  $('#progressFill').style.width = `${((state.round - 1) / ROUNDS) * 100}%`;
  $('#progressText').textContent = `Khách ${state.round}/${ROUNDS}`;
  $('#score').textContent = state.score;
}

/* ---------- Nút bấm ---------- */
$('#startBtn').addEventListener('click', startGame);
$('#againBtn').addEventListener('click', startGame);
$('#menuBtn').addEventListener('click', () => { show('menu'); renderMenuBest(); });
$('#homeBtn').addEventListener('click', () => {
  clearTimeout(state.timer);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  show('menu');
  renderMenuBest();
});
$('#question').addEventListener('click', readQuestion);
$('#soundBtn').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.currentTarget.classList.toggle('off', !state.sound);
});
$('#voiceBtn').addEventListener('click', (e) => {
  state.voice = !state.voice;
  e.currentTarget.classList.toggle('off', !state.voice);
  if (!state.voice && 'speechSynthesis' in window) speechSynthesis.cancel();
});

renderMenuBest();
