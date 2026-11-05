import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GAMES, SITE_NAME, SITE_URL, SUBJECTS, getGame, gradeText } from "@/lib/games";
import { JsonLd, pageMeta } from "@/lib/seo";
import GamePlayer from "./GamePlayer";

type Params = PageProps<"/choi/[gameId]">["params"];

export function generateStaticParams() {
  return GAMES.filter((g) => g.src).map((g) => ({ gameId: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/choi/[gameId]">) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) return { title: "Không tìm thấy" };
  const subject = game.subject === "toan" ? "toán" : "lập trình";
  return pageMeta(
    `${game.title} – Game học ${subject} ${gradeText(game.grades).toLowerCase()}`,
    `${game.description}. Bé học: ${game.skills.join(", ")}. Trò chơi miễn phí trên ${
      SUBJECTS.find((s) => s.id === game.subject)?.name
    }.`,
    `/choi/${game.id}`,
  );
}

// Đọc params bên trong <Suspense> để chuyển trang hiện ngay khung chờ, không bị chặn
export default function PlayPage({ params }: PageProps<"/choi/[gameId]">) {
  return (
    <Suspense fallback={<p className="player-loading">Đang mở trò chơi… 🎈</p>}>
      <Player params={params} />
    </Suspense>
  );
}

async function Player({ params }: { params: Params }) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game?.src) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: game.title,
          description: game.description,
          url: `${SITE_URL}/choi/${game.id}`,
          inLanguage: "vi",
          learningResourceType: "Trò chơi học tập",
          educationalLevel: gradeText(game.grades),
          teaches: game.skills,
          about: game.subject === "toan" ? "Toán" : "Lập trình",
          audience: { "@type": "EducationalAudience", educationalRole: "student" },
          typicalAgeRange: "6-10",
          isAccessibleForFree: true,
          provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <GamePlayer game={game} />
    </>
  );
}
