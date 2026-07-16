import { LoadingState } from "@/components/ui/loading-state";

export default function OnboardingLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sedona-sand px-6 text-sedona-pineSoft">
      <LoadingState
        className="min-h-[280px] w-full max-w-md border-0 bg-white shadow-card"
        description="Checking your session and preparing the onboarding questions."
        title="Preparing onboarding"
      />
    </main>
  );
}
