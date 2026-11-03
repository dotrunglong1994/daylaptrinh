"use client";

import Link from "next/link";
import Stars from "./Stars";
import { SUBJECTS, suggestGames } from "@/lib/games";
import { useProgress } from "@/lib/progress";

/** Trang chủ: vài game hợp lớp của bé mà bé chưa chơi hoặc chưa đủ 3 sao. */
export default function Suggestions() {
  const progress = useProgress();
  const profile = progress.profile;
  if (!progress.loaded || !profile) return null;

  if (!profile.grade) {
    return (
      <section className="card suggestions">
        <h2>🎯 Gợi ý cho {profile.name}</h2>
        <p className="muted">Bấm vào tên bé ở góc trên để chọn lớp, khủng long sẽ gợi ý game hợp với bé.</p>
      </section>
    );
  }

  const games = suggestGames(profile.grade, progress.games);
  return (
    <section className="card suggestions">
      <h2>
        🎯 Gợi ý hôm nay cho {profile.name} <span className="muted">· Lớp {profile.grade}</span>
      </h2>
      {games.length === 0 ? (
        <p className="muted">Bé đã đạt 3 sao mọi game của lớp {profile.grade}. Giỏi quá! Thử sức với lớp trên nhé.</p>
      ) : (
        <ol className="suggest-list">
          {games.map((g) => {
            const record = progress.games[g.id];
            const color = SUBJECTS.find((s) => s.id === g.subject)?.color;
            return (
              <li key={g.id}>
                <Link href={`/choi/${g.id}`} className="node" style={{ "--c": color } as React.CSSProperties}>
                  <span className="node-emoji">{g.emoji}</span>
                  <span className="node-info">
                    <strong>{g.title}</strong>
                    <small>{g.description}</small>
                    <span className="node-meta">
                      {record ? <Stars value={record.bestStars} /> : <em>Mới ✨</em>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <Link href="/ban-do" className="link-btn">
        Xem mọi game lớp {profile.grade} trên bản đồ →
      </Link>
    </section>
  );
}
