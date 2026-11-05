import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Huy hiệu",
  "Các huy hiệu bé sưu tập được khi chơi game học toán và lập trình, giữ chuỗi ngày học và làm thử thách hằng ngày.",
  "/huy-hieu",
);

export default function Layout({ children }: LayoutProps<"/huy-hieu">) {
  return children;
}
