// LEVELS-START (scripts/checks/xuong-lap-trinh.mjs đọc đoạn này để kiểm tra từng màn)
// Xưởng Lập Trình: bé kéo thả khối lệnh vào dưới khối sự kiện để điều khiển bạn gà con trên sân ô vuông.
// Chương trình là cây khối: { flag: [...], click: [...] }, mỗi khối { t, n?, s?, c?, body? }.
// simulate() chạy chương trình thành danh sách khung hình (không đụng DOM), phần dưới chỉ việc diễn lại.
const W = 7;
const H = 5;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // phải, xuống, trái, lên
const COSTUMES = ['🐥', '🐤', '🐣'];
const SAYINGS = ['Xin chào!', 'Hi hi!', 'Vui quá!', 'Tạm biệt!'];
const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419'];
const MAX_FRAMES = 400;

const BLOCKS = {
  move: { cat: 'motion', icon: '👣', label: 'Đi', num: [1, 5], unit: 'bước' },
  right: { cat: 'motion', icon: '↻', label: 'Quay phải' },
  left: { cat: 'motion', icon: '↺', label: 'Quay trái' },
  say: { cat: 'look', icon: '💬', label: 'Nói', text: true },
  costume: { cat: 'look', icon: '👕', label: 'Đổi trang phục' },
  pen: { cat: 'pen', icon: '🖍️', label: 'Hạ bút màu', color: true },
  wait: { cat: 'control', icon: '⏳', label: 'Chờ 1 giây' },
  repeat: { cat: 'control', icon: '🔁', label: 'Lặp lại', num: [2, 9], unit: 'lần', body: true },
};
const HATS = { flag: 'Khi bấm cờ xanh', click: 'Khi bấm vào bạn gà' };

function newBlock(t) {
  const b = { t };
  if (t === 'move') b.n = 1;
  if (t === 'repeat') { b.n = 3; b.body = []; }
  if (t === 'say') b.s = 0;
  if (t === 'pen') b.c = 0;
  return b;
}

// Giá trị kế tiếp khi bé chạm vào ô số / chữ / màu trên khối
function cycleValue(b) {
  const d = BLOCKS[b.t];
  if (d.num) b.n = b.n >= d.num[1] ? d.num[0] : b.n + 1;
  else if (d.text) b.s = (b.s + 1) % SAYINGS.length;
  else if (d.color) b.c = (b.c + 1) % COLORS.length;
}

