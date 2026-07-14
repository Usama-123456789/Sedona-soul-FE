export type DashboardSummary = {
  userId: string;
  preferredName: string;
  currentDay: number;
  currentPhase: "stabilize" | "heal" | "elevate";
  currentModule?: string;
  checkInCompletedToday: boolean;
  regulationStreak: number;
  anxietyTrend?: {
    previous: number;
    current: number;
  };
};

export type RecommendationKind = "tool" | "module" | "reflection" | "chat" | "safety";

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  title: string;
  reason?: string;
  href?: string;
  durationMinutes?: number;
  safetyLevel?: "normal" | "support" | "crisis";
};

export type CheckInScaleRatings = {
  anxiety?: number;
  sadness?: number;
  anger?: number;
  hope?: number;
  focus?: number;
};

export type CheckInPayload = {
  isSafe: boolean;
  feelings: string[];
  scaleRatings: CheckInScaleRatings;
  reflection?: string;
};

export type CheckInResult = {
  checkInId: string;
  completedAt: string;
  recommendation?: Recommendation;
  safetyResourcesRequired: boolean;
};

export type SafetyResource = {
  id: string;
  name: string;
  type: "hotline" | "emergency" | "text" | "link";
  phoneNumber?: string;
  textInstruction?: string;
  url?: string;
  availabilityLabel: string;
  priority: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  safetyFlags?: string[];
};

export type ChatSummary = {
  conversationId: string;
  messages: ChatMessage[];
  suggestedPrompts: string[];
  memoryUpdated: boolean;
};

export type ProgressSummary = {
  phaseProgress: number;
  moduleProgress: number;
  completedPractices: number;
  assessmentTrends: Array<{
    label: string;
    baseline: number;
    current: number;
  }>;
};

export type PartnerStatus = {
  connectionState: "none" | "invited" | "linked" | "solo";
  partnerInitials?: string;
  sharedPhase?: string;
  inviteCode?: string;
};

export type AudioProgress = {
  trackId: string;
  title: string;
  durationSeconds: number;
  positionSeconds: number;
  completed: boolean;
};

export type AdminReportSummary = {
  dateRange: {
    from: string;
    to: string;
  };
  activeUsers: number;
  completedCheckIns: number;
  safetyResourceViews: number;
  pseudonymizedRows: Array<{
    pseudonymousUserId: string;
    phase: string;
    checkInCount: number;
    latestAssessmentSummary?: string;
  }>;
};
