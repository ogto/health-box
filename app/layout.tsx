import type { Metadata } from "next";
import "./globals.css";
import { storefrontConfig } from "./_lib/storefront-config";

export const metadata: Metadata = {
  title: storefrontConfig.metadata.title,
  description: storefrontConfig.metadata.description,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: storefrontConfig.metadata.title,
    description: storefrontConfig.metadata.description,
    images: [storefrontConfig.assets.shareImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
