"use client";

import { useState } from "react";
import { cloudEnabled, resolveConflict, sendCode, signOut, syncNow, useCloud, verifyCode } from "@/lib/cloud";
import { getSavedData, totalStars, type SavedData } from "@/lib/progress";

const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short", dateStyle: "short" });

function summary(d: SavedData) {
  const plays = Object.values(d.games).reduce((sum, g) => sum + g.plays, 0);
  const stars = totalStars({ ...d, loaded: true });
  return [
    d.profile ? `${d.profile.avatar} ${d.profile.name}` : "Chưa có hồ sơ",
    `⭐ ${stars} sao · 🪙 ${d.coins} xu · 🎮 ${plays} lượt chơi`,
    d.pet ? `🐾 Thú cưng: ${d.pet.name}` : "Chưa nuôi thú cưng",
    d.savedAt ? `Cập nhật ${timeFmt.format(new Date(d.savedAt))}` : "",
  ].filter(Boolean);
}

/** Tài khoản phụ huynh: đăng nhập bằng mã gửi qua email để lưu tiến độ lên mạng. */
export default function CloudPanel() {
  const cloud = useCloud();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!cloudEnabled || cloud.status === "off" || cloud.status === "loading") return null;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    setBusy(true);
    setMessage(null);
    const err = await sendCode(target);
    setBusy(false);
    if (err) return setMessage(err);
    setSentTo(target);
    setCode("");
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setBusy(true);
    setMessage(null);
    const err = await verifyCode(sentTo, code.trim());
    setBusy(false);
    if (err) return setMessage(err);
    setSentTo(null);
  }

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

      {sentTo ? (
        <form className="cloud-form" onSubmit={onVerify}>
          <label htmlFor="otp">
            Nhập mã đã gửi tới <b>{sentTo}</b> (hoặc bấm vào liên kết trong email):
          </label>
          <div className="cloud-inputs">
            <input
              id="otp"
              className="name-input otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="123456"
              autoFocus
            />
            <button className="btn primary" disabled={busy || code.length < 6}>
              {busy ? "Đang kiểm tra…" : "Đăng nhập"}
            </button>
          </div>
          <p className="muted small-note">
            Không thấy email? Xem thư mục Spam, hoặc{" "}
            <button type="button" className="link-btn" onClick={() => setSentTo(null)}>
              đổi email / gửi lại mã
            </button>
            .
          </p>
        </form>
      ) : (
        <form className="cloud-form" onSubmit={onSend}>
          <label htmlFor="email">Email của bố mẹ:</label>
          <div className="cloud-inputs">
            <input
              id="email"
              type="email"
              className="name-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bome@email.com"
              required
            />
            <button className="btn primary" disabled={busy || !email.trim()}>
              {busy ? "Đang gửi…" : "Gửi mã"}
            </button>
          </div>
        </form>
      )}
      {message && <p className="form-error">⚠️ {message}</p>}
    </div>
  );
}
