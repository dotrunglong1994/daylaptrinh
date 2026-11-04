"use client";

import { useEffect } from "react";
import { BADGES } from "@/lib/badges";
import { syncBadges, useProgress } from "@/lib/progress";

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function BadgesPage() {
  const progress = useProgress();
  // Ghi nhận huy hiệu đạt được ngoài lúc chơi game (vd. thú cưng lớn lên)
  useEffect(() => {
    if (progress.loaded) syncBadges();
  }, [progress.loaded]);

  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  return (
    <div className="page">
      <h1 className="page-title">🏅 Huy hiệu</h1>
      <p className="muted">
        {progress.profile ? `${progress.profile.name} có` : "Bé có"} {earned}/{BADGES.length} huy hiệu. Chơi game, giữ chuỗi ngày học và làm
        thử thách hằng ngày để sưu tập thêm nhé!
      </p>
      <ul className="badge-grid">
        {BADGES.map((b) => {
          const day = progress.badges[b.id];
          const [value, goal] = b.measure(progress);
          return (
            <li key={b.id} className={`card badge${day ? " earned" : ""}`}>
              <span className="badge-emoji" aria-hidden>
                {b.emoji}
              </span>
              <strong>{b.name}</strong>
              <small className="muted">{b.text}</small>
              {day ? (
                <small className="badge-date">Đạt ngày {dateFmt.format(new Date(`${day}T00:00`))}</small>
              ) : (
                <>
                  <progress max={goal} value={Math.min(value, goal)} aria-label={`Tiến độ ${b.name}`} />
                  <small className="muted">
                    {Math.min(value, goal)}/{goal}
                  </small>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
