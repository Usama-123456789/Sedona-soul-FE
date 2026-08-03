"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, Loader2, RotateCcw, Shield } from "lucide-react";

import { DashboardCheckInCard } from "@/components/check-in/dashboard-check-in-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { AudiobookResumeCard } from "@/components/user/audiobook-resume-card";
import { getDashboardContext } from "@/lib/api/check-ins";
import type { DashboardContext } from "@/types/check-in";

const tools = [
  { title: "Sacred Pause", subtitle: "2-min reset", accent: "#B04F24", tint: "#F4E2D6" },
  { title: "Heart Coherence", subtitle: "Breathe with care", accent: "#465980", tint: "#E4E9F2" },
  { title: "Anger Release", subtitle: "Move the heat", accent: "#B04F24", tint: "#F4E2D6" },
];

const formatPhaseLabel = (phase: string | null | undefined) => {
  if (!phase) {
    return "Stabilize";
  }

  return phase.charAt(0).toUpperCase() + phase.slice(1);
};

const formatModuleLabel = (module: string | null | undefined) => {
  if (!module) {
    return "Chapter C - Regulate";
  }

  return module;
};

const formatPartnerStatus = (dashboard: DashboardContext | null) => {
  const partnerStatus = dashboard?.partnerStatus;

  if (!partnerStatus) {
    return {
      href: "/app/partner",
      label: "Invite or choose solo path",
      sublabel: "You can walk this together or alone",
      initials: "P",
    };
  }

  const status = partnerStatus.status;

  if (status === "linked") {
    const partnerName = partnerStatus.partner?.displayName ?? "your partner";

    return {
      href: "/app/partner",
      label: `You & ${partnerName}`,
      sublabel: "Linked - both walking Phase 1",
      initials: partnerStatus.partner?.initials ?? "P",
    };
  }

  if (status === "invited") {
    return {
      href: "/app/partner",
      label: "Partner invite pending",
      sublabel: partnerStatus.invite?.code ? `Code ${partnerStatus.invite.code}` : "Waiting for your partner",
      initials: "P",
    };
  }

  if (status === "solo") {
    return {
      href: "/app/partner",
      label: "Solo path",
      sublabel: "Private by design - still real work",
      initials: "S",
    };
  }

  return {
    href: "/app/partner",
    label: "Invite or choose solo path",
    sublabel: "You can walk this together or alone",
    initials: "P",
  };
};

const getGreetingTitle = (dashboard: DashboardContext | null) => {
  const preferredName = dashboard?.profile.preferredName?.trim();

  return preferredName ? `Good morning, ${preferredName}.` : "Good morning.";
};

const getSessionDayLabel = (dashboard: DashboardContext | null) => {
  const daysInPhase = dashboard?.stats.daysInPhase;

  if (daysInPhase && daysInPhase > 0) {
    return `Day ${daysInPhase}`;
  }

  return "Today";
};

const getStatCards = (dashboard: DashboardContext | null) => {
  const latestSession = dashboard?.dailySession.latestSession;
  const latestAnxietyLevel = dashboard?.stats.latestAnxietyLevel;
  const hardDaySequenceCount = dashboard?.stats.hardDaySequenceCount ?? 0;

  return [
    {
      label: "day regulation streak",
      tone: "text-[#B04F24]",
      value: dashboard?.stats.regulationStreak == null ? "0" : String(dashboard.stats.regulationStreak),
    },
    {
      label: "latest anxiety level",
      tone: "text-[#3E7A5E]",
      value: latestAnxietyLevel == null ? "-" : `${latestAnxietyLevel}/10`,
    },
    {
      label: latestSession?.pacing.answer === "hard_day" ? "hard-day sequence" : "days in Phase 1",
      tone: "text-[#465980]",
      value: latestSession?.pacing.answer === "hard_day" ? String(hardDaySequenceCount) : String(dashboard?.stats.daysInPhase ?? 0),
    },
  ];
};

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-4 min-[575px]:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
      <div className="min-h-[240px] rounded-[26px] bg-white/60 p-6 shadow-card">
        <Loader2 aria-hidden="true" className="h-7 w-7 animate-spin text-sedona-clay" />
        <p className="mt-5 text-sm font-semibold text-sedona-pineSoft">Loading dashboard</p>
        <p className="mt-2 text-sm leading-6 text-sedona-stone">Fetching your daily session, pacing, safety, and progress context.</p>
      </div>
      <div className="min-h-[240px] rounded-[26px] bg-sedona-pine/90 p-6 shadow-card" />
      <div className="grid grid-cols-3 gap-3 min-[575px]:col-span-2">
        {[0, 1, 2].map((item) => (
          <div className="h-[98px] rounded-[20px] bg-white/70 shadow-card" key={item} />
        ))}
      </div>
    </div>
  );
}

