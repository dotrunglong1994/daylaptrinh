"use client";

import { dayKey } from "@/lib/pet";
import { useProgress } from "@/lib/progress";
import { streakOf, useNow } from "@/lib/useNow";

const MEDALS = ["🥇", "🥈", "🥉"];

/** Trang chủ: các bé trong nhà thi đua sao kiếm được trong 7 ngày qua (chỉ hiện khi có từ 2 bé). */
export default function FamilyBoard() {
  const progress = useProgress();
  const now = useNow();
  const kids = progress.kids.filter((k) => k.profile);
  if (!progress.loaded || !now || kids.length < 2) return null;

  const week = new Set(Array.from({ length: 7 }, (_, i) => dayKey(now - i * 86_400_000)));
  const rows = kids
    .map((k) => ({
      kid: k,
      stars: k.log.filter((e) => week.has(e.d)).reduce((sum, e) => sum + e.s, 0),
      streak: streakOf(k.daily, now).streak,
    }))
    .sort((a, b) => b.stars - a.stars || b.streak - a.streak);
  const top = rows[0].stars;

  return (
    <section className="card family-board">
      <h2>🏁 Thi đua 7 ngày qua</h2>
      <ol>
        {rows.map((r, i) => (
          <li key={r.kid.id} className={r.kid.id === progress.kidId ? "me" : ""}>
            <span className="fb-medal">{r.stars > 0 ? (MEDALS[i] ?? "🎈") : "🎈"}</span>
            <span className="fb-avatar">{r.kid.profile!.avatar}</span>
            <strong>{r.kid.profile!.name}</strong>
            <span className="fb-bar" aria-hidden>
              <i style={{ width: `${top ? (r.stars / top) * 100 : 0}%` }} />
            </span>
            <span className="fb-num">⭐ {r.stars}</span>
            <small className="muted">🔥 {r.streak} ngày</small>
          </li>
        ))}
      </ol>
      <p className="muted">Sao được tính mỗi lượt chơi. Cùng cố gắng nhé, ai cũng giỏi!</p>
    </section>
  );
}
