// Khung dùng chung cho game Phòng Tập Trí Não (người lớn): màn giới thiệu, đếm ngược, màn kết quả, âm thanh.
// Nạp sau bridge.js. Trang game chỉ cần <div id="stage"> chứa phần chơi riêng.
//
// const game = createBrainGame({ id, title, skill, intro, start(api) });
//   intro: HTML hướng dẫn ngắn (2–3 dòng).  start(): gọi mỗi lần bắt đầu một lượt, sau khi đếm ngược 3-2-1.
// game.end(score, details)   details: [[nhãn, giá trị], …] hiện dưới điểm.  Điểm càng cao càng tốt.
// game.wait(ms) → false nếu lượt đã kết thúc / người chơi bấm thoát.  game.timer(sec, onTick) → Promise khi hết giờ.
// game.sfx.good() / bad() / tick() / done()   game.alive() → lượt hiện tại còn chạy không.
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  window.createBrainGame = function (opts) {
    const bestKey = `${opts.id}-best`;
    const state = { token: 0, sound: true, running: false };

    const stage = $('#stage');
    document.body.insertAdjacentHTML('afterbegin', `
      <section id="intro" class="screen">
        <div class="panel">
          <p class="skill">${opts.skill}</p>
          <h1>${opts.title}</h1>
          <div class="intro">${opts.intro}</div>
          <p id="bestLine" class="best"></p>
          <button id="startBtn" class="btn go">Bắt đầu</button>
        </div>
      </section>
      <section id="play" class="screen hidden">
        <header class="hud">
          <button id="quitBtn" class="icon" title="Thoát lượt này">✕</button>
          <div id="hudInfo" class="hud-info"></div>
          <button id="soundBtn" class="icon" title="Âm thanh">🔊</button>
        </header>
      </section>
      <section id="result" class="screen hidden">
        <div class="panel">
          <p class="skill">${opts.skill}</p>
          <p class="score-label">Điểm của bạn</p>
          <p id="scoreBig" class="score-big"></p>
          <p id="recordLine" class="best"></p>
          <dl id="details" class="details"></dl>
          <div class="row">
            <button id="againBtn" class="btn go">Chơi lại</button>
            <button id="menuBtn" class="btn ghost">Hướng dẫn</button>
          </div>
        </div>
      </section>
      <div id="countdown" class="countdown hidden"></div>`);
    $('#play').appendChild(stage);

    const getBest = () => {
      try { return Number(localStorage.getItem(bestKey)) || 0; } catch { return 0; }
    };
    const setBest = (v) => {
      try { localStorage.setItem(bestKey, String(v)); } catch {}
    };

    /* ---------- Âm thanh ---------- */
    let actx;
    function tone(freq, dur, { type = 'sine', vol = 0.12, to = null, delay = 0 } = {}) {
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
      tick: () => tone(520, 0.05, { type: 'triangle', vol: 0.06 }),
      good: () => tone(880, 0.1, { type: 'triangle', vol: 0.1 }),
      bad: () => tone(200, 0.2, { type: 'sawtooth', to: 120, vol: 0.06 }),
      done: () => [523, 659, 784].forEach((f, i) => tone(f, 0.22, { type: 'triangle', delay: i * 0.1 })),
    };

    /* ---------- Chuyển màn ---------- */
    function show(id) {
      for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
    }
    function menu() {
      state.token++;
      state.running = false;
      const best = getBest();
      $('#bestLine').textContent = best ? `Kỷ lục: ${best} điểm` : '';
      $('#countdown').classList.add('hidden');
      show('intro');
    }
    async function begin() {
      const token = ++state.token;
      state.running = false;
      $('#hudInfo').textContent = '';
      show('play');
      const cd = $('#countdown');
      cd.classList.remove('hidden');
      for (const n of [3, 2, 1]) {
        cd.textContent = n;
        sfx.tick();
        await new Promise((r) => setTimeout(r, 650));
        if (token !== state.token) return;
      }
      cd.classList.add('hidden');
      state.running = true;
      opts.start(api);
    }

    function end(score, details = []) {
      if (!state.running) return;
      state.token++;
      state.running = false;
      score = Math.max(0, Math.round(score));
      const prev = getBest();
      if (score > prev) setBest(score);
      sfx.done();
      window.reportResult?.({ gameId: opts.id, stars: 0, score });
      $('#scoreBig').textContent = score;
      $('#recordLine').textContent = score > prev
        ? (prev ? `🎉 Kỷ lục mới! (cũ: ${prev})` : '🎉 Kỷ lục đầu tiên!')
        : `Kỷ lục: ${prev} điểm`;
      $('#details').innerHTML = details.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      show('result');
    }

    $('#startBtn').addEventListener('click', begin);
    $('#againBtn').addEventListener('click', begin);
    $('#menuBtn').addEventListener('click', menu);
    $('#quitBtn').addEventListener('click', menu);
    $('#soundBtn').addEventListener('click', (e) => {
      state.sound = !state.sound;
      e.currentTarget.classList.toggle('off', !state.sound);
    });

    const api = {
      state, sfx, end, menu,
      stage,
      alive: () => state.running,
      hud: (html) => { $('#hudInfo').innerHTML = html; },
      wait: (ms) => {
        const token = state.token;
        return new Promise((r) => setTimeout(() => r(token === state.token), ms));
      },
      // Đếm lùi sec giây, gọi onTick(giây còn lại) mỗi giây. Trả về true khi hết giờ, false nếu lượt đã dừng.
      timer: (sec, onTick) => {
        const token = state.token;
        const endAt = performance.now() + sec * 1000;
        return new Promise((resolve) => {
          let last = -1;
          (function step() {
            if (token !== state.token) return resolve(false);
            const left = Math.max(0, Math.ceil((endAt - performance.now()) / 1000));
            if (left !== last) { last = left; onTick?.(left); }
            if (left <= 0) return resolve(true);
            setTimeout(step, 100);
          })();
        });
      },
    };
    menu();
    return api;
  };
})();
