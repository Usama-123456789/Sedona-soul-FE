import type { LucideIcon } from "lucide-react";
import { CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon = CircleDashed,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-card border border-dashed border-border bg-white/72 p-8 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-sedona-blue">
        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 font-serif text-2xl font-normal text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction} size="sm" type="button" variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
