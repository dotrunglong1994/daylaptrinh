// LEVELS-START (scripts/check-levels.mjs đọc đoạn này để kiểm tra từng màn)
// Một kịch bản = { actor, event, actions: [..] } giống Scratch: "Khi <sự kiện> thì <nhân vật> làm <hành động>".
// event: flag (bấm cờ xanh), click (bấm vào chính nhân vật đó), key:left|right|space, msg:<tin>.
// action: jump, spin, grow, up, left, right, hide, say:<lời>, send:<tin> (gửi tin cho mọi nhân vật).
// goals: khi xảy ra trigger (flag, click:<nhân vật>, key:<phím>) thì mỗi nhân vật phải làm đúng các hành động này.
const ACTORS = {
  cat: ['🐱', 'Mèo'], dog: ['🐶', 'Chó'], bird: ['🐦', 'Chim'], car: ['🚗', 'Xe'], mouse: ['🐭', 'Chuột'], frog: ['🐸', 'Ếch'],
};
const KEYS = { left: '⬅️', right: '➡️', space: '␣' };
const ACTIONS = {
  jump: 'nhảy lên', spin: 'xoay vòng', grow: 'to ra', up: 'bay lên', left: 'đi sang trái', right: 'đi sang phải', hide: 'biến mất',
};

