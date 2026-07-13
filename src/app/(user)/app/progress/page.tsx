import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function ProgressPage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Progress"
        title="Journey progress"
        description="Route placeholder for phase status, module progress, streaks, assessment changes, and tool completions."
      />
    </div>
  );
}
