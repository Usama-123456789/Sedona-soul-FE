"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  HeartPulse,
  Loader2,
  MessageCircle,
  RotateCcw,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FrontendApiError } from "@/lib/api/audio";
import {
  getDashboardContext,
  listSafetyResources,
  startDailyCheckIn,
  submitCheckInAnswers,
  submitPacingAnswer,
  submitSafetyAnswers,
} from "@/lib/api/check-ins";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { clearSafetyLock, completeEntrySafetyGate, setSafetyLock } from "@/lib/safety/safety-lock";
import type {
  CheckInAnswersPayload,
  CheckInNextStep,
  CheckInQuestion,
  DailySessionResponse,
  DigitalSafetyAnswer,
  PacingAnswer,
  SafetyAnswersPayload,
  SafetyGateQuestion,
  SafetyResource,
} from "@/types/check-in";

type StepState = {
  dailySessionId: string | null;
  nextStep: CheckInNextStep | null;
};

type CheckInFlowProps = {
  mode?: "daily" | "entry";
};

type SessionContext = "daily" | "entry";

const safetyFieldMap: Record<string, keyof SafetyAnswersPayload> = {
  addiction_sobriety: "addictionSobriety",
  coercion_control: "coercionControl",
  digital_safety: "digitalSafety",
  physical_safety: "physicalSafety",
  suicidal_self_harm: "suicidalSelfHarm",
};

const safetyFallbackQuestions: SafetyGateQuestion[] = [
  {
    id: "suicidal_self_harm",
    text: "Do you or your partner have any suicidal thoughts or self-harm intentions?",
    expectedSafeAnswer: "no",
  },
  {
    id: "addiction_sobriety",
    text: "Do you or your partner have an addiction or are not sober now?",
    expectedSafeAnswer: "no",
  },
  {
    id: "physical_safety",
    text: "Do you feel physically unsafe with your partner?",
    expectedSafeAnswer: "no",
  },
  {
    id: "coercion_control",
    text: "Do you or your partner feel coercion in any way at this moment?",
    expectedSafeAnswer: "no",
  },
  {
    id: "digital_safety",
    text: "Do you or your partner feel safe digitally?",
    expectedSafeAnswer: "yes",
  },
];

const safetyFallbackResources: SafetyResource[] = [
  {
    id: "immediate_danger",
    title: "Immediate danger",
    description: "Call emergency services if you or someone else is in immediate danger.",
    phone: "911",
    textInstruction: null,
    url: null,
    category: "emergency",
    priority: 1,
  },
  {
    id: "suicide_crisis_lifeline",
    title: "Suicide & Crisis Lifeline",
    description: "Call or text anytime if there are suicidal thoughts or self-harm risk.",
    phone: "988",
    textInstruction: "Call or text 988",
    url: "https://988lifeline.org",
    category: "crisis",
    priority: 2,
  },
  {
    id: "domestic_violence_hotline",
    title: "Domestic Violence Hotline",
    description: "Free, confidential support for physical safety or coercive control concerns.",
    phone: "1-800-799-7233",
    textInstruction: "Text START to 88788",
    url: "https://www.thehotline.org",
    category: "domestic_violence",
    priority: 3,
  },
];

const defaultCheckInQuestions: CheckInQuestion[] = [
  {
    id: "mood_today",
    type: "single_select",
    text: "How are you arriving today?",
    options: ["steady", "anxious", "numb", "angry", "sad"],
  },
  {
    id: "conflict_today",
    type: "single_select",
    text: "Did something happen with your partner today?",
    options: ["yes", "no", "not_applicable"],
  },
  {
    id: "anxiety_level",
    type: "scale",
    text: "What is your anxiety/body activation level right now?",
    min: 1,
    max: 10,
  },
  {
    id: "body_state",
    type: "single_select",
    text: "What body state feels closest right now?",
    options: ["settled", "activated", "collapsed", "numb", "unclear"],
  },
  {
    id: "need_today",
    type: "single_select",
    text: "What do you need today?",
    options: ["grounding", "support", "clarity", "rest", "talk"],
  },
  {
    id: "private_note",
    type: "text",
    text: "Optional honest sentence for yourself.",
  },
];

const formatOptionLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const pacingQuestionFallback: Extract<CheckInNextStep, { nextScreen: "pacing_question" }>["question"] = {
  id: "today_landing",
  text: "How is today landing?",
  options: [
    { label: "Good / steady day", value: "good_steady" },
    { label: "Hard day", value: "hard_day" },
  ],
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof FrontendApiError) {
    if (error.code === "LOCAL_USER_NOT_FOUND") {
      return "Your local profile is not synced yet. Please sign in again so the app can prepare your account.";
    }

    if (error.status === 401) {
      return "Your session expired. Please sign in again.";
    }

    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
};

const getSafetyQuestionsStep = (): CheckInNextStep => ({
  nextScreen: "safety_questions",
  questionSet: {
    id: "phase_1_safety_gates",
    questions: safetyFallbackQuestions,
  },
});

const getPacingQuestionStep = (): CheckInNextStep => ({
  nextScreen: "pacing_question",
  question: pacingQuestionFallback,
});

