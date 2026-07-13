export type DashboardSummary = {
  preferredName: string;
  currentPhase: string;
  currentModule?: string;
  checkInCompletedToday: boolean;
};

export type RecommendationKind = "tool" | "module" | "reflection" | "chat" | "safety";

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  title: string;
  reason?: string;
  href?: string;
};