const LEVELS = [
  {
    name: 'Đi tới ngôi sao', hats: ['flag'], palette: ['move'], start: [1, 2, 0], stars: [[4, 2]], goal: 'stars',
    intro: 'Kéo khối "Đi" thả vào dưới khối cờ xanh. Chạm vào số để đổi số bước, rồi bấm cờ xanh nhé!',
    task: 'Đưa bạn gà tới ngôi sao ⭐',
    hint: 'Đếm số ô từ bạn gà tới ngôi sao. Chạm vào số trên khối "Đi" để đổi.',
    solution: { flag: [{ t: 'move', n: 3 }] },
  },
  {
    name: 'Rẽ ở góc đường', hats: ['flag'], palette: ['move', 'right', 'left'], start: [1, 1, 0], stars: [[4, 3]], rocks: [[5, 1], [3, 2], [2, 3]],
    goal: 'stars',
    intro: 'Bạn gà đang nhìn sang phải (theo mũi tên). Khối "Quay phải" làm bạn gà quay theo chiều kim đồng hồ.',
    task: 'Đưa bạn gà tới ngôi sao, đừng đụng vào đá 🪨',
    hint: 'Đi sang phải trước, tới đúng cột của ngôi sao thì quay rồi đi xuống.',
    solution: { flag: [{ t: 'move', n: 3 }, { t: 'right' }, { t: 'move', n: 2 }] },
  },
  {
    name: 'Leo bậc thang', hats: ['flag'], palette: ['move', 'right', 'left', 'repeat'], start: [0, 4, 0],
    stars: [[1, 3], [2, 2], [3, 1]], maxBlocks: 5, goal: 'stars',
    intro: 'Ba bậc thang giống hệt nhau! Khối "Lặp lại" chạy các khối bên trong nó nhiều lần.',
    task: 'Lấy cả 3 ngôi sao, dùng tối đa 5 khối',
    hint: 'Một bậc là: đi 1, quay trái, đi 1, quay phải. Bỏ 4 khối đó vào trong "Lặp lại 3 lần".',
    solution: { flag: [{ t: 'repeat', n: 3, body: [{ t: 'move', n: 1 }, { t: 'left' }, { t: 'move', n: 1 }, { t: 'right' }] }] },
  },
  {
    name: 'Bấm vào bạn gà', hats: ['click'], palette: ['say', 'costume', 'right', 'left'], start: [3, 2, 0], goal: 'clickSay',
    intro: 'Màn này không có cờ xanh. Chương trình chỉ chạy khi bé bấm vào bạn gà: đó là một sự kiện.',
    task: 'Làm cho bạn gà nói khi được bấm vào',
    hint: 'Kéo khối "Nói" vào dưới khối "Khi bấm vào bạn gà", rồi chạm vào bạn gà trên sân.',
    solution: { click: [{ t: 'say', s: 0 }] },
  },
  {
    name: 'Vẽ hình vuông', hats: ['flag'], palette: ['pen', 'move', 'right', 'left', 'repeat'], start: [2, 1, 0],
    paint: [[2, 1], [3, 1], [4, 1], [4, 2], [4, 3], [3, 3], [2, 3], [2, 2]], maxBlocks: 4, goal: 'paint',
    intro: 'Hạ bút màu xuống thì bạn gà đi tới đâu là tô màu tới đó.',
    task: 'Tô đúng các ô có viền chấm, dùng tối đa 4 khối',
    hint: 'Hạ bút, rồi lặp lại 4 lần: đi 2 bước, quay phải.',
    solution: { flag: [{ t: 'pen', c: 0 }, { t: 'repeat', n: 4, body: [{ t: 'move', n: 2 }, { t: 'right' }] }] },
  },
  {
    name: 'Gà con nhảy múa', hats: ['flag'], palette: ['costume', 'wait', 'say', 'right', 'left', 'repeat'], start: [3, 2, 0],
    maxBlocks: 3, goal: 'dance',
    intro: 'Hoạt hình là nhiều hình nối nhau. Đổi trang phục, chờ một chút, lại đổi… là bạn gà nhảy múa!',
    task: 'Đổi trang phục ít nhất 4 lần, mỗi lần chờ 1 giây, dùng tối đa 3 khối',
    hint: 'Bỏ "Đổi trang phục" và "Chờ 1 giây" vào trong "Lặp lại", chạm vào số để lặp từ 4 lần.',
    solution: { flag: [{ t: 'repeat', n: 4, body: [{ t: 'costume' }, { t: 'wait' }] }] },
  },
  {
    name: 'Phim hoạt hình của bé', hats: ['flag', 'click'], palette: ['move', 'right', 'left', 'say', 'costume', 'pen', 'wait', 'repeat'],
    start: [0, 2, 0], goal: 'free', minBlocks: 4,
    intro: 'Sân chơi tự do! Bé tự nghĩ ra một đoạn phim: bạn gà đi dạo, vẽ, nhảy múa, chào khi được bấm… Bài làm được lưu lại.',
    task: 'Tự làm một đoạn phim có ít nhất 4 khối',
    hint: 'Thử lặp lại: đi 1 bước, đổi trang phục, nói "Hi hi!". Thêm khối dưới "Khi bấm vào bạn gà" nữa nhé.',
    solution: { flag: [{ t: 'pen', c: 1 }, { t: 'repeat', n: 4, body: [{ t: 'move', n: 1 }, { t: 'costume' }, { t: 'say', s: 1 }] }] },
  },
];