const LEVELS = [
  {
    name: 'Bấm cờ xanh',
    actors: ['cat'], events: ['flag', 'click'], actions: ['jump', 'spin'], actionSlots: 1, slots: 1,
    scripts: [{ actor: 'cat', actions: ['jump'], lock: ['actor', 'actions'] }],
    goals: [{ when: 'flag', do: { cat: ['jump'] }, text: 'Bấm cờ 🏁 thì mèo nhảy lên.' }],
    solution: [{ actor: 'cat', event: 'flag', actions: ['jump'] }],
    tip: 'Chương trình chỉ chạy khi có sự kiện! Chọn khối "Khi bấm 🏁" cho mèo nhé.',
  },
  {
    name: 'Bấm vào nhân vật',
    actors: ['cat', 'dog'], events: ['flag', 'click'], actions: ['jump', 'say:Gâu gâu!', 'say:Meo meo!'], actionSlots: 1, slots: 1,
    scripts: [{ actor: 'dog', lock: ['actor'] }],
    goals: [{ when: 'click:dog', do: { dog: ['say:Gâu gâu!'] }, text: 'Bấm vào chó thì chó sủa "Gâu gâu!".' }],
    solution: [{ actor: 'dog', event: 'click', actions: ['say:Gâu gâu!'] }],
    tip: 'Khối "Khi bấm vào mình" chỉ chạy khi bé chạm đúng nhân vật đó.',
  },
  {
    name: 'Mỗi bạn một kịch bản',
    actors: ['cat', 'dog'], events: ['flag', 'click'], actions: ['jump', 'spin', 'say:Meo meo!'], actionSlots: 1, slots: 2,
    goals: [
      { when: 'flag', do: { cat: ['say:Meo meo!'] }, text: 'Bấm cờ 🏁 thì mèo kêu "Meo meo!".' },
      { when: 'click:dog', do: { dog: ['spin'] }, text: 'Bấm vào chó thì chó xoay vòng.' },
    ],
    solution: [
      { actor: 'cat', event: 'flag', actions: ['say:Meo meo!'] },
      { actor: 'dog', event: 'click', actions: ['spin'] },
    ],
    tip: 'Mỗi nhân vật có kịch bản riêng. Chọn nhân vật trước, rồi chọn sự kiện và hành động.',
  },
  {
    name: 'Cùng chờ cờ xanh',
    actors: ['cat', 'bird', 'frog'], events: ['flag', 'click'], actions: ['jump', 'up', 'spin'], actionSlots: 1, slots: 3,
    goals: [
      { when: 'flag', do: { cat: ['spin'], bird: ['up'] }, text: 'Bấm cờ 🏁 thì mèo xoay vòng và chim bay lên cùng lúc.' },
      { when: 'click:frog', do: { frog: ['jump'] }, text: 'Bấm vào ếch thì ếch nhảy lên.' },
    ],
    solution: [
      { actor: 'cat', event: 'flag', actions: ['spin'] },
      { actor: 'bird', event: 'flag', actions: ['up'] },
      { actor: 'frog', event: 'click', actions: ['jump'] },
    ],
    tip: 'Nhiều nhân vật có thể cùng chờ một sự kiện. Bấm cờ một lần là tất cả cùng chạy!',
  },
  {
    name: 'Nhấn phím',
    actors: ['car'], events: ['flag', 'key:left', 'key:right', 'key:space'], actions: ['left', 'right', 'jump'], actionSlots: 1, slots: 3,
    goals: [
      { when: 'key:left', do: { car: ['left'] }, text: 'Nhấn phím ⬅️ thì xe đi sang trái.' },
      { when: 'key:right', do: { car: ['right'] }, text: 'Nhấn phím ➡️ thì xe đi sang phải.' },
      { when: 'key:space', do: { car: ['jump'] }, text: 'Nhấn phím cách ␣ thì xe nhảy lên.' },
    ],
    solution: [
      { actor: 'car', event: 'key:left', actions: ['left'] },
      { actor: 'car', event: 'key:right', actions: ['right'] },
      { actor: 'car', event: 'key:space', actions: ['jump'] },
    ],
    tip: 'Game điều khiển bằng bàn phím dùng sự kiện "Khi nhấn phím".',
  },
  {
    name: 'Nhiều việc theo thứ tự',
    actors: ['bird', 'frog'], events: ['flag', 'click'], actions: ['up', 'jump', 'say:Líu lo!', 'say:Ộp ộp!'], actionSlots: 2, slots: 2,
    goals: [
      { when: 'click:bird', do: { bird: ['up', 'say:Líu lo!'] }, text: 'Bấm vào chim thì chim bay lên, rồi hót "Líu lo!".' },
      { when: 'flag', do: { frog: ['say:Ộp ộp!', 'jump'] }, text: 'Bấm cờ 🏁 thì ếch kêu "Ộp ộp!", rồi nhảy lên.' },
    ],
    solution: [
      { actor: 'bird', event: 'click', actions: ['up', 'say:Líu lo!'] },
      { actor: 'frog', event: 'flag', actions: ['say:Ộp ộp!', 'jump'] },
    ],
    tip: 'Một sự kiện có thể làm nhiều việc theo thứ tự. Việc nào trước đặt trước nhé!',
  },
  {
    name: 'Gửi và nhận tin',
    actors: ['cat', 'mouse'], events: ['flag', 'click', 'msg:chạy'], actions: ['say:Chạy đi!', 'send:chạy', 'right', 'jump'], actionSlots: 2, slots: 2,
    goals: [
      { when: 'click:cat', do: { cat: ['say:Chạy đi!'], mouse: ['right'] }, text: 'Bấm vào mèo thì mèo nói "Chạy đi!" và chuột chạy sang phải.' },
    ],
    solution: [
      { actor: 'cat', event: 'click', actions: ['say:Chạy đi!', 'send:chạy'] },
      { actor: 'mouse', event: 'msg:chạy', actions: ['right'] },
    ],
    tip: 'Bấm vào mèo thì chuột không tự biết! Mèo phải "gửi tin" 📣, chuột "khi nhận tin" thì chạy.',
  },
  {
    name: 'Cả nhóm cùng múa',
    actors: ['cat', 'dog', 'bird'], events: ['flag', 'click', 'msg:múa'], actions: ['jump', 'spin', 'grow', 'say:Cùng múa nào!', 'send:múa'], actionSlots: 2, slots: 5,
    goals: [
      { when: 'flag', do: { dog: ['grow'] }, text: 'Bấm cờ 🏁 thì chó to ra.' },
      { when: 'click:cat', do: { cat: ['say:Cùng múa nào!', 'spin'], dog: ['spin'], bird: ['spin'] }, text: 'Bấm vào mèo thì mèo nói "Cùng múa nào!" và cả ba bạn cùng xoay vòng.' },
    ],
    solution: [
      { actor: 'dog', event: 'flag', actions: ['grow'] },
      { actor: 'cat', event: 'click', actions: ['say:Cùng múa nào!', 'send:múa'] },
      { actor: 'cat', event: 'msg:múa', actions: ['spin'] },
      { actor: 'dog', event: 'msg:múa', actions: ['spin'] },
      { actor: 'bird', event: 'msg:múa', actions: ['spin'] },
    ],
    tip: 'Màn khó! Có 5 kịch bản. Gợi ý: mèo vừa nói vừa gửi tin, các bạn nhận tin thì xoay.',
  },
];

// Các hành động mỗi nhân vật làm khi xảy ra trigger (không tính "gửi tin" vì không nhìn thấy)
function runTrigger(scripts, trigger) {
  const done = {};
  const queue = [trigger];
  const sent = new Set();
  while (queue.length) {
    const t = queue.shift();
    for (const s of scripts) {
      if (!s.actor || !s.event) continue;
      const hit = t === 'flag' ? s.event === 'flag'
        : t.startsWith('click:') ? s.event === 'click' && t === `click:${s.actor}`
        : s.event === t;
      if (!hit) continue;
      for (const a of s.actions || []) {
        if (!a) continue;
        if (a.startsWith('send:')) {
          const msg = `msg:${a.slice(5)}`;
          if (!sent.has(msg)) { sent.add(msg); queue.push(msg); }
          continue;
        }
        (done[s.actor] ||= []).push(a);
      }
    }
  }
  return done;
}

