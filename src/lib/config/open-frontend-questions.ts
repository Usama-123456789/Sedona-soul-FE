export const openFrontendQuestions = [
  {
    area: "Home dashboard",
    question: "Should audiobook resume appear on Home in the lean MVP, or only after audio content is uploaded?",
    phaseImpact: "Phase 1 dashboard content priority",
  },
  {
    area: "Guide chat",
    question: "Should suggested prompt chips be fully AI-generated, module-driven, or a fixed starter set for MVP?",
    phaseImpact: "Chat API response shape",
  },
  {
    area: "Today / Check-In",
    question: "Which exact feeling chips and scale labels are required for the first MVP check-in?",
    phaseImpact: "Check-in schema and validation",
  },
  {
    area: "Safety",
    question: "Should hotline resources be US-only for MVP or region-aware from day one?",
    phaseImpact: "Safety resource data model",
  },
  {
    area: "Partner",
    question: "Which partner actions are MVP: invite/link/status only, or agreements and solo path too?",
    phaseImpact: "Partner flow scope",
  },
  {
    area: "Progress",
    question: "Which assessment scores should be shown as trend lines versus simple before/after values?",
    phaseImpact: "Progress charts and scoring UI",
  },
  {
    area: "Admin",
    question: "Can admin users edit live workbook content directly, or should edits require draft/review/publish states?",
    phaseImpact: "Admin content workflow",
  },
  {
    area: "PWA install",
    question: "Should install prompting be shown immediately, after login, or after first successful check-in?",
    phaseImpact: "Install prompt timing",
  },
] as const;
