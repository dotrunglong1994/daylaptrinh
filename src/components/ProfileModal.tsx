"use client";

import { useState } from "react";
import { GRADES } from "@/lib/games";
import { addKid, setProfile, type Profile } from "@/lib/progress";
import Dino from "./Dino";

const AVATARS = ["🦖", "🐱", "🐶", "🐰", "🦊", "🐼", "🐯", "🦄"];

type Props = {
  /** Hồ sơ đang sửa; null = tạo bé mới */
  initial: Profile | null;
  onDone: () => void;
  /** Cho phép đóng khi đang thêm bé (đã có bé khác) */
  canCancel?: boolean;
};

export default function ProfileModal({ initial, onDone, canCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0]);
  const [grade, setGrade] = useState<number | undefined>(initial?.grade);
  const trimmed = name.trim();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    const profile = { name: trimmed, avatar, ...(grade && { grade }) };
    if (initial) setProfile(profile);
    else addKid(profile);
    onDone();
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <form className="card modal-card" onSubmit={save}>
        <Dino mood="happy" size={90} />
        <h2 id="profile-title">{initial ? "Đổi hồ sơ" : "Chào bé! Bé tên là gì?"}</h2>
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên của bé"
          maxLength={20}
          autoFocus
        />
        <p className="muted">Chọn bạn đồng hành:</p>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              className={a === avatar ? "active" : ""}
              onClick={() => setAvatar(a)}
              aria-label={`Chọn ${a}`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="muted">Bé đang học lớp mấy?</p>
        <div className="grade-filter grade-pick" role="group" aria-label="Lớp của bé">
          {GRADES.map((n) => (
            <button
              type="button"
              key={n}
              className={grade === n ? "on" : ""}
              aria-pressed={grade === n}
              onClick={() => setGrade(grade === n ? undefined : n)}
            >
              Lớp {n}
            </button>
          ))}
        </div>
        <div className="row">
          {(initial || canCancel) && (
            <button type="button" className="btn ghost" onClick={onDone}>
              Hủy
            </button>
          )}
          <button className="btn primary" disabled={!trimmed}>
            {initial ? "Lưu" : "Bắt đầu! 🚀"}
          </button>
        </div>
      </form>
    </div>
  );
}
