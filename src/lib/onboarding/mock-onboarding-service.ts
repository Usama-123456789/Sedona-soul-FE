import type { OnboardingPayload } from "@/lib/onboarding/onboarding-options";

export type OnboardingNextScreen = "dashboard" | "safety";

export interface OnboardingResult {
  message: string;
  nextScreen: OnboardingNextScreen;
  profile: {
    currentPhase: "stabilize" | "heal" | "elevate";
    displayName: string;
    onboardingComplete: boolean;
  };
}

export async function submitMockOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  await waitForOnboarding();

  return {
    message:
      payload.initialSafetyAnswer === "safe"
        ? "Your starting profile is ready."
        : "Your safety support path is ready.",
    nextScreen: payload.initialSafetyAnswer === "safe" ? "dashboard" : "safety",
    profile: {
      currentPhase: payload.currentNeed === "heal" || payload.currentNeed === "elevate" ? payload.currentNeed : "stabilize",
      displayName: payload.displayName.trim(),
      onboardingComplete: true,
    },
  };
}

function waitForOnboarding() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 650);
  });
}
