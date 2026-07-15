import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SafeScrollAreaProps = {
  children: ReactNode;
  className?: string;
  bottomNav?: boolean;
};

export function SafeScrollArea({ children, className, bottomNav = false }: SafeScrollAreaProps) {
  return (
    <section
      className={cn(
        "safe-scroll min-h-dvh flex-1 overflow-y-auto overscroll-contain pwa:h-full pwa:min-h-0",
        bottomNav && "pb-[calc(6.5rem+env(safe-area-inset-bottom))] pwa:pb-0",
        className,
      )}
    >
      {children}
    </section>
  );
}
