import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import CloudSync from "@/components/CloudSync";
import Header from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/games";
import { SHARE_IMAGE } from "@/lib/seo";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700", "800"],
});

const TITLE = `${SITE_NAME} – Học toán và lập trình qua trò chơi`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "học toán cho bé",
    "lập trình cho trẻ em",
    "trò chơi học toán",
    "toán lớp 1",
    "toán lớp 2",
    "toán lớp 3",
    "toán lớp 4",
    "toán lớp 5",
    "tư duy lập trình",
    "game giáo dục",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION, images: [SHARE_IMAGE] },
};

export const viewport: Viewport = {
  themeColor: "#7cc8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={baloo.variable}>
      <body>
        <CloudSync />
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
