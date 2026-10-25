"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_NAME } from "@/lib/games";
import { totalStars, useProgress } from "@/lib/progress";
import ProfileModal from "./ProfileModal";

export default function Header() {
  const progress = useProgress();
  const [editing, setEditing] = useState(false);
  const needsProfile = progress.loaded && !progress.profile;

  return (
    <>
      <header className="site-header">
        <Link href="/" className="logo">
          🎈 <span>{SITE_NAME}</span>
        </Link>
        <nav className="nav">
          <Link href="/ban-do">🗺️ Bản đồ</Link>
          <Link href="/thu-cung">🐾 Thú cưng</Link>
          <Link href="/phu-huynh">👨‍👩‍👧 Phụ huynh</Link>
        </nav>
        {progress.loaded && (
          <div className="wallet">
            <span title="Tổng số sao">⭐ {totalStars(progress)}</span>
            <span title="Xu">🪙 {progress.coins}</span>
            {progress.profile && (
              <button className="avatar-btn" onClick={() => setEditing(true)} title="Đổi tên, hình đại diện">
                <span className="avatar">{progress.profile.avatar}</span>
                <span className="avatar-name">{progress.profile.name}</span>
              </button>
            )}
          </div>
        )}
      </header>
      {/* Đặt ngoài header: backdrop-filter của header làm lệch vị trí position: fixed */}
      {(needsProfile || editing) && (
        <ProfileModal initial={progress.profile} onDone={() => setEditing(false)} />
      )}
    </>
  );
}
