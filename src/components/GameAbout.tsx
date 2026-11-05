import Link from "next/link";
import { GAMES, SITE_NAME, SUBJECTS, gradeText, type Game } from "@/lib/games";

/** Game cùng đảo, chung nhiều lớp nhất với game đang chơi */
function relatedGames(game: Game, count = 4) {
  const shared = (g: Game) => g.grades.filter((n) => game.grades.includes(n)).length;
  return GAMES.filter((g) => g.src && g.id !== game.id && g.subject === game.subject && shared(g) > 0)
    .sort((a, b) => shared(b) - shared(a))
    .slice(0, count);
}

/**
 * Giới thiệu game dưới khung chơi: phụ huynh đọc biết game dạy gì,
 * và Google có chữ để hiểu trang (nội dung game nằm trong iframe nên Google không đọc được).
 */
export default function GameAbout({ game }: { game: Game }) {
  const subject = SUBJECTS.find((s) => s.id === game.subject)!;
  const lo = Math.min(...game.grades);
  const hi = Math.max(...game.grades);
  const ages = lo === hi ? `${lo + 5} tuổi` : `${lo + 5}–${hi + 5} tuổi`;
  const related = relatedGames(game);

  return (
    <section className="page game-about" style={{ "--c": subject.color } as React.CSSProperties}>
      <div className="card">
        <h2>
          {game.emoji} Về trò chơi {game.title}
        </h2>
        <p>
          {game.description}. {game.title} là trò chơi trên {subject.name} của {SITE_NAME}, hợp với bé{" "}
          {gradeText(game.grades).toLowerCase()} ({ages}), theo chương trình Giáo dục phổ thông 2018.
        </p>

        <h3>Bé học được gì?</h3>
        <p>{game.teaches}.</p>
        <ul className="about-skills">
          {game.skills.map((s) => (
            <li key={s}>✅ {s}</li>
          ))}
        </ul>

        <h3>Chơi thế nào?</h3>
        <p>
          Mỗi trò chơi có nhiều màn, dễ trước khó sau. Khủng long cổ vũ và đọc to lời nhắn cho bé, bé làm sai cũng không bị
          phạt. Xong mỗi màn bé được tối đa 3 sao, mỗi sao đổi được xu để nuôi thú cưng ảo. Chơi miễn phí ngay trên
          trình duyệt, không cần cài đặt hay đăng nhập.
        </p>
      </div>

      {related.length > 0 && (
        <div className="card">
          <h2>Trò chơi cùng {subject.name}</h2>
          <ol className="suggest-list">
            {related.map((g) => (
              <li key={g.id}>
                <Link href={`/choi/${g.id}`} className="node">
                  <span className="node-emoji">{g.emoji}</span>
                  <span className="node-info">
                    <strong>{g.title}</strong>
                    <small>{g.description}</small>
                    <span className="node-meta">
                      <span className="grade-chip">{gradeText(g.grades)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
