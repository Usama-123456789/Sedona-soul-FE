import { PageShell } from "@/components/layouts/page-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { RoutePlaceholder } from "@/components/placeholders/route-placeholder";
import { userRouteStates } from "@/components/placeholders/user-route-states";

export default function SettingsPage() {
  return (
    <PageShell maxWidth="md">
      <RoutePlaceholder
        states={userRouteStates.settings}
        eyebrow="Settings"
        title="User settings"
        description="Account profile, privacy, consent, notifications, install status, partner controls, and preferences."
      />
      <section className="mt-4 rounded-[24px] bg-white p-6 shadow-card">
        <p className="sedona-eyebrow">Session</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-sedona-pineSoft">Account access</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-sedona-stone">
          Sign out of this browser and return to the Sedona Soul login screen.
        </p>
        <LogoutButton className="mt-5 h-12 border-sedona-creamLine bg-white px-5 text-sedona-clay hover:bg-[#FFF8F4]" />
      </section>
    </PageShell>
  );
}
