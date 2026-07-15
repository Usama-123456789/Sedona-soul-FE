import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { GreetingHeader } from "@/components/shared/greeting-header";

type RouteStateCopy = {
  title: string;
  description: string;
};

type RouteEmptyStateCopy = RouteStateCopy & {
  icon?: LucideIcon;
};

type RouteStateGridProps = {
  loading: RouteStateCopy;
  empty: RouteEmptyStateCopy;
  error: RouteStateCopy;
  className?: string;
};

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  states?: RouteStateGridProps;
  className?: string;
};

export function RouteStateGrid({ loading, empty, error, className }: RouteStateGridProps) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-3", className)} aria-label="Screen states">
      <LoadingState className="min-h-[188px] p-5 shadow-card" description={loading.description} title={loading.title} />
      <EmptyState
        className="min-h-[188px] p-5"
        description={empty.description}
        icon={empty.icon}
        title={empty.title}
      />
      <ErrorState className="min-h-[188px]" description={error.description} title={error.title} />
    </div>
  );
}

export function RoutePlaceholder({ eyebrow, title, description, states, className }: RoutePlaceholderProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_40px_-30px_rgba(48,30,16,0.35)]">
        <GreetingHeader description={description} eyebrow={eyebrow} title={title} />
      </div>
      {states ? <RouteStateGrid {...states} /> : null}
    </section>
  );
}
