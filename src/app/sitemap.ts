import type { MetadataRoute } from "next";
import { BRAIN_GAMES } from "@/lib/brain";
import { GAMES, SITE_URL } from "@/lib/games";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["/ban-do", 0.9],
    ["/tri-nao", 0.6],
    ["/phu-huynh", 0.5],
    ["/thu-cung", 0.4],
    ["/huy-hieu", 0.3],
  ];
  return [
    ...pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, priority })),
    ...GAMES.filter((g) => g.src).map((g) => ({ url: `${SITE_URL}/choi/${g.id}`, priority: 0.8 })),
    ...BRAIN_GAMES.map((g) => ({ url: `${SITE_URL}/tri-nao/${g.id}`, priority: 0.5 })),
  ];
}
