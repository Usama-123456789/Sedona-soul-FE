import { BookOpen, Headphones, Heart, LineChart, MessageCircle, Settings, Sun } from "lucide-react";

export const userRouteStates = {
  home: {
    loading: {
      title: "Loading dashboard",
      description: "Fetching the greeting, journey status, quick tools, partner strip, and audiobook resume.",
    },
    empty: {
      icon: Sun,
      title: "No dashboard progress yet",
      description: "After onboarding, this area will show check-ins, streaks, recommendations, and your current phase.",
    },
    error: {
      title: "Dashboard unavailable",
      description: "We could not load the dashboard summary. The app should keep the user in place and offer a retry.",
    },
  },
  guide: {
    loading: {
      title: "Loading guide chat",
      description: "Preparing workbook context, suggested prompts, and previous conversation memory.",
    },
    empty: {
      icon: MessageCircle,
      title: "No guide conversation yet",
      description: "The first prompt will open a workbook-trained conversation and begin saving memory for this user.",
    },
    error: {
      title: "Guide could not connect",
      description: "If AI or RAG is unavailable, show this state and keep suggested grounding options visible.",
    },
  },
  today: {
    loading: {
      title: "Preparing check-in",
      description: "Loading the safety gate, daily prompts, scale ratings, and recommendation handoff.",
    },
    empty: {
      icon: Sun,
      title: "No check-in started today",
      description: "The user should begin with the safety question before workbook guidance or practices continue.",
    },
    error: {
      title: "Check-in could not load",
      description: "Safety resources and retry options should remain available if the daily check-in data fails.",
    },
  },
  partner: {
    loading: {
      title: "Loading partner space",
      description: "Checking connection status, agreements, invite code, and solo-path preferences.",
    },
    empty: {
      icon: Heart,
      title: "No partner linked",
      description: "The user can invite a partner or continue on the solo pathway with private-by-default sharing.",
    },
    error: {
      title: "Partner status unavailable",
      description: "If partner data cannot load, keep the solo pathway and privacy explanation accessible.",
    },
  },
  progress: {
    loading: {
      title: "Loading progress",
      description: "Collecting phase status, module completion, assessment trends, streaks, and practice history.",
    },
    empty: {
      icon: LineChart,
      title: "No progress recorded yet",
      description: "Assessment changes, practice completions, and reflections will appear after the first sessions.",
    },
    error: {
      title: "Progress could not load",
      description: "The app should preserve local navigation and let the user retry progress summaries.",
    },
  },
  audiobook: {
    loading: {
      title: "Loading audio",
      description: "Finding the current chapter, playback position, duration, and saved listening state.",
    },
    empty: {
      icon: Headphones,
      title: "No audio progress yet",
      description: "Once audio content is available, the player will show resume position and chapter progress.",
    },
    error: {
      title: "Audio unavailable",
      description: "If tracks or progress fail to load, show a calm retry state instead of an empty player.",
    },
  },
  settings: {
    loading: {
      title: "Loading settings",
      description: "Fetching profile, privacy, consent, notification, install, and partner-sharing preferences.",
    },
    empty: {
      icon: Settings,
      title: "No preferences configured",
      description: "Default privacy and notification choices will be shown until the user updates settings.",
    },
    error: {
      title: "Settings could not load",
      description: "If profile settings fail, keep account safety and privacy messaging visible with retry support.",
    },
  },
} as const;

export const workbookStates = {
  loading: {
    title: "Loading workbook content",
    description: "Preparing modules, practices, reflection prompts, and source-aware guidance from the workbook.",
  },
  empty: {
    icon: BookOpen,
    title: "Workbook content not added",
    description: "When content is connected, this area can show the current module and upcoming practices.",
  },
  error: {
    title: "Workbook content unavailable",
    description: "If content retrieval fails, keep the user in the app shell and offer a clear retry path.",
  },
} as const;