export function HomeDashboard() {
  const [dashboard, setDashboard] = useState<DashboardContext | null>(null);
  const [dateLabel, setDateLabel] = useState("Today");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getDashboardContext();
      setDashboard(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We could not load the dashboard.");
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setDateLabel(
      new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        weekday: "long",
      }).format(new Date()),
    );
    void loadDashboard();
  }, []);

  const statCards = useMemo(() => getStatCards(dashboard), [dashboard]);
  const partnerState = useMemo(() => formatPartnerStatus(dashboard), [dashboard]);
  const phaseLabel = formatPhaseLabel(dashboard?.journey.currentPhase);
  const moduleLabel = formatModuleLabel(dashboard?.journey.currentModule);
  const phaseProgress = dashboard?.journey.phaseProgress.stabilize ?? 0;

  return (
    <>
      <header className="flex flex-col gap-5">
        <div className="min-w-0">
          <p className="sedona-eyebrow">
            {dateLabel} - {getSessionDayLabel(dashboard)}
          </p>
          <h1 className="mt-2 text-wrap font-serif text-[36px] font-normal leading-[1.08] text-sedona-pineSoft min-[390px]:text-[38px] pwa:text-[42px]">
            {getGreetingTitle(dashboard)}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-sedona-stone">
            However you&apos;re arriving today, there&apos;s nothing to fix first.
          </p>
        </div>
      </header>

      {error ? (
        <ErrorState
          className="mt-6 bg-white/92"
          description={error}
          onRetry={loadDashboard}
          retryLabel="Reload dashboard"
          title="Dashboard unavailable"
        />
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : !error ? (
        <div className="mt-6 grid gap-4 min-[575px]:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
          <DashboardCheckInCard dashboard={dashboard} isLoading={false} />

          <section className="flex min-h-[230px] flex-col justify-between rounded-[26px] bg-[#12362C] p-6 text-[#F1EDE2] shadow-[0_16px_34px_-20px_rgba(18,54,44,0.6)] min-[575px]:min-h-[240px] lg:min-h-[270px]">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E7E4D8]/60">Your journey</p>
                <p className="text-xs font-semibold text-[#E7B27E]">Phase 1 of 3</p>
              </div>
              <h2 className="mt-3 font-serif text-[28px] font-normal leading-none">{phaseLabel}</h2>
              <p className="mt-3 text-sm leading-6 text-[#E7E4D8]/65">
                {moduleLabel} - building your nervous-system foundation.
              </p>
            </div>
            <div>
              <div className="mb-4 mt-6 flex gap-2">
                <span className="h-1.5 rounded-full bg-[#E7B27E]" style={{ flexGrow: Math.max(phaseProgress, 10) }} />
                <span className="h-1.5 flex-1 rounded-full bg-[#E7E4D8]/20" />
                <span className="h-1.5 flex-1 rounded-full bg-[#E7E4D8]/20" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#F1EDE2]">Stabilize</span>
                <span className="text-[#E7E4D8]/45">Heal</span>
                <span className="text-[#E7E4D8]/45">Elevate</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3 min-[575px]:col-span-2">
            {statCards.map((stat) => (
              <div
                className="rounded-[20px] bg-white p-4 shadow-[0_10px_22px_-18px_rgba(48,30,16,0.2)]"
                key={stat.label}
              >
                <p className={`font-serif text-[34px] leading-none ${stat.tone}`}>{stat.value}</p>
                <p className="mt-2 text-[12.5px] font-medium leading-[1.3] text-[#8A8070]">{stat.label}</p>
              </div>
            ))}
          </section>

          {dashboard?.latestRecommendation ? (
            <section className="rounded-[22px] border border-[#EAD9C8] bg-[#FFF8F3] p-5 shadow-card min-[575px]:col-span-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F4E2D6] text-sedona-clay">
                  <RotateCcw aria-hidden="true" size={21} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sedona-clay">
                    Recommended next
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-normal leading-tight text-sedona-pineSoft">
                    {dashboard.latestRecommendation.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sedona-stone">{dashboard.latestRecommendation.reason}</p>
                </div>
                <Button asChild className="hidden rounded-full px-5 min-[575px]:inline-flex" variant="outline">
                  <Link href="/app/today">Open</Link>
                </Button>
              </div>
            </section>
          ) : null}

          <section className="min-[575px]:col-span-2">
            <div className="flex items-center justify-between gap-4 px-1 pb-3 pt-1">
              <h2 className="font-serif text-[24px] font-normal text-[#16352B]">In-the-moment tools</h2>
              <p className="hidden text-sm font-medium text-[#B04F24] sm:block">When you need to land now</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 min-[575px]:grid min-[575px]:grid-cols-3 min-[575px]:overflow-visible">
              {tools.map((tool) => (
                <article
                  className="min-w-[168px] rounded-[20px] border-t-[3px] bg-white p-5 shadow-[0_10px_22px_-18px_rgba(48,30,16,0.22)]"
                  key={tool.title}
                  style={{ borderTopColor: tool.accent }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: tool.tint }}
                  >
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: tool.accent }} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold leading-tight text-[#16352B]">{tool.title}</h3>
                  <p className="mt-2 text-sm text-[#9A8F7C]">{tool.subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <AudiobookResumeCard initialResume={dashboard?.audiobook ?? null} />

          <Link
            className="flex items-center gap-4 rounded-[22px] border border-[#E2E6EE] bg-[#EEF0F4] px-5 py-4 min-[575px]:col-span-2"
            href={partnerState.href}
          >
            <div className="flex shrink-0 items-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#465980] text-sm font-semibold text-white">
                M
              </span>
              <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#EEF0F4] bg-[#B04F24] text-sm font-semibold text-white">
                {partnerState.initials.slice(0, 1)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#2C3A52]">{partnerState.label}</p>
              <p className="mt-1 truncate text-sm text-[#6E7890]">{partnerState.sublabel}</p>
            </div>
            <ArrowRight aria-hidden="true" className="text-[#465980]" size={18} strokeWidth={2} />
          </Link>

          <section className="rounded-[22px] bg-white p-5 shadow-[0_10px_22px_-18px_rgba(48,30,16,0.22)] min-[575px]:col-span-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#E0E8E1] text-[#3E7A5E]">
                {dashboard?.safety.latestEvent ? (
                  <AlertTriangle aria-hidden="true" size={22} strokeWidth={1.8} />
                ) : (
                  <Shield aria-hidden="true" size={22} strokeWidth={1.8} />
                )}
              </div>
              <div>
                <p className="font-serif text-2xl font-normal text-[#16352B]">
                  {dashboard?.safety.latestEvent ? "Safety support was offered" : "Safety comes first"}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7C7363]">
                  {dashboard?.safety.latestEvent
                    ? "The dashboard keeps the latest safety event visible so the next session can begin gently."
                    : "Every daily check-in starts with a safety gate before workbook guidance, chat, or practices continue."}
                </p>
              </div>
              <div className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0E8E1] text-[#3E7A5E] min-[575px]:flex">
                <Check aria-hidden="true" size={18} strokeWidth={2} />
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
