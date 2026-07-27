import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";

import "./globals.css";
import { PwaServiceWorker } from "@/components/pwa/pwa-service-worker";
import { Toaster } from "@/components/ui/toaster";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sedona-soul.example"),
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
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#12362C" },
    { media: "(prefers-color-scheme: dark)", color: "#12362C" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={newsreader.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
        <PwaServiceWorker />
      </body>
    </html>
  );
}
