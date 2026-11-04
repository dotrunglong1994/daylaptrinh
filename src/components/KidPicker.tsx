"use client";

import { switchKid, totalStars, useProgress } from "@/lib/progress";
import Dino from "./Dino";

export const MAX_KIDS = 6;

type Props = {
  /** who: hỏi khi mở web; switch: bé bấm vào tên mình ở góc trên */
  mode: "who" | "switch";
  onPick: () => void;
  onAdd: () => void;
  onEdit?: () => void;
  onClose?: () => void;
};

/** Chọn bé đang chơi: mỗi bé có sao, xu, thú cưng và huy hiệu riêng. */
export default function KidPicker({ mode, onPick, onAdd, onEdit, onClose }: Props) {
  const progress = useProgress();
  const kids = progress.kids.filter((k) => k.profile);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="kid-title">
      <div className="card modal-card kid-picker">
        <Dino mood="happy" size={80} />
        <h2 id="kid-title">{mode === "who" ? "Ai đang chơi nhỉ?" : "Đổi bạn chơi"}</h2>
        <div className="kid-grid">
          {kids.map((k) => (
            <button
              key={k.id}
              className={`kid-btn${k.id === progress.kidId ? " on" : ""}`}
              onClick={() => {
                switchKid(k.id);
                onPick();
              }}
            >
              <span className="kid-avatar">{k.profile!.avatar}</span>
              <strong>{k.profile!.name}</strong>
              <small>
                {k.profile!.grade ? `Lớp ${k.profile!.grade} · ` : ""}⭐ {totalStars(k)}
              </small>
            </button>
          ))}
          {kids.length < MAX_KIDS && (
            <button className="kid-btn add" onClick={onAdd}>
              <span className="kid-avatar">➕</span>
              <strong>Thêm bé</strong>
              <small>Anh, chị, em…</small>
            </button>
          )}
        </div>
        {mode === "switch" && (
          <div className="row">
            {onEdit && progress.profile && (
              <button className="btn ghost small" onClick={onEdit}>
                ✏️ Sửa hồ sơ {progress.profile.name}
              </button>
            )}
            <button className="btn ghost small" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
