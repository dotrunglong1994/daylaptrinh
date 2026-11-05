import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Phòng Tập Trí Não",
  "Trò chơi luyện trí nhớ, sự tập trung, tốc độ tính nhẩm và suy luận cho bố mẹ, mỗi ngày vài phút.",
  "/tri-nao",
);

export default function Layout({ children }: LayoutProps<"/tri-nao">) {
  return children;
}
