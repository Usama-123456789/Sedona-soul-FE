import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function TodayPage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Today"
        title="Daily check-in"
        description="Route placeholder for safety gate, 4-5 check-in questions, and recommendation handoff."
      />
    </div>
  );
}
