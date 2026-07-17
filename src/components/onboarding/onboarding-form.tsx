"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { onboardingCompleteCookieName, userAppRoot } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";

type OnboardingStep = 0 | 1 | 2 | 3;

interface IntroSlide {
  eyebrow: string;
  title: string;
  description: string;
  accent: "clay" | "blue" | "sage";
  buttonLabel: string;
}

interface AssessmentItem {
  id: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  defaultValue: number;
}

const introSlides: IntroSlide[] = [
  {
    accent: "clay",
    buttonLabel: "Continue",
    description:
      "The workbook you're about to walk moves in three phases — Stabilize, Heal, Elevate. You're starting with Phase 1: calming the storm before anything gets rebuilt. A few minutes a day is enough.",
    eyebrow: "Welcome",
    title: "This is a repair path, not a self-help feed.",
  },
  {
    accent: "blue",
    buttonLabel: "Continue",
    description:
      "Check-ins, honest sentences, anger releases — all of it stays private to you. If you link a partner later, only the things you explicitly choose to share are shared. Nothing leaks.",
    eyebrow: "Private by design",
    title: "Your journal is yours. Full stop.",
  },
  {
    accent: "sage",
    buttonLabel: "Begin your entry assessment",
    description:
      "You can invite your significant other whenever you're ready — or walk the Solo Partner Pathway. You are half the dynamic, and the half you control.",
    eyebrow: "Together or alone",
    title: "It works even if your partner never joins.",
  },
];

const assessmentItems: AssessmentItem[] = [
  {
    defaultValue: 5,
    highLabel: "Constant",
    id: "relationship_anxiety",
    label: "Anxiety when I think about us",
    lowLabel: "Calm",
  },
  {
    defaultValue: 4,
    highLabel: "Every night",
    id: "sleep_quality",
    label: "Sleeping through the night",
    lowLabel: "Rarely",
  },
  {
    defaultValue: 4,
    highLabel: "Fully",
    id: "daily_focus",
    label: "Able to focus on daily tasks",
    lowLabel: "Barely",
  },
  {
    defaultValue: 5,
    highLabel: "Strong",
    id: "hope",
    label: "Hope that this can change",
    lowLabel: "None",
  },
  {
    defaultValue: 3,
    highLabel: "Usually",
    id: "pause_before_reacting",
    label: "I can pause before reacting",
    lowLabel: "Never",
  },
];

const accentStyles = {
  blue: {
    dot: "bg-sedona-blue",
    icon: "bg-[#DFE7F2] text-sedona-blue",
    eyebrow: "text-sedona-blue",
  },
  clay: {
    dot: "bg-sedona-clay",
    icon: "bg-[#F3E1D6] text-sedona-clay",
    eyebrow: "text-sedona-clay",
  },
  sage: {
    dot: "bg-sedona-sage",
    icon: "bg-[#E0EBE5] text-sedona-sage",
    eyebrow: "text-sedona-sage",
  },
} as const;

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(assessmentItems.map((item) => [item.id, item.defaultValue])),
  );
  const [isSaving, setIsSaving] = useState(false);

  const isAssessmentStep = step === 3;

  function handleSkip() {
    setStep(3);
  }

  function handleContinue() {
    if (step < 2) {
      setStep((current) => (current + 1) as OnboardingStep);
      return;
    }

    setStep(3);
  }

  function updateAssessmentValue(itemId: string, value: number) {
    setValues((current) => ({ ...current, [itemId]: value }));
  }

  async function handleSaveBaseline() {
    setIsSaving(true);
    window.localStorage.setItem("sedona_entry_assessment", JSON.stringify(values));

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to save onboarding completion.");
      }

      markOnboardingComplete();
      router.push(userAppRoot);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-sedona-sand text-sedona-pineSoft">
      {isAssessmentStep ? (
        <AssessmentScreen
          isSaving={isSaving}
          onSave={handleSaveBaseline}
          onValueChange={updateAssessmentValue}
          values={values}
        />
      ) : (
        <IntroScreen currentStep={step} onContinue={handleContinue} onSkip={handleSkip} />
      )}
    </div>
  );
}

