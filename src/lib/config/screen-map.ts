export const routeToScreenMap = [
  {
    route: "/app/home",
    screen: "Home dashboard",
    prototypeReference: "Mobile Home + Responsive Home",
    purpose: "Greeting, daily check-in entry, journey status, stats, quick tools, partner strip, audiobook resume.",
  },
  {
    route: "/app/guide",
    screen: "Guide chat",
    prototypeReference: "Guide chat",
    purpose: "Open workbook-trained AI chat with suggested prompts and stored conversation memory.",
  },
  {
    route: "/app/today",
    screen: "Today / Daily Check-In",
    prototypeReference: "Safety gate, check-in state, matched practice",
    purpose: "Safety gate, emotional state input, assessment scales, recommendations, and practice logging.",
  },
  {
    route: "/app/partner",
    screen: "Partner",
    prototypeReference: "Shared, Invite, Solo path",
    purpose: "Partner link status, agreements, invite flow, solo pathway, and couple-related practice surfaces.",
  },
  {
    route: "/app/progress",
    screen: "Progress",
    prototypeReference: "Your journey",
    purpose: "Phase/module progress, assessment trends, streaks, practice completion, and reflection progress.",
  },
  {
    route: "/app/audiobook",
    screen: "Audiobook",
    prototypeReference: "Not explicit in shared prototype; required by scope",
    purpose: "Audio progress, playback state, module audio, and resume position.",
  },
  {
    route: "/app/settings",
    screen: "Settings",
    prototypeReference: "Not explicit in shared prototype; required by PWA/account behavior",
    purpose: "Profile, privacy, notifications, install status, partner controls, and account preferences.",
  },
  {
    route: "/admin/dashboard",
    screen: "Admin Dashboard",
    prototypeReference: "Admin web dashboard requirement",
    purpose: "Operational overview for user progress, content health, safety reporting, and high-level metrics.",
  },
  {
    route: "/admin/content",
    screen: "Admin Content",
    prototypeReference: "Admin web dashboard requirement",
    purpose: "Upload/update workbook/book content, videos, prompts, practices, and module metadata.",
  },
  {
    route: "/admin/reports",
    screen: "Admin Reports",
    prototypeReference: "Admin web dashboard requirement",
    purpose: "Pseudonymized summaries, progress reporting, assessment trends, and safety/resource usage reports.",
  },
] as const;
