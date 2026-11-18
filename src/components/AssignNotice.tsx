"use client";

import Link from "next/link";
import { familyNotices, markNoticesSeen, useMyClasses, useSeenNotices, type Notice } from "@/lib/classroom";
import { getGame } from "@/lib/games";
import { dayKey } from "@/lib/pet";
import { switchKid, useProgress } from "@/lib/progress";
import { useNow } from "@/lib/useNow";

/** Các thông báo bài cô giao cần báo phụ huynh lúc này (dùng cho thẻ thông báo và chấm đỏ trên menu) */
export function useNotices(): { notices: Notice[]; today: string } {
  const progress = useProgress();
  const mine = useMyClasses();
  const seen = useSeenNotices();
  const now = useNow();
  if (!progress.loaded || !now || !mine.list.length) return { notices: [], today: "" };
  const today = dayKey(now);
  const notices = familyNotices(mine, progress.kids, today, seen).filter((n) => getGame(n.g));
  return { notices, today };
}

const dueText = (n: Notice) => {
  if (n.left === null) return "Không có hạn nộp";
  const [, m, d] = n.due!.split("-");
  if (n.left < 0) return `Đã quá hạn (${d}/${m}), bé chưa làm`;
  if (n.left === 0) return "Hôm nay là hạn nộp";
  if (n.left === 1) return "Mai là hạn nộp";
  return `Hạn nộp ${d}/${m} (còn ${n.left} ngày)`;
};

const TITLE = { new: "📬 Bài mới", due: "⏰ Sắp hết hạn", late: "⚠️ Quá hạn" } as const;

/** Thẻ báo phụ huynh: cô vừa giao bài mới, hoặc bài sắp/đã quá hạn mà bé chưa làm. Hiện ở trang chủ và Góc phụ huynh. */
export default function AssignNotice() {
  const progress = useProgress();
  const { notices, today } = useNotices();
  if (!notices.length) return null;
  const kids = new Set(notices.map((n) => n.kidId)).size;
  const fresh = notices.filter((n) => n.fresh).length;
  const urgent = notices.length - notices.filter((n) => n.kind === "new").length;

  return (
    <section className="card assign-notice" aria-live="polite">
      <h2>
        🔔 {fresh ? `Cô giáo vừa giao ${fresh} bài mới` : "Nhắc bài cô giao"}
        {fresh > 0 && urgent > 0 && ", có bài sắp hết hạn"}
      </h2>
      <ul>
        {notices.map((n) => {
          const g = getGame(n.g)!;
          const href = n.l >= 0 ? `/choi/${g.id}?man=${n.l + 1}` : `/choi/${g.id}`;
          return (
            <li key={`${n.kidId}-${n.id}`} className={`notice-${n.kind}`}>
              <span className="notice-kid" title={n.kidName}>
                {n.avatar}
              </span>
              <span className="notice-info">
                <em>
                  {TITLE[n.kind]}
                  {n.fresh && n.kind !== "new" && " · mới"} · {n.kidName} · {n.className}
                </em>
                <strong>
                  {g.emoji} {n.l >= 0 ? `${n.level_name || `Màn ${n.l + 1}`} · ${g.title}` : `${g.title} (màn nào cũng được)`}
                </strong>
                <small>
                  {dueText(n)}
                  {n.note && ` · “${n.note}”`}
                </small>
              </span>
              <Link
                href={href}
                className="btn primary small"
                onClick={() => {
                  if (n.kidId !== progress.kidId) switchKid(n.kidId);
                }}
              >
                {kids > 1 ? `${n.kidName} làm` : "Làm bài"}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="row left">
        <button className="btn ghost small" onClick={() => markNoticesSeen(notices, today)}>
          ✓ Đã biết
        </button>
        <small className="muted">
          {urgent ? "Bài sắp hết hạn sẽ nhắc lại vào ngày mai nếu bé chưa làm." : "Bài này vẫn ở mục Thử thách hôm nay của bé."}
        </small>
      </div>
    </section>
  );
}