function IntroScreen({
  currentStep,
  onContinue,
  onSkip,
}: {
  currentStep: 0 | 1 | 2;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const slide = introSlides[currentStep];
  const accent = accentStyles[slide.accent];

  return (
    <section className="flex min-h-dvh flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-10 sm:px-10 sm:pb-14 sm:pt-16">
      <header className="mx-auto grid w-full max-w-[710px] items-center">
        <span aria-hidden="true" />
        <StepDots activeStep={currentStep} total={3} />
        <button
          className="justify-self-end text-sm font-bold text-sedona-taupe transition-colors hover:text-sedona-pineSoft sm:text-base"
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-[720px]">
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-[20px]", accent.icon)}>
            <span className={cn("h-7 w-7 rounded-full", accent.dot)} />
          </div>
          <p className={cn("mt-8 text-[12px] font-bold uppercase tracking-[0.28em]", accent.eyebrow)}>
            {slide.eyebrow}
          </p>
          <h1 className="mt-4 max-w-[680px] font-serif text-[42px] leading-[1.08] tracking-normal text-sedona-pineSoft sm:text-[56px] md:text-[60px]">
            {slide.title}
          </h1>
          <p className="mt-8 max-w-[680px] text-[17px] font-medium leading-8 text-sedona-stone sm:text-xl sm:leading-9">
            {slide.description}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[720px]">
        <Button
          className="h-16 w-full rounded-[18px] bg-sedona-pine text-lg font-bold text-white shadow-[0_18px_34px_-24px_rgba(18,54,44,.8)] hover:bg-sedona-pineSoft"
          onClick={onContinue}
          type="button"
        >
          {slide.buttonLabel}
        </Button>
      </div>
    </section>
  );
}

function AssessmentScreen({
  isSaving,
  onSave,
  onValueChange,
  values,
}: {
  isSaving: boolean;
  onSave: () => void;
  onValueChange: (itemId: string, value: number) => void;
  values: Record<string, number>;
}) {
  return (
    <section className="min-h-dvh px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[690px] flex-col">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-sedona-taupe">Your starting point</p>
          <h1 className="mt-2 font-serif text-[38px] leading-[1.05] text-sedona-pineSoft sm:text-[48px]">
            Where are you today, honestly?
          </h1>
          <p className="mt-5 max-w-[650px] text-base font-medium leading-7 text-sedona-stone sm:text-lg">
            This is your baseline — not a grade. In a few weeks you&apos;ll look back at these numbers, and the contrast
            will be the proof.
          </p>
        </div>

        <div className="mt-7 space-y-4 sm:mt-8">
          {assessmentItems.map((item) => (
            <AssessmentScale
              item={item}
              key={item.id}
              onChange={(value) => onValueChange(item.id, value)}
              value={values[item.id] ?? item.defaultValue}
            />
          ))}
        </div>

        <Button
          className="mt-6 h-16 w-full rounded-[18px] bg-sedona-clay text-lg font-bold text-white shadow-[0_18px_34px_-24px_rgba(176,79,36,.9)] hover:bg-sedona-clayDark"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving ? (
            <>
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save my baseline & enter Phase 1"
          )}
        </Button>
        <p className="mt-5 text-center text-sm font-semibold text-sedona-taupe">Only you see these numbers.</p>
      </div>
    </section>
  );
}

function AssessmentScale({
  item,
  onChange,
  value,
}: {
  item: AssessmentItem;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <fieldset className="rounded-[28px] bg-white px-5 py-5 shadow-[0_18px_40px_-36px_rgba(48,30,16,.8)] sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <legend className="text-base font-extrabold leading-6 text-sedona-pineSoft">{item.label}</legend>
        <p className="shrink-0 text-base font-bold text-sedona-clay">
          {value}
          <span className="ml-1 text-sm font-semibold text-sedona-taupe">/ 10</span>
        </p>
      </div>

      <div className="mt-5 ml-auto w-full max-w-[610px]">
        <div className="grid h-[40px] grid-cols-10 items-end gap-1.5 sm:gap-2" role="radiogroup" aria-label={item.label}>
          {Array.from({ length: 10 }, (_, index) => {
            const optionValue = index + 1;
            const selected = optionValue <= value;
            const blockHeight = 18 + index * 2;

            return (
              <button
                aria-checked={value === optionValue}
                aria-label={`${item.label}: ${optionValue} out of 10`}
                className={cn(
                  "rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sedona-clay focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  selected ? "bg-sedona-clay" : "bg-[#E9DFD0]",
                )}
                key={optionValue}
                onClick={() => onChange(optionValue)}
                role="radio"
                style={{ height: `${blockHeight}px` }}
                type="button"
              />
            );
          })}
        </div>

        <div className="mt-2 flex justify-between text-xs font-semibold text-sedona-taupe">
          <span>{item.lowLabel}</span>
          <span>{item.highLabel}</span>
        </div>
      </div>
    </fieldset>
  );
}

function StepDots({ activeStep, total }: { activeStep: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Onboarding step ${activeStep + 1} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={cn(
            "h-3 rounded-full transition-all",
            index === activeStep ? "w-10 bg-sedona-clay" : "w-3 bg-[#DED4C4]",
          )}
          key={index}
        />
      ))}
    </div>
  );
}

function markOnboardingComplete() {
  const maxAge = 60 * 60 * 24 * 365;

  document.cookie = `${onboardingCompleteCookieName}=true; path=/; max-age=${maxAge}; samesite=lax`;
  window.localStorage.setItem(onboardingCompleteCookieName, "true");
}

export function OnboardingCompletionLinks() {
  return (
    <div className="hidden">
      <Link href={userAppRoot}>Dashboard</Link>
      <Link href="/app/today">Safety resources</Link>
    </div>
  );
}
