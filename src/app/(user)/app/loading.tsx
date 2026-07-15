import { PageShell } from "@/components/layouts/page-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function UserAppLoading() {
  return (
    <PageShell maxWidth="md">
      <LoadingState
        className="min-h-[360px] w-full border-0"
        description="Loading your Sedona Soul profile, protected app space, and next recommended step."
        title="Preparing your space"
      />
    </PageShell>
  );
}