const getDigitalSafetyAdvisoryStep = (resources?: SafetyResource[]): CheckInNextStep => ({
  nextScreen: "digital_safety_advisory",
  reason: "digital_safety_concern",
  resources,
  continueAfterAcknowledgement: true,
});

const getHeldForPacingStep = (): CheckInNextStep => ({
  nextScreen: "hold_position",
  reason: "hard_day",
  pacing: {
    answer: "hard_day",
    allowedActions: ["regulation_practice", "just_talk"],
    chapterProgressAllowed: false,
    hardDaySequenceCount: 1,
    thresholdReached: false,
  },
});

const getDigitalAdvisoryAcknowledgementKey = (dailySessionId: string) =>
  `sedona:digital-safety-advisory:${dailySessionId}`;

const hasAcknowledgedDigitalAdvisory = (dailySessionId: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(getDigitalAdvisoryAcknowledgementKey(dailySessionId)) === "true";
};

const markDigitalAdvisoryAcknowledged = (dailySessionId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getDigitalAdvisoryAcknowledgementKey(dailySessionId), "true");
};

const normalizeStepFromDashboard = async (): Promise<StepState> => {
  const dashboard = await getDashboardContext();
  const todaySession = dashboard.dailySession.todaySession;

  if (!dashboard.dailySession.hasSessionToday || !todaySession) {
    return {
      dailySessionId: null,
      nextStep: null,
    };
  }

  if (todaySession.status === "safety_exited") {
    return {
      dailySessionId: todaySession.id,
      nextStep: {
        nextScreen: "safety_resources",
      },
    };
  }

  if (!todaySession.safetyCompletedAt) {
    return {
      dailySessionId: todaySession.id,
      nextStep: getSafetyQuestionsStep(),
    };
  }

  if (
    todaySession.safetyCheck?.result === "digital_advisory" &&
    !todaySession.pacing.answer &&
    !hasAcknowledgedDigitalAdvisory(todaySession.id)
  ) {
    const resources = await listSafetyResources()
      .then((items) => items.filter((resource) => resource.id === "digital_safety_advisory"))
      .catch(() => safetyFallbackResources.filter((resource) => resource.id === "digital_safety_advisory"));

    return {
      dailySessionId: todaySession.id,
      nextStep: getDigitalSafetyAdvisoryStep(resources),
    };
  }

  if (!todaySession.pacing.answer) {
    return {
      dailySessionId: todaySession.id,
      nextStep: getPacingQuestionStep(),
    };
  }

  if (todaySession.pacing.answer === "hard_day") {
    return {
      dailySessionId: todaySession.id,
      nextStep: {
        nextScreen: todaySession.pacing.hardDaySequenceCount >= 4 ? "support_check" : "hold_position",
        pacing: {
          answer: "hard_day",
          allowedActions: ["regulation_practice", "just_talk"],
          chapterProgressAllowed: false,
          hardDaySequenceCount: todaySession.pacing.hardDaySequenceCount,
          thresholdReached: todaySession.pacing.hardDaySequenceCount >= 4,
        },
      },
    };
  }

  if (todaySession.status !== "completed") {
    return {
      dailySessionId: todaySession.id,
      nextStep: {
        nextScreen: "checkin_questions",
        questions: defaultCheckInQuestions,
      },
    };
  }

  return {
    dailySessionId: todaySession.id,
    nextStep: {
      nextScreen: "dashboard",
    },
  };
};

