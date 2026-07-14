import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
};

const maxWidthClass = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-[1040px]",
  full: "max-w-none",
};

export function PageShell({ children, className, maxWidth = "xl" }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full px-5 pb-32 pt-8 pwa:px-9 pwa:py-10 lg:px-14 lg:py-12", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}
