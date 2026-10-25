"use client";

import Link from "next/link";
import Stars from "@/components/Stars";
import { GAMES, SUBJECTS } from "@/lib/games";
import { useProgress } from "@/lib/progress";

export default function MapPage() {
  const progress = useProgress();

  return (
    <div className="page">
      <h1 className="page-title">
        🗺️ Bản đồ phiêu lưu
        {progress.profile && <span className="muted"> của {progress.profile.name}</span>}
      </h1>

      <div className="islands">
        {SUBJECTS.map((s) => (
          <section key={s.id} id={s.id} className="island" style={{ "--c": s.color } as React.CSSProperties}>
            <h2>
              {s.emoji} {s.name}
            </h2>
            <ol className="trail">
              {GAMES.filter((g) => g.subject === s.id).map((g) => {
                const record = progress.games[g.id];
                const body = (
                  <>
                    <span className="node-emoji">{g.src ? g.emoji : "🔒"}</span>
                    <span className="node-info">
                      <strong>{g.title}</strong>
                      <small>{g.src ? g.description : "Sắp ra mắt"}</small>
                      {g.src && (
                        <span className="node-meta">
                          <Stars value={record?.bestStars ?? 0} />
                          {record?.progressText && <em>{record.progressText}</em>}
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={g.id}>
                    {g.src ? (
                      <Link href={`/choi/${g.id}`} className="node">
                        {body}
                      </Link>
                    ) : (
                      <div className="node locked">{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
