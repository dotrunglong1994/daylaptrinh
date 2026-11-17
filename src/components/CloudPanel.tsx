"use client";

import { cloudEnabled, resolveConflict, signOut, syncNow, useCloud } from "@/lib/cloud";
import LoginForm from "./LoginForm";
import { getSavedData, totalStars, type SavedData } from "@/lib/progress";

const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short", dateStyle: "short" });

function summary(d: SavedData) {
  const kids = d.kids.filter((k) => k.profile);
  return [
    ...(kids.length
      ? kids.map((k) => {
          const plays = Object.values(k.games).reduce((sum, g) => sum + g.plays, 0);
          return `${k.profile!.avatar} ${k.profile!.name}: ⭐ ${totalStars(k)} sao · 🪙 ${k.coins} xu · 🎮 ${plays} lượt${k.pet ? ` · 🐾 ${k.pet.name}` : ""}`;
        })
      : ["Chưa có hồ sơ bé"]),
    d.savedAt ? `Cập nhật ${timeFmt.format(new Date(d.savedAt))}` : "",
  ].filter(Boolean);
}

/** Tài khoản phụ huynh: đăng nhập bằng mã gửi qua email để lưu tiến độ lên mạng. */
export default function CloudPanel() {
  const cloud = useCloud();
  if (!cloudEnabled || cloud.status === "off" || cloud.status === "loading") return null;

  // Đã đăng nhập
  if (cloud.email) {
    return (
      <div className="card cloud-card">
        <h2>☁️ Tài khoản phụ huynh</h2>
        <p>
          Đã đăng nhập <b>{cloud.email}</b>. Tiến độ của bé được lưu cả trên máy này và trên tài khoản, nên đổi máy
          hay xóa dữ liệu trình duyệt cũng không mất.
        </p>

        {cloud.status === "conflict" && cloud.remote ? (
          <div className="conflict">
            <p>
              <b>Máy này và tài khoản đang có hai tiến độ khác nhau.</b> Bố mẹ chọn giữ bản nào? Bản còn lại sẽ bị
              thay thế.
            </p>
            <div className="conflict-grid">
              <div className="conflict-option">
                <h3>💻 Trên máy này</h3>
                {summary(getSavedData()).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <button className="btn primary small" onClick={() => resolveConflict("local")}>
                  Giữ bản này
                </button>
              </div>
              <div className="conflict-option">
                <h3>☁️ Trong tài khoản</h3>
                {summary(cloud.remote).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <button className="btn primary small" onClick={() => resolveConflict("remote")}>
                  Giữ bản này
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className={`sync-status ${cloud.status}`}>
            {cloud.status === "syncing" && "🔄 Đang đồng bộ…"}
            {cloud.status === "synced" &&
              `✅ Đã đồng bộ${cloud.lastSynced ? ` lúc ${timeFmt.format(new Date(cloud.lastSynced))}` : ""}`}
            {cloud.status === "error" && `⚠️ ${cloud.error}`}
          </p>
        )}

        <div className="row left">
          {cloud.status !== "conflict" && (
            <button className="btn ghost small" onClick={() => syncNow()} disabled={cloud.status === "syncing"}>
              🔄 Đồng bộ ngay
            </button>
          )}
          <button className="btn ghost small" onClick={() => signOut()}>
            Đăng xuất
          </button>
        </div>
        <p className="muted small-note">Đăng xuất thì tiến độ vẫn còn trên máy này.</p>
      </div>
    );
  }

  // Chưa đăng nhập
  return (
    <div className="card cloud-card">
      <h2>☁️ Lưu tiến độ lên tài khoản (không bắt buộc)</h2>
      <p className="muted">
        Hiện tiến độ chỉ lưu trên trình duyệt này. Đăng nhập bằng email để không bị mất khi đổi máy, và để bé chơi
        tiếp được trên máy tính bảng hay điện thoại khác. Không cần mật khẩu: chúng tôi gửi một mã đăng nhập vào email.
      </p>

      <LoginForm emailLabel="Email của bố mẹ:" placeholder="bome@email.com" />
    </div>
  );
}
