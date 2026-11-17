import { pageMeta } from "@/lib/seo";

export const metadata = {
  ...pageMeta(
    "Phiếu bài tập cho cả lớp",
    "Phiếu bài tập in ra giấy theo những màn nhiều bé trong lớp hay làm sai, kèm đáp án cho thầy cô.",
    "/giao-vien/phieu",
  ),
  robots: { index: false },
};

export default function Layout({ children }: LayoutProps<"/giao-vien/phieu">) {
  return children;
}