const countBlocks = (list = []) => list.reduce((n, b) => n + 1 + (b.body ? countBlocks(b.body) : 0), 0);
const totalBlocks = (scripts) => Object.values(scripts).reduce((n, list) => n + countBlocks(list), 0);
const key = (x, y) => `${x},${y}`;

function blankState(L) {
  return { x: L.start[0], y: L.start[1], dir: L.start[2], costume: 0, pen: null, painted: {}, got: [], bumps: 0 };
}

// Chạy một chương trình từ trạng thái `from`. Trả { frames, state }; mỗi khung hình có p = vị trí khối trong cây.
function simulate(L, list, from, hat = 'flag') {
  const s = { ...from, painted: { ...from.painted }, got: [...from.got] };
  const rocks = new Set((L.rocks || []).map(([x, y]) => key(x, y)));
  const stars = new Set((L.stars || []).map(([x, y]) => key(x, y)));
  const frames = [];
  const push = (f) => frames.length < MAX_FRAMES && frames.push(f);
  const paint = () => {
    if (s.pen === null) return null;
    s.painted[key(s.x, s.y)] = s.pen;
    return s.pen;
  };
  function exec(blocks, path) {
    blocks.forEach((b, i) => {
      const p = [...path, i].join('.');
      if (frames.length >= MAX_FRAMES) return;
      if (b.t === 'move') {
        for (let k = 0; k < b.n; k++) {
          const nx = s.x + DIRS[s.dir][0];
          const ny = s.y + DIRS[s.dir][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || rocks.has(key(nx, ny))) {
            s.bumps++;
            push({ t: 'bump', p });
            break;
          }
          s.x = nx;
          s.y = ny;
          const k2 = key(nx, ny);
          let star = null;
          if (stars.has(k2) && !s.got.includes(k2)) { s.got.push(k2); star = k2; }
          push({ t: 'step', p, x: nx, y: ny, paint: paint(), star });
        }
      } else if (b.t === 'right' || b.t === 'left') {
        s.dir = (s.dir + (b.t === 'right' ? 1 : 3)) % 4;
        push({ t: 'turn', p, dir: s.dir });
      } else if (b.t === 'say') {
        push({ t: 'say', p, text: SAYINGS[b.s] });
      } else if (b.t === 'costume') {
        s.costume = (s.costume + 1) % COSTUMES.length;
        push({ t: 'costume', p, costume: s.costume });
      } else if (b.t === 'pen') {
        s.pen = b.c;
        push({ t: 'pen', p, x: s.x, y: s.y, paint: paint() });
      } else if (b.t === 'wait') {
        push({ t: 'wait', p });
      } else if (b.t === 'repeat') {
        for (let k = 0; k < b.n; k++) exec(b.body, [...path, i]);
      }
    });
  }
  exec(list, [hat]);
  return { frames, state: s };
}

// Chương trình vừa chạy đã đạt yêu cầu của màn chưa? why: lời khủng long khi chưa đạt (null = không tính là sai)
function checkGoal(L, hat, scripts, res) {
  const n = res.frames.filter((f) => f.t === 'say').length;
  switch (L.goal) {
    case 'stars': {
      const left = L.stars.length - res.state.got.length;
      if (!left) return { ok: true };
      if (res.state.bumps) return { ok: false, why: 'Ối, bạn gà đụng phải đá hoặc mép sân rồi! Xem lại số bước nhé.' };
      return { ok: false, why: left === L.stars.length ? 'Bạn gà chưa tới ngôi sao. Đếm lại số ô xem!' : `Còn ${left} ngôi sao chưa lấy. Cố lên!` };
    }
    case 'paint': {
      const want = new Set(L.paint.map(([x, y]) => key(x, y)));
      const got = Object.keys(res.state.painted);
      const extra = got.filter((k) => !want.has(k)).length;
      const missing = [...want].filter((k) => !(k in res.state.painted)).length;
      if (!extra && !missing) return { ok: true };
      if (!got.length) return { ok: false, why: 'Bạn gà chưa tô ô nào. Nhớ hạ bút màu trước khi đi nhé!' };
      return { ok: false, why: extra ? 'Bạn gà tô ra ngoài viền chấm mất rồi.' : `Còn ${missing} ô chưa tô.` };
    }
    case 'clickSay':
      if (hat !== 'click') return { ok: false, why: null };
      return n ? { ok: true } : { ok: false, why: 'Bạn gà chưa nói gì cả. Thêm khối "Nói" nhé!' };
    case 'dance': {
      const costumes = res.frames.filter((f) => f.t === 'costume').length;
      const waits = res.frames.filter((f) => f.t === 'wait').length;
      if (costumes >= 4 && waits >= 4) return { ok: true };
      if (costumes < 4) return { ok: false, why: `Bạn gà mới đổi trang phục ${costumes} lần, cần ít nhất 4 lần.` };
      return { ok: false, why: 'Đổi nhanh quá, không kịp nhìn! Thêm "Chờ 1 giây" sau mỗi lần đổi nhé.' };
    }
    case 'free':
      return totalBlocks(scripts) >= L.minBlocks ? { ok: true } : { ok: false, why: null };
    default:
      return { ok: false, why: null };
  }
}

