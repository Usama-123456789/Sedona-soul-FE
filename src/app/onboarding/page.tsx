import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OnboardingForm, OnboardingCompletionLinks } from "@/components/onboarding/onboarding-form";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { onboardingCompleteCookieName, onboardingRoot, signInUrl, userAppRoot } from "@/lib/auth/routes";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`${signInUrl}?redirect_url=${encodeURIComponent(onboardingRoot)}`);
  }

  const cookieStore = await cookies();

  if (cookieStore.get(onboardingCompleteCookieName)?.value === "true") {
    redirect(userAppRoot);
  }

  return (
    <OnboardingShell>
      <OnboardingForm />
      <OnboardingCompletionLinks />
    </OnboardingShell>
  );
}
