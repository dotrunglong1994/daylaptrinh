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

// Mỗi bé có tiến độ chọn màn riêng. Website ghi bé đang chơi vào localStorage "bhv-kid" (cùng origin với game).
// Bé đầu tiên ("k1") dùng khóa cũ để giữ tiến độ đã lưu trước khi có nhiều bé.
window.kidKey = function (key) {
  let kid = null;
  try { kid = localStorage.getItem('bhv-kid'); } catch {}
  return kid && kid !== 'k1' ? `${key}@${kid}` : key;
};
