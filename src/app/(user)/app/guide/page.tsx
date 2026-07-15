import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function GuidePage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.guide}
        eyebrow="Guide"
        title="Workbook-guided chat"
        description="Open workbook-trained chat with suggested prompts, stored conversation memory, safety flags, and recommended next steps."
      />
    </PageShell>
  );
}
