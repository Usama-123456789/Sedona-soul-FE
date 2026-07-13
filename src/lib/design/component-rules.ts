export const componentUsageRules = {
  userPwa: [
    "Use mobile-first layouts and switch to the responsive sidebar layout at 575px.",
    "Use warm Sedona tokens for user-facing recovery flows: sand, paper, pine, clay, sage, blue, and taupe.",
    "Keep cards calm and spacious; reserve the prominent clay action for daily check-in or primary continuation.",
    "Use the bottom navigation only below 575px; use the compact or expanded sidebar at 575px and above.",
    "Safety and crisis states must be visually direct, high contrast, and easy to exit.",
  ],
  adminDashboard: [
    "Use desktop-first dashboard density with sidebar navigation, tables, filters, and reporting surfaces.",
    "Use the same tokens and primitives, but prefer quieter secondary actions and compact cards.",
    "Avoid mobile PWA bottom navigation, oversized recovery copy, and consumer-style hero blocks in admin.",
    "Keep admin forms, content tools, and reporting screens predictable and scan-friendly.",
  ],
} as const;
