import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTile = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "pine" | "clay" | "blue" | "sage";
};

type PhaseSummary = {
  label: string;
  count: number;
  color: string;
};

type AssessmentTrend = {
  label: string;
  baseline: number;
  latest: number;
  direction: "up" | "down";
};

type ContentStatus = {
  label: string;
  value: string;
  status: string;
  icon: LucideIcon;
};

const metricTiles: MetricTile[] = [
  {
    label: "Total users",
    value: "184",
    helper: "+18 this week",
    icon: Users,
    tone: "pine",
  },
  {
    label: "Active users",
    value: "72",
    helper: "39% weekly activity",
    icon: TrendingUp,
    tone: "sage",
  },
  {
    label: "Baseline complete",
    value: "126",
    helper: "68% of accounts",
    icon: CheckCircle2,
    tone: "blue",
  },
  {
    label: "Safety flags",
    value: "7",
    helper: "2 pending review",
    icon: ShieldCheck,
    tone: "clay",
  },
];

const phaseSummary: PhaseSummary[] = [
  { label: "Phase 1 - Stabilize", count: 118, color: "bg-[#B85028]" },
  { label: "Phase 2 - Heal", count: 42, color: "bg-[#3E7A5E]" },
  { label: "Phase 3 - Elevate", count: 24, color: "bg-[#465980]" },
];

const assessmentTrends: AssessmentTrend[] = [
  { label: "Anxiety when I think about us", baseline: 7, latest: 4, direction: "down" },
  { label: "Sleeping through the night", baseline: 4, latest: 7, direction: "up" },
  { label: "Able to focus on daily tasks", baseline: 3, latest: 6, direction: "up" },
  { label: "Hope that this can change", baseline: 3, latest: 6, direction: "up" },
  { label: "I can pause before reacting", baseline: 2, latest: 7, direction: "up" },
];

const contentStatus: ContentStatus[] = [
  { label: "Workbook files", value: "3", status: "Phase docs ready", icon: FileText },
  { label: "Videos", value: "12", status: "Simple links/uploads", icon: BarChart3 },
  { label: "Audiobook", value: "8", status: "Draft chapters", icon: Headphones },
  { label: "Knowledge base", value: "Synced", status: "Theo RAG active", icon: Bot },
];

const recentActivity = [
  { event: "18 new users started onboarding", time: "Today" },
  { event: "43 daily check-ins completed", time: "Today" },
  { event: "7 users viewed safety resources", time: "Yesterday" },
  { event: "Phase 1 workbook content updated", time: "Yesterday" },
];

const actionItems = [
  "Confirm final 39-question HVRA scoring rules",
  "Upload remaining audiobook chapter files",
  "Review safety resource copy before publish",
];

const toneClasses: Record<MetricTile["tone"], string> = {
  blue: "bg-[#E8ECF5] text-[#465980]",
  clay: "bg-[#F7E5DA] text-[#B85028]",
  pine: "bg-[#E4ECE6] text-[#12362C]",
  sage: "bg-[#E4EFE8] text-[#3E7A5E]",
};

export default function AdminDashboardPage() {
  const totalPhaseUsers = phaseSummary.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="sedona-eyebrow">Admin overview</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Dashboard home</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            A quick operational view of users, journeys, assessments, content readiness, safety signals, and AI sync health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]"
            href="/admin/content"
          >
            Manage content
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#12362C] px-4 text-sm font-semibold text-[#F4EFE6] shadow-[0_14px_30px_-22px_rgba(18,54,44,0.8)] transition hover:bg-[#1B493B]"
            href="/admin/reports"
          >
            View reports
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1">
        {metricTiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <article className="min-w-[220px] flex-1 rounded-[18px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]" key={tile.label}>
              <div className="flex items-center justify-between gap-4">
                <span className={cn("flex size-11 items-center justify-center rounded-2xl", toneClasses[tile.tone])}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">Live</span>
              </div>
              <p className="mt-5 text-sm font-semibold text-[#7C7363]">{tile.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="font-serif text-4xl font-normal leading-none text-[#16352B]">{tile.value}</p>
                <p className="pb-1 text-right text-sm font-semibold text-[#A89A82]">{tile.helper}</p>
              </div>
            </article>
          );
        })}
      </div>


      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="sedona-eyebrow">Journey</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Progress by phase</h2>
              </div>
              <p className="rounded-full bg-[#F4EFE6] px-3 py-1 text-sm font-semibold text-[#7C7363]">{totalPhaseUsers} active</p>
            </div>

            <div className="mt-5 space-y-4">
              {phaseSummary.map((phase) => {
                const width = Math.round((phase.count / totalPhaseUsers) * 100);

                return (
                  <div key={phase.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#16352B]">{phase.label}</span>
                      <span className="font-semibold text-[#7C7363]">{phase.count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#E8DFD1]">
                      <div className={cn("h-full rounded-full", phase.color)} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Safety</p>
                <h2 className="mt-1 font-serif text-3xl font-normal">Safety visibility</h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </span>
            </div>

            <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#C7D1C8]">Not safe selections</span>
                <span className="text-2xl font-semibold">7</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#C7D1C8]">Resource views</span>
                <span className="text-2xl font-semibold">31</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#C7D1C8]">Pending review</span>
                <span className="text-2xl font-semibold">2</span>
              </div>
            </div>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)] lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="sedona-eyebrow">Assessment</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Entry assessment vs. latest</h2>
              </div>
              <p className="text-sm font-semibold text-[#A89A82]">Pseudonymized averages</p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {assessmentTrends.map((trend) => {
                const latestWidth = trend.latest * 10;
                const baselineLeft = trend.baseline * 10;

                return (
                  <div className="rounded-2xl border border-[#E8DFD1] px-4 py-3" key={trend.label}>
                    <div className="mb-3 flex items-start justify-between gap-4 text-sm">
                      <span className="font-semibold text-[#33443E]">{trend.label}</span>
                      <span className="shrink-0 font-semibold text-[#3E7A5E]">
                        {trend.baseline} - {trend.latest} {trend.direction === "down" ? "down" : "up"}
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full bg-[#E8DFD1]">
                      <div className="h-full rounded-full bg-[#B85028]" style={{ width: `${latestWidth}%` }} />
                      <span className="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#CBBEAA]" style={{ left: `${baselineLeft}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-5">
          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="sedona-eyebrow">Content</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Readiness</h2>
              </div>
              <Link className="text-sm font-semibold text-[#B85028] hover:text-[#8F3E20]" href="/admin/content">
                Manage
              </Link>
            </div>

            <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
              {contentStatus.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-center gap-3 px-4 py-3" key={item.label}>
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#16352B]">{item.label}</p>
                      <p className="truncate text-sm text-[#7C7363]">{item.status}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#3E7A5E]">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E4ECE6] text-[#12362C]">
                <CheckCircle2 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Next</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Action items</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {actionItems.map((item) => (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8DFD1] px-4 py-3 text-sm font-semibold text-[#33443E]" key={item}>
                  <span>{item}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-[#B85028]" />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Activity</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Recent activity</h2>
              </div>
            </div>
            <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
              {recentActivity.map((item) => (
                <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm" key={item.event}>
                  <span className="font-medium text-[#4F5C55]">{item.event}</span>
                  <span className="shrink-0 font-semibold text-[#A89A82]">{item.time}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
