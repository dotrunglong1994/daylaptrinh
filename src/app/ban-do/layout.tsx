import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Bản đồ phiêu lưu",
  "Hơn 30 trò chơi học toán và lập trình cho bé lớp 1–5, chia theo Đảo Toán Học và Đảo Lập Trình, lọc theo lớp của bé.",
  "/ban-do",
);

export default function Layout({ children }: LayoutProps<"/ban-do">) {
  return children;
}
