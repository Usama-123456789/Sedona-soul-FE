import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OnboardingForm, OnboardingCompletionLinks } from "@/components/onboarding/onboarding-form";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { getBackendCurrentUser } from "@/lib/auth/backend-auth";
import { authRedirectRoot, onboardingRoot, signInUrl, userAppRoot } from "@/lib/auth/routes";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`${signInUrl}?redirect_url=${encodeURIComponent(onboardingRoot)}`);
  }

  let shouldRedirectHome = false;

  try {
    const { user } = await getBackendCurrentUser(session);
    shouldRedirectHome = user.onboardingComplete && user.baselineCompleted;
  } catch (error) {
    console.error("Unable to load backend onboarding state", error);
    redirect(authRedirectRoot);
  }

  if (shouldRedirectHome) {
    redirect(userAppRoot);
  }

  return (
    <OnboardingShell>
      <OnboardingForm />
      <OnboardingCompletionLinks />
    </OnboardingShell>
  );
}
