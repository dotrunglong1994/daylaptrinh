"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AssignPanel, { type AssignDraft } from "@/components/AssignPanel";
import LoginForm from "@/components/LoginForm";
import {
  classWeakSkills,
  createClass,
  currentAssignment,
  deleteClass,
  listClasses,
  listMembers,
  removeMember,
  type Assignment,
  type ClassRow,
  type MemberRow,
} from "@/lib/classroom";
import { cloudEnabled, signOut, useCloud } from "@/lib/cloud";
import { GRADES, getGame } from "@/lib/games";
import { dayKey } from "@/lib/pet";
import { useNow } from "@/lib/useNow";

/** "hôm nay", "hôm qua", "3 ngày trước" */
function daysAgo(day: string | null | undefined, now: number) {
  if (!day || !now) return "chưa chơi";
  const diff = Math.round((Date.parse(dayKey(now)) - Date.parse(day)) / 86_400_000);
  if (diff <= 0) return "hôm nay";
  if (diff === 1) return "hôm qua";
  return `${diff} ngày trước`;
}

export default function TeacherPage() {
  const cloud = useCloud();

  if (!cloudEnabled || cloud.status === "off") {
    return (
      <div className="page">
        <h1 className="page-title">🏫 Lớp học của thầy cô</h1>
        <p className="card muted">Website này chưa bật tài khoản trực tuyến nên chưa dùng được lớp học.</p>
      </div>
    );
  }
  if (cloud.status === "loading") return <div className="page" />;

  return (
    <div className="page teacher">
      <h1 className="page-title">🏫 Lớp học của thầy cô</h1>
      {cloud.email ? (
        <>
          <p className="muted">
            Đăng nhập: <b>{cloud.email}</b> ·{" "}
            <button className="link-btn" onClick={() => signOut()}>
              Đăng xuất
            </button>
          </p>
          <Classes />
        </>
      ) : (
        <div className="card cloud-card">
          <p>
            Thầy cô tạo lớp và nhận một <b>mã lớp</b> gửi cho phụ huynh. Phụ huynh nhập mã ở Góc phụ huynh, rồi mỗi lần
            bé chơi, thầy cô xem được sao, số ngày học trong tuần và <b>các màn bé hay sai</b> của cả lớp. Thầy cô không
            thấy email hay dữ liệu khác của gia đình.
          </p>
          <LoginForm emailLabel="Email của thầy cô:" placeholder="giaovien@email.com" />
        </div>
      )}
    </div>
  );
}

