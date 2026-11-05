import type { Metadata } from "next";
import { SITE_NAME } from "./games";

/** Ảnh hiện khi chia sẻ liên kết lên Facebook, Zalo… (public/og.png) */
export const SHARE_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} – Học toán và lập trình qua trò chơi vui nhộn, lớp 1–5`,
};

/**
 * Metadata cho một trang: tiêu đề, mô tả, đường dẫn chuẩn và thẻ chia sẻ.
 * Trang con khai báo openGraph sẽ thay hẳn openGraph của layout gốc, nên phải ghi đủ ở đây.
 */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const full = `${title} · ${SITE_NAME}`;
  return {
    // absolute: layout con (vd. /tri-nao) không có template nên tự ghép tên website
    title: { absolute: full },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title: full,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [SHARE_IMAGE] },
  };
}

/** Dữ liệu có cấu trúc (schema.org) cho Google, đặt trong <script type="application/ld+json"> */
export function JsonLd({ data }: { data: object }) {
  // Thoát "<" để chuỗi trong dữ liệu không đóng thẻ script sớm
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
