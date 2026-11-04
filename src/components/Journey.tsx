"use client";

import Link from "next/link";
import { useState } from "react";
import { JOURNEY_GOAL, STOPS, nextRare, stepsThisWeek, weekOf } from "@/lib/journey";
import { claimJourney, useProgress } from "@/lib/progress";
import { useNow } from "@/lib/useNow";

/** Trang thú cưng: thú cưng đi một chặng mỗi ngày bé xong thử thách, đủ chặng thì mở rương đồ hiếm. */
export default function Journey({ petEmoji }: { petEmoji: string }) {
  const progress = useProgress();
  const now = useNow();
  const [message, setMessage] = useState<string | null>(null);
  if (!now) return null;

  const steps = stepsThisWeek(progress.challenge?.days, now);
  const claimed = progress.journey.includes(weekOf(now));
  const ready = steps >= JOURNEY_GOAL && !claimed;
  const prize = nextRare(progress.inventory);
  // Thú cưng đứng ở chặng vừa tới (chưa đi chặng nào thì ở nhà)
  const at = Math.max(0, Math.min(steps, STOPS.length) - 1);

  function open() {
    const result = claimJourney();
    if (!result.ok) return setMessage(result.reason);
    setMessage(result.item ? `Trong rương có ${result.item.emoji} ${result.item.name}! Vào cửa hàng để dùng nhé.` : `Trong rương có ${result.coins} 🪙!`);
  }

  return (
    <section className="card journey">
      <h2>🗺️ Hành trình tuần này</h2>
      <p className="muted">
        Mỗi ngày bé xong <Link href="/">thử thách hôm nay</Link>, thú cưng đi thêm một chặng. Đủ {JOURNEY_GOAL} chặng trong
        tuần thì mở rương báu {prize ? `(${prize.emoji} đồ hiếm)` : "(xu)"}.
      </p>
      <ol className="journey-path" aria-label={`Đã đi ${steps} trên ${STOPS.length} chặng`}>
        {STOPS.map((s, i) => (
          <li key={s.name} className={i < steps ? "passed" : i === JOURNEY_GOAL - 1 ? "chest" : ""}>
            <span className="stop">{i === JOURNEY_GOAL - 1 && !claimed ? "🎁" : s.emoji}</span>
            {i === at && <span className="walker">{petEmoji}</span>}
            <small>{s.name}</small>
          </li>
        ))}
      </ol>
      <div className="row left">
        <strong>
          Đã đi {steps}/{STOPS.length} chặng
        </strong>
        {ready && (
          <button className="btn primary small" onClick={open}>
            🎁 Mở rương báu
          </button>
        )}
        {claimed && <span className="muted">Tuần này đã mở rương ✅</span>}
      </div>
      {message && <p className="journey-msg">{message}</p>}
    </section>
  );
}
