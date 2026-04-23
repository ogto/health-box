import type { Metadata } from "next";
import "./globals.css";
import { getStorefrontRuntime } from "./_lib/storefront-runtime";

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
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
