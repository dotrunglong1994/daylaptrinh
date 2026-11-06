"use client";

import { useState } from "react";
import CloudPanel from "@/components/CloudPanel";
import InstallCard from "@/components/InstallCard";
import SkillReport from "@/components/SkillReport";
import Stars from "@/components/Stars";
import WeeklyReport from "@/components/WeeklyReport";
import { GAMES, GRADES, gamesForGrade } from "@/lib/games";
import { useCloud } from "@/lib/cloud";
import { removeKid, resetProgress, switchKid, totalStars, useProgress } from "@/lib/progress";
import { streakOf, useNow } from "@/lib/useNow";

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ParentPage() {
  const progress = useProgress();
  const cloud = useCloud();
  const [confirming, setConfirming] = useState<"reset" | "remove" | null>(null);
  const { streak } = streakOf(progress.daily, useNow());
  const plays = Object.values(progress.games).reduce((sum, g) => sum + g.plays, 0);
  const playable = GAMES.filter((g) => g.src);
  const kids = progress.kids.filter((k) => k.profile);
  const name = progress.profile?.name ?? "bé";

  return (
    <div className="page">
      <h1 className="page-title">👨‍👩‍👧 Góc phụ huynh</h1>
      {kids.length > 1 && (
        <div className="kid-tabs" role="group" aria-label="Xem tiến độ của bé">
          {kids.map((k) => (
            <button
              key={k.id}
              className={k.id === progress.kidId ? "on" : ""}
              aria-pressed={k.id === progress.kidId}
              onClick={() => {
                switchKid(k.id);
                setConfirming(null);
              }}
            >
              {k.profile!.avatar} {k.profile!.name}
            </button>
          ))}
        </div>
      )}
      <p className="muted">
        {progress.profile
          ? `Tiến độ học của ${progress.profile.name}${progress.profile.grade ? ` (lớp ${progress.profile.grade})` : ""}.`
          : "Bé chưa tạo hồ sơ."}{" "}
        {cloud.email ? `Dữ liệu được lưu trên máy này và tài khoản ${cloud.email}.` : "Dữ liệu đang lưu trên trình duyệt này."}
      </p>

      <div className="stats">
        <div className="card stat">
          <b>{totalStars(progress)}</b>
          <span>⭐ Sao đạt được</span>
        </div>
        <div className="card stat">
          <b>{progress.coins}</b>
          <span>🪙 Xu</span>
        </div>
        <div className="card stat">
          <b>{plays}</b>
          <span>🎮 Lượt chơi</span>
        </div>
        <div className="card stat">
          <b>{streak}</b>
          <span>🔥 Ngày học liên tiếp</span>
        </div>
      </div>

      <WeeklyReport />
      <SkillReport />

      <h2 className="section-title">📚 Theo lớp</h2>
      <div className="grade-progress">
        {GRADES.map((n) => {
          const games = gamesForGrade(n);
          const played = games.filter((g) => progress.games[g.id]).length;
          const stars = games.reduce((sum, g) => sum + (progress.games[g.id]?.bestStars ?? 0), 0);
          const mine = progress.profile?.grade === n;
          return (
            <div key={n} className={`card grade-card${mine ? " mine" : ""}`}>
              <b>
                Lớp {n}
                {mine && " ⭐"}
              </b>
              <span>
                Đã chơi {played}/{games.length} game
              </span>
              <progress max={games.length * 3} value={stars} aria-label={`Sao lớp ${n}`} />
              <small className="muted">
                ⭐ {stars}/{games.length * 3} sao
              </small>
            </div>
          );
        })}
      </div>
      {progress.profile && !progress.profile.grade && (
        <p className="muted small-note">Chọn lớp cho bé bằng cách bấm vào tên bé ở góc trên.</p>
      )}

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Trò chơi</th>
              <th>Sao cao nhất</th>
              <th>Điểm cao nhất</th>
              <th>Lượt chơi</th>
              <th>Lần cuối</th>
            </tr>
          </thead>
          <tbody>
            {playable.map((g) => {
              const r = progress.games[g.id];
              return (
                <tr key={g.id}>
                  <td>
                    {g.emoji} {g.title}
                    {r?.progressText && <small className="muted"> · {r.progressText}</small>}
                  </td>
                  <td>
                    <Stars value={r?.bestStars ?? 0} />
                  </td>
                  <td>{r?.bestScore ?? "–"}</td>
                  <td>{r?.plays ?? 0}</td>
                  <td>{r ? dateFmt.format(new Date(r.lastPlayed)) : "Chưa chơi"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CloudPanel />
      <InstallCard />

      <div className="row left">
        {confirming ? (
          <>
            <span>
              {confirming === "reset"
                ? `Xóa toàn bộ sao, xu, thú cưng và lịch sử chơi của ${name}`
                : `Xóa hẳn hồ sơ ${name} (cả sao, xu, thú cưng)`}
              {cloud.email ? " (cả trên tài khoản)" : ""}?
            </span>
            <button
              className="btn danger small"
              onClick={() => {
                if (confirming === "reset") resetProgress();
                else if (progress.kidId) removeKid(progress.kidId);
                setConfirming(null);
              }}
            >
              Xóa
            </button>
            <button className="btn ghost small" onClick={() => setConfirming(null)}>
              Hủy
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost small" onClick={() => setConfirming("reset")}>
              🗑️ Xóa tiến độ của {name}
            </button>
            {kids.length > 1 && (
              <button className="btn ghost small" onClick={() => setConfirming("remove")}>
                👋 Xóa hồ sơ {name}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
