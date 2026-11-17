"use client";

import Worksheet from "@/components/Worksheet";
import { useProgress } from "@/lib/progress";
import { weakSkills } from "@/lib/skills";
import { useNow } from "@/lib/useNow";

/** Phiếu bài tập của một bé theo Sổ tay lỗi sai: câu bé đã sai và 5 câu tương tự mỗi màn, đáp án ở cuối. */
export default function WorksheetPage() {
  const progress = useProgress();
  const now = useNow();
  if (!progress.loaded) return null;
  const date = now ? new Date(now).toLocaleDateString("vi-VN") : "";

  return (
    <Worksheet
      skills={weakSkills(progress.skills)}
      back={{ href: "/phu-huynh", label: "Góc phụ huynh" }}
      head={
        <p>
          Họ và tên: <b>{progress.profile?.name ?? "Bé"}</b>
          {progress.profile?.grade ? ` · Lớp ${progress.profile.grade}` : ""}
          {date && ` · Ngày ${date}`}
        </p>
      }
      intro="Các câu dưới đây luyện lại những phần bé hay làm sai khi chơi game. Bé làm vào giấy, xong thì nhờ bố mẹ chấm nhé!"
      empty="Sổ tay lỗi sai chưa có màn nào cần ôn. Khi bé trả lời sai trong game, phiếu bài tập sẽ có câu luyện thêm cho đúng phần đó."
      wrongTitle="Câu bé đã làm sai, làm lại nhé:"
      answersTitle="✅ Đáp án câu luyện thêm (dành cho bố mẹ)"
      who="bé"
    />
  );
}
