// Khung dùng chung cho các game: màn hình chọn màn, thanh trên, khủng long, bảng thắng, âm thanh.
// Nạp sau mascot.js và bridge.js. Trang game chỉ cần <div id="stage"> chứa phần chơi riêng.
//
// const game = createGame({ id, title, sub, levels, unit, winTitle, start(idx), free, levelLabel(i) });
// free: mở sẵn mọi màn; levelLabel(i): chữ trên nút chọn màn thay cho số màn
// game.say(text, mood, kind)   game.sfx.good()   game.win({ stars, eq, text })   game.rounds(i, n)
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  window.createGame = function (opts) {
    const unit = opts.unit || 'màn';
    const storeKey = window.kidKey ? window.kidKey(`${opts.id}-progress`) : `${opts.id}-progress`;
    const state = { idx: 0, sound: true, token: 0 };

    /* ---------- Dựng khung trang ---------- */
    const stage = $('#stage');
    document.body.insertAdjacentHTML('afterbegin', `
      <section id="levels" class="screen">
        <div class="panel">
          <div class="dino menu-dino" data-dino></div>
          <h1>${opts.title}</h1>
          <p class="sub">${opts.sub}</p>
          <div id="levelGrid" class="level-grid"></div>
        </div>
      </section>
      <section id="play" class="screen hidden">
        <header class="hud">
          <button id="backBtn" class="icon" title="Chọn màn">🗺️</button>
          <h2 id="levelTitle"></h2>
          <button id="musicBtn" class="icon off" title="Nhạc nền">🎵</button>
          <button id="soundBtn" class="icon" title="Âm thanh">🔊</button>
        </header>
        <div id="roundDots" class="round-dots"></div>
        <div class="guide">
          <div id="mascot" class="dino mascot" data-dino></div>
          <div id="bubble" class="bubble" title="Chạm để nghe lại"></div>
        </div>
      </section>
      <div id="winModal" class="modal hidden">
        <div class="panel">
          <h1>${opts.winTitle || 'Giỏi quá! 🎉'}</h1>
          <div id="winStars" class="stars"></div>
          <p id="winEq" class="equation"></p>
          <p id="winText" class="sub"></p>
          <div class="row">
            <button id="replayBtn" class="btn ghost">🔁 Chơi lại</button>
            <button id="nextBtn" class="btn go">${capital(unit)} tiếp ➡️</button>
          </div>
        </div>
      </div>`);
    $('#play').appendChild(stage);
    window.mountDino?.();

    /* ---------- Tiến độ ---------- */
    function load() {
      try { return JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch { return {}; }
    }
    function save(p) {
      try { localStorage.setItem(storeKey, JSON.stringify(p)); } catch {}
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
      tap: () => tone(440, 0.07, { type: 'triangle', vol: 0.08 }),
      pop: () => tone(330, 0.1, { type: 'square', vol: 0.05, to: 520 }),
      good: () => [660, 880].forEach((f, i) => tone(f, 0.16, { type: 'triangle', delay: i * 0.09, vol: 0.12 })),
      bad: () => tone(180, 0.3, { type: 'sawtooth', to: 90, vol: 0.08 }),
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', delay: i * 0.12, vol: 0.12 })),
    };

    /* ---------- Chọn màn ---------- */
    function show(id) {
      for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
    }
    function renderLevelGrid() {
      state.token++;
      window.speechSynthesis?.cancel();
      const progress = load();
      $('#levelGrid').innerHTML = Array.from({ length: opts.levels }, (_, i) => {
        const stars = progress[i] || 0;
        const unlocked = opts.free || i === 0 || progress[i - 1];
        const starText = stars ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
        const label = opts.levelLabel ? opts.levelLabel(i) : i + 1;
        return `<button data-i="${i}" class="${stars ? 'done' : ''}" ${unlocked ? '' : 'disabled'}>${unlocked ? label : '🔒'}<small>${starText}</small></button>`;
      }).join('');
      $('#winModal').classList.add('hidden');
      show('levels');
    }
    function start(idx) {
      state.token++;
      state.idx = idx;
      document.querySelectorAll('.hint-note').forEach((n) => n.remove());
      $('#winModal').classList.add('hidden');
      $('#levelTitle').textContent = `${capital(unit)} ${idx + 1}/${opts.levels}`;
      $('#roundDots').innerHTML = '';
      show('play');
      opts.start(idx);
    }

    $('#levelGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && !btn.disabled) start(Number(btn.dataset.i));
    });
    $('#backBtn').addEventListener('click', renderLevelGrid);
    $('#replayBtn').addEventListener('click', () => start(state.idx));
    $('#nextBtn').addEventListener('click', () => {
      if (state.idx < opts.levels - 1) start(state.idx + 1);
      else renderLevelGrid();
    });
    /* ---------- Nhạc nền: giai điệu ngũ cung nhẹ, mặc định tắt, nhớ lựa chọn trong localStorage ---------- */
    const MUSIC_KEY = 'bhv-music';
    const NOTES = [523, 587, 659, 784, 880, 1047];
    let musicTimer = null;
    let beat = 0;
    function musicOn() {
      try { return localStorage.getItem(MUSIC_KEY) === 'on'; } catch { return false; }
    }
    function setMusic(on) {
      try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch {}
      $('#musicBtn').classList.toggle('off', !on);
      clearInterval(musicTimer);
      musicTimer = null;
      if (!on) return;
      musicTimer = setInterval(() => {
        if (document.hidden || !state.sound) return;
        beat++;
        // Mỗi nhịp một nốt nhẹ, cứ 4 nhịp thêm một nốt trầm
        const note = NOTES[(beat * 3 + (beat >> 2)) % NOTES.length];
        tone(note, 0.35, { type: 'sine', vol: 0.025 });
        if (beat % 4 === 0) tone(note / 2, 0.8, { type: 'triangle', vol: 0.02 });
      }, 420);
    }
    $('#musicBtn').addEventListener('click', () => setMusic(!musicOn()));
    // Trình duyệt chỉ cho phát âm thanh sau khi bé chạm vào trang
    if (musicOn()) document.addEventListener('pointerdown', () => setMusic(musicOn()), { once: true });
    $('#musicBtn').classList.toggle('off', !musicOn());

    $('#soundBtn').addEventListener('click', (e) => {
      state.sound = !state.sound;
      e.currentTarget.classList.toggle('off', !state.sound);
    });

    /* ---------- Thắng màn ---------- */
    function win({ stars, eq = '', text }) {
      sfx.win();
      if (stars === 3) confetti();
      const progress = load();
      progress[state.idx] = Math.max(progress[state.idx] || 0, stars);
      save(progress);
      const done = Object.keys(progress).length;
      const totalStars = Object.values(progress).reduce((a, b) => a + b, 0);
      window.reportResult?.({ gameId: opts.id, stars, score: totalStars, progressText: `${done}/${opts.levels} ${unit}` });

      $('#winStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">⭐</span>`).join('');
      $('#winEq').textContent = eq;
      $('#winText').textContent = text ?? (stars === 3 ? 'Không sai lần nào. Tuyệt vời!' : 'Chơi lại để lấy đủ 3 sao nhé!');
      $('#nextBtn').textContent = state.idx === opts.levels - 1 ? 'Xong hết rồi! 🏆' : `${capital(unit)} tiếp ➡️`;
      const token = state.token;
      setTimeout(() => token === state.token && $('#winModal').classList.remove('hidden'), 700);
    }

    // Chấm tròn cho biết bé đang ở câu thứ mấy trong màn
    function rounds(i, n) {
      $('#roundDots').innerHTML = n > 1
        ? Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')
        : '';
    }

    const api = {
      state, sfx, tone, show, win, rounds,
      say: (text, mood = 'happy', kind = '') => window.mascotSay(text, mood, kind, 0),
      // Chờ ms mili giây; trả về false nếu bé đã rời màn trong lúc chờ
      wait: (ms) => {
        const token = state.token;
        return new Promise((r) => setTimeout(() => r(token === state.token), ms));
      },
      starsFor: (mistakes, two = 2) => (mistakes === 0 ? 3 : mistakes <= two ? 2 : 1),
      menu: renderLevelGrid,
    };
    renderLevelGrid();
    return api;
  };

  // Vẽ các nút đáp án; onPick(i, btn) trả về true nếu đúng (khóa các nút lại).
  // isRight(i) (không bắt buộc, không có tác dụng phụ): bé chọn sai thì khủng long cất bớt một đáp án sai
  // (chỉ khi còn từ 3 đáp án, để không lộ đáp án đúng).
  window.renderChoices = function (el, labels, onPick, isRight) {
    let misses = 0;
    el.innerHTML = labels.map((l, i) => `<button class="choice" data-i="${i}">${l}</button>`).join('');
    clearNote(el);
    el.onclick = (e) => {
      const btn = e.target.closest('.choice');
      if (!btn || btn.disabled || el.classList.contains('locked')) return;
      const right = onPick(Number(btn.dataset.i), btn);
      btn.classList.add(right ? 'right' : 'wrong');
      if (right) {
        clearNote(el);
        return el.classList.add('locked');
      }
      btn.disabled = true;
      if (++misses === 1 && isRight) hideOneWrong(el, isRight);
    };
    el.classList.remove('locked');
  };

  function clearNote(el) {
    if (el.nextElementSibling?.classList.contains('hint-note')) el.nextElementSibling.remove();
  }

  function hideOneWrong(el, isRight) {
    const open = [...el.querySelectorAll('.choice:not(:disabled)')];
    const wrong = open.filter((b) => !isRight(Number(b.dataset.i)));
    if (open.length <= 2 || !wrong.length) return;
    const b = wrong[Math.floor(Math.random() * wrong.length)];
    b.disabled = true;
    b.classList.add('hinted');
    el.insertAdjacentHTML('afterend', '<p class="hint-note">🦖 Khủng long đã cất bớt một đáp án sai. Bé thử lại nhé!</p>');
  }

  // Pháo giấy khi bé được 3 sao
  function confetti() {
    const colors = ['#ff5e7e', '#ffd43b', '#4c6ef5', '#2bb673', '#ff922b', '#cc5de8'];
    const box = document.createElement('div');
    box.className = 'confetti';
    box.innerHTML = Array.from({ length: 70 }, () => {
      const style = `left:${Math.random() * 100}%;background:${colors[Math.floor(Math.random() * colors.length)]};`
        + `animation-delay:${Math.random() * 0.6}s;animation-duration:${1.8 + Math.random() * 1.4}s;`
        + `--drift:${Math.round(Math.random() * 160 - 80)}px;--spin:${Math.round(Math.random() * 720)}deg`;
      return `<i style="${style}"></i>`;
    }).join('');
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3800);
  }

  window.shuffle = function (arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function capital(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();
