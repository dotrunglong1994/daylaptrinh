"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DAILY_BONUS,
  DEFAULT_BG,
  FOODS,
  ITEMS,
  SPECIES,
  itemOf,
  moodOf,
  petNow,
  speciesOf,
  stageOf,
  type ItemSlot,
  type SpeciesId,
} from "@/lib/pet";
import {
  adoptPet,
  buyItem,
  cuddlePet,
  equipItem,
  feedPet,
  petCooldown,
  useProgress,
  type ActionResult,
  type Progress,
} from "@/lib/progress";
import { useNow, streakOf } from "@/lib/useNow";

const SLOT_NAMES: Record<ItemSlot, string> = { hat: "🎩 Mũ", face: "🕶️ Phụ kiện", bg: "🏞️ Phòng" };

export default function PetPage() {
  const progress = useProgress();
  const now = useNow();

  if (!progress.loaded) return <div className="page" />;
  if (!progress.pet) return <AdoptPet />;
  return <PetRoom progress={progress} now={now} />;
}

function AdoptPet() {
  const [species, setSpecies] = useState<SpeciesId>("cun");
  const [name, setName] = useState("");
  const trimmed = name.trim();

  return (
    <div className="page">
      <form
        className="card adopt"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) adoptPet(species, trimmed);
        }}
      >
        <h1 className="page-title">🥚 Nhận nuôi thú cưng</h1>
        <p className="muted">Chăm thú cưng bằng xu kiếm được khi chơi game. Học càng chăm, thú cưng càng lớn!</p>
        <div className="species-grid">
          {SPECIES.map((s) => (
            <button
              type="button"
              key={s.id}
              className={s.id === species ? "active" : ""}
              onClick={() => setSpecies(s.id)}
            >
              <span>{s.emoji}</span>
              {s.name}
            </button>
          ))}
        </div>
        <input
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Đặt tên cho ${speciesOf(species).name.toLowerCase()}`}
          maxLength={16}
        />
        <button className="btn primary big" disabled={!trimmed}>
          Nhận nuôi 💕
        </button>
      </form>
    </div>
  );
}

type Flash = { id: number; text: string; emoji?: string };

function PetRoom({ progress, now }: { progress: Progress; now: number }) {
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const pet = petNow(progress.pet!, now);
  const species = speciesOf(pet.species);
  const stage = stageOf(pet.xp);
  const mood = moodOf(pet);
  const cooldown = petCooldown(pet, now);
  const bg = itemOf(pet.equipped.bg);
  const { streak, playedToday } = streakOf(progress.daily, now);

  function act(result: ActionResult, text: string, emoji: string) {
    setFlash(result.ok ? { id: Date.now(), text, emoji } : { id: Date.now(), text: result.reason });
  }

  return (
    <div className="page">
      <h1 className="page-title">
        🐾 {pet.name} <span className="stage-badge">{stage.name}</span>
      </h1>

      <div className="pet-layout">
        <section className="pet-room" style={{ background: bg?.bg ?? DEFAULT_BG }}>
          {bg && <span className="room-deco">{bg.emoji}</span>}
          <div className="pet-bubble">{flash?.text ?? mood.text}</div>
          <div
            key={flash?.emoji ? `pet-${flash.id}` : "pet"}
            className={`pet ${mood.sad ? "sad" : ""} ${flash?.emoji ? "happy" : ""}`}
            style={{ "--s": stage.scale } as React.CSSProperties}
          >
            {pet.equipped.hat && <span className="pet-hat">{itemOf(pet.equipped.hat)?.emoji}</span>}
            <span className="pet-body">{species.emoji}</span>
            {pet.equipped.face && <span className="pet-face">{itemOf(pet.equipped.face)?.emoji}</span>}
          </div>
          {flash?.emoji && (
            <span key={`treat-${flash.id}`} className="treat">
              {flash.emoji}
            </span>
          )}
        </section>

        <aside className="card pet-panel">
          <Meter label="🍽️ No bụng" value={pet.fullness} color="#ff922b" />
          <Meter label="😊 Vui vẻ" value={pet.happiness} color="#f06595" />
          <Meter
            label={stage.next ? `🌱 Lớn lên (${pet.xp}/${stage.next})` : "🌟 Đã lớn hết cỡ!"}
            value={stage.next ? (pet.xp / stage.next) * 100 : 100}
            color="#51cf66"
          />

          <button
            className="btn ghost cuddle"
            disabled={cooldown > 0}
            onClick={() => act(cuddlePet(), "Hihi, nhột quá! 💕", "💕")}
          >
            🤗 Vuốt ve {cooldown > 0 && <small>({cooldown} phút nữa)</small>}
          </button>

          <h3>Cho ăn</h3>
          <div className="food-row">
            {FOODS.map((f) => (
              <button
                key={f.id}
                className="food"
                disabled={progress.coins < f.price}
                onClick={() => act(feedPet(f.id), `Ngon quá! Cảm ơn ${progress.profile?.name ?? "bé"}! 😋`, f.emoji)}
              >
                <span>{f.emoji}</span>
                {f.name}
                <small>🪙 {f.price}</small>
              </button>
            ))}
          </div>
          {progress.coins < FOODS[0].price && (
            <p className="muted small-note">
              Hết xu rồi! <Link href="/ban-do">Chơi game để kiếm xu 🎮</Link>
            </p>
          )}
        </aside>
      </div>

      <section className={`card streak ${playedToday ? "done" : ""}`}>
        <span className="streak-fire">🔥</span>
        <div>
          <strong>{streak} ngày học liên tiếp</strong>
          <p className="muted">
            {playedToday
              ? `Hôm nay bé đã nhận thưởng +${DAILY_BONUS} 🪙 rồi. Mai quay lại nhé!`
              : `Chơi 1 game hôm nay để nhận thưởng +${DAILY_BONUS} 🪙 và giữ chuỗi ngày học!`}
          </p>
        </div>
        {!playedToday && (
          <Link href="/ban-do" className="btn primary small">
            Chơi ngay
          </Link>
        )}
      </section>

      <section className="card shop">
        <h2>🛍️ Cửa hàng</h2>
        {(Object.keys(SLOT_NAMES) as ItemSlot[]).map((slot) => (
          <div key={slot}>
            <h3>{SLOT_NAMES[slot]}</h3>
            <div className="shop-grid">
              {ITEMS.filter((i) => i.slot === slot).map((item) => {
                const owned = progress.inventory.includes(item.id);
                const using = pet.equipped[slot] === item.id;
                return (
                  <div key={item.id} className={`shop-item ${using ? "using" : ""}`}>
                    <span className="shop-emoji">{item.emoji}</span>
                    <span>{item.name}</span>
                    {owned ? (
                      <button className="btn ghost small" onClick={() => equipItem(slot, using ? null : item.id)}>
                        {using ? "Tháo ra" : "Dùng"}
                      </button>
                    ) : (
                      <button
                        className="btn primary small"
                        disabled={progress.coins < item.price}
                        onClick={() => act(buyItem(item.id), `Wow, ${item.name.toLowerCase()} đẹp quá!`, "✨")}
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-bar">
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}
