"use client";

import Link from "next/link";
import { CHALLENGE_BONUS, challengeDone, challengeGames, reviewGame } from "@/lib/challenge";
import { SUBJECTS } from "@/lib/games";
import { dayKey } from "@/lib/pet";
import { useProgress } from "@/lib/progress";
import { useNow } from "@/lib/useNow";

/** Trang chủ: 3 game thử thách hôm nay, chơi xong cả 3 được thưởng thêm xu. */
export default function DailyChallenge() {
  const progress = useProgress();
  const now = useNow();
  if (!progress.loaded || !progress.profile || !now) return null;
  const day = dayKey(now);
  const games = challengeGames(day, progress.profile.grade, progress.log);
  const review = reviewGame(day, games, progress.log);
  if (!games.length) return null;
  const done = challengeDone(progress.log, day, games);
  const claimed = progress.challenge?.day === day;

  return (
    <section className={`card challenge${claimed ? " claimed" : ""}`}>
      <h2>
        🎯 Thử thách hôm nay{" "}
        <span className="muted">
          · {done.size}/{games.length}
        </span>
      </h2>
      <p className="muted">
        {claimed
          ? `Bé đã hoàn thành thử thách hôm nay và nhận ${CHALLENGE_BONUS} xu. Mai có thử thách mới nhé!`
          : `Chơi xong cả ${games.length} game (ít nhất 1 sao mỗi game) để nhận thêm ${CHALLENGE_BONUS} 🪙.`}
      </p>
      <ol className="suggest-list">
        {games.map((g) => {
          const color = SUBJECTS.find((s) => s.id === g.subject)?.color;
          const ok = done.has(g.id);
          return (
            <li key={g.id}>
              <Link href={`/choi/${g.id}`} className={`node${ok ? " done" : ""}`} style={{ "--c": color } as React.CSSProperties}>
                <span className="node-emoji">{ok ? "✅" : g.emoji}</span>
                <span className="node-info">
                  <strong>{g.title}</strong>
                  <small>{ok ? "Xong rồi!" : g.description}</small>
                  {g === review && !ok && <em className="review-tag">🔁 Ôn lại: lần trước bé chưa được 3 sao</em>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
