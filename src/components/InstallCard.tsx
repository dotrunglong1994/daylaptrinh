"use client";

import { installApp, usePwa } from "@/lib/pwa";

/** Góc phụ huynh: cài website lên máy tính bảng / điện thoại như ứng dụng */
export default function InstallCard() {
  const pwa = usePwa();
  const offline = pwa.offlineReady ? (
    <p className="install-ok">✓ Đã tải sẵn mọi trò chơi, bé chơi được cả khi không có mạng.</p>
  ) : (
    <p className="muted">Mở website khi có mạng một lúc để máy tải sẵn trò chơi, sau đó chơi được cả khi không có mạng.</p>
  );

  return (
    <section className="card install-card">
      <h2>📲 Cài lên máy tính bảng</h2>
      {pwa.installed ? (
        <p>Bạn đang dùng bản đã cài trên máy. 🎉</p>
      ) : pwa.canInstall ? (
        <>
          <p>Thêm biểu tượng Bé Học Vui ra màn hình chính, bé bấm vào là chơi ngay, toàn màn hình.</p>
          <button className="btn primary" onClick={installApp}>
            Cài lên máy
          </button>
        </>
      ) : pwa.ios ? (
        <p>
          Trên iPad / iPhone: mở bằng Safari, bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên) rồi chọn{" "}
          <b>Thêm vào MH chính</b>.
        </p>
      ) : (
        <p>
          Mở website bằng Chrome trên máy tính bảng, bấm menu <b>⋮</b> rồi chọn <b>Cài đặt ứng dụng</b> (hoặc{" "}
          <b>Thêm vào màn hình chính</b>).
        </p>
      )}
      {offline}
    </section>
  );
}
