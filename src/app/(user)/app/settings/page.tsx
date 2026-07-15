import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function SettingsPage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.settings}
        eyebrow="Settings"
        title="User settings"
        description="Account profile, privacy, consent, notifications, install status, partner controls, and preferences."
      />
    </PageShell>
  );
}
