import { PageShell } from "@/components/layouts/page-shell";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function PartnerPage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.partner}
        eyebrow="Partner"
        title="Partner and solo path"
        description="Shared, Invite, and Solo Path sections with partner status, agreements, invite code, and private-by-default sharing."
      />
    </PageShell>
  );
}
