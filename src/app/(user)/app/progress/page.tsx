import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function ProgressPage() {
  return (
    <PageShell maxWidth="lg">
      <RoutePlaceholder
        states={userRouteStates.progress}
        eyebrow="Progress"
        title="Journey progress"
        description="Phase status, module completion, streaks, assessment changes, practice completions, and reflection progress."
      />
    </PageShell>
  );
}
