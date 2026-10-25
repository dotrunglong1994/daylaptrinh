// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra mỗi màn đều giải được)
const ACTIONS = {
  stop: { icon: '🛑', label: 'Dừng lại' },
  go: { icon: '🚗', label: 'Đi tiếp' },
  slow: { icon: '🐢', label: 'Đi chậm' },
  horn: { icon: '📯', label: 'Bấm còi' },
};
const CONDS = {
  red: '🔴 đèn đỏ',
  yellow: '🟡 đèn vàng',
  green: '🟢 đèn xanh',
  person: '🚶 có người qua đường',
  cow: '🐄 có bò trên đường',
};
const OBSTACLES = { person: '🚶', cow: '🐄' };

// rules: các luật theo thứ tự ban đầu ('else' = NGƯỢC LẠI, luôn ở cuối)
// order: cho phép đổi thứ tự luật. scenes: các tình huống xe gặp, xáo trộn mỗi lần chạy.
const LEVELS = [
  {
    rules: ['red', 'green'], actions: ['stop', 'go', 'slow'],
    scenes: [{ light: 'red' }, { light: 'green' }, { light: 'red' }, { light: 'green' }],
    tip: 'Chọn việc xe phải làm cho mỗi luật, rồi bấm ▶️ nhé!',
  },
  {
    rules: ['red', 'yellow', 'green'], actions: ['stop', 'go', 'slow'],
    scenes: [{ light: 'red' }, { light: 'yellow' }, { light: 'green' }, { light: 'yellow' }, { light: 'red' }],
    tip: 'Đèn vàng là đèn sắp đỏ đó. Xe nên làm gì nhỉ?',
  },
  {
    rules: ['red', 'else'], actions: ['stop', 'go', 'slow'],
    scenes: [{ light: 'green' }, { light: 'red' }, { light: 'green' }, { light: 'red' }],
    tip: 'Mới: NGƯỢC LẠI nghĩa là "mọi trường hợp còn lại"!',
  },
  {
    rules: ['green', 'red', 'person'], actions: ['stop', 'go', 'slow'], order: true,
    scenes: [{ light: 'green' }, { light: 'green', obstacle: 'person' }, { light: 'red' }, { light: 'red', obstacle: 'person' }, { light: 'green' }],
    tip: 'Xe đọc luật từ trên xuống và làm theo luật ĐẦU TIÊN đúng. Dùng ⬆️⬇️ để đổi thứ tự!',
  },
  {
    rules: ['green', 'cow', 'red'], actions: ['stop', 'go', 'horn'], order: true,
    scenes: [{ light: 'green' }, { light: 'green', obstacle: 'cow' }, { light: 'red' }, { light: 'green', obstacle: 'cow' }, { light: 'green' }],
    tip: 'Có bò trên đường thì bấm còi cho bò đi chỗ khác nhé!',
  },
  {
    rules: ['green', 'yellow', 'red', 'person'], actions: ['stop', 'go', 'slow'], order: true,
    scenes: [{ light: 'green' }, { light: 'yellow', obstacle: 'person' }, { light: 'yellow' }, { light: 'green', obstacle: 'person' }, { light: 'red' }, { light: 'green' }],
    tip: 'Màn cuối! Sắp xếp luật thật khéo để xe an toàn nhé 💪',
  },
];

// Việc đúng phải làm trong mỗi tình huống. Đèn vàng: luật Việt Nam yêu cầu dừng trước vạch,
// bài học cho bé dạy "đi chậm, chuẩn bị dừng" nên chấp nhận cả hai.
function expected(scene) {
  if (scene.obstacle === 'person') return ['stop'];
  if (scene.obstacle === 'cow') return ['horn'];
  return { red: ['stop'], yellow: ['slow', 'stop'], green: ['go'] }[scene.light];
}

