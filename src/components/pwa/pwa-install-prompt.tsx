"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [hasMounted, setHasMounted] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigatorWithStandalone && Boolean(navigatorWithStandalone.standalone));

    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!hasMounted || !installEvent || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-md rounded-[20px] border border-border bg-white p-4 shadow-nav pwa:right-6 pwa:left-auto pwa:bottom-6 pwa:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-secondary text-sedona-clay">
          <Download aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Sedona Soul</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Add the companion to your home screen for an app-like experience.</p>
          <Button
            className="mt-3"
            onClick={() => {
              installEvent.prompt().finally(() => setInstallEvent(null));
            }}
            size="sm"
            type="button"
            variant="accent"
          >
            Install app
          </Button>
        </div>
      </div>
    </div>
  );
}
