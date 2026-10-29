import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import CloudSync from "@/components/CloudSync";
import Header from "@/components/Header";
import { SITE_NAME } from "@/lib/games";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} – Học toán và lập trình qua trò chơi`, template: `%s · ${SITE_NAME}` },
  description: "Website giúp trẻ em học toán và lập trình qua các trò chơi vui nhộn.",
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
