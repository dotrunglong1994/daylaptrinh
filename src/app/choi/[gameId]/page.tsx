import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GAMES, getGame } from "@/lib/games";
import GamePlayer from "./GamePlayer";

type Params = PageProps<"/choi/[gameId]">["params"];

export function generateStaticParams() {
  return GAMES.filter((g) => g.src).map((g) => ({ gameId: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/choi/[gameId]">) {
  const { gameId } = await params;
  return { title: getGame(gameId)?.title ?? "Không tìm thấy" };
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
  return <GamePlayer game={game} />;
}
