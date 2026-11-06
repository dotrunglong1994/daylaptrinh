"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gradeText, type Game } from "@/lib/games";
import { CHALLENGE_SIZE } from "@/lib/challenge";
import { recordMistake, recordResult, type Reward as Earned } from "@/lib/progress";

type Reward = Earned & { id: number; stars: number };

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

const subscribeNone = () => () => {};
function levelParam() {
  const man = new URLSearchParams(window.location.search).get("man") ?? "";
  return /^\d{1,2}$/.test(man) ? man : "";
}

export default function GamePlayer({ game }: { game: Game }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  // ?man=N (từ thử thách ôn lại, Góc phụ huynh): mở thẳng màn N của game. Chỉ đọc trên trình duyệt.
  const man = useSyncExternalStore(subscribeNone, levelParam, () => "");
  const src = game.src && man ? `${game.src}?man=${man}` : game.src;
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
      const level = typeof data.level === "number" ? data.level : undefined;
      const levelName = typeof data.levelName === "string" ? data.levelName.slice(0, 60) : "";
      if (data.type === "mistake") {
        if (level !== undefined) recordMistake(game.id, level, levelName, typeof data.question === "string" ? data.question : "");
        return;
      }
      const stars = Number(data.stars) || 0;
      const earned = recordResult(game.id, {
        stars,
        score: Number(data.score) || 0,
        progressText: typeof data.progressText === "string" ? data.progressText : undefined,
        level,
        levelName,
      });
      setReward({ id: Date.now(), ...earned, stars });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game.id]);

  useEffect(() => {
    if (!reward) return;
    // Có huy hiệu hay thử thách mới thì để lâu hơn cho bé kịp đọc
    const t = setTimeout(() => setReward(null), reward.badges.length || reward.challengeBonus ? 5000 : 2600);
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
      <iframe ref={frame} src={src} title={game.title} className="player-frame" allow="autoplay" />
      {reward && (
        <div key={reward.id} className={`reward${reward.badges.length || reward.challengeBonus ? " long" : ""}`} role="status">
          {"⭐".repeat(reward.stars)} +{reward.coins} 🪙
          {reward.bonus > 0 && <small className="reward-bonus">🔥 Thưởng học hôm nay +{reward.bonus} 🪙</small>}
          {reward.challengeBonus > 0 && (
            <small className="reward-bonus">
              🎯 Xong thử thách {CHALLENGE_SIZE} game hôm nay +{reward.challengeBonus} 🪙
            </small>
          )}
          {reward.badges.map((b) => (
            <small key={b.id} className="reward-bonus">
              🏅 Huy hiệu mới: {b.emoji} {b.name}
            </small>
          ))}
        </div>
      )}
    </div>
  );
}
