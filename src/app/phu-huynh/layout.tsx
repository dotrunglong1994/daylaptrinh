import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Góc phụ huynh",
  "Phụ huynh xem tiến độ học của bé: số sao, lượt chơi, báo cáo 7 ngày, game bé làm tốt và game cần luyện thêm.",
  "/phu-huynh",
);

export default function Layout({ children }: LayoutProps<"/phu-huynh">) {
  return children;
}
