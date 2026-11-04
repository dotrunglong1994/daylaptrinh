"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE_NAME } from "@/lib/games";
import { totalStars, useProgress } from "@/lib/progress";
import KidPicker from "./KidPicker";
import ProfileModal from "./ProfileModal";

// Đã trả lời "Ai đang chơi?" trong phiên này (mở tab mới thì hỏi lại)
const WHO_KEY = "bhv-who";
function answeredWho() {
  try {
    return sessionStorage.getItem(WHO_KEY) === "1";
  } catch {
    return true;
  }
}

export default function Header() {
  const progress = useProgress();
  const [dialog, setDialog] = useState<"switch" | "edit" | "add" | null>(null);
  const [whoDone, setWhoDone] = useState(false);
  // Phòng Tập Trí Não dành cho người lớn: không bắt tạo hồ sơ bé
  const adultArea = usePathname().startsWith("/tri-nao");
  const needsProfile = progress.loaded && !progress.profile && !adultArea;
  const kidCount = progress.kids.filter((k) => k.profile).length;
  const askWho = progress.loaded && !adultArea && kidCount >= 2 && !whoDone && !dialog && !answeredWho();
  const doneWho = () => {
    try {
      sessionStorage.setItem(WHO_KEY, "1");
    } catch {}
    setWhoDone(true);
  };

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
          <Link href="/tri-nao">🧠 Trí não</Link>
        </nav>
        {progress.loaded && (
          <div className="wallet">
            <span title="Tổng số sao">⭐ {totalStars(progress)}</span>
            <span title="Xu">🪙 {progress.coins}</span>
            <Link href="/huy-hieu" className="wallet-link" title="Huy hiệu">
              🏅 {Object.keys(progress.badges).length}
            </Link>
            {progress.profile && (
              <button className="avatar-btn" onClick={() => setDialog("switch")} title="Đổi bạn chơi, sửa hồ sơ">
                <span className="avatar">{progress.profile.avatar}</span>
                <span className="avatar-name">{progress.profile.name}</span>
              </button>
            )}
          </div>
        )}
      </header>
      {/* Đặt ngoài header: backdrop-filter của header làm lệch vị trí position: fixed */}
      {(needsProfile || dialog === "edit" || dialog === "add") && (
        <ProfileModal
          initial={dialog === "add" ? null : progress.profile}
          canCancel={dialog === "add"}
          onDone={() => {
            setDialog(null);
            doneWho();
          }}
        />
      )}
      {(askWho || dialog === "switch") && (
        <KidPicker
          mode={dialog === "switch" ? "switch" : "who"}
          onPick={() => {
            setDialog(null);
            doneWho();
          }}
          onAdd={() => setDialog("add")}
          onEdit={() => setDialog("edit")}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
