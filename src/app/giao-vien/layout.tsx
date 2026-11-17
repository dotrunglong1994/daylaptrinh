import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Lớp học cho giáo viên",
  "Thầy cô tạo lớp, gửi mã cho phụ huynh và xem tiến độ cả lớp: sao, số ngày học trong tuần, các màn toán và lập trình bé hay sai.",
  "/giao-vien",
);

export default function Layout({ children }: LayoutProps<"/giao-vien">) {
  return children;
}
