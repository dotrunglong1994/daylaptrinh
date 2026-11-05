import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BRAIN_GAMES, getBrainGame } from "@/lib/brain";
import { pageMeta } from "@/lib/seo";
import BrainPlayer from "./BrainPlayer";

type Params = PageProps<"/tri-nao/[gameId]">["params"];

export function generateStaticParams() {
  return BRAIN_GAMES.map((g) => ({ gameId: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/tri-nao/[gameId]">) {
  const { gameId } = await params;
  const game = getBrainGame(gameId);
  if (!game) return { title: "Không tìm thấy" };
  return pageMeta(
    `${game.title} – Luyện ${game.skill.toLowerCase()} cho người lớn`,
    `${game.description} Mỗi lượt ${game.minutes}.`,
    `/tri-nao/${game.id}`,
  );
}

export default function BrainPlayPage({ params }: PageProps<"/tri-nao/[gameId]">) {
  return (
    <Suspense fallback={<p className="player-loading">Đang mở bài tập… 🧠</p>}>
      <Player params={params} />
    </Suspense>
  );
}

async function Player({ params }: { params: Params }) {
  const { gameId } = await params;
  const game = getBrainGame(gameId);
  if (!game) notFound();
  return <BrainPlayer game={game} />;
}
