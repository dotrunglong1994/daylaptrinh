import { BRAIN_GAMES } from "@/lib/brain";
import { GAMES } from "@/lib/games";

/**
 * Danh sách trang và game để service worker (public/sw.js) tải sẵn, chơi được khi không có mạng.
 * `version` đổi sau mỗi lần deploy, service worker thấy khác thì tải lại toàn bộ.
 */
export function GET() {
  const playable = GAMES.filter((g) => g.src);
  return Response.json({
    version: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    pages: [
      "/",
      "/ban-do",
      "/thu-cung",
      "/huy-hieu",
      "/phu-huynh",
      "/tri-nao",
      ...playable.map((g) => `/choi/${g.id}`),
      ...BRAIN_GAMES.map((g) => `/tri-nao/${g.id}`),
    ],
    games: [...playable.map((g) => g.src!), ...BRAIN_GAMES.map((g) => g.src)],
  });
}
