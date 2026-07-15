import Link from "next/link";
import { ArrowRight, Check, Heart, Shield } from "lucide-react";

import { PageShell } from "@/components/layouts/page-shell";
import { GreetingHeader } from "@/components/shared/greeting-header";

const stats = [
  { value: "12", label: "day regulation streak", tone: "text-[#B04F24]" },
  { value: "7→4", label: "anxiety, last 30 days", tone: "text-[#3E7A5E]" },
  { value: "24", label: "days in Phase 1", tone: "text-[#465980]" },
];

const tools = [
  { title: "Sacred Pause", subtitle: "2-min reset", accent: "#B04F24", tint: "#F4E2D6" },
  { title: "Heart Coherence", subtitle: "Breathe with care", accent: "#465980", tint: "#E4E9F2" },
  { title: "Anger Release", subtitle: "Move the heat", accent: "#B04F24", tint: "#F4E2D6" },
];

export default function HomePage() {
  return (
    <PageShell>
      <GreetingHeader
        description="However you're arriving today, there's nothing to fix first."
        eyebrow="Friday, July 10 · Day 24"
        title="Good morning, Maya."
      />
      <div className="mt-6 grid gap-4 min-[575px]:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
        <Link
          className="relative min-h-[210px] overflow-hidden rounded-[26px] bg-[#6F8275] shadow-[0_18px_36px_-18px_rgba(48,30,16,0.34)] min-[575px]:min-h-[240px] lg:min-h-[270px]"
          href="/app/today"
        >
          <div className="absolute inset-0 bg-[linear-gradient(155deg,#B8C0B6_0%,#87978B_44%,#50685E_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,54,44,0.12)_0%,rgba(18,54,44,0.72)_100%)]" />
          <div className="relative flex h-full flex-col justify-end p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">Daily check-in</p>
            <h2 className="mt-2 max-w-[300px] font-serif text-[30px] font-normal leading-[1.16] text-[#FBF7EF]">
              How are you arriving today?
            </h2>
            <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#F4EFE6] px-5 py-3 text-sm font-semibold text-[#9A4220]">
              Begin check-in
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
            </div>
          </div>
        </Link>

        <section className="flex min-h-[230px] flex-col justify-between rounded-[26px] bg-[#12362C] p-6 text-[#F1EDE2] shadow-[0_16px_34px_-20px_rgba(18,54,44,0.6)] min-[575px]:min-h-[240px] lg:min-h-[270px]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E7E4D8]/60">Your journey</p>
              <p className="text-xs font-semibold text-[#E7B27E]">Phase 1 of 3</p>
            </div>
            <h2 className="mt-3 font-serif text-[28px] font-normal leading-none">Stabilize</h2>
            <p className="mt-3 text-sm leading-6 text-[#E7E4D8]/65">
              Chapter C — Regulate · building your nervous-system foundation.
            </p>
          </div>
          <div>
            <div className="mb-4 mt-6 flex gap-2">
              <span className="h-1.5 flex-1 rounded-full bg-[#E7B27E]" />
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
          {stats.map((stat) => (
            <div
              className="rounded-[20px] bg-white p-4 shadow-[0_10px_22px_-18px_rgba(48,30,16,0.2)]"
              key={stat.label}
            >
              <p className={`font-serif text-[34px] leading-none ${stat.tone}`}>{stat.value}</p>
              <p className="mt-2 text-[12.5px] font-medium leading-[1.3] text-[#8A8070]">{stat.label}</p>
            </div>
          ))}
        </section>

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

        <Link
          className="flex items-center gap-4 rounded-[22px] border border-[#E2E6EE] bg-[#EEF0F4] px-5 py-4 min-[575px]:col-span-2"
          href="/app/partner"
        >
          <div className="flex shrink-0 items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#465980] text-sm font-semibold text-white">
              M
            </span>
            <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#EEF0F4] bg-[#B04F24] text-sm font-semibold text-white">
              E
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#2C3A52]">You &amp; Evan</p>
            <p className="mt-1 truncate text-sm text-[#6E7890]">Linked · both walking Phase 1</p>
          </div>
          <ArrowRight aria-hidden="true" className="text-[#465980]" size={18} strokeWidth={2} />
        </Link>

        <section className="rounded-[22px] bg-white p-5 shadow-[0_10px_22px_-18px_rgba(48,30,16,0.22)] min-[575px]:col-span-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#E0E8E1] text-[#3E7A5E]">
              <Shield aria-hidden="true" size={22} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-serif text-2xl font-normal text-[#16352B]">Safety comes first</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7C7363]">
                Every daily check-in starts with a safety gate before workbook guidance, chat, or practices continue.
              </p>
            </div>
            <div className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0E8E1] text-[#3E7A5E] min-[575px]:flex">
              <Check aria-hidden="true" size={18} strokeWidth={2} />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
