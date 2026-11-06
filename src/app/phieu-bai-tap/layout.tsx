import { pageMeta } from "@/lib/seo";

export const metadata = {
  ...pageMeta(
    "Phiếu bài tập",
    "Phiếu bài tập in ra giấy theo những màn bé hay làm sai: câu bé đã sai, câu tương tự để luyện và đáp án cho phụ huynh.",
    "/phieu-bai-tap",
  ),
  robots: { index: false },
};

export default function Layout({ children }: LayoutProps<"/phieu-bai-tap">) {
  return children;
}
