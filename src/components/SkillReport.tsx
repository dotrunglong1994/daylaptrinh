"use client";

import Link from "next/link";
import { getGame } from "@/lib/games";
import { useProgress } from "@/lib/progress";
import { strongSkills, weakSkills } from "@/lib/skills";

const dateText = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }) : "");

/** Góc phụ huynh: sổ tay lỗi sai, màn nào bé còn hay sai, màn nào đã vững. */
export default function SkillReport() {
  const progress = useProgress();
  if (!progress.loaded) return null;
  const weak = weakSkills(progress.skills).filter((s) => getGame(s.g)).slice(0, 8);
  const strong = strongSkills(progress.skills).filter((s) => getGame(s.g)).slice(0, 16);

  return (
    <section className="weekly skill-report">
      <h2 className="section-title skill-title">
        📒 Sổ tay lỗi sai
        {weak.length > 0 && (
          <Link href="/phieu-bai-tap" className="btn ghost small">
            🖨️ In phiếu bài tập
          </Link>
        )}
      </h2>
      {weak.length === 0 && strong.length === 0 ? (
        <p className="card muted">
          Khi bé trả lời sai trong game, câu đó được ghi lại ở đây theo từng màn. Hôm sau thử thách hằng ngày sẽ cho bé ôn
          đúng màn bé hay sai.
        </p>
      ) : (
        <div className="week-lists">
          <div className="card">
            <h3>🌱 Cần ôn lại</h3>
            {weak.length ? (
              <ul className="skill-list">
                {weak.map((s) => {
                  const game = getGame(s.g)!;
                  return (
                    <li key={`${s.g}#${s.l}`}>
                      <div className="skill-head">
                        <span>
                          {game.emoji} <b>{s.name}</b> <small className="muted">· {game.title}</small>
                        </span>
                        <Link href={`/choi/${s.g}?man=${s.l + 1}`} className="btn ghost small">
                          Ôn lại
                        </Link>
                      </div>
                      <small className="muted">
                        Sai {s.wrong} câu trong {s.wrongDays.length} ngày, lần gần nhất {dateText(s.lastWrongAt)}
                        {s.bestStars > 0 && ` · cao nhất ${s.bestStars} ⭐`}
                      </small>
                      {s.recent.length > 0 && (
                        <ul className="skill-questions">
                          {s.recent.map((q) => (
                            <li key={q}>“{q}”</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Màn nào bé từng sai cũng đã được 3 sao lại rồi. Giỏi quá!</p>
            )}
          </div>
          <div className="card">
            <h3>💪 Đã vững</h3>
            {strong.length ? (
              <p className="skill-chips">
                {strong.map((s) => (
                  <span key={`${s.g}#${s.l}`} className="chip" title={getGame(s.g)!.title}>
                    {getGame(s.g)!.emoji} {s.name}
                  </span>
                ))}
              </p>
            ) : (
              <p className="muted">Bé chưa có màn nào đạt 3 sao gần đây.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
