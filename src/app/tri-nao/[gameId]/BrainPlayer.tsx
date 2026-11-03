"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BrainGame } from "@/lib/brain";
import { recordBrain } from "@/lib/progress";

type Toast = { id: number; score: number; record: boolean };

export default function BrainPlayer({ game }: { game: BrainGame }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Nhận điểm từ game (public/games/shared/bridge.js)
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data;
      if (data?.source !== "daylaptrinh-game" || data.gameId !== game.id) return;
      const score = Math.max(0, Math.round(Number(data.score) || 0));
      setToast({ id: Date.now(), score, record: recordBrain(game.id, score) });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="player brain-player">
      <div className="player-bar">
        <Link href="/tri-nao" className="btn ghost small">
          ← Phòng tập
        </Link>
        <h1>
          {game.emoji} {game.title}
        </h1>
        <span className="skills">
          <span className="chip">{game.skill}</span>
          <span className="chip">⏱ {game.minutes}</span>
        </span>
      </div>
      <iframe ref={frame} src={game.src} title={game.title} className="player-frame" allow="autoplay" />
      {toast && (
        <div key={toast.id} className="reward" role="status">
          {toast.record ? `🏆 Kỷ lục mới: ${toast.score}` : `Đã lưu: ${toast.score} điểm`}
        </div>
      )}
    </div>
  );
}