function goalMet(scripts, goal) {
  const done = runTrigger(scripts, goal.when);
  const names = new Set([...Object.keys(done), ...Object.keys(goal.do)]);
  return [...names].every((n) => (done[n] || []).join('|') === (goal.do[n] || []).join('|'));
}
// LEVELS-END

const $ = (s) => document.querySelector(s);
const state = { level: null, scripts: [], mistakes: 0, running: false };

const game = createGame({
  id: 'thi-tran-su-kien',
  title: '🎬 Thị Trấn Sự Kiện',
  sub: 'Gắn sự kiện cho các nhân vật để thị trấn chuyển động!',
  levels: LEVELS.length,
  winTitle: 'Thị trấn chạy đúng rồi! 🎬',
  start: startLevel,
});

const eventLabel = (e, actor) => {
  if (e === 'flag') return 'Khi bấm 🏁';
  if (e === 'click') return `Khi bấm vào ${actor ? ACTORS[actor][1].toLowerCase() : 'mình'}`;
  if (e.startsWith('key:')) return `Khi nhấn ${KEYS[e.slice(4)]}`;
  return `Khi nhận tin "${e.slice(4)}"`;
};
const actionLabel = (a) => {
  if (a.startsWith('say:')) return `nói "${a.slice(4)}"`;
  if (a.startsWith('send:')) return `📣 gửi tin "${a.slice(5)}"`;
  return ACTIONS[a];
};

/* ---------- Dựng màn ---------- */
function startLevel(idx) {
  const L = LEVELS[idx];
  state.level = L;
  state.mistakes = 0;
  // Bé có thể rời màn giữa lúc đang chạy thử: dọn trạng thái chạy cũ
  state.running = false;
  $('#stage').classList.remove('running');
  $('#picker').classList.add('hidden');
  state.scripts = Array.from({ length: L.slots }, (_, i) => {
    const s = L.scripts?.[i] || {};
    return { actor: s.actor || null, event: s.event || null, actions: Array.from({ length: L.actionSlots }, (_, k) => s.actions?.[k] || null), lock: s.lock || [] };
  });
  $('#town').innerHTML = L.actors.map((a) =>
    `<button class="actor" data-actor="${a}"><span class="say"></span>${ACTORS[a][0]}<span class="name">${ACTORS[a][1]}</span></button>`).join('');
  const keys = L.events.filter((e) => e.startsWith('key:')).map((e) => e.slice(4));
  $('#keyBtns').innerHTML = keys.map((k) => `<button class="trig" data-key="${k}">${KEYS[k]}</button>`).join('');
  $('#flagBtn').classList.toggle('hidden', !L.events.includes('flag'));
  renderGoals();
  renderScripts();
  game.say(L.tip);
}

function renderGoals(results = []) {
  $('#goals').innerHTML = state.level.goals.map((g, i) =>
    `<li class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : ''}">${g.text}</li>`).join('');
}

function renderScripts() {
  $('#scripts').innerHTML = state.scripts.map((s, i) => {
    const chip = (field, k, cls, label) => {
      const locked = s.lock.includes(field);
      return `<button class="chip ${cls}${label ? '' : ' empty'}${locked ? ' locked' : ''}" data-s="${i}" data-f="${field}" data-k="${k}">${label || '❓'}</button>`;
    };
    return `<div class="script">
      ${chip('actor', 0, 'actor-chip', s.actor && ACTORS[s.actor][0])}
      ${chip('event', 0, 'event', s.event && eventLabel(s.event, s.actor))}
      <span class="arrow">→</span>
      ${s.actions.map((a, k) => chip('actions', k, 'action', a && actionLabel(a))).join('<span class="arrow">rồi</span>')}
    </div>`;
  }).join('');
}

