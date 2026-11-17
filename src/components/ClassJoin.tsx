"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { joinClass, leaveClass, loadMyClasses, useMyClasses } from "@/lib/classroom";
import { cloudEnabled, cloudUserId, useCloud } from "@/lib/cloud";
import { getSavedData, useProgress } from "@/lib/progress";

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Góc phụ huynh: cho bé vào lớp của cô giáo bằng mã lớp. */
export default function ClassJoin() {
  const progress = useProgress();
  const cloud = useCloud();
  const mine = useMyClasses();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);

  const signedIn = Boolean(cloud.email);
  useEffect(() => {
    if (signedIn && mine.user !== cloudUserId()) loadMyClasses();
  }, [signedIn, mine.user]);

  if (!cloudEnabled || cloud.status === "off" || cloud.status === "loading" || !progress.profile) return null;
  const name = progress.profile.name;
  const classes = mine.list.filter((m) => m.kid_id === progress.kidId);

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    const kid = getSavedData().kids.find((k) => k.id === progress.kidId);
    if (!kid) return;
    setBusy(true);
    setMessage(null);
    const err = await joinClass(code, kid);
    setBusy(false);
    if (err) return setMessage({ ok: false, text: err });
    setCode("");
    setMessage({ ok: true, text: `Đã cho ${name} vào lớp. Cô giáo sẽ thấy tiến độ của ${name} sau mỗi lần bé chơi.` });
  }

  async function onLeave(classId: string) {
    setBusy(true);
    const err = await leaveClass(classId, progress.kidId!);
    setBusy(false);
    setLeaving(null);
    setMessage(err ? { ok: false, text: err } : null);
  }

  return (
    <div className="card cloud-card class-join">
      <h2>🏫 Lớp học của {name}</h2>
      {!signedIn ? (
        <p className="muted">
          Nếu cô giáo gửi mã lớp, bố mẹ đăng nhập tài khoản phụ huynh ở phần ☁️ dưới đây rồi nhập mã để cô xem được tiến
          độ của {name}. Cô chỉ thấy tên, sao, lượt chơi và các màn bé hay sai.
        </p>
      ) : (
        <>
          {classes.length > 0 ? (
            <ul className="class-list">
              {classes.map((c) => (
                <li key={c.class_id}>
                  <span>
                    <b>{c.class_name}</b>
                    <small className="muted"> · gửi tiến độ lần cuối {dateFmt.format(new Date(c.updated_at))}</small>
                  </span>
                  {leaving === c.class_id ? (
                    <span className="row">
                      <button className="btn danger small" disabled={busy} onClick={() => onLeave(c.class_id)}>
                        Rời lớp
                      </button>
                      <button className="btn ghost small" onClick={() => setLeaving(null)}>
                        Thôi
                      </button>
                    </span>
                  ) : (
                    <button className="btn ghost small" onClick={() => setLeaving(c.class_id)}>
                      Rời lớp
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              {name} chưa vào lớp nào. Nhập mã 6 ký tự cô giáo gửi để cô xem được tiến độ của bé (tên, sao, lượt chơi,
              các màn bé hay sai).
            </p>
          )}
          <form className="cloud-form" onSubmit={onJoin}>
            <label htmlFor="class-code">Mã lớp:</label>
            <div className="cloud-inputs">
              <input
                id="class-code"
                className="name-input otp-input"
                autoComplete="off"
                autoCapitalize="characters"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="K7M2QP"
              />
              <button className="btn primary" disabled={busy || code.length !== 6}>
                {busy ? "Đang vào lớp…" : "Vào lớp"}
              </button>
            </div>
          </form>
          {mine.error && <p className="form-error">⚠️ {mine.error}</p>}
        </>
      )}
      {message && <p className={message.ok ? "form-ok" : "form-error"}>{message.ok ? "✅" : "⚠️"} {message.text}</p>}
      <p className="muted small-note">
        Là giáo viên? <Link href="/giao-vien">Tạo lớp và xem tiến độ cả lớp</Link>.
      </p>
    </div>
  );
}
