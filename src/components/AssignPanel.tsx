"use client";

import { useEffect, useState } from "react";
import { assignWork, closeAssignments, daysLeft, memberStatus, type Assignment, type MemberRow } from "@/lib/classroom";
import { GAMES, SUBJECTS, getGame } from "@/lib/games";
import { loadLevelNames } from "@/lib/levels";

const dateText = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
/** "2026-11-20" → "20/11" (không đổi múi giờ) */
const dayText = (day: string) => {
  const [, m, d] = day.split("-").map(Number);
  return `${d}/${m}`;
};
const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
};

/** "Hạn nộp 20/11 (còn 2 ngày)" */
function dueText(due: string | null, today: string | null, closed: boolean) {
  if (!due) return "Không có hạn nộp";
  const left = today ? daysLeft(due, today) : null;
  const tail =
    closed || left === null ? "" : left > 0 ? ` (còn ${left} ngày)` : left === 0 ? " (hết hạn hôm nay)" : " (đã quá hạn)";
  return `Hạn nộp ${dayText(due)}${tail}`;
}

/** Bài đã chọn sẵn khi bấm "Giao màn này" ở mục Màn cả lớp hay sai */
export type AssignDraft = { g: string; l: number };

const assignTitle = (a: Assignment) => {
  const game = getGame(a.g);
  return `${a.l >= 0 ? a.level_name || `Màn ${a.l + 1}` : "Màn nào cũng được"} · ${game?.title ?? a.g}`;
};

/** Chia các bé theo cách làm bài: đúng hạn, nộp muộn, chưa làm */
function groupKids(a: Assignment, members: MemberRow[]) {
  const rows = members.map((m) => ({ m, ...memberStatus(m, a) }));
  return {
    ontime: rows.filter((r) => r.state === "ontime"),
    late: rows.filter((r) => r.state === "late"),
    todo: rows.filter((r) => r.state === "todo"),
  };
}

