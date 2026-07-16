export type JourneyType = "individual" | "couple" | "crisis_stabilize" | "solo";
export type PartnerStatus = "with_partner" | "partner_not_ready" | "solo";
export type CurrentNeed = "stabilize" | "heal" | "elevate" | "not_sure";
export type InitialSafetyAnswer = "safe" | "not_sure" | "not_safe";

export interface OnboardingPayload {
  consentPrivacy: boolean;
  consentSensitiveUse: boolean;
  currentNeed: CurrentNeed;
  displayName: string;
  initialSafetyAnswer: InitialSafetyAnswer;
  journeyType: JourneyType;
  partnerStatus: PartnerStatus;
}

export const journeyTypeOptions = [
  {
    description: "Personal repair and nervous-system support.",
    label: "Individual",
    value: "individual",
  },
  {
    description: "You and your partner may both use the work.",
    label: "Couple",
    value: "couple",
  },
  {
    description: "Start with de-escalation, grounding, and repair basics.",
    label: "Crisis / Stabilize",
    value: "crisis_stabilize",
  },
  {
    description: "Work your side of the dynamic even if they are not ready.",
    label: "Solo path",
    value: "solo",
  },
] as const;

export const partnerStatusOptions = [
  {
    label: "With partner",
    value: "with_partner",
  },
  {
    label: "Partner may join later",
    value: "partner_not_ready",
  },
  {
    label: "Solo for now",
    value: "solo",
  },
] as const;

export const currentNeedOptions = [
  {
    label: "Stabilize",
    value: "stabilize",
  },
  {
    label: "Heal",
    value: "heal",
  },
  {
    label: "Elevate",
    value: "elevate",
  },
  {
    label: "Not sure",
    value: "not_sure",
  },
] as const;

export const safetyAnswerOptions = [
  {
    description: "Continue into your starting plan.",
    label: "Yes, I am safe",
    value: "safe",
  },
  {
    description: "Keep help resources close before continuing.",
    label: "I am not sure",
    value: "not_sure",
  },
  {
    description: "Show safety support before normal app guidance.",
    label: "I am not safe",
    value: "not_safe",
  },
] as const;
