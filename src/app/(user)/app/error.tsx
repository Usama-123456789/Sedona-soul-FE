"use client";

import { PageShell } from "@/components/layouts/page-shell";
import { ErrorState } from "@/components/ui/error-state";

type UserAppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function UserAppError({ reset }: UserAppErrorProps) {
  return (
    <PageShell maxWidth="md">
      <ErrorState
        className="min-h-[280px]"
        description="We could not load this protected screen. Your progress is still saved; try loading this section again."
        onRetry={reset}
        title="This screen needs a refresh"
      />
    </PageShell>
  );
}