export function CheckInFlow({ mode = "daily" }: CheckInFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<StepState>({ dailySessionId: null, nextStep: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInitialState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "entry") {
        const result = await startDailyCheckIn("entry_safety");

        setSafetyLock();

        setState({
          dailySessionId: result.dailySession.id,
          nextStep:
            result.dailySession.status === "safety_exited"
              ? {
                  nextScreen: "safety_resources",
                  resources:
                    result.nextStep.nextScreen === "safety_resources" ? result.nextStep.resources : undefined,
                }
              : getSafetyQuestionsStep(),
        });
      } else {
        const nextState = await normalizeStepFromDashboard();

        if (nextState.nextStep?.nextScreen === "safety_resources") {
          setSafetyLock();
        } else {
          clearSafetyLock();
        }

        setState(nextState);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "We could not load today's session."));
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void loadInitialState();
  }, [loadInitialState]);

  const startSession = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await startDailyCheckIn();
      setState({
        dailySessionId: result.dailySession.id,
        nextStep: result.nextStep,
      });
      toast({
        description: "Safety and pacing will decide today's next step.",
        title: result.reusedExisting ? "Resuming today's check-in" : "Daily check-in started",
      });
    } catch (startError) {
      setError(getErrorMessage(startError, "We could not begin the check-in."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeEntryAndGoHome = async () => {
    await completeEntrySafetyGate();
    router.replace("/app/home");
    router.refresh();
  };

  const updateFromResult = async (result: DailySessionResponse) => {
    if (result.nextStep.nextScreen === "safety_resources") {
      setSafetyLock();
    } else {
      clearSafetyLock();
    }

    if (mode === "entry") {
      if (result.nextStep.nextScreen === "safety_resources") {
        setState({
          dailySessionId: result.dailySession.id,
          nextStep: result.nextStep,
        });
        return;
      }

      await completeEntryAndGoHome();
      return;
    }

    setState({
      dailySessionId: result.dailySession.id,
      nextStep: result.nextStep,
    });
  };

  const routeFromBackendError = async (error: unknown, fallback: string) => {
    if (error instanceof FrontendApiError) {
      if (error.code === "DAILY_SESSION_SAFETY_NOT_CLEAR") {
        setSafetyLock();
        setState((current) => ({
          dailySessionId: current.dailySessionId,
          nextStep: getSafetyQuestionsStep(),
        }));
        toast({
          description: "Safety gates need to be completed before this step.",
          title: "Safety first",
          variant: "destructive",
        });
        return;
      }

      if (error.code === "DAILY_SESSION_HELD_FOR_PACING") {
        setState((current) => ({
          dailySessionId: current.dailySessionId,
          nextStep: getHeldForPacingStep(),
        }));
        toast({
          description: "Hard days hold workbook progress and offer regulation/support.",
          title: "Workbook progress is paused",
          variant: "destructive",
        });
        return;
      }

      if (error.code === "LOCAL_USER_NOT_FOUND" || error.status === 401) {
        setError(getErrorMessage(error, fallback));
        return;
      }
    }

    setError(getErrorMessage(error, fallback));
  };

  const continueAfterDigitalAdvisory = async () => {
    if (!state.dailySessionId) {
      setError("Daily session is missing. Please restart today's check-in.");
      return;
    }

    markDigitalAdvisoryAcknowledged(state.dailySessionId);
    setError(null);

    if (mode === "entry") {
      await completeEntryAndGoHome();
      return;
    }

    setState({
      dailySessionId: state.dailySessionId,
      nextStep: getPacingQuestionStep(),
    });
  };

  if (isLoading) {
    return (
      <SessionShell
        context={mode}
        eyebrow={mode === "entry" ? "Safety gate" : "Today"}
        title={mode === "entry" ? "Before you enter Phase 1" : "Daily check-in"}
        description="Finding the right place to begin."
      >
        <LoadingState
          className="border-0 bg-white/92"
          description="Loading your safety gate and today's session state."
          title="Preparing check-in"
        />
      </SessionShell>
    );
  }

  if (error) {
    return (
      <SessionShell
        context={mode}
        eyebrow={mode === "entry" ? "Safety gate" : "Today"}
        title={mode === "entry" ? "Safety check unavailable" : "Daily check-in"}
        description="Something interrupted the check-in flow."
      >
        <ErrorState
          description={error}
          onRetry={loadInitialState}
          retryLabel="Reload session"
          title="Check-in unavailable"
        />
      </SessionShell>
    );
  }

  if (!state.nextStep) {
    return <StartSessionScreen isSubmitting={isSubmitting} onStart={startSession} />;
  }

  return (
    <SessionStepRenderer
      dailySessionId={state.dailySessionId}
      context={mode}
      isSubmitting={isSubmitting}
      nextStep={state.nextStep}
      onDigitalAdvisoryContinue={continueAfterDigitalAdvisory}
      onDashboardRefresh={loadInitialState}
      routeFromBackendError={routeFromBackendError}
      setError={setError}
      setIsSubmitting={setIsSubmitting}
      updateFromResult={updateFromResult}
    />
  );
}

function SessionStepRenderer({
  context,
  dailySessionId,
  isSubmitting,
  nextStep,
  onDigitalAdvisoryContinue,
  onDashboardRefresh,
  routeFromBackendError,
  setError,
  setIsSubmitting,
  updateFromResult,
}: {
  context: SessionContext;
  dailySessionId: string | null;
  isSubmitting: boolean;
  nextStep: CheckInNextStep;
  onDigitalAdvisoryContinue: () => Promise<void>;
  onDashboardRefresh: () => Promise<void>;
  routeFromBackendError: (error: unknown, fallback: string) => Promise<void>;
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  updateFromResult: (result: DailySessionResponse) => Promise<void>;
}) {
  if (nextStep.nextScreen === "safety_questions") {
    return (
      <SafetyQuestionsScreen
        dailySessionId={dailySessionId}
        context={context}
        isSubmitting={isSubmitting}
        questions={nextStep.questionSet.questions}
        setError={setError}
        setIsSubmitting={setIsSubmitting}
        routeFromBackendError={routeFromBackendError}
        updateFromResult={updateFromResult}
      />
    );
  }

  if (nextStep.nextScreen === "safety_resources") {
    return <SafetyResourcesScreen context={context} resources={nextStep.resources} />;
  }

  if (nextStep.nextScreen === "digital_safety_advisory") {
    return (
      <DigitalSafetyAdvisoryScreen
        dailySessionId={dailySessionId}
        resources={nextStep.resources}
        onContinue={onDigitalAdvisoryContinue}
        setError={setError}
      />
    );
  }

  if (nextStep.nextScreen === "pacing_question") {
    return (
      <PacingQuestionScreen
        dailySessionId={dailySessionId}
        isSubmitting={isSubmitting}
        question={nextStep.question}
        setError={setError}
        setIsSubmitting={setIsSubmitting}
        routeFromBackendError={routeFromBackendError}
        updateFromResult={updateFromResult}
      />
    );
  }

  if (nextStep.nextScreen === "hold_position") {
    return <HoldPositionScreen hardDaySequenceCount={nextStep.pacing.hardDaySequenceCount} />;
  }

  if (nextStep.nextScreen === "support_check") {
    return <SupportCheckScreen hardDaySequenceCount={nextStep.pacing.hardDaySequenceCount} />;
  }

  if (nextStep.nextScreen === "checkin_questions") {
    return (
      <CheckInQuestionsScreen
        dailySessionId={dailySessionId}
        isSubmitting={isSubmitting}
        questions={nextStep.questions}
        setError={setError}
        setIsSubmitting={setIsSubmitting}
        routeFromBackendError={routeFromBackendError}
        updateFromResult={updateFromResult}
      />
    );
  }

  if (nextStep.nextScreen === "recommendation") {
    return <RecommendationScreen onRefresh={onDashboardRefresh} />;
  }

  return <CompletedScreen />;
}

function SessionShell({
  children,
  context = "daily",
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  context?: SessionContext;
  description: string;
  eyebrow: string;
  title: string;
}) {
  const closeHref = context === "entry" ? "/app/entry-safety" : "/app/home";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[760px] flex-col">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="sedona-eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-[38px] font-normal leading-[1.05] text-sedona-pineSoft min-[575px]:text-[52px]">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-sedona-stone">{description}</p>
        </div>
        <Button
          aria-label="Close check-in"
          asChild
          className="h-12 w-12 shrink-0 rounded-full bg-white p-0 text-sedona-stone shadow-card hover:bg-white"
          variant="outline"
        >
          <Link href={closeHref}>
            <X aria-hidden="true" size={22} strokeWidth={2} />
          </Link>
        </Button>
      </div>
      <div className="mt-8 flex-1">{children}</div>
    </div>
  );
}

function StartSessionScreen({ isSubmitting, onStart }: { isSubmitting: boolean; onStart: () => void }) {
  return (
    <SessionShell
      description="Every session begins by checking safety and pacing before any workbook guidance."
      eyebrow="Daily check-in"
      title="Before we begin, are you safe right now?"
    >
      <div className="flex min-h-[420px] flex-col justify-end gap-4">
        <div className="rounded-[28px] bg-white p-6 shadow-card min-[575px]:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#E0E8E1] text-sedona-sage">
            <Shield aria-hidden="true" size={28} strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 font-serif text-[32px] font-normal leading-tight text-sedona-pineSoft">
            A few grounding questions first.
          </h2>
          <p className="mt-3 text-base leading-7 text-sedona-stone">
            The app will slow the pace if today needs care before curriculum. That is part of the work.
          </p>
        </div>
        <Button className="min-h-14 rounded-[18px] text-base" disabled={isSubmitting} onClick={onStart} type="button">
          {isSubmitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          Begin check-in
        </Button>
      </div>
    </SessionShell>
  );
}

function SafetyQuestionsScreen({
  context,
  dailySessionId,
  isSubmitting,
  questions,
  setError,
  setIsSubmitting,
  routeFromBackendError,
  updateFromResult,
}: {
  context: SessionContext;
  dailySessionId: string | null;
  isSubmitting: boolean;
  questions: SafetyGateQuestion[];
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  routeFromBackendError: (error: unknown, fallback: string) => Promise<void>;
  updateFromResult: (result: DailySessionResponse) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Partial<Record<keyof SafetyAnswersPayload, DigitalSafetyAnswer>>>({});

  const resolvedQuestions = questions.length ? questions : safetyFallbackQuestions;
  const isComplete = resolvedQuestions.every((question) => {
    const field = safetyFieldMap[question.id];

    return field ? Boolean(answers[field]) : true;
  });

  const handleSubmit = async () => {
    if (!dailySessionId || !isComplete) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitSafetyAnswers(dailySessionId, {
        addictionSobriety: (answers.addictionSobriety as SafetyAnswersPayload["addictionSobriety"]) ?? "no",
        coercionControl: (answers.coercionControl as SafetyAnswersPayload["coercionControl"]) ?? "no",
        digitalSafety: (answers.digitalSafety as DigitalSafetyAnswer) ?? "yes",
        physicalSafety: (answers.physicalSafety as SafetyAnswersPayload["physicalSafety"]) ?? "no",
        suicidalSelfHarm: (answers.suicidalSelfHarm as SafetyAnswersPayload["suicidalSelfHarm"]) ?? "no",
      });
      await updateFromResult(result);
    } catch (submitError) {
      await routeFromBackendError(submitError, "We could not save the safety answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SessionShell
      context={context}
      description="We ask this every session. If there is danger, the workbook pauses and resources come first."
      eyebrow="Safety gate"
      title="Before we begin, are you safe right now?"
    >
      <div className="space-y-4">
        {resolvedQuestions.map((question, index) => {
          const field = safetyFieldMap[question.id];
          const currentValue = field ? answers[field] : undefined;
          const safeLabel = question.expectedSafeAnswer === "yes" ? "Yes" : "No";
          const riskLabel = question.expectedSafeAnswer === "yes" ? "No / concerns" : "Yes";
          const isDigitalSafetyQuestion = field === "digitalSafety";

          return (
            <section className="rounded-[24px] bg-white p-5 shadow-card" key={question.id}>
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4E2D6] text-sm font-semibold text-sedona-clay">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug text-sedona-pineSoft">{question.text}</h2>
                  <div
                    className={cn(
                      "mt-4 grid gap-3",
                      isDigitalSafetyQuestion ? "min-[480px]:grid-cols-3" : "min-[480px]:grid-cols-2",
                    )}
                  >
                    <AnswerButton
                      active={currentValue === question.expectedSafeAnswer}
                      label={safeLabel}
                      onClick={() => {
                        if (field) {
                          setAnswers((current) => ({ ...current, [field]: question.expectedSafeAnswer }));
                        }
                      }}
                    />
                    {isDigitalSafetyQuestion ? (
                      <>
                        <AnswerButton
                          active={currentValue === "no"}
                          label="No"
                          onClick={() => {
                            setAnswers((current) => ({ ...current, digitalSafety: "no" }));
                          }}
                          tone="warm"
                        />
                        <AnswerButton
                          active={currentValue === "concerns"}
                          label="Concerns"
                          onClick={() => {
                            setAnswers((current) => ({ ...current, digitalSafety: "concerns" }));
                          }}
                          tone="warm"
                        />
                      </>
                    ) : (
                      <AnswerButton
                        active={Boolean(currentValue && currentValue !== question.expectedSafeAnswer)}
                        label={riskLabel}
                        onClick={() => {
                          if (field) {
                            setAnswers((current) => ({
                              ...current,
                              [field]: question.expectedSafeAnswer === "yes" ? "no" : "yes",
                            }));
                          }
                        }}
                        tone="warm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
        <Button className="min-h-14 w-full rounded-[18px] text-base" disabled={!isComplete || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </SessionShell>
  );
}

function AnswerButton({
  active,
  label,
  onClick,
  tone = "safe",
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  tone?: "safe" | "warm";
}) {
  return (
    <button
      className={cn(
        "min-h-12 rounded-[16px] border px-4 text-sm font-semibold transition-colors",
        active
          ? tone === "safe"
            ? "border-[#B9D6C4] bg-[#E0E8E1] text-sedona-sage"
            : "border-[#E9C7B9] bg-[#FFF3EC] text-sedona-clay"
          : "border-sedona-creamLine bg-[#FBF7EF] text-sedona-stone hover:bg-white",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SafetyResourcesScreen({ context, resources }: { context: SessionContext; resources?: SafetyResource[] }) {
  const [fallbackResources, setFallbackResources] = useState<SafetyResource[]>([]);
  const visibleResources = resources?.length ? resources : fallbackResources.length ? fallbackResources : safetyFallbackResources;
  const sortedResources = visibleResources.slice().sort((a, b) => {
    if (a.category === "domestic_violence" && b.category !== "domestic_violence") {
      return -1;
    }

    if (b.category === "domestic_violence" && a.category !== "domestic_violence") {
      return 1;
    }

    return a.priority - b.priority;
  });

  useEffect(() => {
    if (resources?.length) {
      return;
    }

    let cancelled = false;

    void listSafetyResources()
      .then((result) => {
        if (!cancelled) {
          setFallbackResources(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFallbackResources(safetyFallbackResources);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resources]);

  return (
    <div className="relative mx-[calc(50%-50vw)] -my-10 flex min-h-dvh bg-sedona-pine px-5 py-10 text-[#F7F0E7] pwa:mx-0 pwa:my-0 pwa:min-h-full pwa:px-10 pwa:py-14 lg:px-16">
      <Link
        aria-label="Close safety resources"
        className="absolute right-5 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-[#D8D1C4] transition-colors hover:bg-white/18 hover:text-white pwa:right-10 pwa:top-10"
        href={context === "entry" ? "/app/entry-safety" : "/app/today"}
      >
        <X aria-hidden="true" size={22} strokeWidth={2} />
      </Link>

      <section className="mx-auto flex w-full max-w-[930px] flex-col justify-center py-8 pwa:max-w-[820px]">
        <div>
          <h1 className="font-serif text-[42px] font-normal leading-[1.05] text-[#F7F0E7] min-[575px]:text-[56px]">
            First, your safety.
          </h1>
          <p className="mt-6 max-w-[760px] text-base font-medium leading-7 text-[#D8D1C4]/78 min-[575px]:text-lg min-[575px]:leading-8">
            The tools in this app are not what you need in this moment. Please reach one of these directly.
            They&apos;re free, confidential, and there right now.
          </p>
        </div>

        <div className="mt-9 space-y-4">
          {sortedResources.map((resource) => (
              <div
                className="flex flex-col gap-4 rounded-[22px] border border-white/15 bg-white/[0.07] p-5 min-[575px]:flex-row min-[575px]:items-center min-[575px]:px-7"
                key={resource.id}
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold leading-tight text-[#F7F0E7] min-[575px]:text-xl">
                    {resource.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#D8D1C4]/70">{resource.description}</p>
                  {resource.textInstruction ? (
                    <p className="text-sm font-medium text-[#D8D1C4]/70">{resource.textInstruction}</p>
                  ) : null}
                </div>
                {resource.phone ? (
                  <a
                    className={cn(
                      "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-base font-extrabold text-[#2A1C12]",
                      resource.category === "emergency" ? "bg-[#D5633E] text-white" : "bg-[#E7B27E]",
                    )}
                    href={`tel:${resource.phone.replace(/\D/g, "")}`}
                  >
                    {resource.phone}
                  </a>
                ) : resource.url ? (
                  <a
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#E7B27E] px-6 text-sm font-bold text-[#2A1C12]"
                    href={resource.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open resource
                  </a>
                ) : null}
              </div>
            ))}
        </div>

        <p className="mt-9 font-serif text-xl italic leading-8 text-[#F7F0E7]/78">
          This work will be here when you&apos;re ready. It is not going anywhere.
        </p>

        <Button
          asChild
          className="mt-7 min-h-14 w-full rounded-[18px] border border-white/15 bg-white/10 text-base font-bold text-white hover:bg-white/15"
        >
          <Link href={context === "entry" ? "/app/entry-safety" : "/app/today"}>I&apos;m safe now - go back</Link>
        </Button>
      </section>
    </div>
  );
}

function DigitalSafetyAdvisoryScreen({
  dailySessionId,
  onContinue,
  resources,
  setError,
}: {
  dailySessionId: string | null;
  onContinue: () => Promise<void>;
  resources?: SafetyResource[];
  setError: (error: string | null) => void;
}) {
  const [isContinuing, setIsContinuing] = useState(false);

  const continueToPacing = async () => {
    if (!dailySessionId) {
      setError("Daily session is missing. Please restart today's check-in.");
      return;
    }

    setIsContinuing(true);
    setError(null);

    try {
      markDigitalAdvisoryAcknowledged(dailySessionId);
      await onContinue();
    } catch {
      setError("We could not continue after the digital safety advisory.");
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <SessionShell
      description="Digital safety is part of the container. You can continue after acknowledging this advisory."
      eyebrow="Digital safety"
      title="Use the safest device available."
    >
      <div className="rounded-[28px] border border-[#EAD9C8] bg-white p-6 shadow-card min-[575px]:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#E4E9F2] text-sedona-blue">
          <Shield aria-hidden="true" size={28} strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 font-serif text-[32px] font-normal leading-tight text-sedona-pineSoft">
          Pause before continuing.
        </h2>
        <p className="mt-3 text-base leading-7 text-sedona-stone">
          If a device, browser, or message history may be monitored, use a safer device. Only clear history if it is safe
          to do so.
        </p>
        {resources?.[0]?.url ? (
          <a
            className="mt-5 inline-flex text-sm font-semibold text-sedona-clay underline-offset-4 hover:underline"
            href={resources[0].url}
            rel="noreferrer"
            target="_blank"
          >
            Open digital safety resource
          </a>
        ) : null}
        <Button className="mt-7 min-h-14 w-full rounded-[18px] text-base" disabled={isContinuing} onClick={continueToPacing}>
          {isContinuing ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          I understand - continue
        </Button>
      </div>
    </SessionShell>
  );
}

function PacingQuestionScreen({
  dailySessionId,
  isSubmitting,
  question,
  setError,
  setIsSubmitting,
  routeFromBackendError,
  updateFromResult,
}: {
  dailySessionId: string | null;
  isSubmitting: boolean;
  question: Extract<CheckInNextStep, { nextScreen: "pacing_question" }>["question"];
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  routeFromBackendError: (error: unknown, fallback: string) => Promise<void>;
  updateFromResult: (result: DailySessionResponse) => Promise<void>;
}) {
  const submitPacing = async (answer: PacingAnswer) => {
    if (!dailySessionId) {
      setError("Daily session is missing. Please restart today's check-in.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitPacingAnswer(dailySessionId, answer);
      await updateFromResult(result);
    } catch (submitError) {
      await routeFromBackendError(submitError, "We could not save today's pacing answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SessionShell
      description="This decides whether today is a curriculum day or a regulation/support day."
      eyebrow="Pacing layer"
      title={question.text}
    >
      <div className="grid gap-4 min-[575px]:grid-cols-2">
        {question.options.map((option) => (
          <button
            className="rounded-[26px] border border-sedona-creamLine bg-white p-6 text-left shadow-card transition-transform hover:-translate-y-0.5 active:translate-y-0 min-[575px]:p-8"
            disabled={isSubmitting}
            key={option.value}
            onClick={() => submitPacing(option.value)}
            type="button"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[16px]",
                option.value === "good_steady" ? "bg-[#E0E8E1] text-sedona-sage" : "bg-[#F4E2D6] text-sedona-clay",
              )}
            >
              {option.value === "good_steady" ? (
                <Check aria-hidden="true" size={24} strokeWidth={2} />
              ) : (
                <HeartPulse aria-hidden="true" size={24} strokeWidth={1.8} />
              )}
            </div>
            <h2 className="mt-8 font-serif text-[30px] font-normal leading-tight text-sedona-pineSoft">
              {option.label}
            </h2>
            <p className="mt-3 text-sm leading-6 text-sedona-stone">
              {option.value === "good_steady"
                ? "Continue into the normal check-in and next workbook step."
                : "Hold the workbook position and use regulation or support today."}
            </p>
          </button>
        ))}
      </div>
    </SessionShell>
  );
}

function HoldPositionScreen({ hardDaySequenceCount }: { hardDaySequenceCount: number }) {
  return (
    <SessionShell
      description="Hard days pause curriculum. You can still count today as showing up."
      eyebrow="Hold position"
      title="Today is for regulation, not advancement."
    >
      <div className="rounded-[28px] bg-white p-6 shadow-card min-[575px]:p-8">
        <div className="grid gap-4 min-[575px]:grid-cols-3">
          <SupportActionCard
            description="A two-minute reset before any next step."
            icon={<RotateCcw aria-hidden="true" size={24} strokeWidth={1.8} />}
            title="Sacred Pause"
          />
          <SupportActionCard
            description="Breathe with care and slow the body."
            icon={<HeartPulse aria-hidden="true" size={24} strokeWidth={1.8} />}
            title="Heart Coherence"
          />
          <SupportActionCard
            description="Talk without opening curriculum."
            icon={<MessageCircle aria-hidden="true" size={24} strokeWidth={1.8} />}
            title="Just Talk"
          />
        </div>
        <div className="mt-6 rounded-[20px] bg-[#F7F0E7] p-5">
          <p className="text-sm font-semibold text-sedona-pineSoft">Hard-day sequence: {hardDaySequenceCount}</p>
          <p className="mt-2 text-sm leading-6 text-sedona-stone">
            This activity can count toward daily activity/streak, but workbook chapter progress remains paused.
          </p>
        </div>
        <Button asChild className="mt-6 min-h-14 w-full rounded-[18px] text-base">
          <Link href="/app/home">Close today&apos;s session</Link>
        </Button>
      </div>
    </SessionShell>
  );
}

function SupportCheckScreen({ hardDaySequenceCount }: { hardDaySequenceCount: number }) {
  return (
    <SessionShell
      description="Repeated hard days can mean workbook alone is not enough right now."
      eyebrow="Support check"
      title="Bring support into the room."
    >
      <div className="rounded-[28px] border border-[#E9C7B9] bg-[#FFF8F3] p-6 shadow-card min-[575px]:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#F4E2D6] text-sedona-clay">
          <AlertTriangle aria-hidden="true" size={28} strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 font-serif text-[32px] font-normal leading-tight text-sedona-pineSoft">
          This is hard day {hardDaySequenceCount}.
        </h2>
        <p className="mt-3 text-base leading-7 text-sedona-stone">
          The app should help you verify support is engaged before continuing. For now, use your support plan or
          professional resources and keep curriculum paused.
        </p>
        <div className="mt-6 grid gap-3 min-[575px]:grid-cols-2">
          <Button asChild className="min-h-14 rounded-[18px] text-base">
            <Link href="/app/guide">Just Talk</Link>
          </Button>
          <Button asChild className="min-h-14 rounded-[18px] text-base" variant="outline">
            <Link href="/app/home">Return home</Link>
          </Button>
        </div>
      </div>
    </SessionShell>
  );
}

function SupportActionCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <article className="rounded-[22px] border border-sedona-creamLine bg-[#FBF7EF] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#F4E2D6] text-sedona-clay">
        {icon}
      </div>
      <h2 className="mt-6 text-lg font-semibold leading-tight text-sedona-pineSoft">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-sedona-stone">{description}</p>
    </article>
  );
}

function CheckInQuestionsScreen({
  dailySessionId,
  isSubmitting,
  questions,
  setError,
  setIsSubmitting,
  routeFromBackendError,
  updateFromResult,
}: {
  dailySessionId: string | null;
  isSubmitting: boolean;
  questions: CheckInQuestion[];
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  routeFromBackendError: (error: unknown, fallback: string) => Promise<void>;
  updateFromResult: (result: DailySessionResponse) => Promise<void>;
}) {
  const resolvedQuestions = questions.length ? questions : defaultCheckInQuestions;
  const [answers, setAnswers] = useState<CheckInAnswersPayload>({
    anxietyLevel: 5,
    bodyState: "activated",
    conflictToday: "no",
    moodToday: "steady",
    needToday: "grounding",
    privateNote: "",
  });

  const handleSubmit = async () => {
    if (!dailySessionId) {
      setError("Daily session is missing. Please restart today's check-in.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitCheckInAnswers(dailySessionId, {
        ...answers,
        privateNote: answers.privateNote?.trim() || undefined,
      });
      await updateFromResult(result);
    } catch (submitError) {
      await routeFromBackendError(submitError, "We could not save today's check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SessionShell
      description="These answers become today's private check-in snapshot."
      eyebrow="Daily check-in"
      title="Where are you today, honestly?"
    >
      <div className="space-y-4">
        {resolvedQuestions.map((question) => (
          <CheckInQuestionField answers={answers} key={question.id} question={question} setAnswers={setAnswers} />
        ))}
        <Button className="min-h-14 w-full rounded-[18px] text-base" disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          Save check-in
        </Button>
      </div>
    </SessionShell>
  );
}

function CheckInQuestionField({
  answers,
  question,
  setAnswers,
}: {
  answers: CheckInAnswersPayload;
  question: CheckInQuestion;
  setAnswers: React.Dispatch<React.SetStateAction<CheckInAnswersPayload>>;
}) {
  if (question.type === "scale") {
    return (
      <section className="rounded-[24px] bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold leading-snug text-sedona-pineSoft">{question.text}</h2>
          <span className="text-lg font-semibold text-sedona-clay">{answers.anxietyLevel}/10</span>
        </div>
        <input
          aria-label={question.text}
          className="mt-5 h-3 w-full cursor-pointer accent-sedona-clay"
          max={question.max}
          min={question.min}
          onChange={(event) => {
            setAnswers((current) => ({
              ...current,
              anxietyLevel: Number(event.target.value),
            }));
          }}
          type="range"
          value={answers.anxietyLevel}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-sedona-taupe">
          <span>Calm</span>
          <span>Constant</span>
        </div>
      </section>
    );
  }

  if (question.type === "text") {
    return (
      <section className="rounded-[24px] bg-white p-5 shadow-card">
        <label className="text-base font-semibold leading-snug text-sedona-pineSoft" htmlFor="private-note">
          {question.text}
        </label>
        <textarea
          className="mt-4 min-h-28 w-full resize-none rounded-[18px] border border-sedona-creamLine bg-[#FBF7EF] px-4 py-3 text-sm leading-6 text-sedona-pineSoft outline-none transition-colors placeholder:text-sedona-taupe focus:border-sedona-clay"
          id="private-note"
          maxLength={2000}
          onChange={(event) => {
            setAnswers((current) => ({
              ...current,
              privateNote: event.target.value,
            }));
          }}
          placeholder="One honest sentence is enough."
          value={answers.privateNote}
        />
      </section>
    );
  }

  const selectedValue =
    question.id === "mood_today"
      ? answers.moodToday
      : question.id === "conflict_today"
        ? answers.conflictToday
        : question.id === "body_state"
          ? answers.bodyState
          : answers.needToday;

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold leading-snug text-sedona-pineSoft">{question.text}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
              selectedValue === option
                ? "border-[#B9D6C4] bg-[#E0E8E1] text-sedona-sage"
                : "border-sedona-creamLine bg-[#FBF7EF] text-sedona-stone hover:bg-white",
            )}
            key={option}
            onClick={() => {
              setAnswers((current) => {
                if (question.id === "mood_today") {
                  return { ...current, moodToday: option as CheckInAnswersPayload["moodToday"] };
                }

                if (question.id === "conflict_today") {
                  return { ...current, conflictToday: option as CheckInAnswersPayload["conflictToday"] };
                }

                if (question.id === "body_state") {
                  return { ...current, bodyState: option as CheckInAnswersPayload["bodyState"] };
                }

                return { ...current, needToday: option as CheckInAnswersPayload["needToday"] };
              });
            }}
            type="button"
          >
            {formatOptionLabel(option)}
          </button>
        ))}
      </div>
    </section>
  );
}

function RecommendationScreen({ onRefresh }: { onRefresh: () => Promise<void> }) {
  return (
    <SessionShell
      description="Today's check-in is saved. The next recommendation will come from the guided workflow layer."
      eyebrow="Session saved"
      title="You showed up today."
    >
      <div className="rounded-[28px] bg-white p-6 shadow-card min-[575px]:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#E0E8E1] text-sedona-sage">
          <Sparkles aria-hidden="true" size={28} strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 font-serif text-[32px] font-normal leading-tight text-sedona-pineSoft">
          Your next step is ready to be generated.
        </h2>
        <p className="mt-3 text-base leading-7 text-sedona-stone">
          For this slice, the app saves the daily check-in and returns you to the dashboard. Workbook chapter routing will
          connect when the workflow JSON/API is ready.
        </p>
        <div className="mt-7 grid gap-3 min-[575px]:grid-cols-2">
          <Button asChild className="min-h-14 rounded-[18px] text-base">
            <Link href="/app/home">
              Return home
              <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
          </Button>
          <Button className="min-h-14 rounded-[18px] text-base" onClick={() => void onRefresh()} type="button" variant="outline">
            Refresh session
          </Button>
        </div>
      </div>
    </SessionShell>
  );
}

function CompletedScreen() {
  return (
    <SessionShell
      description="Today's guided check-in is complete."
      eyebrow="Complete"
      title="You are done for today."
    >
      <div className="rounded-[28px] bg-white p-6 text-center shadow-card min-[575px]:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E0E8E1] text-sedona-sage">
          <Check aria-hidden="true" size={28} strokeWidth={2} />
        </div>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-sedona-stone">
          The dashboard will keep your place and bring you back through safety and pacing next time.
        </p>
        <Button asChild className="mt-7 min-h-14 rounded-[18px] px-8 text-base">
          <Link href="/app/home">Back to home</Link>
        </Button>
      </div>
    </SessionShell>
  );
}
