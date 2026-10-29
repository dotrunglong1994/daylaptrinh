"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gradeText, type Game } from "@/lib/games";
import { recordResult } from "@/lib/progress";

type Reward = { id: number; coins: number; bonus: number; stars: number };

// Bật/tắt đọc to lời khủng long; game đọc khóa này mỗi lần nói (public/games/shared/mascot.js)
const READ_KEY = "bhv-read-aloud";
const readListeners = new Set<() => void>();
function subscribeRead(cb: () => void) {
  readListeners.add(cb);
  return () => readListeners.delete(cb);
}
function readAloudOn() {
  try {
    return localStorage.getItem(READ_KEY) !== "off";
  } catch {
    return true;
  }
}

export default function GamePlayer({ game }: { game: Game }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const readAloud = useSyncExternalStore(subscribeRead, readAloudOn, () => true);

  function toggleRead() {
    try {
      localStorage.setItem(READ_KEY, readAloud ? "off" : "on");
    } catch {}
    if (readAloud) frame.current?.contentWindow?.speechSynthesis?.cancel();
    readListeners.forEach((l) => l());
  }

  // Nhận kết quả từ game (public/games/shared/bridge.js)
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data;
      if (data?.source !== "daylaptrinh-game" || data.gameId !== game.id) return;
      const stars = Number(data.stars) || 0;
      const { coins, bonus } = recordResult(game.id, {
        stars,
        score: Number(data.score) || 0,
        progressText: typeof data.progressText === "string" ? data.progressText : undefined,
      });
      setReward({ id: Date.now(), coins, bonus, stars });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game.id]);

  useEffect(() => {
    if (!reward) return;
    const t = setTimeout(() => setReward(null), 2600);
    return () => clearTimeout(t);
  }, [reward]);

  return (
    <div className="player">
      <div className="player-bar">
        <Link href="/ban-do" className="btn ghost small">
          ← Bản đồ
        </Link>
        <h1>
          {game.emoji} {game.title}
        </h1>
        <button
          className="btn ghost small"
          onClick={toggleRead}
          aria-pressed={readAloud}
          title="Đọc to lời khủng long (cần giọng tiếng Việt trên máy)"
        >
          {readAloud ? "🔊 Đọc to: Bật" : "🔇 Đọc to: Tắt"}
        </button>
        <span className="skills">
          <span className="chip">{gradeText(game.grades)}</span>
          {game.skills.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </span>
      </div>
      <iframe ref={frame} src={game.src} title={game.title} className="player-frame" allow="autoplay" />
      {reward && (
        <div key={reward.id} className="reward" role="status">
          {"⭐".repeat(reward.stars)} +{reward.coins} 🪙
          {reward.bonus > 0 && <small className="reward-bonus">🔥 Thưởng học hôm nay +{reward.bonus} 🪙</small>}
        </div>
      )}
    </div>
  );
}
