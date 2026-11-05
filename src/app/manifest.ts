import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/games";

// Cài website lên máy như ứng dụng (PWA); phần chơi khi không có mạng ở public/sw.js
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – Học toán và lập trình qua trò chơi`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e7f5ff",
    theme_color: "#7cc8ff",
    categories: ["education", "kids", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
