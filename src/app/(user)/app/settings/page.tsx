import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";

export default function SettingsPage() {
  return (
    <div className="px-5 py-16 min-[575px]:px-8 min-[575px]:py-8 lg:px-10">
      <RoutePlaceholder
        eyebrow="Settings"
        title="User settings"
        description="Route placeholder for account, privacy, consent, and notification settings if included."
      />
    </div>
  );
}
