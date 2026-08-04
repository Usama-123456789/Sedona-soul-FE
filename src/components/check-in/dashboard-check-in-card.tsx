"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { getDashboardContext } from "@/lib/api/check-ins";
import type { DashboardContext } from "@/types/check-in";

type CardState = {
  cta: string;
  eyebrow: string;
  title: string;
};

export function DashboardCheckInCard({
  dashboard: initialDashboard,
  isLoading: initialLoading,
}: {
  dashboard?: DashboardContext | null;
  isLoading?: boolean;
}) {
  const [dashboard, setDashboard] = useState<DashboardContext | null>(initialDashboard ?? null);
  const [isLoading, setIsLoading] = useState(initialLoading ?? !initialDashboard);

  useEffect(() => {
    if (initialDashboard !== undefined || initialLoading !== undefined) {
      setDashboard(initialDashboard ?? null);
      setIsLoading(Boolean(initialLoading));
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const result = await getDashboardContext();

        if (!cancelled) {
          setDashboard(result);
        }
      } catch {
        if (!cancelled) {
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [initialDashboard, initialLoading]);

  const cardState = useMemo<CardState>(() => {
    const todaySession = dashboard?.dailySession.todaySession;

    if (isLoading) {
      return {
        cta: "Checking status",
        eyebrow: "Daily check-in",
        title: "How are you arriving today?",
      };
    }

    if (!todaySession) {
      return {
        cta: "Begin check-in",
        eyebrow: "Daily check-in",
        title: "How are you arriving today?",
      };
    }

    if (todaySession.status === "safety_exited") {
      return {
        cta: "Review safety resources",
        eyebrow: "Safety first",
        title: "Safety resources are open.",
      };
    }

    if (todaySession.pacing.answer === "hard_day") {
      return {
        cta: "Open support tools",
        eyebrow: "Hold position",
        title: "Today is for regulation.",
      };
    }

    if (todaySession.status === "completed") {
      return {
        cta: "View today's check-in",
        eyebrow: "Today's session saved",
        title: "You already checked in today.",
      };
    }

    return {
      cta: "Resume check-in",
      eyebrow: "Daily check-in",
      title: "Continue where you left off.",
    };
  }, [dashboard, isLoading]);

  return (
    <Link
      className="relative min-h-[210px] overflow-hidden rounded-[26px] bg-[#6F8275] shadow-[0_18px_36px_-18px_rgba(48,30,16,0.34)] transition-transform active:scale-[0.99] min-[575px]:min-h-[240px] lg:min-h-[270px]"
      href="/app/today"
    >
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#B8C0B6_0%,#87978B_44%,#50685E_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,54,44,0.12)_0%,rgba(18,54,44,0.72)_100%)]" />
      <div className="relative flex h-full flex-col justify-end p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">{cardState.eyebrow}</p>
        <h2 className="mt-2 max-w-[320px] font-serif text-[30px] font-normal leading-[1.16] text-[#FBF7EF]">
          {cardState.title}
        </h2>
        <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#F4EFE6] px-5 py-3 text-sm font-semibold text-[#9A4220]">
          {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          {cardState.cta}
          {!isLoading ? <ArrowRight aria-hidden="true" size={17} strokeWidth={2} /> : null}
        </div>
      </div>
    </Link>
  );
}
