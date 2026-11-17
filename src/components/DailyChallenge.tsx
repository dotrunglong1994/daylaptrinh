"use client";

import Link from "next/link";
import { CHALLENGE_BONUS, challengeDone, challengeGames, challengeReview } from "@/lib/challenge";
import { assignmentStars, assignmentsForKid, daysLeft, useMyClasses } from "@/lib/classroom";
import { SUBJECTS, getGame } from "@/lib/games";
import { dayKey } from "@/lib/pet";
import { useProgress } from "@/lib/progress";
import { useNow } from "@/lib/useNow";

/** Trang chủ: 3 game thử thách hôm nay, chơi xong cả 3 được thưởng thêm xu. */
export default function DailyChallenge() {
  const progress = useProgress();
  const now = useNow();
  const mine = useMyClasses();
  if (!progress.loaded || !progress.profile || !now) return null;
  const day = dayKey(now);
  const games = challengeGames(day, progress.profile.grade, progress.log, progress.skills);
  const review = challengeReview(day, games, progress.log, progress.skills);
  const skill = review?.skill;
  if (!games.length) return null;
  const done = challengeDone(progress.log, day, games);
  const claimed = progress.challenge?.day === day;
  const tasks = assignmentsForKid(mine, progress.kidId).filter((a) => getGame(a.g));

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
      {tasks.length > 0 && (
        <ul className="suggest-list assign-list">
          {tasks.map((a) => {
            const g = getGame(a.g)!;
            const stars = assignmentStars(progress, a);
            const color = SUBJECTS.find((s) => s.id === g.subject)?.color;
            const left = daysLeft(a.due, day);
            const due =
              stars || left === null
                ? null
                : left > 1
                  ? `⏰ Còn ${left} ngày`
                  : left === 1
                    ? "⏰ Hạn nộp là ngày mai"
                    : left === 0
                      ? "⏰ Hôm nay là hạn nộp!"
                      : "⏰ Đã quá hạn, bé làm ngay nhé";
            return (
              <li key={a.id}>
                <Link
                  href={a.l >= 0 ? `/choi/${g.id}?man=${a.l + 1}` : `/choi/${g.id}`}
                  className={`node assign-node${stars ? " done" : ""}`}
                  style={{ "--c": color } as React.CSSProperties}
                >
                  <span className="node-emoji">{stars ? "✅" : g.emoji}</span>
                  <span className="node-info">
                    <em className="assign-tag">📌 Bài cô giao · {a.className}</em>
                    <strong>{a.l >= 0 ? a.level_name || `Màn ${a.l + 1}` : g.title}</strong>
                    <small>
                      {stars ? `Xong rồi! ${"⭐".repeat(stars)}` : a.l >= 0 ? g.title : "Chơi màn nào cũng được"}
                      {!stars && a.note && ` · “${a.note}”`}
                    </small>
                    {due && <em className={`assign-due${left !== null && left <= 0 ? " urgent" : ""}`}>{due}</em>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ol className="suggest-list">
        {games.map((g) => {
          const color = SUBJECTS.find((s) => s.id === g.subject)?.color;
          const ok = done.has(g.id);
          const isReview = g === review?.game;
          const href = isReview && skill ? `/choi/${g.id}?man=${skill.l + 1}` : `/choi/${g.id}`;
          return (
            <li key={g.id}>
              <Link href={href} className={`node${ok ? " done" : ""}`} style={{ "--c": color } as React.CSSProperties}>
                <span className="node-emoji">{ok ? "✅" : g.emoji}</span>
                <span className="node-info">
                  <strong>{g.title}</strong>
                  <small>{ok ? "Xong rồi!" : g.description}</small>
                  {isReview && !ok && (
                    <em className="review-tag">
                      {skill
                        ? `🔁 Ôn lại: ${skill.name} (bé sai ${skill.wrong} câu)`
                        : "🔁 Ôn lại: lần trước bé chưa được 3 sao"}
                    </em>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