function KidGroups({ a, members }: { a: Assignment; members: MemberRow[] }) {
  const { ontime, late, todo } = groupKids(a, members);
  const key = (m: MemberRow) => `${m.user_id}|${m.kid_id}`;
  const groups = [
    { id: "ontime", title: a.due ? "✅ Đúng hạn" : "✅ Đã làm xong", rows: ontime },
    { id: "late", title: "🐢 Nộp muộn", rows: late },
    { id: "todo", title: "⏳ Chưa làm", rows: todo },
  ].filter((x) => x.rows.length);
  return (
    <div className="assign-groups">
      {groups.map((grp) => (
        <div key={grp.id} className={`assign-group ${grp.id}`}>
          <h3>
            {grp.title} <span className="muted">({grp.rows.length})</span>
          </h3>
          <ul className="assign-kids">
            {grp.rows.map((r) => (
              <li key={key(r.m)} className={grp.id === "todo" ? "" : `done ${grp.id}`}>
                {r.m.avatar} {r.m.kid_name}
                {r.stars > 0 && <small> {"⭐".repeat(r.stars)}</small>}
                {r.day && grp.id === "late" && <small className="muted"> · {dayText(r.day)}</small>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Trang giáo viên: bài đang giao cho cả lớp, bé nào làm đúng hạn / muộn / chưa làm, các bài đã giao trước, giao bài mới. */
export default function AssignPanel(props: {
  classId: string;
  grade: number | null;
  /** Các bài đã giao, mới trước */
  assignments: Assignment[];
  /** Hôm nay (YYYY-MM-DD) */
  today: string | null;
  members: MemberRow[];
  draft: AssignDraft | null;
  setDraft: (d: AssignDraft | null) => void;
  onChanged: () => void;
}) {
  const { assignments, members, draft, today } = props;
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const a = assignments[0] && !assignments[0].closed ? assignments[0] : null;
  const past = a ? assignments.slice(1) : assignments;
  const game = a ? getGame(a.g) : null;
  const done = a ? members.filter((m) => memberStatus(m, a).stars > 0) : [];

  return (
    <section className="card assign-card">
      <h2>📌 Bài cô giao cho cả lớp</h2>
      {a && game ? (
        <>
          <p className="assign-now">
            <span className="assign-emoji">{game.emoji}</span>
            <span>
              <b>{a.l >= 0 ? a.level_name || `Màn ${a.l + 1}` : "Màn nào cũng được"}</b> · {game.title}
              <br />
              <small className="muted">
                Giao ngày {dateText(a.created_at)} · <span className="assign-due">{dueText(a.due, today, false)}</span>
                {a.note && ` · “${a.note}”`}
              </small>
            </span>
          </p>
          <p>
            <b>
              {done.length}/{members.length}
            </b>{" "}
            bé đã làm xong{members.length ? "" : " (lớp chưa có bé nào)"}
          </p>
          {members.length > 0 && <KidGroups a={a} members={members} />}
          <p className="muted small-note">
            Bé thấy bài ở “Thử thách hôm nay” trên trang chủ. Kết quả cập nhật sau khi bé chơi xong (máy của bé cần đăng nhập
            tài khoản phụ huynh). Quá hạn bé vẫn làm được, cô thấy bé ở mục “Nộp muộn”.
          </p>
          {!draft && (
            <div className="row left">
              <button className="btn ghost small" onClick={() => props.setDraft({ g: a.g, l: a.l })}>
                Giao bài khác
              </button>
              {confirmClear ? (
                <>
                  <button
                    className="btn danger small"
                    onClick={async () => {
                      const err = await closeAssignments(props.classId);
                      setConfirmClear(false);
                      if (err) return setError(err);
                      props.onChanged();
                    }}
                  >
                    Thôi giao bài
                  </button>
                  <button className="btn ghost small" onClick={() => setConfirmClear(false)}>
                    Không
                  </button>
                </>
              ) : (
                <button className="btn ghost small" onClick={() => setConfirmClear(true)}>
                  Thôi giao bài
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        !draft && (
          <>
            <p className="muted">
              Chọn một màn cho cả lớp luyện, kèm hạn nộp. Màn đó hiện ở “Thử thách hôm nay” của mọi bé trong lớp, và cô thấy bé
              nào làm đúng hạn, bé nào nộp muộn.
            </p>
            <div className="row left">
              <button className="btn primary small" onClick={() => props.setDraft({ g: "", l: -1 })}>
                📌 Giao bài
              </button>
            </div>
          </>
        )
      )}

      {draft && (
        <AssignForm
          key={`${draft.g}#${draft.l}`}
          grade={props.grade}
          draft={draft}
          today={today}
          cancel={() => props.setDraft(null)}
          submit={async (g, l, levelName, note, due) => {
            const err = await assignWork(props.classId, g, l, levelName, note, due);
            if (err) return setError(err);
            props.setDraft(null);
            props.onChanged();
          }}
        />
      )}
      {error && <p className="form-error">⚠️ {error}</p>}

      {past.length > 0 && (
        <details className="assign-history">
          <summary>📚 Bài đã giao trước ({past.length})</summary>
          <ul>
            {past.map((p) => {
              const { ontime, late, todo } = groupKids(p, members);
              return (
                <li key={p.id}>
                  <details>
                    <summary>
                      <span>
                        {getGame(p.g)?.emoji} <b>{assignTitle(p)}</b>
                        <br />
                        <small className="muted">
                          Giao {dateText(p.created_at)} · {dueText(p.due, today, true)}
                        </small>
                      </span>
                      <span className="assign-count">
                        ✅ {ontime.length}
                        {late.length > 0 && ` · 🐢 ${late.length}`}
                        {todo.length > 0 && ` · ⏳ ${todo.length}`}
                      </span>
                    </summary>
                    {members.length > 0 ? <KidGroups a={p} members={members} /> : <p className="muted">Lớp chưa có bé nào.</p>}
                  </details>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

function AssignForm(props: {
  grade: number | null;
  draft: AssignDraft;
  today: string | null;
  cancel: () => void;
  submit: (g: string, l: number, levelName: string, note: string, due: string | null) => Promise<void>;
}) {
  const [g, setG] = useState(props.draft.g);
  const [l, setL] = useState(props.draft.l);
  const [names, setNames] = useState<{ g: string; list: string[] } | null>(null);
  const [note, setNote] = useState("");
  // Mặc định hạn nộp sau 3 ngày; xóa trống = không có hạn
  const [due, setDue] = useState(props.today ? addDays(props.today, 3) : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!g) return;
    let alive = true;
    loadLevelNames(g).then((list) => alive && setNames({ g, list }));
    return () => {
      alive = false;
    };
  }, [g]);

  const levels = names?.g === g ? names.list : null;
  const playable = GAMES.filter((x) => x.src);
  const fits = (x: (typeof playable)[number]) => !props.grade || x.grades?.includes(props.grade);

  return (
    <form
      className="cloud-form assign-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!g) return;
        setBusy(true);
        await props.submit(g, l, l >= 0 ? (levels?.[l] ?? `Màn ${l + 1}`) : "", note, due || null);
        setBusy(false);
      }}
    >
      <label htmlFor="assign-game">Trò chơi:</label>
      <select
        id="assign-game"
        className="name-input"
        value={g}
        onChange={(e) => {
          setG(e.target.value);
          setL(-1);
        }}
      >
        <option value="">Chọn trò chơi…</option>
        {SUBJECTS.map((s) => (
          <optgroup key={s.id} label={`${s.emoji} ${s.name}${props.grade ? ` · hợp lớp ${props.grade}` : ""}`}>
            {playable
              .filter((x) => x.subject === s.id && fits(x))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.emoji} {x.title}
                </option>
              ))}
          </optgroup>
        ))}
        {props.grade && (
          <optgroup label="Lớp khác">
            {playable
              .filter((x) => !fits(x))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.emoji} {x.title}
                </option>
              ))}
          </optgroup>
        )}
      </select>

      {g && (
        <>
          <label htmlFor="assign-level">Màn:</label>
          <select id="assign-level" className="name-input" value={l} onChange={(e) => setL(Number(e.target.value))} disabled={!levels}>
            <option value={-1}>Màn nào cũng được</option>
            {levels?.map((n, i) => (
              <option key={i} value={i}>
                Màn {i + 1}: {n}
              </option>
            ))}
          </select>
          <label htmlFor="assign-note">Lời dặn (không bắt buộc):</label>
          <input
            id="assign-note"
            className="name-input"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cố gắng được 3 sao nhé!"
          />
          <label htmlFor="assign-due">Hạn nộp (để trống nếu không có hạn):</label>
          <input
            id="assign-due"
            type="date"
            className="name-input"
            value={due}
            min={props.today ?? undefined}
            onChange={(e) => setDue(e.target.value)}
          />
        </>
      )}
      <div className="row left">
        <button className="btn primary small" disabled={!g || busy || !levels}>
          {busy ? "Đang giao…" : "Giao bài cho cả lớp"}
        </button>
        <button type="button" className="btn ghost small" onClick={props.cancel}>
          Thôi
        </button>
      </div>
    </form>
  );
}
