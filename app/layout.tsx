import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin", "vietnamese"] });
const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const ogImage = `${protocol}://${host}/og-v2.png`;
  const title = "QRồi Xong! — Mã quét thật nét, tính nết thật nhây";
  const description = "Làm mã QR cho đường dẫn, Wi-Fi, VietQR có số tiền, lời nhắn và thư điện tử. Không ghi danh, không lo hết hạn, không sợ gài phí.";

  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, locale: "vi_VN", type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: "QRồi Xong! — Mã quét thật nét, tính nết thật nhây" }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>;
}