// Kiểm tra trước khi chạy: dùng quá số khối cho phép?
const overLimit = (L, scripts) => Boolean(L.maxBlocks) && totalBlocks(scripts) > L.maxBlocks;
// LEVELS-END

const $ = (s) => document.querySelector(s);
const STORE = window.kidKey ? window.kidKey('xuong-lap-trinh-code') : 'xuong-lap-trinh-code';
const FLAG_SVG = '<svg class="flag-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2v20" stroke="#2b8a3e" stroke-width="2.6" stroke-linecap="round"/><path d="M6 3c4-2 7 2 13 0v10c-6 2-9-2-13 0z" fill="#40c057" stroke="#2b8a3e" stroke-width="1.4"/></svg>';
const DUR = { step: 380, bump: 420, turn: 260, say: 950, costume: 320, pen: 220, wait: 800 };

const play = { idx: 0, scripts: {}, scene: null, fails: 0, busy: false, won: false, runToken: 0 };

/* ---------- Lưu bài làm theo từng bé ---------- */
function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
}
function saveCode() {
  const all = loadAll();
  all[play.idx] = play.scripts;
  try { localStorage.setItem(STORE, JSON.stringify(all)); } catch {}
}
function validList(list) {
  return Array.isArray(list) && list.every((b) => b && BLOCKS[b.t] && (!b.body || validList(b.body)));
}

/* ---------- Khối lệnh ---------- */
function getList(path) {
  let list = play.scripts[path[0]];
  for (const i of path.slice(1)) list = list[i].body;
  return list;
}
const parsePath = (s) => s.split('.').map((v, i) => (i ? Number(v) : v));

function valueHTML(b) {
  const d = BLOCKS[b.t];
  if (d.num) return `<button class="val" data-v>${b.n}</button>${d.unit}`;
  if (d.text) return `<button class="val txt" data-v>${SAYINGS[b.s]}</button>`;
  if (d.color) return `<button class="val dot" data-v style="background:${COLORS[b.c]}" aria-label="Đổi màu"></button>`;
  return '';
}
function blockHTML(b, p = '') {
  const d = BLOCKS[b.t];
  const head = `<span class="ico">${d.icon}</span><span>${d.label}</span>${valueHTML(b)}`;
  if (!d.body) return `<div class="blk c-${d.cat}" data-t="${b.t}" data-p="${p}">${head}</div>`;
  return `<div class="blk c-${d.cat} wrap" data-t="${b.t}" data-p="${p}"><div class="blk-head">${head}</div>`
    + `<div class="body">${p ? listHTML(b.body, p) : ''}</div><div class="blk-foot"></div></div>`;
}
function listHTML(list, p) {
  let h = '';
  list.forEach((b, i) => { h += `<i class="slot" data-l="${p}" data-i="${i}"></i>${blockHTML(b, `${p}.${i}`)}`; });
  return h + `<i class="slot ${list.length ? '' : 'empty'}" data-l="${p}" data-i="${list.length}">${list.length ? '' : 'thả khối vào đây'}</i>`;
}
function renderWorkspace() {
  const L = LEVELS[play.idx];
  $('#workspace').innerHTML = L.hats.map((h) => `<div class="script" data-hat="${h}">`
    + `<div class="hat">${h === 'flag' ? FLAG_SVG : '<span class="ico">👆</span>'}<span>${HATS[h]}</span></div>`
    + `<div class="stack">${listHTML(play.scripts[h], h)}</div></div>`).join('');
  const n = totalBlocks(play.scripts);
  $('#limit').textContent = L.maxBlocks ? `🧩 ${n}/${L.maxBlocks} khối` : `🧩 ${n} khối`;
  $('#limit').classList.toggle('over', overLimit(L, play.scripts));
}
function renderPalette() {
  $('#palette').innerHTML = LEVELS[play.idx].palette.map((t) => blockHTML(newBlock(t))).join('');
}

