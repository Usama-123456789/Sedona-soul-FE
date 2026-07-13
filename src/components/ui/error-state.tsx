import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something needs attention",
  description = "We could not load this section. Please try again.",
  retryLabel = "Try again",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("rounded-card border border-[#E9C7B9] bg-[#FFF8F3] p-6 text-left shadow-card", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F4E2D6] text-destructive">
          <AlertTriangle aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          {onRetry ? (
            <Button className="mt-4" onClick={onRetry} size="sm" type="button" variant="outline">
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
