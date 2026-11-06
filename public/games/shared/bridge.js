// Báo kết quả cho website khi game chạy bên trong khung (iframe).
// result: { gameId, stars, score, progressText? }
window.reportResult = function (result) {
  if (window.parent === window) return; // mở game riêng lẻ thì bỏ qua
  window.parent.postMessage({ source: 'daylaptrinh-game', ...result }, window.location.origin);
};

// Báo một lần bé làm sai (Sổ tay lỗi sai). mistake: { gameId, level, levelName, question }
window.reportMistake = function (mistake) {
  if (window.parent === window) return;
  window.parent.postMessage({ source: 'daylaptrinh-game', type: 'mistake', ...mistake }, window.location.origin);
};

// Dành cho game cũ không dùng kit.js: câu hỏi đang hiện, chữ trên nút chọn màn, màn trong địa chỉ ?man=N
window.questionText = function () {
  const el = document.querySelector('[data-question], #question, #story');
  return (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
};
window.reportMistakeAt = function (gameId, level, levelName, question) {
  window.reportMistake({ gameId, level, levelName, question: String(question ?? window.questionText()).slice(0, 90) });
};
window.buttonLabel = function (selector) {
  return (document.querySelector(selector)?.firstChild?.textContent || '').trim();
};
/** Tên màn: LEVELS[i].name (hoặc tên món ăn), không có thì "Màn N" */
window.levelNameOf = function (i) {
  let L = null;
  try { L = LEVELS[i]; } catch {} // LEVELS là biến top-level của game.js
  return String((L && (L.name || (Array.isArray(L.dish) && L.dish[1]))) || `Màn ${i + 1}`);
};
/** Game cũ theo màn: ghi lỗi sai ở màn idx. Câu hỏi là lời khủng long vừa nói (giải thích chỗ sai). */
window.reportLevelMistake = function (gameId, idx) {
  setTimeout(() => {
    const said = (document.getElementById('bubble')?.textContent || '').replace(/\s+/g, ' ').trim();
    window.reportMistakeAt(gameId, idx, window.levelNameOf(idx), said || window.questionText());
  }, 0);
};
/** ?man=N: mở thẳng màn N nếu nút màn đó trên bảng chọn màn không bị khóa */
window.openLevelFromUrl = function () {
  const m = window.levelFromUrl();
  const btn = m >= 0 && document.querySelector(`#levelGrid button[data-i="${m}"]`);
  if (btn && !btn.disabled) btn.click();
};
/** Màn bé cần mở thẳng (đếm từ 0), -1 nếu địa chỉ không có ?man=N */
window.levelFromUrl = function () {
  const n = Number(new URLSearchParams(location.search).get('man'));
  return Number.isInteger(n) && n >= 1 ? n - 1 : -1;
};

// Mỗi bé có tiến độ chọn màn riêng. Website ghi bé đang chơi vào localStorage "bhv-kid" (cùng origin với game).
// Bé đầu tiên ("k1") dùng khóa cũ để giữ tiến độ đã lưu trước khi có nhiều bé.
window.kidKey = function (key) {
  let kid = null;
  try { kid = localStorage.getItem('bhv-kid'); } catch {}
  return kid && kid !== 'k1' ? `${key}@${kid}` : key;
};
