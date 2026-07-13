import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function PartnerPage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Partner"
        title="Partner and solo path"
        description="Route placeholder for Shared, Invite, and Solo Path sections with private-by-default sharing."
      />
    </div>
  );
}
