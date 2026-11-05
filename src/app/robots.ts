import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/games";

export default function robots(): MetadataRoute.Robots {
  return {
    // Trang /games/<id>/ chỉ là khung chơi trong iframe; trang nên hiện trên Google là /choi/<id>
    rules: { userAgent: "*", allow: "/", disallow: "/games/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
