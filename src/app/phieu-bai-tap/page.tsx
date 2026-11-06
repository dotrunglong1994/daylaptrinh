"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGame } from "@/lib/games";
import { useProgress } from "@/lib/progress";
import { weakSkills, type SkillRecord } from "@/lib/skills";
import { useNow } from "@/lib/useNow";
import { loadPrintRound, makeItems, PRINTABLE, type PrintItem } from "@/lib/worksheet";

const PER_SKILL = 5;
const MAX_SKILLS = 6;

type Sheet = { skill: SkillRecord; items: PrintItem[] };

/** Phiếu bài tập in ra giấy theo Sổ tay lỗi sai: mỗi màn bé hay sai có câu bé đã sai và 5 câu tương tự, đáp án ở cuối. */
export default function WorksheetPage() {
  const progress = useProgress();
  const now = useNow();
  const [round, setRound] = useState(0);
  const [sheets, setSheets] = useState<{ key: string; list: Sheet[] } | null>(null);

  const weak = progress.loaded ? weakSkills(progress.skills).filter((s) => getGame(s.g)) : [];
  const printable = weak.filter((s) => PRINTABLE.has(s.g)).slice(0, MAX_SKILLS);
  const others = weak.filter((s) => !PRINTABLE.has(s.g)).slice(0, 8);
  const key = `${round}|${printable.map((s) => `${s.g}#${s.l}`).join(",")}`;

  useEffect(() => {
    if (!printable.length) return;
    let alive = true;
    Promise.all(
      printable.map(async (skill) => {
        const printRound = await loadPrintRound(skill.g);
        return { skill, items: printRound ? makeItems(printRound, skill.l, PER_SKILL, skill.recent) : [] };
      }),
    ).then((list) => {
      if (alive) setSheets({ key, list });
    });
    return () => {
      alive = false;
    };
    // key gom đủ màn cần in và lần bấm "Đổi câu khác"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!progress.loaded) return null;
  const ready = sheets?.key === key ? sheets.list : null;
  const name = progress.profile?.name ?? "Bé";
  const date = now ? new Date(now).toLocaleDateString("vi-VN") : "";
  let n = 0;

  return (
    <div className="page worksheet">
      <div className="no-print ws-bar">
        <Link href="/phu-huynh" className="btn ghost small">
          ← Góc phụ huynh
        </Link>
        {printable.length > 0 && (
          <>
            <button className="btn ghost small" onClick={() => setRound((r) => r + 1)}>
              🔄 Đổi câu khác
            </button>
            <button className="btn primary small" onClick={() => window.print()} disabled={!ready}>
              🖨️ In phiếu
            </button>
          </>
        )}
      </div>

      <header className="ws-head">
        <h1>📝 Phiếu bài tập</h1>
        <p>
          Họ và tên: <b>{name}</b>
          {progress.profile?.grade ? ` · Lớp ${progress.profile.grade}` : ""}
          {date && ` · Ngày ${date}`}
        </p>
        <p className="muted">Các câu dưới đây luyện lại những phần bé hay làm sai khi chơi game. Bé làm vào giấy, xong thì nhờ bố mẹ chấm nhé!</p>
      </header>

      {weak.length === 0 && (
        <p className="card muted">
          Sổ tay lỗi sai chưa có màn nào cần ôn. Khi bé trả lời sai trong game, phiếu bài tập sẽ có câu luyện thêm cho đúng phần đó.
        </p>
      )}
      {printable.length === 0 && weak.length > 0 && (
        <p className="card muted">
          Những màn bé hay sai đều cần hình vẽ hoặc thao tác trên máy, chưa in ra giấy được. Bé chơi lại các màn bên dưới nhé.
        </p>
      )}
      {printable.length > 0 && !ready && <p className="muted no-print">Đang soạn phiếu…</p>}

      {ready?.map(({ skill, items }) => {
        const game = getGame(skill.g)!;
        return (
          <section key={`${skill.g}#${skill.l}`} className="ws-part">
            <h2>
              {game.emoji} {skill.name} <small>· {game.title}</small>
            </h2>
            {skill.recent.length > 0 && (
              <>
                <h3>Câu bé đã làm sai, làm lại nhé:</h3>
                <ol className="ws-list" start={n + 1}>
                  {skill.recent.map((q) => {
                    n++;
                    return (
                      <li key={q}>
                        {q}
                        <span className="ws-line" />
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
            {items.length > 0 && (
              <>
                <h3>Câu luyện thêm:</h3>
                <ol className="ws-list" start={n + 1}>
                  {items.map((it) => {
                    n++;
                    return (
                      <li key={it.q}>
                        {it.q}
                        <span className="ws-line" />
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>
        );
      })}

      {others.length > 0 && (
        <section className="ws-part">
          <h2>🎮 Chơi lại trên máy</h2>
          <p className="muted">Các màn này cần hình vẽ hoặc kéo thả nên bé luyện trên máy:</p>
          <ul className="ws-others">
            {others.map((s) => (
              <li key={`${s.g}#${s.l}`}>
                {getGame(s.g)!.emoji} {getGame(s.g)!.title}: <b>{s.name}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ready && ready.some((s) => s.items.length) && (
        <section className="ws-part ws-answers">
          <h2>✅ Đáp án câu luyện thêm (dành cho bố mẹ)</h2>
          {ready.map(({ skill, items }) =>
            items.length ? (
              <div key={`${skill.g}#${skill.l}`}>
                <h3>{skill.name}</h3>
                <ul>
                  {items.map((it) => (
                    <li key={it.q}>
                      <span className="muted">{it.q}</span> → <b>{it.a}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </section>
      )}
    </div>
  );
}
