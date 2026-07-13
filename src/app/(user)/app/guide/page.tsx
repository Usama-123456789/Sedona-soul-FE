import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function GuidePage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Guide"
        title="Workbook-guided chat"
        description="Route placeholder for the AI guide chat, quick prompts, source references, and recommended next step cards."
      />
    </div>
  );
}
