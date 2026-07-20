import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, FileText, ShieldCheck, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type ReportTile = {
  label: string;
  value: string;
  helper: string;
};

type ReportListItem = {
  name: string;
  type: string;
  status: "Ready" | "Syncing" | "Review";
  updatedAt: string;
  owner: string;
};

const reportTiles: ReportTile[] = [
  { label: "Check-ins today", value: "43", helper: "+12 vs yesterday" },
  { label: "Baselines completed", value: "126", helper: "68% of users" },
  { label: "Avg improvement", value: "+22%", helper: "Across key scores" },
  { label: "Safety views", value: "31", helper: "Resource opens" },
];

const reports: ReportListItem[] = [
  { name: "Weekly user summary", type: "User", status: "Ready", updatedAt: "Today", owner: "Admin" },
  { name: "Safety resource report", type: "Safety", status: "Review", updatedAt: "Today", owner: "Safety" },
  { name: "Assessment trends", type: "Assessment", status: "Ready", updatedAt: "Yesterday", owner: "Clinical" },
  { name: "Content usage report", type: "Content", status: "Ready", updatedAt: "Yesterday", owner: "Content" },
  { name: "AI guide usage", type: "AI", status: "Syncing", updatedAt: "2 hours ago", owner: "AI" },
];

const reportCategories = [
  { label: "User reports", icon: FileText, count: "2 ready" },
  { label: "Assessment reports", icon: TrendingUp, count: "1 ready" },
  { label: "Safety reports", icon: ShieldCheck, count: "1 review" },
  { label: "Engagement reports", icon: BarChart3, count: "2 synced" },
];

export default function AdminReportsPage() {
  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="sedona-eyebrow">Admin reports</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Privacy-safe reports</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Pseudonymized summaries for users, check-ins, assessment movement, safety resource usage, content engagement, and AI guide activity.
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#12362C] px-4 text-sm font-semibold text-[#F4EFE6] shadow-[0_14px_30px_-22px_rgba(18,54,44,0.8)] transition hover:bg-[#1B493B]" type="button">
          Generate report
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1">
        {reportTiles.map((tile) => (
          <article className="min-w-[220px] flex-1 rounded-[18px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]" key={tile.label}>
            <div className="flex items-center justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#F7E5DA] text-[#B85028]">
                <BarChart3 aria-hidden="true" className="size-5" />
              </span>
              <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">Live</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-[#7C7363]">{tile.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="font-serif text-4xl font-normal leading-none text-[#16352B]">{tile.value}</p>
              <p className="pb-1 text-right text-sm font-semibold text-[#A89A82]">{tile.helper}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="sedona-eyebrow">Listing</p>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Recent reports</h2>
              <p className="mt-1 text-sm leading-6 text-[#7C7363]">Short listing for the latest report summaries and processing states.</p>
            </div>
            <button className="h-10 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" type="button">
              Filter reports
            </button>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E8DFD1]">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(220px,1.4fr)_0.65fr_0.7fr_0.75fr_0.7fr_72px] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                <span>Report name</span>
                <span>Type</span>
                <span>Status</span>
                <span>Updated</span>
                <span>Owner</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-[#E8DFD1]">
                {reports.map((report) => (
                  <div className="grid grid-cols-[minmax(220px,1.4fr)_0.65fr_0.7fr_0.75fr_0.7fr_72px] items-center gap-4 px-4 py-3 text-sm" key={report.name}>
                    <span className="font-semibold text-[#16352B]">{report.name}</span>
                    <span className="text-[#7C7363]">{report.type}</span>
                    <span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          report.status === "Ready" && "bg-[#E4EFE8] text-[#3E7A5E]",
                          report.status === "Review" && "bg-[#F7E5DA] text-[#B85028]",
                          report.status === "Syncing" && "bg-[#E8ECF5] text-[#465980]",
                        )}
                      >
                        {report.status}
                      </span>
                    </span>
                    <span className="text-[#7C7363]">{report.updatedAt}</span>
                    <span className="text-[#7C7363]">{report.owner}</span>
                    <Link className="text-right text-sm font-semibold text-[#B85028] hover:text-[#8F3E20]" href="/admin/reports">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-5">
          <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Privacy rule</p>
                <h2 className="mt-1 font-serif text-3xl font-normal">No raw journals</h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#C7D1C8]">
              Reports should use aggregated or pseudonymized data only unless the client explicitly approves full private journal visibility.
            </p>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Categories</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Report types</h2>
              </div>
            </div>
            <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
              {reportCategories.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-center gap-3 px-4 py-3" key={item.label}>
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#16352B]">{item.label}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#3E7A5E]">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
