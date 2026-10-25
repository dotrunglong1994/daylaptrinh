// Báo kết quả cho website khi game chạy bên trong khung (iframe).
// result: { gameId, stars, score, progressText? }
window.reportResult = function (result) {
  if (window.parent === window) return; // mở game riêng lẻ thì bỏ qua
  window.parent.postMessage({ source: 'daylaptrinh-game', ...result }, window.location.origin);
};
