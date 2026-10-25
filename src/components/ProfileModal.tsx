"use client";

import { useState } from "react";
import { setProfile, type Profile } from "@/lib/progress";
import Dino from "./Dino";

const AVATARS = ["🦖", "🐱", "🐶", "🐰", "🦊", "🐼", "🐯", "🦄"];

export default function ProfileModal({ initial, onDone }: { initial: Profile | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0]);
  const trimmed = name.trim();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    setProfile({ name: trimmed, avatar });
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
        <div className="row">
          {initial && (
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