/* ---------- Sân khấu ---------- */
const pos = (x, y) => `left:${(x / W) * 100}%;top:${(y / H) * 100}%`;
function renderScene() {
  const L = LEVELS[play.idx];
  const s = play.scene;
  const cells = [];
  for (const [x, y] of L.paint || []) cells.push(`<i class="target" style="${pos(x, y)}"></i>`);
  for (const [k, c] of Object.entries(s.painted)) {
    const [x, y] = k.split(',').map(Number);
    cells.push(`<i class="paint" data-k="${k}" style="${pos(x, y)};background:${COLORS[c]}"></i>`);
  }
  for (const [x, y] of L.rocks || []) cells.push(`<i class="thing" style="${pos(x, y)}">🪨</i>`);
  for (const [x, y] of L.stars || []) {
    cells.push(`<i class="thing star ${s.got.includes(key(x, y)) ? 'got' : ''}" data-k="${key(x, y)}" style="${pos(x, y)}">⭐</i>`);
  }
  $('#scene').innerHTML = cells.join('') + `<button id="sprite" class="sprite" aria-label="Bạn gà">`
    + `<span class="arrow">➜</span><span class="body"></span><span class="say hidden"></span></button>`;
  drawSprite();
}
function drawSprite() {
  const s = play.scene;
  const el = $('#sprite');
  el.style.left = `${(s.x / W) * 100}%`;
  el.style.top = `${(s.y / H) * 100}%`;
  el.querySelector('.arrow').style.transform = `rotate(${s.dir * 90}deg)`;
  const body = el.querySelector('.body');
  body.textContent = COSTUMES[s.costume];
  body.classList.toggle('flip', s.dir === 2);
}
function paintCell(k, c) {
  const [x, y] = k.split(',').map(Number);
  $('#scene').insertAdjacentHTML('afterbegin', `<i class="paint" style="${pos(x, y)};background:${COLORS[c]}"></i>`);
}
function sayBubble(text) {
  const b = $('#sprite .say');
  b.textContent = text;
  b.classList.toggle('hidden', !text);
}

/* ---------- Chạy chương trình ---------- */
function resetScene() {
  play.runToken++;
  play.busy = false;
  play.scene = blankState(LEVELS[play.idx]);
  renderScene();
  markRunning(null);
}
function markRunning(p) {
  document.querySelectorAll('#workspace .blk.now').forEach((e) => e.classList.remove('now'));
  if (p) document.querySelector(`#workspace .blk[data-p="${p}"]`)?.classList.add('now');
}

