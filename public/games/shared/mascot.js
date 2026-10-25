// Khủng long cổ vũ dùng chung cho các game.
// Gắn hình vào mọi phần tử có [data-dino]; mascotSay() cần #mascot và #bubble trong trang.
(function () {
  const SVG = `
<svg viewBox="0 0 120 120" aria-hidden="true">
  <g fill="#ffb627">
    <polygon points="16,76 20,62 28,74" /><polygon points="28,64 34,50 42,62" />
    <polygon points="42,58 50,44 56,58" /><polygon points="58,38 58,22 68,30" />
  </g>
  <path d="M22 90 Q2 88 4 72 Q14 84 34 82 Z" fill="#3fae68" />
  <ellipse cx="50" cy="84" rx="30" ry="26" fill="#52c47a" />
  <ellipse cx="56" cy="90" rx="16" ry="15" fill="#c7f0b5" />
  <rect x="34" y="100" width="12" height="15" rx="6" fill="#3fae68" />
  <rect x="58" y="100" width="12" height="15" rx="6" fill="#3fae68" />
  <circle cx="78" cy="46" r="24" fill="#52c47a" />
  <ellipse cx="93" cy="55" rx="15" ry="12" fill="#52c47a" />
  <circle cx="80" cy="40" r="8" fill="#fff" />
  <circle cx="82" cy="41" r="4" fill="#23395b" />
  <circle cx="83.5" cy="39.5" r="1.4" fill="#fff" />
  <circle cx="99" cy="50" r="1.6" fill="#23395b" />
  <circle cx="88" cy="58" r="4.5" fill="#ff9fb1" opacity=".7" />
  <path class="m-smile" d="M88 61 Q96 67 104 58" stroke="#23395b" stroke-width="3" fill="none" stroke-linecap="round" />
  <path class="m-open" d="M88 60 Q96 74 105 57 Z" fill="#c2255c" stroke="#23395b" stroke-width="2.5" stroke-linejoin="round" />
  <path class="m-sad" d="M89 65 Q96 59 103 64" stroke="#23395b" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M68 82 q9 2 11 -7" stroke="#3fae68" stroke-width="6" fill="none" stroke-linecap="round" />
</svg>`;
  document.querySelectorAll('[data-dino]').forEach((el) => (el.innerHTML = SVG));

  const MOODS = ['happy', 'cheer', 'sad'];
  let timer;
  // duration = 0: bong bóng thoại ở lại cho tới lần nói tiếp theo
  window.mascotSay = function (text, mood = 'happy', kind = 'good', duration = 1400) {
    const mascot = document.getElementById('mascot');
    const bubble = document.getElementById('bubble');
    if (!mascot || !bubble) return;
    mascot.classList.remove(...MOODS);
    void mascot.offsetWidth; // chạy lại animation khi cùng tâm trạng
    if (mood) mascot.classList.add(mood);
    bubble.textContent = text;
    bubble.className = `bubble show ${kind}`;
    clearTimeout(timer);
    if (duration > 0) {
      timer = setTimeout(() => {
        bubble.classList.remove('show');
        mascot.classList.remove(...MOODS);
      }, duration);
    }
  };
})();
