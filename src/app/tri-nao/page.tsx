"use client";

import Link from "next/link";
import { BRAIN_GAMES } from "@/lib/brain";
import { dayKey } from "@/lib/pet";
import { useProgress } from "@/lib/progress";
import { streakOf, useNow } from "@/lib/useNow";

export default function BrainPage() {
  const progress = useProgress();
  const now = useNow();
  const { streak, playedToday } = streakOf(progress.brainDaily, now);
  const today = now ? dayKey(now) : "";

  return (
    <div className="page brain-page">
      <h1 className="page-title">🧠 Phòng Tập Trí Não</h1>
      <p className="muted">
        Dành cho bố mẹ và người lớn: mỗi ngày vài phút luyện trí nhớ, sự tập trung và tốc độ xử lý. Điểm được lưu riêng,
        không ảnh hưởng sao và xu của bé.
      </p>

      {progress.loaded && (
        <div className="brain-streak">
          <b>🔥 {streak}</b> ngày tập liên tiếp
          <span className="muted">{playedToday ? " · Hôm nay đã tập ✓" : " · Hôm nay chưa tập"}</span>
        </div>
      )}

      <div className="brain-grid">
        {BRAIN_GAMES.map((g) => {
          const r = progress.brain[g.id];
          const recent = r?.history.slice(-7) ?? [];
          const top = Math.max(1, ...recent.map((h) => h.score));
          const todayScore = r?.history.find((h) => h.day === today)?.score;
          return (
            <Link key={g.id} href={`/tri-nao/${g.id}`} className="brain-card">
              <span className="brain-skill">{g.skill}</span>
              <h2>
                {g.emoji} {g.title}
              </h2>
              <p>{g.description}</p>
              <div className="brain-stats">
                <span>
                  Kỷ lục <b>{r?.best ?? "–"}</b>
                </span>
                <span>
                  Hôm nay <b>{todayScore ?? "–"}</b>
                </span>
                <span>
                  ⏱ <b>{g.minutes}</b>
                </span>
              </div>
              {recent.length > 1 && (
                <div className="brain-bars" aria-label="Điểm cao nhất 7 ngày tập gần nhất">
                  {recent.map((h) => (
                    <i key={h.day} style={{ height: `${Math.max(8, (h.score / top) * 100)}%` }} title={`${h.day}: ${h.score}`} />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
