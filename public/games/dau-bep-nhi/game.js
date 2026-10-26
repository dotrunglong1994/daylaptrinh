const STEP_MS = 750;

// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng món)
// steps: [id, biểu tượng, việc làm, các bước phải làm trước]. Thứ tự liệt kê là một lời giải đúng;
// bước nào không phụ thuộc nhau thì đổi chỗ được. extras: thẻ thừa [biểu tượng, việc làm, lời chê].
const LEVELS = [
  { dish: ['🍹', 'Nước cam'], tip: 'Chạm vào thẻ bước theo đúng thứ tự, rồi bấm Nấu thử!',
    steps: [['cat', '🔪', 'Cắt cam làm đôi'], ['vat', '🍊', 'Vắt cam vào ly', ['cat']], ['moi', '🥤', 'Mời bố mẹ uống', ['vat']]] },
  { dish: ['🥪', 'Bánh mì kẹp trứng'], tip: 'Có những bước làm trước hay sau đều được đó!',
    steps: [['cat', '🥖', 'Cắt đôi ổ bánh mì'], ['chien', '🍳', 'Chiên một quả trứng'],
      ['kep', '🥪', 'Kẹp trứng vào bánh mì', ['cat', 'chien']], ['an', '😋', 'Ăn thôi', ['kep']]] },
  { dish: ['🍳', 'Trứng chiên'], tip: 'Robot làm đúng y như công thức, không tự sửa đâu!',
    steps: [['dap', '🥚', 'Đập trứng vào bát'], ['danh', '🥢', 'Đánh tan trứng', ['dap']],
      ['bep', '🔥', 'Bật bếp, cho dầu vào chảo'], ['do', '🍳', 'Đổ trứng vào chảo', ['danh', 'bep']],
      ['lat', '🔄', 'Lật mặt trứng', ['do']], ['bay', '🍽️', 'Bày ra đĩa', ['lat']]] },
  { dish: ['🍜', 'Mì nước'], tip: 'Nghĩ xem nước phải sôi trước hay sau khi thả mì nhé.',
    steps: [['dun', '♨️', 'Đun sôi nước'], ['boc', '📦', 'Bóc gói mì'],
      ['tha', '🍜', 'Thả mì vào nồi', ['dun', 'boc']], ['gia', '🧂', 'Cho gói gia vị', ['tha']],
      ['cho', '⏳', 'Chờ 3 phút', ['tha']], ['muc', '🥣', 'Múc ra bát', ['gia', 'cho']]] },
  { dish: ['🥤', 'Sinh tố chuối'], tip: 'Máy xay chỉ chạy khi đã có đủ đồ bên trong!',
    steps: [['boc', '🍌', 'Bóc vỏ chuối'], ['cho', '🫙', 'Cho chuối vào máy xay', ['boc']],
      ['sua', '🥛', 'Đổ sữa vào máy xay'], ['xay', '🔌', 'Bật máy xay', ['cho', 'sua']], ['rot', '🥤', 'Rót ra ly', ['xay']]] },
  { dish: ['🥗', 'Salad hoa quả'], tip: 'Có một thẻ KHÔNG thuộc công thức. Đừng cho nó vào nhé!',
    steps: [['rua', '💧', 'Rửa sạch hoa quả'], ['cat', '🔪', 'Cắt hoa quả thành miếng', ['rua']],
      ['bat', '🥣', 'Cho hoa quả vào bát', ['cat']], ['sua', '🥛', 'Rưới sữa chua lên trên', ['bat']], ['tron', '🥄', 'Trộn đều', ['sua']]],
    extras: [['🔥', 'Nướng hoa quả trong lò', 'Ai lại đi nướng salad! Bước này thừa rồi.']] },
  { dish: ['🍚', 'Cơm rang trứng'], tip: 'Lần này có 2 thẻ thừa trốn trong đống thẻ!',
    steps: [['bep', '🔥', 'Bật bếp, cho dầu vào chảo'], ['hanh', '🧅', 'Phi hành cho thơm', ['bep']],
      ['com', '🍚', 'Cho cơm nguội vào chảo', ['hanh']], ['trung', '🥚', 'Đập trứng vào, đảo đều', ['com']],
      ['nem', '🧂', 'Nêm nước mắm', ['com']], ['bay', '🍽️', 'Bày ra đĩa', ['trung', 'nem']]],
    extras: [['💦', 'Đổ nước ngập cơm', 'Đổ nước vào thì thành cháo mất rồi!'], ['🧊', 'Cho cơm vào tủ đá', 'Cơm đông cứng thì rang sao được!']] },
  { dish: ['🥞', 'Bánh kếp mật ong'], tip: 'Món khó nhất: 7 bước và 2 thẻ thừa. Đầu bếp nhí cố lên!',
    steps: [['dap', '🥚', 'Đập trứng vào bát'], ['bot', '🌾', 'Thêm bột mì và sữa'],
      ['khuay', '🥢', 'Khuấy đều thành bột lỏng', ['dap', 'bot']], ['chao', '🔥', 'Làm nóng chảo'],
      ['do', '🫓', 'Đổ bột vào chảo', ['khuay', 'chao']], ['lat', '🔄', 'Lật bánh', ['do']], ['mat', '🍯', 'Rưới mật ong', ['lat']]],
    extras: [['🧂', 'Rắc thật nhiều muối', 'Bánh mặn chát luôn! Bước này thừa.'], ['🧦', 'Cho tất vào bột', 'Eo ơi! Tất đâu phải đồ ăn 🤢']] },
];

