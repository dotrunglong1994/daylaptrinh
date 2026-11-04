"use client";

import { SUBJECTS, getGame, suggestGames } from "@/lib/games";
import { dayKey } from "@/lib/pet";
import { useProgress } from "@/lib/progress";
import { useNow } from "@/lib/useNow";

const DAY = 86_400_000;
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Góc phụ huynh: 7 ngày qua bé học thế nào, mạnh và cần luyện game nào, nên chơi gì tiếp. */
export default function WeeklyReport() {
  const progress = useProgress();
  const now = useNow();
  if (!progress.loaded || !now) return null;

  const log = progress.log;
  const days = Array.from({ length: 7 }, (_, i) => {
    const t = now - (6 - i) * DAY;
    return { key: dayKey(t), label: WEEKDAY[new Date(t).getDay()] };
  });
  const thisWeek = new Set(days.map((d) => d.key));
  const lastWeek = new Set(Array.from({ length: 7 }, (_, i) => dayKey(now - (7 + i) * DAY)));
  const entries = log.filter((e) => thisWeek.has(e.d));
  const before = log.filter((e) => lastWeek.has(e.d)).length;

  const perDay = days.map((d) => {
    const list = entries.filter((e) => e.d === d.key);
    return { ...d, plays: list.length, stars: list.reduce((sum, e) => sum + e.s, 0) };
  });
  const maxPlays = Math.max(1, ...perDay.map((d) => d.plays));
  const activeDays = perDay.filter((d) => d.plays).length;
  const stars = entries.reduce((sum, e) => sum + e.s, 0);
  const bySubject = SUBJECTS.map((s) => ({ ...s, plays: entries.filter((e) => getGame(e.g)?.subject === s.id).length }));

  // Mỗi game chơi trong tuần: số lượt, sao cao nhất, sao trung bình
  const perGame = [...new Set(entries.map((e) => e.g))].flatMap((id) => {
    const game = getGame(id);
    if (!game) return [];
    const list = entries.filter((e) => e.g === id);
    const best = Math.max(...list.map((e) => e.s));
    return [{ game, plays: list.length, best, avg: list.reduce((sum, e) => sum + e.s, 0) / list.length }];
  });
  const strong = perGame.filter((g) => g.best === 3).sort((a, b) => b.avg - a.avg || b.plays - a.plays).slice(0, 3);
  const weak = perGame.filter((g) => g.best < 3).sort((a, b) => a.avg - b.avg || b.plays - a.plays).slice(0, 3);
  const grade = progress.profile?.grade;
  const next = grade ? suggestGames(grade, progress.games, 3) : [];
  const diff = entries.length - before;

  return (
    <section className="weekly">
      <h2 className="section-title">📅 Báo cáo 7 ngày qua</h2>
      {entries.length === 0 ? (
        <p className="card muted">
          Bé chưa chơi game nào trong 7 ngày qua. Báo cáo ghi lại mỗi lượt chơi từ khi có tính năng này.
        </p>
      ) : (
        <>
          <div className="stats">
            <div className="card stat">
              <b>{activeDays}/7</b>
              <span>📆 Ngày có học</span>
            </div>
            <div className="card stat">
              <b>{entries.length}</b>
              <span>
                🎮 Lượt chơi
                {before > 0 && (
                  <small className="muted"> ({diff >= 0 ? `+${diff}` : diff} so với tuần trước)</small>
                )}
              </span>
            </div>
            <div className="card stat">
              <b>{stars}</b>
              <span>⭐ Sao qua các lượt chơi</span>
            </div>
            <div className="card stat">
              <b>
                {bySubject.map((s) => s.plays).join(" · ")}
              </b>
              <span>{bySubject.map((s) => `${s.emoji} ${s.name.replace("Đảo ", "")}`).join(" · ")}</span>
            </div>
          </div>

          <div className="card week-chart-card">
            <h3>Lượt chơi mỗi ngày</h3>
            <div className="week-chart" role="img" aria-label="Biểu đồ lượt chơi 7 ngày qua, xem bảng bên dưới">
              {perDay.map((d, i) => (
                <div key={d.key} className={`week-col${i === 6 ? " today" : ""}`} tabIndex={0}>
                  <span className="week-tip">
                    {d.plays} lượt · {d.stars} ⭐
                  </span>
                  <span className="week-bar-wrap">
                    {d.plays > 0 && <span className="week-bar" style={{ height: `${(d.plays / maxPlays) * 100}%` }} />}
                  </span>
                  <span className="week-day">{i === 6 ? "Hôm nay" : d.label}</span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Lượt chơi và số sao mỗi ngày</caption>
              <tbody>
                {perDay.map((d) => (
                  <tr key={d.key}>
                    <th scope="row">{d.key}</th>
                    <td>{d.plays} lượt</td>
                    <td>{d.stars} sao</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="week-lists">
            <div className="card">
              <h3>💪 Bé làm tốt</h3>
              {strong.length ? (
                <ul>
                  {strong.map((g) => (
                    <li key={g.game.id}>
                      {g.game.emoji} {g.game.title} <small className="muted">· {g.plays} lượt, đạt 3 sao</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Tuần này bé chưa đạt 3 sao game nào.</p>
              )}
            </div>
            <div className="card">
              <h3>🌱 Cần luyện thêm</h3>
              {weak.length ? (
                <ul>
                  {weak.map((g) => (
                    <li key={g.game.id}>
                      {g.game.emoji} {g.game.title}{" "}
                      <small className="muted">
                        · {g.plays} lượt, cao nhất {g.best} ⭐ ({g.game.skills.join(", ")})
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Game nào bé chơi tuần này cũng đạt 3 sao. Tuyệt vời!</p>
              )}
            </div>
            {next.length > 0 && (
              <div className="card">
                <h3>🎯 Nên chơi tiếp</h3>
                <ul>
                  {next.map((g) => (
                    <li key={g.id}>
                      {g.emoji} {g.title} <small className="muted">· {g.skills.join(", ")}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
