"use client";

import { useEffect, useState } from "react";
import { assignWork, clearAssignments, type Assignment, type MemberRow } from "@/lib/classroom";
import { GAMES, SUBJECTS, getGame } from "@/lib/games";
import { loadLevelNames } from "@/lib/levels";

const dateText = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });

/** Bài đã chọn sẵn khi bấm "Giao màn này" ở mục Màn cả lớp hay sai */
export type AssignDraft = { g: string; l: number };

/** Trang giáo viên: bài đang giao cho cả lớp, bé nào đã làm xong, giao bài mới. */
export default function AssignPanel(props: {
  classId: string;
  grade: number | null;
  assignment: Assignment | null;
  members: MemberRow[];
  draft: AssignDraft | null;
  setDraft: (d: AssignDraft | null) => void;
  onChanged: () => void;
}) {
  const { assignment: a, members, draft } = props;
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const game = a ? getGame(a.g) : null;
  const done = a ? members.filter((m) => (m.summary.asg?.[a.id] ?? 0) > 0) : [];
  const waiting = a ? members.filter((m) => !((m.summary.asg?.[a.id] ?? 0) > 0)) : [];

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
                Giao ngày {dateText(a.created_at)}
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
          {members.length > 0 && (
            <ul className="assign-kids">
              {done.map((m) => (
                <li key={`${m.user_id}|${m.kid_id}`} className="done">
                  ✅ {m.avatar} {m.kid_name} <small>{"⭐".repeat(m.summary.asg![a.id])}</small>
                </li>
              ))}
              {waiting.map((m) => (
                <li key={`${m.user_id}|${m.kid_id}`}>
                  ⏳ {m.avatar} {m.kid_name}
                </li>
              ))}
            </ul>
          )}
          <p className="muted small-note">
            Bé thấy bài ở “Thử thách hôm nay” trên trang chủ. Kết quả cập nhật sau khi bé chơi xong (máy của bé cần đăng nhập
            tài khoản phụ huynh).
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
                      const err = await clearAssignments(props.classId);
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
              Chọn một màn cho cả lớp luyện. Màn đó hiện ở “Thử thách hôm nay” của mọi bé trong lớp, và cô thấy bé nào đã làm xong.
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
          cancel={() => props.setDraft(null)}
          submit={async (g, l, levelName, note) => {
            const err = await assignWork(props.classId, g, l, levelName, note);
            if (err) return setError(err);
            props.setDraft(null);
            props.onChanged();
          }}
        />
      )}
      {error && <p className="form-error">⚠️ {error}</p>}
    </section>
  );
}

function AssignForm(props: {
  grade: number | null;
  draft: AssignDraft;
  cancel: () => void;
  submit: (g: string, l: number, levelName: string, note: string) => Promise<void>;
}) {
  const [g, setG] = useState(props.draft.g);
  const [l, setL] = useState(props.draft.l);
  const [names, setNames] = useState<{ g: string; list: string[] } | null>(null);
  const [note, setNote] = useState("");
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
        await props.submit(g, l, l >= 0 ? (levels?.[l] ?? `Màn ${l + 1}`) : "", note);
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
