import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function TodayPage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.today}
        eyebrow="Today"
        title="Daily check-in"
        description="Safety gate, check-in questions, scale ratings, reflection capture, recommendation handoff, and practice logging."
      />
    </PageShell>
  );
}