async function run(hat) {
  const L = LEVELS[play.idx];
  if (play.busy || drag) return;
  if (!L.hats.includes(hat)) {
    game.say(hat === 'flag' ? 'Màn này không có cờ xanh. Bé bấm vào bạn gà nhé!' : 'Bạn gà kêu "chiếp chiếp"! Màn này chưa có khối "Khi bấm vào bạn gà".', 'think');
    return;
  }
  const list = play.scripts[hat];
  if (!list.length) {
    game.say(`Chưa có khối nào dưới "${HATS[hat]}". Kéo khối từ hộp bên trái thả vào nhé!`, 'think');
    return;
  }
  if (overLimit(L, play.scripts)) {
    play.fails++;
    game.sfx.bad();
    game.say(`Bé đang dùng ${totalBlocks(play.scripts)} khối, nhiều hơn ${L.maxBlocks} rồi. ${L.hint}`, 'think');
    return;
  }
  if (hat === 'flag') resetScene();
  const token = ++play.runToken;
  const res = simulate(L, list, play.scene, hat);
  play.busy = true;
  $('#stage').classList.add('running');
  sayBubble('');
  for (const f of res.frames) {
    markRunning(f.p);
    applyFrame(f);
    if (!(await game.wait(DUR[f.t])) || token !== play.runToken) return;
  }
  play.busy = false;
  $('#stage').classList.remove('running');
  markRunning(null);
  play.scene = res.state;
  const g = checkGoal(L, hat, play.scripts, res);
  if (g.ok) return finish();
  if (g.why) {
    play.fails++;
    game.sfx.bad();
    game.say(play.fails >= 2 ? `${g.why} Gợi ý: ${L.hint}` : g.why, 'think');
  }
}

function applyFrame(f) {
  const s = play.scene;
  const el = $('#sprite');
  if (f.t === 'step') {
    s.x = f.x;
    s.y = f.y;
    if (f.paint !== null) paintCell(key(f.x, f.y), f.paint);
    if (f.star) {
      $(`#scene .star[data-k="${f.star}"]`)?.classList.add('got');
      game.sfx.good();
    } else game.sfx.tap();
  } else if (f.t === 'bump') {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    game.tone(150, 0.2, { type: 'square', vol: 0.06 });
  } else if (f.t === 'turn') s.dir = f.dir;
  else if (f.t === 'costume') { s.costume = f.costume; game.sfx.pop(); }
  else if (f.t === 'say') { sayBubble(f.text); game.tone(700, 0.12, { type: 'triangle', vol: 0.08, to: 900 }); }
  else if (f.t === 'pen' && f.paint !== null) paintCell(key(f.x, f.y), f.paint);
  drawSprite();
}

function finish() {
  const L = LEVELS[play.idx];
  if (play.won && L.goal === 'free') return game.say('Phim hay quá! Bé cứ sửa tiếp, bài làm tự lưu lại.', 'happy');
  play.won = true;
  const stars = game.starsFor(play.fails);
  game.say('Chương trình chạy đúng rồi! 🎉', 'happy');
  game.win({ stars, eq: `🧩 ${totalBlocks(play.scripts)} khối`, text: L.goal === 'free' ? 'Bài làm đã được lưu. Bé có thể quay lại sửa tiếp!' : undefined });
}

