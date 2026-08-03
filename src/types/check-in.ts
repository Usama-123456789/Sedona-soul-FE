import type { AudioResumeResponse } from "@/types/audio";

export type SafetyAnswer = "yes" | "no";
export type DigitalSafetyAnswer = SafetyAnswer | "concerns";
export type PacingAnswer = "good_steady" | "hard_day";
export type SafetyEventSource = "check_in" | "chat";
export type SafetyEventSeverity = "advisory" | "support" | "crisis";

export type DailySessionStatus =
  | "started"
  | "safety_completed"
  | "safety_exited"
  | "pacing_completed"
  | "completed";

export type SafetyGateQuestion = {
  id: string;
  text: string;
  expectedSafeAnswer: SafetyAnswer;
};

export type PacingQuestion = {
  id: string;
  text: string;
  options: Array<{
    value: PacingAnswer;
    label: string;
  }>;
};

export type CheckInQuestion =
  | {
      id: "mood_today" | "conflict_today" | "body_state" | "need_today";
      type: "single_select";
      text: string;
      options: string[];
    }
  | {
      id: "anxiety_level";
      type: "scale";
      text: string;
      min: number;
      max: number;
    }
  | {
      id: "private_note";
      type: "text";
      text: string;
    };

export type SafetyAnswersPayload = {
  suicidalSelfHarm: SafetyAnswer;
  addictionSobriety: SafetyAnswer;
  physicalSafety: SafetyAnswer;
  coercionControl: SafetyAnswer;
  digitalSafety: DigitalSafetyAnswer;
};

export type CheckInAnswersPayload = {
  moodToday: "steady" | "anxious" | "numb" | "angry" | "sad";
  conflictToday: "yes" | "no" | "not_applicable";
  anxietyLevel: number;
  bodyState: "settled" | "activated" | "collapsed" | "numb" | "unclear";
  needToday: "grounding" | "support" | "clarity" | "rest" | "talk";
  privateNote?: string;
};

export type SafetyCheck = {
  id: string;
  dailySessionId: string;
  result: "clear" | "blocked" | "digital_advisory";
  suicidalSelfHarm: SafetyAnswer | null;
  addictionSobriety: SafetyAnswer | null;
  physicalSafety: SafetyAnswer | null;
  coercionControl: SafetyAnswer | null;
  digitalSafety: DigitalSafetyAnswer | null;
  completedAt: string;
  createdAt?: string;
};

export type CheckIn = {
  id: string;
  dailySessionId: string;
  answers: {
    moodToday: CheckInAnswersPayload["moodToday"] | null;
    conflictToday: CheckInAnswersPayload["conflictToday"] | null;
    anxietyLevel: number | null;
    bodyState: CheckInAnswersPayload["bodyState"] | null;
    needToday: CheckInAnswersPayload["needToday"] | null;
    hasPrivateNote: boolean;
  };
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DailySession = {
  id: string;
  sessionDate: string;
  status: DailySessionStatus;
  source: string;
  safetyCompletedAt: string | null;
  pacingCompletedAt: string | null;
  pacing: {
    answer: PacingAnswer | null;
    hardDaySequenceCount: number;
  };
  safetyCheck: SafetyCheck | null;
  checkIn: CheckIn | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SafetyResource = {
  id: string;
  title: string;
  description: string;
  phone: string | null;
  textInstruction: string | null;
  url: string | null;
  category: "emergency" | "crisis" | "domestic_violence" | "digital_safety";
  priority: number;
};

export type SafetyEvent = {
  id: string;
  dailySessionId: string | null;
  safetyCheckId: string | null;
  source: SafetyEventSource;
  severity: SafetyEventSeverity;
  trigger: string;
  resourceKey: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateSafetyEventPayload = {
  dailySessionId?: string;
  safetyCheckId?: string;
  source: SafetyEventSource;
  severity: SafetyEventSeverity;
  trigger: string;
  resourceKey?: string;
  metadata?: Record<string, unknown>;
};

export type CheckInNextStep =
  | {
      nextScreen: "safety_questions";
      questionSet: {
        id: string;
        questions: SafetyGateQuestion[];
      };
    }
  | {
      nextScreen: "safety_resources";
      reason?: string;
      resources?: SafetyResource[];
    }
  | {
      nextScreen: "digital_safety_advisory";
      reason?: string;
      resources?: SafetyResource[];
      continueAfterAcknowledgement?: boolean;
    }
  | {
      nextScreen: "pacing_question";
      question: PacingQuestion;
    }
  | {
      nextScreen: "hold_position" | "support_check";
      reason?: string;
      pacing: {
        answer: PacingAnswer;
        hardDaySequenceCount: number;
        thresholdReached: boolean;
        chapterProgressAllowed: boolean;
        allowedActions: Array<"regulation_practice" | "just_talk" | string>;
      };
    }
  | {
      nextScreen: "checkin_questions";
      questions: CheckInQuestion[];
    }
  | {
      nextScreen: "recommendation";
      nextAction?: string;
    }
  | {
      nextScreen: "dashboard";
    };

export type DailySessionResponse = {
  dailySession: DailySession;
  reusedExisting?: boolean;
  nextStep: CheckInNextStep;
};

export type DashboardContext = {
  profile: {
    id: string;
    email: string;
    preferredName: string | null;
    role: "user" | "admin";
    status: "active" | "disabled" | "deleted";
    onboardingComplete: boolean;
    baselineCompleted: boolean;
    currentPhase: string;
    currentModule: string | null;
  };
  journey: {
    currentPhase: string;
    currentModule: string | null;
    phaseProgress: {
      stabilize: number;
      heal: number;
      elevate: number;
    };
  };
  dailySession: {
    hasSessionToday: boolean;
    todaySession: DailySession | null;
    latestSession: DailySession | null;
  };
  stats: {
    hardDaySequenceCount: number;
    latestAnxietyLevel: number | null;
    daysInPhase: number | null;
    regulationStreak: number | null;
  };
  latestRecommendation: {
    type: string;
    title: string;
    reason: string;
    target: string;
  } | null;
  safety: {
    latestEvent: {
      id: string;
      severity: "advisory" | "support" | "crisis";
      trigger: string;
      createdAt: string;
    } | null;
  };
  partnerStatus: {
    status: string;
    relationshipId?: string | null;
    partner?: {
      id: string;
      displayName: string | null;
      initials: string;
    } | null;
    invite?: {
      code: string | null;
      inviteUrl: string | null;
    } | null;
    sharing?: {
      privateByDefault: boolean;
      rawPrivateContentShared: boolean;
    };
    timestamps?: {
      acceptedAt: string | null;
      soloSelectedAt: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    };
  };
  audiobook: AudioResumeResponse | null;
};
