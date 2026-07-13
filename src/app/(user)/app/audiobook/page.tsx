import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function AudiobookPage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Audiobook"
        title="Basic in-app player"
        description="Route placeholder for chapter list, play/pause, seek, speed control, and saved listening position."
      />
    </div>
  );
}
