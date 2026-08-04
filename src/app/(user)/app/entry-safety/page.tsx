import { PageShell } from "@/components/layouts/page-shell";
import { CheckInFlow } from "@/components/check-in/check-in-flow";

export default function EntrySafetyPage() {
  return (
    <PageShell className="pt-6 min-[575px]:pt-10" maxWidth="lg">
      <CheckInFlow mode="entry" />
    </PageShell>
  );
}
