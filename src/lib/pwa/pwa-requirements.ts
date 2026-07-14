export const pwaRequirements = {
  appName: "Sedona Soul Companion",
  shortName: "Sedona Soul",
  startUrl: "/app/home",
  display: "standalone",
  themeColor: "#12362C",
  backgroundColor: "#F4EFE6",
  icons: ["/icons/icon-192.svg", "/icons/icon-512.svg"],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    safeAreaHandling: "Use env(safe-area-inset-*) through safe-scroll and safe bottom navigation wrappers.",
  },
  installBehavior: [
    "Android/Chromium: listen for beforeinstallprompt and show a soft install prompt.",
    "iOS Safari: users install through Share > Add to Home Screen; app metadata and appleWebApp settings are configured.",
    "Install prompt must never block safety or check-in flows.",
  ],
  serviceWorkerStrategy: [
    "Register service worker only in production.",
    "Cache static shell assets and icons.",
    "Do not cache sensitive user answers, chat content, journal reflections, or admin reports in Phase 0.",
    "Future Phase 1 API calls should stay network-first unless backend explicitly approves offline storage.",
  ],
} as const;
