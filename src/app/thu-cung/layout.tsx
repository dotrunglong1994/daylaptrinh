import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Thú cưng ảo",
  "Bé học để kiếm xu, cho thú cưng ăn, mua đồ và giữ chuỗi ngày học mỗi ngày.",
  "/thu-cung",
);

export default function Layout({ children }: LayoutProps<"/thu-cung">) {
  return children;
}
