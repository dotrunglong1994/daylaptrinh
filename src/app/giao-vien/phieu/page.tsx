"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import Worksheet from "@/components/Worksheet";
import { classWeakSkills, listClasses, listMembers, type ClassRow, type MemberRow } from "@/lib/classroom";
import { useCloud } from "@/lib/cloud";
import { useNow } from "@/lib/useNow";

// Đọc ?lop=<id lớp> trên trình duyệt (trang tĩnh, không đọc searchParams khi render phía server)
const classIdFromUrl = () => new URLSearchParams(location.search).get("lop");
const noop = () => () => {};

/** Phiếu bài tập cho cả lớp: các màn nhiều bé trong lớp còn sai, câu các bé đã sai và câu luyện thêm, đáp án cho thầy cô. */
export default function ClassWorksheetPage() {
  const cloud = useCloud();
  const classId = useSyncExternalStore(noop, classIdFromUrl, () => null);
  const now = useNow();
  const [data, setData] = useState<{ cls: ClassRow | null; members: MemberRow[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!cloud.email || !classId) return;
    let alive = true;
    (async () => {
      const classes = await listClasses();
      const cls = classes.data.find((c) => c.id === classId) ?? null;
      const members = cls ? await listMembers(cls.id) : { data: [], error: null };
      if (alive) setData({ cls, members: members.data, error: classes.error ?? members.error });
    })();
    return () => {
      alive = false;
    };
  }, [cloud.email, classId]);

  const back = (
    <Link href="/giao-vien" className="btn ghost small">
      ← Lớp học
    </Link>
  );
  if (cloud.status === "loading" || cloud.status === "off") return null;
  if (!cloud.email) {
    return (
      <div className="page">
        {back}
        <p className="card muted">Thầy cô đăng nhập ở trang Lớp học trước, rồi bấm “In phiếu cho cả lớp”.</p>
      </div>
    );
  }
  if (!data) return <p className="page muted">Đang tải lớp…</p>;
  if (!data.cls) {
    return (
      <div className="page">
        {back}
        <p className="card muted">{data.error ? `⚠️ ${data.error}` : "Không tìm thấy lớp này trong tài khoản của thầy cô."}</p>
      </div>
    );
  }

  const weak = classWeakSkills(data.members);
  const date = now ? new Date(now).toLocaleDateString("vi-VN") : "";
  return (
    <Worksheet
      skills={weak.map((w) => ({ g: w.g, l: w.l, name: w.n, recent: w.qs }))}
      back={{ href: "/giao-vien", label: "Lớp học" }}
      head={
        <>
          <p>
            Lớp: <b>{data.cls.name}</b>
            {date && ` · Ngày ${date}`}
          </p>
          <p>
            Họ và tên: <span className="ws-name-line" />
          </p>
        </>
      }
      intro="Các câu dưới đây luyện lại những phần nhiều bạn trong lớp còn hay làm sai khi chơi game. Em làm vào giấy rồi nộp cho thầy cô nhé!"
      empty="Chưa có màn nào cả lớp cần ôn. Khi các bé trả lời sai trong game, phiếu sẽ có câu luyện thêm cho đúng phần đó."
      wrongTitle="Câu các bạn trong lớp đã làm sai, em làm lại nhé:"
      answersTitle="✅ Đáp án câu luyện thêm (dành cho thầy cô)"
      who="các bé"
    />
  );
}
