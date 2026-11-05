import Link from "next/link";
import Dino from "@/components/Dino";
import DailyChallenge from "@/components/DailyChallenge";
import FamilyBoard from "@/components/FamilyBoard";
import Suggestions from "@/components/Suggestions";
import { GAMES, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUBJECTS } from "@/lib/games";
import { JsonLd } from "@/lib/seo";

const FEATURES = [
  { emoji: "🎮", title: "Học mà chơi", text: "Mỗi bài học là một trò chơi, bé học lúc nào không hay." },
  { emoji: "🦖", title: "Bạn đồng hành", text: "Khủng long cổ vũ bé, sai cũng không bị phạt." },
  { emoji: "🐾", title: "Nuôi thú cưng", text: "Học để kiếm xu, chăm thú cưng của riêng bé lớn lên mỗi ngày." },
];

export default function Home() {
  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          inLanguage: "vi",
        }}
      />
      <section className="hero">
        <Dino mood="cheer" size={150} />
        <div>
          <h1>
            Chào mừng tới <span className="brand">{SITE_NAME}</span>!
          </h1>
          <p className="lead">Học toán và lập trình qua những trò chơi vui nhộn dành cho bé từ 6 đến 10 tuổi.</p>
          <Link href="/ban-do" className="btn primary big">
            Bắt đầu phiêu lưu 🚀
          </Link>
        </div>
      </section>

      <DailyChallenge />
      <FamilyBoard />
      <Suggestions />

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="card feature">
            <div className="feature-emoji">{f.emoji}</div>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="subjects">
        {SUBJECTS.map((s) => {
          const games = GAMES.filter((g) => g.subject === s.id);
          return (
            <Link key={s.id} href={`/ban-do#${s.id}`} className="card subject" style={{ "--c": s.color } as React.CSSProperties}>
              <div className="subject-emoji">{s.emoji}</div>
              <div>
                <h3>{s.name}</h3>
                <p className="muted">{s.description}</p>
                <p className="subject-games">{games.map((g) => g.emoji).join(" ")}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