/* ---------- Chọn khối ---------- */
let picking = null;
$('#scripts').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip || state.running || chip.classList.contains('locked')) return;
  const s = state.scripts[Number(chip.dataset.s)];
  const field = chip.dataset.f;
  const L = state.level;
  let opts;
  if (field === 'actor') opts = L.actors.map((a) => [a, `${ACTORS[a][0]} ${ACTORS[a][1]}`, 'actor-chip']);
  else if (field === 'event') opts = L.events.map((ev) => [ev, eventLabel(ev, s.actor), 'event']);
  else opts = L.actions.map((a) => [a, actionLabel(a), 'action']);
  opts.push([null, '🧹 Bỏ trống', 'empty']);
  picking = { s, field, k: Number(chip.dataset.k) };
  $('#pickTitle').textContent = field === 'actor' ? 'Chọn nhân vật' : field === 'event' ? 'Chọn sự kiện' : 'Chọn hành động';
  $('#pickList').innerHTML = opts.map(([, label, cls], i) => `<button class="chip ${cls}" data-i="${i}">${label}</button>`).join('');
  $('#pickList').onclick = (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const v = opts[Number(b.dataset.i)][0];
    if (picking.field === 'actions') picking.s.actions[picking.k] = v;
    else picking.s[picking.field] = v;
    game.sfx.pop();
    $('#picker').classList.add('hidden');
    renderGoals();
    renderScripts();
  };
  $('#picker').classList.remove('hidden');
});
$('#pickCancel').addEventListener('click', () => $('#picker').classList.add('hidden'));

/* ---------- Chạy chương trình ---------- */
async function animate(done) {
  const one = async (actor, actions) => {
    const el = document.querySelector(`.actor[data-actor="${actor}"]`);
    if (!el) return;
    for (const a of actions) {
      if (a.startsWith('say:')) {
        const bubble = el.querySelector('.say');
        bubble.textContent = a.slice(4);
        bubble.classList.add('show');
        game.tone(700, 0.12, { type: 'triangle' });
        await game.wait(900);
        bubble.classList.remove('show');
      } else {
        el.classList.remove(`a-${a}`);
        void el.offsetWidth;
        el.classList.add(`a-${a}`);
        game.tone(a === 'jump' || a === 'up' ? 520 : 380, 0.2, { type: 'triangle', to: a === 'jump' || a === 'up' ? 880 : 500 });
        await game.wait(800);
        el.classList.remove(`a-${a}`);
      }
    }
  };
  await Promise.all(Object.entries(done).map(([actor, actions]) => one(actor, actions)));
}

function pulse(trigger) {
  let el = null;
  if (trigger === 'flag') el = $('#flagBtn');
  else if (trigger.startsWith('key:')) el = document.querySelector(`[data-key="${trigger.slice(4)}"]`);
  else el = document.querySelector(`.actor[data-actor="${trigger.slice(6)}"]`);
  if (!el) return;
  el.classList.remove('pressed', 'tapped');
  void el.offsetWidth;
  el.classList.add(trigger.startsWith('click:') ? 'tapped' : 'pressed');
}

// Bé tự bấm thử cờ, phím, nhân vật
async function tryTrigger(trigger) {
  if (state.running) return;
  state.running = true;
  pulse(trigger);
  const done = runTrigger(state.scripts, trigger);
  if (!Object.keys(done).length) game.say('Không ai làm gì cả. Chưa có kịch bản nào chờ sự kiện này!', 'sad', 'soft');
  await animate(done);
  state.running = false;
}
$('#flagBtn').addEventListener('click', () => tryTrigger('flag'));
$('#keyBtns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-key]');
  if (b) tryTrigger(`key:${b.dataset.key}`);
});
$('#town').addEventListener('click', (e) => {
  const b = e.target.closest('.actor');
  if (b) tryTrigger(`click:${b.dataset.actor}`);
});
document.addEventListener('keydown', (e) => {
  const key = { ArrowLeft: 'left', ArrowRight: 'right', ' ': 'space' }[e.key];
  if (!key || !state.level || !state.level.events.includes(`key:${key}`) || $('#play').classList.contains('hidden')) return;
  e.preventDefault();
  tryTrigger(`key:${key}`);
});

$('#testBtn').addEventListener('click', async () => {
  if (state.running) return;
  state.running = true;
  $('#stage').classList.add('running');
  const results = [];
  renderGoals(results);
  for (const g of state.level.goals) {
    pulse(g.when);
    await animate(runTrigger(state.scripts, g.when));
    if (!(await game.wait(250))) return;
    results.push(goalMet(state.scripts, g));
    renderGoals(results);
  }
  state.running = false;
  $('#stage').classList.remove('running');
  if (results.every(Boolean)) {
    game.say('Tất cả yêu cầu đều đúng! 🎉', 'cheer', 'good');
    const stars = game.starsFor(state.mistakes);
    return game.win({
      stars,
      eq: `${state.scripts.filter((s) => s.actor && s.event).length} kịch bản`,
      text: stars === 3 ? 'Đúng ngay lần đầu. Bé lập trình như trong Scratch rồi!' : `Bé thử ${state.mistakes + 1} lần mới đúng. Cố lên!`,
    });
  }
  state.mistakes++;
  game.sfx.bad();
  const i = results.indexOf(false);
  game.say(`Yêu cầu ${i + 1} chưa đúng. Bé xem lại nhân vật, sự kiện và thứ tự hành động nhé.`, 'sad', 'soft');
});