// Mọi thẻ của một món: bước thật có id riêng, thẻ thừa có id x0, x1…
function cardsOf(level) {
  const steps = level.steps.map(([id, icon, text, after = []]) => ({ id, icon, text, after }));
  const extras = (level.extras || []).map(([icon, text, oops], i) => ({ id: `x${i}`, icon, text, oops, extra: true }));
  return [...steps, ...extras];
}

// Chạy công thức (mảng id). Trả về { ok } hoặc chỗ hỏng:
// extra = có thẻ thừa, order = làm khi chưa xong bước cần trước (need), missing = thiếu bước.
function checkPlan(level, plan) {
  const cards = Object.fromEntries(cardsOf(level).map((c) => [c.id, c]));
  const done = new Set();
  for (let i = 0; i < plan.length; i++) {
    const card = cards[plan[i]];
    if (card.extra) return { ok: false, at: i, reason: 'extra' };
    const need = card.after.find((id) => !done.has(id));
    if (need) return { ok: false, at: i, reason: 'order', need };
    done.add(card.id);
  }
  if (done.size < level.steps.length) return { ok: false, at: plan.length, reason: 'missing' };
  return { ok: true };
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, cards: {}, order: [], recipe: [], fails: 0, running: false, runToken: 0, sound: true };

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('cook-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('cook-progress', JSON.stringify(p)); } catch {}
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
  tap: () => tone(660, 0.08, { type: 'triangle', vol: 0.12 }),
  step: () => tone(520, 0.12, { type: 'triangle', vol: 0.08 }),
  bad: () => tone(200, 0.4, { type: 'sawtooth', to: 90, vol: 0.08 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);
const lower = (text) => text[0].toLowerCase() + text.slice(1);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Chọn món ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function renderLevelGrid() {
  const progress = loadProgress();
  $('#levelGrid').innerHTML = LEVELS.map((lv, i) => {
    const stars = progress[i] || 0;
    const unlocked = i === 0 || progress[i - 1];
    const starText = stars ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    return `<button data-i="${i}" class="${stars ? 'done' : ''}" ${unlocked ? '' : 'disabled'}>${unlocked ? lv.dish[0] : '🔒'}<small>${starText}</small></button>`;
  }).join('');
  show('levels');
}

$('#levelGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn && !btn.disabled) startLevel(Number(btn.dataset.i));
});

/* ---------- Thẻ và công thức ---------- */
const cardHtml = (c) => `<span class="c-icon">${c.icon}</span><span class="c-text">${c.text}</span>`;

function renderCards(activeIdx = -1, failIdx = -1) {
  const need = state.level.steps.length;
  $('#recipe').innerHTML = Array.from({ length: need }, (_, i) => {
    const id = state.recipe[i];
    if (!id) return '<li class="slot"></li>';
    const cls = i === activeIdx ? ' active' : i === failIdx ? ' fail' : i < activeIdx ? ' cooked' : '';
    return `<li><button class="card${cls}" data-id="${id}">${cardHtml(state.cards[id])}</button></li>`;
  }).join('');
  $('#pool').innerHTML = state.order
    .filter((id) => !state.recipe.includes(id))
    .map((id) => `<button class="card" data-id="${id}">${cardHtml(state.cards[id])}</button>`)
    .join('') || '<p class="empty">Đã dùng hết thẻ.</p>';
  $('#slotInfo').textContent = `(${state.recipe.length}/${need} bước)`;
}

function setStove(icon, text, cls = '') {
  $('#stoveIcon').textContent = icon;
  $('#stoveText').textContent = text;
  const stove = $('#stove');
  stove.className = 'stove';
  void stove.offsetWidth;
  if (cls) stove.classList.add(cls);
}

$('#pool').addEventListener('click', (e) => {
  const btn = e.target.closest('.card');
  if (!btn || state.running) return;
  if (state.recipe.length >= state.level.steps.length) {
    return say(`Công thức chỉ có ${state.level.steps.length} bước. Bỏ bớt một thẻ ra trước nhé!`, 'sad', 'soft');
  }
  state.recipe.push(btn.dataset.id);
  sfx.tap();
  renderCards();
});

$('#recipe').addEventListener('click', (e) => {
  const btn = e.target.closest('.card');
  if (!btn || state.running) return;
  state.recipe = state.recipe.filter((id) => id !== btn.dataset.id);
  sfx.tap();
  renderCards();
});

$('#clearBtn').addEventListener('click', () => {
  if (state.running) return;
  state.recipe = [];
  setStove('🍽️', 'Bếp sẵn sàng');
  renderCards();
});

/* ---------- Nấu thử ---------- */
function setRunning(running) {
  state.running = running;
  $('#runBtn').disabled = running;
  $('#clearBtn').disabled = running;
  $('#play').classList.toggle('running', running);
}

async function run() {
  if (state.running) return;
  if (state.recipe.length < state.level.steps.length) {
    return say(`Công thức cần đủ ${state.level.steps.length} bước. Bé thêm thẻ vào nhé!`, 'sad', 'soft');
  }
  const token = ++state.runToken;
  setRunning(true);
  const result = checkPlan(state.level, state.recipe);
  const last = result.ok ? state.recipe.length : result.at;

  for (let i = 0; i < Math.min(last, state.recipe.length); i++) {
    const card = state.cards[state.recipe[i]];
    renderCards(i);
    setStove(card.icon, card.text, 'cook');
    sfx.step();
    await wait(STEP_MS);
    if (token !== state.runToken) return;
  }

  if (result.ok) return win();

  state.fails++;
  sfx.bad();
  const card = state.cards[state.recipe[result.at]];
  renderCards(-1, result.at);
  setStove('💥', 'Hỏng rồi!', 'boom');
  if (result.reason === 'extra') say(`Bước ${result.at + 1}: ${card.oops}`, 'sad', 'soft');
  else if (result.reason === 'order') {
    say(`Bước ${result.at + 1}: Chưa ${lower(state.cards[result.need].text)} mà đã ${lower(card.text)}!`, 'sad', 'soft');
  } else say('Món ăn chưa xong! Còn thiếu một bước nào đó.', 'sad', 'soft');
  await wait(900);
  if (token === state.runToken) setRunning(false);
}

function win() {
  setRunning(false);
  renderCards(state.recipe.length);
  const [icon, name] = state.level.dish;
  setStove(icon, `${name} xong rồi!`, 'done');
  sfx.win();

  const stars = state.fails === 0 ? 3 : state.fails === 1 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'dau-bep-nhi', stars, score: totalStars, progressText: `${done}/${LEVELS.length} món`,
  });

  say('Thơm quá! Robot nấu đúng công thức rồi 🎉', 'cheer', 'good');
  $('#winDish').textContent = icon;
  $('#winTitle').textContent = `${name} ngon tuyệt!`;
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = stars === 3
    ? 'Công thức đúng ngay lần đầu. Công thức chính là một thuật toán đó!'
    : `Bé nấu thử ${state.fails + 1} lần mới thành công. Suy nghĩ kỹ thứ tự để được 3 sao nhé!`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Món tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 900);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.level = LEVELS[idx];
  const cards = cardsOf(state.level);
  state.cards = Object.fromEntries(cards.map((c) => [c.id, c]));
  // Xáo thẻ, tránh trường hợp xáo ra đúng luôn thứ tự giải
  do state.order = shuffle(cards.map((c) => c.id));
  while (checkPlan(state.level, state.order.slice(0, state.level.steps.length)).ok);
  state.recipe = [];
  state.fails = 0;
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `${state.level.dish[0]} ${state.level.dish[1]}`;
  show('play');
  setRunning(false);
  setStove('🍽️', 'Bếp sẵn sàng');
  renderCards();
  say(state.level.tip, 'happy');
}

$('#runBtn').addEventListener('click', run);
$('#backBtn').addEventListener('click', () => { state.runToken++; setRunning(false); renderLevelGrid(); });
$('#replayBtn').addEventListener('click', () => startLevel(state.idx));
$('#nextBtn').addEventListener('click', () => {
  if (state.idx < LEVELS.length - 1) startLevel(state.idx + 1);
  else { $('#winModal').classList.add('hidden'); renderLevelGrid(); }
});
$('#soundBtn').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.currentTarget.classList.toggle('off', !state.sound);
});

renderLevelGrid();
