import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function AudiobookPage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.audiobook}
        eyebrow="Audiobook"
        title="Basic in-app player"
        description="Chapter list, play/pause, seek, speed control, current module audio, and saved listening position."
      />
    </PageShell>
  );
}
