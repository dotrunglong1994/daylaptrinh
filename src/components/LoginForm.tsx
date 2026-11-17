"use client";

import { useState } from "react";
import { sendCode, verifyCode } from "@/lib/cloud";

/** Đăng nhập không cần mật khẩu: gửi mã vào email rồi nhập mã. Dùng ở Góc phụ huynh và trang giáo viên. */
export default function LoginForm({ emailLabel, placeholder }: { emailLabel: string; placeholder: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <>
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
          <label htmlFor="email">{emailLabel}</label>
          <div className="cloud-inputs">
            <input
              id="email"
              type="email"
              className="name-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
            />
            <button className="btn primary" disabled={busy || !email.trim()}>
              {busy ? "Đang gửi…" : "Gửi mã"}
            </button>
          </div>
        </form>
      )}
      {message && <p className="form-error">⚠️ {message}</p>}
    </>
  );
}