function Classes() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (pick?: string) => {
    const { data, error } = await listClasses();
    setError(error);
    setClasses(data);
    setSelected((cur) => pick ?? (data.some((c) => c.id === cur) ? cur : (data[0]?.id ?? null)));
  }, []);

  useEffect(() => {
    // Tải danh sách lớp khi mở trang (gọi Supabase, không đặt state đồng bộ trong effect)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await createClass(name, grade ? Number(grade) : null);
    setBusy(false);
    if (error) return setError(error);
    setName("");
    await reload(data?.id);
  }

  const current = classes?.find((c) => c.id === selected) ?? null;

  return (
    <>
      {error && <p className="form-error">⚠️ {error}</p>}
      {classes && classes.length > 0 && (
        <div className="kid-tabs" role="group" aria-label="Chọn lớp">
          {classes.map((c) => (
            <button key={c.id} className={c.id === selected ? "on" : ""} aria-pressed={c.id === selected} onClick={() => setSelected(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {current && <ClassView key={current.id} cls={current} onDeleted={() => reload()} />}

      <form className="card cloud-card cloud-form" onSubmit={onCreate}>
        <h2>➕ Tạo lớp mới</h2>
        <div className="cloud-inputs">
          <input
            className="name-input"
            aria-label="Tên lớp"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lớp 3A – Trường Tiểu học Hoa Sen"
          />
          <select className="name-input grade-select" aria-label="Khối lớp" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Khối…</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
          <button className="btn primary" disabled={busy || !name.trim()}>
            Tạo lớp
          </button>
        </div>
      </form>
    </>
  );
}

function ClassView({ cls, onDeleted }: { cls: ClassRow; onDeleted: () => void }) {
  const now = useNow();
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [draft, setDraft] = useState<AssignDraft | null>(null);

  const reload = useCallback(async () => {
    const [mem, asg] = await Promise.all([listMembers(cls.id), currentAssignment(cls.id)]);
    setError(mem.error ?? asg.error);
    setMembers(mem.data);
    setAssignment(asg.data);
  }, [cls.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const invite = `Mời bố mẹ cho bé vào lớp "${cls.name}" trên Bé Học Vui: mở ${typeof location === "undefined" ? "" : location.origin}/phu-huynh, đăng nhập bằng email ở phần ☁️, rồi nhập mã lớp ${cls.code}.`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const list = members ?? [];
  const week = now ? new Set(Array.from({ length: 7 }, (_, i) => dayKey(now - i * 86_400_000))) : new Set<string>();
  const activeWeek = list.filter((m) => m.summary.lastDay && week.has(m.summary.lastDay)).length;
  const weak = classWeakSkills(list).slice(0, 8);
  const memberKey = (m: MemberRow) => `${m.user_id}|${m.kid_id}`;

  return (
    <section className="class-view">
      <div className="card class-code-card">
        <div>
          <small className="muted">Mã lớp gửi phụ huynh</small>
          <b className="class-code">{cls.code}</b>
        </div>
        <p className="muted">
          Phụ huynh mở <b>Góc phụ huynh</b>, đăng nhập bằng email, rồi nhập mã này.
          {cls.grade ? ` Khối lớp ${cls.grade}.` : ""}
        </p>
        <button className="btn ghost small" onClick={copyInvite}>
          {copied ? "✅ Đã chép lời mời" : "📋 Chép lời mời gửi phụ huynh"}
        </button>
      </div>

      <div className="stats">
        <div className="card stat">
          <b>{list.length}</b>
          <span>👧 Học sinh</span>
        </div>
        <div className="card stat">
          <b>{activeWeek}</b>
          <span>📅 Bé có học trong 7 ngày</span>
        </div>
        <div className="card stat">
          <b>{list.reduce((s, m) => s + (m.summary.plays7 ?? 0), 0)}</b>
          <span>🎮 Lượt chơi tuần này</span>
        </div>
      </div>

      {error && <p className="form-error">⚠️ {error}</p>}

      <AssignPanel
        classId={cls.id}
        grade={cls.grade}
        assignment={assignment}
        members={list}
        draft={draft}
        setDraft={setDraft}
        onChanged={() => reload()}
      />

      <h2 className="section-title skill-title">
        👧 Học sinh
        <button className="btn ghost small" onClick={() => reload()}>
          🔄 Tải lại
        </button>
      </h2>
      {members && list.length === 0 && (
        <p className="card muted">Chưa có bé nào vào lớp. Gửi mã {cls.code} cho phụ huynh nhé.</p>
      )}
      {list.length > 0 && (
        <div className="card table-wrap">
          <table className="class-table">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>⭐ Sao</th>
                <th>Ngày học / 7 ngày</th>
                <th>Chơi gần nhất</th>
                <th>Màn cần ôn</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const s = m.summary;
                const k = memberKey(m);
                const isOpen = open === k;
                return (
                  <StudentRows
                    key={k}
                    m={m}
                    isOpen={isOpen}
                    toggle={() => setOpen(isOpen ? null : k)}
                    lastText={daysAgo(s.lastDay, now)}
                    confirming={confirm === k}
                    askRemove={() => setConfirm(k)}
                    cancelRemove={() => setConfirm(null)}
                    remove={async () => {
                      const err = await removeMember(m);
                      setConfirm(null);
                      if (err) return setError(err);
                      reload();
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {weak.length > 0 && (
        <>
          <h2 className="section-title skill-title">
            🌱 Màn cả lớp hay sai
            <Link href={`/giao-vien/phieu?lop=${cls.id}`} className="btn ghost small">
              🖨️ In phiếu cho cả lớp
            </Link>
          </h2>
          <div className="card">
            <ul className="skill-list">
              {weak.map((w) => {
                const game = getGame(w.g);
                return (
                  <li key={`${w.g}#${w.l}`}>
                    <div className="skill-head">
                      <span>
                        {game?.emoji} <b>{w.n}</b> <small className="muted">· {game?.title ?? w.g}</small>
                      </span>
                      {game && (
                        <span className="row skill-actions">
                          <Link href={`/choi/${w.g}?man=${w.l + 1}`} className="btn ghost small">
                            Mở màn này
                          </Link>
                          <button
                            className="btn ghost small"
                            onClick={() => {
                              setDraft({ g: w.g, l: w.l });
                              document.querySelector(".assign-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                          >
                            📌 Giao màn này
                          </button>
                        </span>
                      )}
                    </div>
                    <small className="muted">
                      {w.kids.length} bé còn sai ({w.kids.join(", ")}), tổng {w.wrong} câu
                    </small>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <div className="row left">
        {confirm === "class" ? (
          <>
            <span>Xóa lớp {cls.name}? Các bé sẽ rời lớp, tiến độ của bé vẫn còn ở nhà.</span>
            <button
              className="btn danger small"
              onClick={async () => {
                const err = await deleteClass(cls.id);
                if (err) return setError(err);
                onDeleted();
              }}
            >
              Xóa lớp
            </button>
            <button className="btn ghost small" onClick={() => setConfirm(null)}>
              Thôi
            </button>
          </>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirm("class")}>
            🗑️ Xóa lớp này
          </button>
        )}
      </div>
    </section>
  );
}

function StudentRows(props: {
  m: MemberRow;
  isOpen: boolean;
  toggle: () => void;
  lastText: string;
  confirming: boolean;
  askRemove: () => void;
  cancelRemove: () => void;
  remove: () => void;
}) {
  const { m, isOpen } = props;
  const s = m.summary;
  const weak = s.weak ?? [];
  const games = Object.entries(s.games ?? {})
    .map(([id, [stars, plays]]) => ({ game: getGame(id), stars, plays }))
    .filter((g) => g.game)
    .sort((a, b) => b.plays - a.plays);
  return (
    <>
      <tr className={isOpen ? "open" : ""}>
        <td>
          <button className="link-btn student-btn" onClick={props.toggle} aria-expanded={isOpen}>
            {m.avatar} {m.kid_name} {isOpen ? "▾" : "▸"}
          </button>
        </td>
        <td>{s.stars ?? 0}</td>
        <td>
          {s.days7 ?? 0} ngày · {s.plays7 ?? 0} lượt
        </td>
        <td>{props.lastText}</td>
        <td>{weak.length ? weak.slice(0, 2).map((w) => w.n).join(", ") + (weak.length > 2 ? ` +${weak.length - 2}` : "") : "—"}</td>
      </tr>
      {isOpen && (
        <tr className="student-detail">
          <td colSpan={5}>
            <div className="week-lists">
              <div>
                <h3>🌱 Màn cần ôn</h3>
                {weak.length ? (
                  <ul className="skill-list">
                    {weak.map((w) => (
                      <li key={`${w.g}#${w.l}`}>
                        <span>
                          {getGame(w.g)?.emoji} <b>{w.n}</b> <small className="muted">· sai {w.w} câu trong {w.d} ngày</small>
                        </span>
                        {w.q && <small className="muted">“{w.q}”</small>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Không có màn nào bé còn sai.{s.strong ? ` Đã vững ${s.strong} màn.` : ""}</p>
                )}
              </div>
              <div>
                <h3>🎮 Game đã chơi ({s.played ?? 0})</h3>
                {games.length ? (
                  <ul className="skill-list">
                    {games.slice(0, 12).map(({ game, stars, plays }) => (
                      <li key={game!.id}>
                        <span>
                          {game!.emoji} {game!.title} <small className="muted">· {"⭐".repeat(stars) || "chưa có sao"} · {plays} lượt</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Bé chưa chơi game nào.</p>
                )}
              </div>
            </div>
            <div className="row left">
              {props.confirming ? (
                <>
                  <span>Cho {m.kid_name} rời lớp?</span>
                  <button className="btn danger small" onClick={props.remove}>
                    Rời lớp
                  </button>
                  <button className="btn ghost small" onClick={props.cancelRemove}>
                    Thôi
                  </button>
                </>
              ) : (
                <button className="btn ghost small" onClick={props.askRemove}>
                  Cho bé rời lớp
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
