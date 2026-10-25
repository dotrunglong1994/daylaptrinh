"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/games";
import { recordResult } from "@/lib/progress";

type Reward = { id: number; coins: number; bonus: number; stars: number };

export default function GamePlayer({ game }: { game: Game }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [reward, setReward] = useState<Reward | null>(null);

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
        <span className="skills">
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