function matches(cond, scene) {
  if (cond === 'else') return true;
  if (cond in OBSTACLES) return scene.obstacle === cond;
  return scene.light === cond;
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { idx: 0, level: null, rules: [], running: false, runToken: 0, fails: 0, sound: true };
const START = 10;
const STOP = 49;
const EXIT = 118;

/* ---------- Lưu tiến độ ---------- */
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('traffic-progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('traffic-progress', JSON.stringify(p)); } catch {}
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
  ok: () => tone(880, 0.12, { type: 'triangle', vol: 0.1 }),
  horn: () => { tone(415, 0.18, { type: 'square', vol: 0.06 }); tone(415, 0.18, { type: 'square', vol: 0.06, delay: 0.25 }); },
  fail: () => tone(220, 0.4, { type: 'sawtooth', to: 110, vol: 0.08 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (text, mood = null, kind = '') => window.mascotSay(text, mood, kind, 0);
const condText = (cond) => (cond === 'else' ? '<b>NGƯỢC LẠI</b>' : `<b>NẾU</b> ${CONDS[cond]}`);

/* ---------- Chọn màn ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function renderLevelGrid() {
  const progress = loadProgress();
  $('#levelGrid').innerHTML = LEVELS.map((_, i) => {
    const stars = progress[i] || 0;
    const unlocked = i === 0 || progress[i - 1];
    const starText = stars ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
    return `<button data-i="${i}" class="${stars ? 'done' : ''}" ${unlocked ? '' : 'disabled'}>${unlocked ? i + 1 : '🔒'}<small>${starText}</small></button>`;
  }).join('');
  show('levels');
}

$('#levelGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn && !btn.disabled) startLevel(Number(btn.dataset.i));
});

/* ---------- Luật ---------- */
function renderRules(activeIdx = -1, failIdx = -1) {
  const L = state.level;
  const last = state.rules.length - 1;
  $('#rules').innerHTML = state.rules.map((r, i) => {
    const cls = i === activeIdx ? ' active' : i === failIdx ? ' fail' : '';
    const acts = L.actions.map((a) =>
      `<button data-a="${a}" class="${r.action === a ? 'on' : ''}">${ACTIONS[a].icon} ${ACTIONS[a].label}</button>`
    ).join('');
    // Luật NGƯỢC LẠI luôn đứng cuối nên không cho di chuyển
    const movable = L.order && r.cond !== 'else';
    const move = movable
      ? `<div class="rule-move"><button data-move="-1" ${i === 0 ? 'disabled' : ''} title="Lên">⬆️</button>` +
        `<button data-move="1" ${i === last || state.rules[i + 1]?.cond === 'else' ? 'disabled' : ''} title="Xuống">⬇️</button></div>`
      : '';
    return `<div class="rule${cls}" data-i="${i}"><span class="rule-num">${i + 1}</span>` +
      `<span class="rule-cond">${condText(r.cond)} <b>THÌ</b></span><div class="rule-acts">${acts}</div>${move}</div>`;
  }).join('');
}

$('#rules').addEventListener('click', (e) => {
  if (state.running) return;
  const rule = e.target.closest('.rule');
  const btn = e.target.closest('button');
  if (!rule || !btn || btn.disabled) return;
  const i = Number(rule.dataset.i);
  if (btn.dataset.a) {
    state.rules[i].action = btn.dataset.a;
  } else if (btn.dataset.move) {
    const j = i + Number(btn.dataset.move);
    [state.rules[i], state.rules[j]] = [state.rules[j], state.rules[i]];
  }
  sfx.tap();
  renderRules();
});

/* ---------- Con đường ---------- */
function setScene(scene) {
  $('#light').dataset.c = scene.light;
  const ob = $('#obstacle');
  ob.className = 'obstacle';
  ob.textContent = scene.obstacle ? OBSTACLES[scene.obstacle] : '';
  $('#car').classList.remove('crash');
  placeCar(START, 0);
  sceneMsg('');
}

function placeCar(pct, ms) {
  const car = $('#car');
  car.style.transitionDuration = `${ms}ms`;
  car.style.left = `calc(${pct}% - var(--car-w))`;
}

async function moveCar(pct, ms) {
  placeCar(pct, ms);
  await wait(ms);
}

function sceneMsg(text) {
  const el = $('#sceneMsg');
  el.textContent = text;
  el.classList.toggle('show', !!text);
}

function renderDots(current = -1, results = []) {
  $('#sceneDots').innerHTML = state.level.scenes.map((_, i) =>
    `<i class="${results[i] || (i === current ? 'now' : '')}"></i>`
  ).join('');
}

/* ---------- Chạy thử ---------- */
function firstMatch(scene) {
  return state.rules.findIndex((r) => matches(r.cond, scene));
}

function failMessage(scene, act, ok, ruleIdx) {
  // Có luật đúng nằm bên dưới luật đã dùng → gợi ý đổi thứ tự
  const betterBelow = state.rules.some((r, i) => i > ruleIdx && matches(r.cond, scene) && ok.includes(r.action));
  const orderHint = state.level.order && betterBelow ? ' Có luật đúng ở bên dưới, thử đưa nó lên trên xem!' : '';
  if (ruleIdx < 0) return 'Không có luật nào cho tình huống này!';
  if (scene.obstacle && act !== 'stop' && act !== 'horn') return `Ối! Suýt đụng ${scene.obstacle === 'person' ? 'bạn ấy' : 'bạn bò'} rồi! 😱${orderHint}`;
  if (scene.obstacle === 'cow' && act === 'stop') return `Xe dừng mãi mà bò không chịu đi. Bấm còi xem!${orderHint}`;
  if (scene.light === 'red' && act === 'go') return 'Ối! Xe vượt đèn đỏ rồi! 🚨';
  if (scene.light === 'red' && act === 'slow') return 'Đèn đỏ thì phải dừng hẳn nhé!';
  if (act === 'horn') return 'Không có gì cản đường mà bấm còi inh ỏi thì ồn lắm!';
  if (scene.light === 'green' && act === 'stop') return 'Đèn xanh mà xe đứng yên, các xe phía sau phải chờ mãi!';
  if (scene.light === 'yellow' && act === 'go') return 'Đèn vàng sắp đỏ rồi, phải đi chậm và chuẩn bị dừng!';
  return `Lúc này xe phải ${ok.map((a) => ACTIONS[a].label.toLowerCase()).join(' hoặc ')}.${orderHint}`;
}

async function animateAction(scene, act, ok, token) {
  if (!act) return wait(400); // không có luật nào khớp: xe đứng yên
  if (act === 'go' && scene.obstacle) {
    // phanh gấp trước vật cản
    await moveCar(STOP + 3, 350);
    $('#car').classList.add('crash');
    $('#obstacle').classList.add('scared');
    sfx.fail();
    return wait(700);
  }
  if (act === 'stop') {
    sceneMsg('✋ Dừng chờ…');
    await wait(800);
    if (token !== state.runToken || !ok) return;
    if (scene.obstacle) $('#obstacle').classList.add('leave');
    else if (scene.light !== 'green') $('#light').dataset.c = 'green';
    await wait(600);
    sceneMsg('');
    return moveCar(EXIT, 900);
  }
  if (act === 'horn') {
    sfx.horn();
    sceneMsg('📯 Bíp bíp!');
    await wait(700);
    if (token !== state.runToken || !ok) return;
    $('#obstacle').classList.add('leave');
    await wait(600);
    sceneMsg('');
    return moveCar(EXIT, 900);
  }
  return moveCar(EXIT, act === 'slow' ? 2000 : 900);
}

async function run() {
  if (state.running) return;
  if (state.rules.some((r) => !r.action)) return say('Bé chọn việc cần làm cho tất cả các luật trước nhé!', 'sad', 'soft');
  const token = ++state.runToken;
  state.running = true;
  $('#play').classList.add('running');
  $('#runBtn').disabled = true;
  say('Xe xuất phát! 🚗', 'cheer');

  const scenes = [...state.level.scenes].sort(() => Math.random() - 0.5);
  const results = [];
  for (let s = 0; s < scenes.length; s++) {
    const scene = scenes[s];
    $('#sceneCount').textContent = `Tình huống ${s + 1}/${scenes.length}`;
    renderDots(s, results);
    setScene(scene);
    await wait(350);
    await moveCar(STOP, 900);
    if (token !== state.runToken) return;

    const idx = firstMatch(scene);
    renderRules(idx);
    await wait(650);
    if (token !== state.runToken) return;

    const act = idx < 0 ? null : state.rules[idx].action;
    const ok = expected(scene);
    const passed = ok.includes(act);
    await animateAction(scene, act, passed, token);
    if (token !== state.runToken) return;

    if (!passed) {
      results[s] = 'fail';
      renderDots(-1, results);
      renderRules(-1, idx);
      if (act !== 'go' || !scene.obstacle) sfx.fail();
      state.fails++;
      say(failMessage(scene, act, ok, idx), 'sad', 'soft');
      return endRun();
    }
    results[s] = 'ok';
    sfx.ok();
    renderRules();
  }
  renderDots(-1, results);
  win();
}

function endRun() {
  state.running = false;
  $('#play').classList.remove('running');
  $('#runBtn').disabled = false;
}

function win() {
  endRun();
  sfx.win();
  const stars = state.fails === 0 ? 3 : state.fails === 1 ? 2 : 1;
  const progress = loadProgress();
  progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
  saveProgress(progress);

  const done = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
  window.reportResult?.({
    gameId: 'den-giao-thong', stars, score: totalStars, progressText: `${done}/${LEVELS.length} màn`,
  });

  say('Xe đi an toàn qua mọi tình huống! 🎉', 'cheer', 'good');
  $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
  $('#winText').textContent = state.fails === 0
    ? 'Đúng ngay lần chạy đầu tiên!'
    : `Bé đã sửa luật ${state.fails} lần để xe chạy an toàn. Giỏi lắm!`;
  $('#nextBtn').textContent = state.idx === LEVELS.length - 1 ? 'Xong hết rồi! 🏆' : 'Màn tiếp ➡️';
  setTimeout(() => $('#winModal').classList.remove('hidden'), 500);
}

/* ---------- Điều hướng ---------- */
function startLevel(idx) {
  state.runToken++;
  state.idx = idx;
  state.level = LEVELS[idx];
  state.rules = state.level.rules.map((cond) => ({ cond, action: null }));
  state.fails = 0;
  $('#winModal').classList.add('hidden');
  $('#levelTitle').textContent = `Màn ${idx + 1}/${LEVELS.length}`;
  $('#orderNote').textContent = state.level.order ? '· xe đọc từ trên xuống, làm theo luật đầu tiên đúng' : '';
  show('play');
  endRun();
  $('#sceneCount').textContent = `${state.level.scenes.length} tình huống`;
  renderDots();
  setScene(state.level.scenes[0]);
  renderRules();
  say(state.level.tip, 'happy');
}

$('#runBtn').addEventListener('click', run);
$('#backBtn').addEventListener('click', () => { state.runToken++; endRun(); renderLevelGrid(); });
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
