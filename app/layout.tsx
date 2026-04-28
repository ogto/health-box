import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getStorefrontRuntime } from "./_lib/storefront-runtime";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
  weight: "45 920",
});

export async function generateMetadata(): Promise<Metadata> {
  const runtime = await getStorefrontRuntime();

  return {
    metadataBase: new URL(`https://${runtime.host.rootDomain}`),
    title: runtime.metadata.title,
    description: runtime.metadata.description,
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/apple-icon.png",
    },
    openGraph: {
      title: runtime.metadata.title,
      description: runtime.metadata.description,
      images: [runtime.assets.shareImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
