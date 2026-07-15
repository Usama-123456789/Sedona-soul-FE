import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  as?: "div" | "section";
};

const maxWidthClass = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-[980px]",
  full: "max-w-none",
};

export function PageShell({ children, className, maxWidth = "xl", as: Component = "div" }: PageShellProps) {
  return (
    <Component
      className={cn(
        "safe-pwa-inset mx-auto w-full px-5 pb-32 pt-8 pwa:pb-8 pwa:pt-8 md:px-10 lg:px-12 lg:py-10 xl:px-14",
        maxWidthClass[maxWidth],
        className,
      )}
    >
      {children}
    </Component>
  );
}
