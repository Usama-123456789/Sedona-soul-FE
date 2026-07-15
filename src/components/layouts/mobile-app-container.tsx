import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MobileAppContainerProps = {
  children: ReactNode;
  className?: string;
};

export function MobileAppContainer({ children, className }: MobileAppContainerProps) {
  return (
    <main
      className={cn(
        "min-h-dvh bg-sedona-sand text-sedona-pineSoft pwa:h-dvh pwa:overflow-hidden",
        className,
      )}
    >
      {children}
    </main>
  );
}
