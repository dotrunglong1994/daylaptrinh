"use client";

import { useState } from "react";
import Stars from "@/components/Stars";
import { GAMES } from "@/lib/games";
import { resetProgress, totalStars, useProgress } from "@/lib/progress";
import { streakOf, useNow } from "@/lib/useNow";

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function ParentPage() {
  const progress = useProgress();
  const [confirming, setConfirming] = useState(false);
  const { streak } = streakOf(progress.daily, useNow());
  const plays = Object.values(progress.games).reduce((sum, g) => sum + g.plays, 0);
  const playable = GAMES.filter((g) => g.src);

  return (
    <div className="page">
      <h1 className="page-title">👨‍👩‍👧 Góc phụ huynh</h1>
      <p className="muted">
        {progress.profile ? `Tiến độ học của ${progress.profile.name}.` : "Bé chưa tạo hồ sơ."} Dữ liệu đang lưu trên trình
        duyệt này.
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

      <div className="row left">
        {confirming ? (
          <>
            <span>Xóa toàn bộ sao, xu, thú cưng và lịch sử chơi?</span>
            <button
              className="btn danger small"
              onClick={() => {
                resetProgress();
                setConfirming(false);
              }}
            >
              Xóa
            </button>
            <button className="btn ghost small" onClick={() => setConfirming(false)}>
              Hủy
            </button>
          </>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirming(true)}>
            🗑️ Xóa tiến độ
          </button>
        )}
      </div>
    </div>
  );
}
