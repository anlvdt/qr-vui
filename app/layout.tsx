import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin", "vietnamese"] });
const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anlvdt.github.io/qr-vui";
const title = "QR Vui — Tạo mã QR vui hơn, vẫn dễ quét";
const description = "Tạo mã QR cho liên kết, Wi-Fi, VietQR, văn bản và email; tùy biến với 96 mẫu minh họa hoặc ảnh riêng ngay trên thiết bị của bạn.";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: `${assetPrefix}/favicon.svg`, shortcut: `${assetPrefix}/favicon.svg` },
  openGraph: { title, description, locale: "vi_VN", type: "website", images: [{ url: `${siteUrl}/og-qr-vui.png`, width: 1731, height: 909, alt: "QR Vui — Tạo mã QR vui hơn, vẫn dễ quét" }] },
  twitter: { card: "summary_large_image", title, description, images: [`${siteUrl}/og-qr-vui.png`] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>;
}