/* ---------- Kéo thả ---------- */
let drag = null;
function blockAt(p) {
  const path = parsePath(p);
  return getList(path.slice(0, -1))[path.at(-1)];
}
function onDown(e) {
  if (play.busy || e.button > 0) return;
  const el = e.target.closest('.blk');
  if (!el) return;
  const fromPalette = Boolean(el.closest('#palette'));
  drag = { el, fromPalette, p: el.dataset.p, val: Boolean(e.target.closest('[data-v]')), x0: e.clientX, y0: e.clientY, moved: false };
  e.preventDefault();
}
function beginDrag(e) {
  const rect = drag.el.getBoundingClientRect();
  drag.dx = drag.x0 - rect.left;
  drag.dy = drag.y0 - rect.top;
  if (drag.fromPalette) drag.block = newBlock(drag.el.dataset.t);
  else {
    const path = parsePath(drag.p);
    drag.block = getList(path.slice(0, -1)).splice(path.at(-1), 1)[0];
    renderWorkspace();
  }
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.innerHTML = blockHTML(drag.block, 'g');
  document.body.appendChild(ghost);
  drag.ghost = ghost;
  drag.moved = true;
  game.sfx.tap();
  moveDrag(e);
}
function moveDrag(e) {
  const x = e.clientX - drag.dx;
  const y = e.clientY - drag.dy;
  drag.ghost.style.transform = `translate(${x}px, ${y}px) rotate(-2deg)`;
  // Chỗ thả gần nhất: khe giữa hai khối, đo từ góc trên bên trái của khối đang kéo
  let best = null;
  let bestD = 56;
  for (const slot of document.querySelectorAll('#workspace .slot')) {
    const r = slot.getBoundingClientRect();
    if (e.clientX < r.left - 40 || e.clientX > r.right + 160) continue;
    const d = Math.abs(y - r.top) + Math.max(0, r.left - x) * 0.5;
    if (d < bestD) { bestD = d; best = slot; }
  }
  drag.slot = best;
  const line = $('#dropLine');
  if (!best) return line.classList.add('hidden');
  const r = best.getBoundingClientRect();
  line.classList.remove('hidden');
  line.style.transform = `translate(${r.left}px, ${r.top + (best.classList.contains('empty') ? r.height / 2 : 0) - 3}px)`;
}
function onMove(e) {
  if (!drag) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
    beginDrag(e);
  } else moveDrag(e);
}
function onUp() {
  if (!drag) return;
  const d = drag;
  drag = null;
  $('#dropLine').classList.add('hidden');
  if (!d.moved) return tap(d);
  d.ghost.remove();
  if (d.slot) {
    getList(parsePath(d.slot.dataset.l)).splice(Number(d.slot.dataset.i), 0, d.block);
    game.sfx.pop();
  } else if (!d.fromPalette) {
    game.say('Đã bỏ khối đó đi. Muốn dùng lại thì kéo từ hộp khối nhé.', 'happy');
  }
  afterEdit();
}
// Chạm (không kéo): khối trong hộp thì gắn vào cuối chương trình, ô giá trị trên khối thì đổi giá trị
function tap(d) {
  if (d.fromPalette) {
    const hat = LEVELS[play.idx].hats[0];
    play.scripts[hat].push(newBlock(d.el.dataset.t));
    game.sfx.pop();
  } else if (d.val) {
    cycleValue(blockAt(d.p));
    game.sfx.tap();
  } else return;
  afterEdit();
}
function afterEdit() {
  saveCode();
  renderWorkspace();
  if (play.busy) return;
  if (LEVELS[play.idx].goal !== 'free') play.won = false;
}

/* ---------- Bắt đầu màn ---------- */
function startLevel(idx) {
  const L = LEVELS[idx];
  play.idx = idx;
  play.fails = 0;
  play.won = false;
  drag?.ghost?.remove();
  drag = null;
  const saved = loadAll()[idx];
  play.scripts = Object.fromEntries(L.hats.map((h) => [h, validList(saved?.[h]) ? saved[h] : []]));
  $('#question').textContent = L.task;
  $('#flagBtn').classList.toggle('dim', !L.hats.includes('flag'));
  $('#stage').classList.remove('running');
  renderPalette();
  renderWorkspace();
  resetScene();
  game.say(L.intro, 'happy');
}

const game = createGame({
  id: 'xuong-lap-trinh',
  title: '🧩 Xưởng Lập Trình',
  sub: 'Kéo thả khối lệnh để làm phim hoạt hình cho bạn gà con!',
  levels: LEVELS.length,
  winTitle: 'Lập trình giỏi quá! 🧩',
  start: startLevel,
});

$('#flagBtn').addEventListener('click', () => run('flag'));
$('#stopBtn').addEventListener('click', () => {
  $('#stage').classList.remove('running');
  resetScene();
});
$('#clearBtn').addEventListener('click', () => {
  if (play.busy) return;
  for (const h of Object.keys(play.scripts)) play.scripts[h] = [];
  afterEdit();
});
$('#scene').addEventListener('click', (e) => {
  if (e.target.closest('#sprite')) run('click');
});
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#palette, #workspace')) onDown(e);
});
document.addEventListener('pointermove', onMove);
document.addEventListener('pointerup', onUp);
document.addEventListener('pointercancel', onUp);
