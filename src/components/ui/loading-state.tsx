import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  title = "Loading",
  description = "Preparing the next step...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-card border border-border bg-white p-8 text-center shadow-card", className)}>
      <Loader2 aria-hidden="true" className="h-7 w-7 animate-spin text-sedona-clay" strokeWidth={1.8} />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
