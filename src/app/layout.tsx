import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Sedona Soul Companion",
    template: "%s | Sedona Soul Companion",
  },
  description: "Sedona Soul recovery and repair companion PWA.",
  applicationName: "Sedona Soul",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sedona Soul",
  },
};

export const viewport: Viewport = {
  themeColor: "#12362C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body>{children}</body>
    </html>
  );
}
