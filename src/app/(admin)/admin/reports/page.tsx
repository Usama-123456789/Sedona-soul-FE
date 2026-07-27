"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type AdminUser = {
  id: string;
  pseudonymousUserId: string;
  status: "active" | "disabled" | "deleted";
  currentPhase: string | null;
  currentModule: string | null;
  onboardingComplete: boolean;
  baselineCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type ContentDocument = {
  id: string;
  title: string;
  type: "workbook" | "book" | "audio" | "video" | "resource";
  phase: string | null;
  status: "draft" | "published" | "unpublished";
  version: number;
  updatedAt: string;
};

type AuditAction =
  | "content_document_create"
  | "content_document_update"
  | "content_document_upload"
  | "content_document_publish"
  | "content_document_unpublish"
  | "content_document_archive"
  | "admin_login"
  | "admin_logout";

type AdminAuditLog = {
  id: string;
  adminUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type AdminReport = {
  dateRange: {
    createdFrom: string | null;
    createdTo: string | null;
  };
  accounts: {
    activeUsers: number;
    deletedUsers: number;
    disabledUsers: number;
    totalUsers: number;
  };
  onboarding: {
    completed: number;
    incomplete: number;
  };
  baseline: {
    completed: number;
    incomplete: number;
  };
  usersByCurrentPhase: Array<{
    phase: string;
    total: number;
  }>;
  newUsersInDateRange: {
    total: number;
  };
};

type ReportData = {
  auditLogs: AdminAuditLog[];
  contentCounts: {
    draft: number;
    published: number;
    total: number;
    unpublished: number;
  };
  recentContent: ContentDocument[];
  recentUsers: AdminUser[];
  report: AdminReport;
};

type MetricTile = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "pine" | "clay" | "blue" | "sage";
};

type QueryValue = boolean | number | string | null | undefined;

const rangeDays = 30;

const toneClasses: Record<MetricTile["tone"], string> = {
  blue: "bg-[#E8ECF5] text-[#465980]",
  clay: "bg-[#F7E5DA] text-[#B85028]",
  pine: "bg-[#E4ECE6] text-[#12362C]",
  sage: "bg-[#E4EFE8] text-[#3E7A5E]",
};

const auditToneClasses: Record<AuditAction, string> = {
  admin_login: "bg-[#E4EFE8] text-[#3E7A5E]",
  admin_logout: "bg-[#F4EFE6] text-[#7C7363]",
  content_document_archive: "bg-[#F7E5DA] text-[#B85028]",
  content_document_create: "bg-[#E4ECE6] text-[#12362C]",
  content_document_publish: "bg-[#E4EFE8] text-[#3E7A5E]",
  content_document_unpublish: "bg-[#F7E5DA] text-[#B85028]",
  content_document_update: "bg-[#E8ECF5] text-[#465980]",
  content_document_upload: "bg-[#E8ECF5] text-[#465980]",
};

const readApiResponse = async <T,>(response: Response) => {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;
    throw new Error(error?.message ?? "Request failed.");
  }

  return payload.data;
};

const buildUrl = (path: string, params: Record<string, QueryValue> = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const search = query.toString();
  return search ? `${path}?${search}` : path;
};

const getApiData = async <T,>(path: string, params?: Record<string, QueryValue>) => {
  const response = await fetch(buildUrl(path, params), {
    cache: "no-store",
  });

  return readApiResponse<T>(response);
};

const getContentDocumentCount = async (params: Record<string, QueryValue> = {}) => {
  const data = await getApiData<{ documents: ContentDocument[]; pagination: Pagination }>("/api/admin/content-documents", {
    ...params,
    page: 1,
    pageSize: 1,
  });

  return data.pagination.total;
};

const formatLabel = (value: string) =>
  value
    .replace(/^content_document_/, "")
    .replace(/^admin_/, "admin ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
};

const formatPercent = (value: number, total: number) => {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
};

const getAuditStatusText = (auditLog: AdminAuditLog) => {
  const metadata = auditLog.metadata ?? {};
  const nextStatus = typeof metadata.nextStatus === "string" ? metadata.nextStatus : null;
  const previousStatus = typeof metadata.previousStatus === "string" ? metadata.previousStatus : null;

  if (previousStatus && nextStatus && previousStatus !== nextStatus) {
    return `${formatLabel(previousStatus)} to ${formatLabel(nextStatus)}`;
  }

  if (nextStatus) {
    return formatLabel(nextStatus);
  }

  return formatLabel(auditLog.action);
};

const getAuditEntityText = (auditLog: AdminAuditLog) => {
  const metadata = auditLog.metadata ?? {};
  const title = typeof metadata.title === "string" ? metadata.title : null;

  if (title) {
    return title;
  }

  return `${formatLabel(auditLog.entityType)} ${auditLog.entityId.slice(0, 8)}`;
};

const getPhaseLabel = (phase: string) => {
  if (phase === "stabilize") {
    return "Phase 1 - Stabilize";
  }

  if (phase === "heal") {
    return "Phase 2 - Heal";
  }

  if (phase === "elevate") {
    return "Phase 3 - Elevate";
  }

  return formatLabel(phase);
};

const getRangeStartIso = () => {
  const date = new Date();
  date.setDate(date.getDate() - rangeDays);
  return date.toISOString();
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const createdFrom = getRangeStartIso();
      const [
        reportData,
        totalContent,
        publishedContent,
        draftContent,
        unpublishedContent,
        recentUsersData,
        recentContentData,
        auditData,
      ] = await Promise.all([
        getApiData<{ report: AdminReport }>("/api/admin/reports", { createdFrom }),
        getContentDocumentCount(),
        getContentDocumentCount({ status: "published" }),
        getContentDocumentCount({ status: "draft" }),
        getContentDocumentCount({ status: "unpublished" }),
        getApiData<{ users: AdminUser[]; pagination: Pagination }>("/api/admin/users", { page: 1, pageSize: 6 }),
        getApiData<{ documents: ContentDocument[]; pagination: Pagination }>("/api/admin/content-documents", { page: 1, pageSize: 6 }),
        getApiData<{ auditLogs: AdminAuditLog[]; pagination: Pagination }>("/api/admin/audit-logs", { page: 1, pageSize: 10 }),
      ]);

      setReportData({
        auditLogs: auditData.auditLogs,
        contentCounts: {
          draft: draftContent,
          published: publishedContent,
          total: totalContent,
          unpublished: unpublishedContent,
        },
        recentContent: recentContentData.documents,
        recentUsers: recentUsersData.users,
        report: reportData.report,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin reports.";
      setErrorMessage(message);
      setReportData(null);
      toast({
        description: message,
        title: "Reports could not load",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadReportData();
  }, [loadReportData]);

  const metricTiles = useMemo<MetricTile[]>(() => {
    const report = reportData?.report;
    const accounts = report?.accounts;
    const content = reportData?.contentCounts;

    return [
      {
        label: "Total users",
        value: accounts ? String(accounts.totalUsers) : "--",
        helper: accounts ? `${accounts.activeUsers} active` : "Loading",
        icon: Users,
        tone: "pine",
      },
      {
        label: "Onboarding complete",
        value: report ? String(report.onboarding.completed) : "--",
        helper: report ? formatPercent(report.onboarding.completed, report.accounts.totalUsers) : "Loading",
        icon: CheckCircle2,
        tone: "sage",
      },
      {
        label: "Baseline complete",
        value: report ? String(report.baseline.completed) : "--",
        helper: report ? formatPercent(report.baseline.completed, report.accounts.totalUsers) : "Loading",
        icon: TrendingUp,
        tone: "blue",
      },
      {
        label: "Published content",
        value: content ? String(content.published) : "--",
        helper: content ? `${content.total} total documents` : "Loading",
        icon: FileText,
        tone: "clay",
      },
    ];
  }, [reportData]);

  const phaseRows = reportData?.report.usersByCurrentPhase ?? [];
  const totalPhaseUsers = phaseRows.reduce((sum, item) => sum + item.total, 0);

  const accountStatusRows = [
    { label: "Active", value: reportData?.report.accounts.activeUsers ?? "--" },
    { label: "Disabled", value: reportData?.report.accounts.disabledUsers ?? "--" },
    { label: "Deleted", value: reportData?.report.accounts.deletedUsers ?? "--" },
    { label: `New in ${rangeDays} days`, value: reportData?.report.newUsersInDateRange.total ?? "--" },
  ];

  const contentStatusRows = [
    { className: "bg-[#E4EFE8] text-[#3E7A5E]", label: "Published", value: reportData?.contentCounts.published ?? "--" },
    { className: "bg-[#E8ECF5] text-[#465980]", label: "Draft", value: reportData?.contentCounts.draft ?? "--" },
    { className: "bg-[#F7E5DA] text-[#B85028]", label: "Unpublished", value: reportData?.contentCounts.unpublished ?? "--" },
  ];


  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="sedona-eyebrow">Admin reports</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Privacy-safe reports</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Pseudonymized account, onboarding, baseline, content readiness, and admin activity summaries.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#12362C] px-4 text-sm font-semibold text-[#F4EFE6] shadow-[0_14px_30px_-22px_rgba(18,54,44,0.8)] transition hover:bg-[#1B493B] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          onClick={loadReportData}
          type="button"
        >
          Refresh reports
          <History aria-hidden="true" className={cn("size-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-[18px] border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">{errorMessage}</div>
      ) : null}

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="sedona-eyebrow">Users</p>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Recent user summaries</h2>
              <p className="mt-1 text-sm leading-6 text-[#7C7363]">Safe account-level fields only, ordered by newest users.</p>
            </div>
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" href="/admin/users">
              View users
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E8DFD1]">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[minmax(180px,1fr)_0.7fr_0.85fr_0.75fr_0.75fr_0.75fr] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                <span>User</span>
                <span>Status</span>
                <span>Phase</span>
                <span>Onboarding</span>
                <span>Baseline</span>
                <span>Last login</span>
              </div>
              <div className="divide-y divide-[#E8DFD1]">
                {isLoading ? <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">Loading user summaries...</div> : null}

                {!isLoading && reportData?.recentUsers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">No users found yet.</div>
                ) : null}

                {!isLoading &&
                  reportData?.recentUsers.map((user) => (
                    <div className="grid grid-cols-[minmax(180px,1fr)_0.7fr_0.85fr_0.75fr_0.75fr_0.75fr] items-center gap-4 px-4 py-3 text-sm" key={user.id}>
                      <span className="font-semibold text-[#16352B]">{user.pseudonymousUserId}</span>
                      <span className="capitalize text-[#7C7363]">{user.status}</span>
                      <span className="font-medium text-[#4F5C55]">{user.currentPhase ? getPhaseLabel(user.currentPhase) : "Not set"}</span>
                      <span>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", user.onboardingComplete ? "bg-[#E4EFE8] text-[#3E7A5E]" : "bg-[#F7E5DA] text-[#B85028]")}>
                          {user.onboardingComplete ? "Complete" : "Open"}
                        </span>
                      </span>
                      <span>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", user.baselineCompleted ? "bg-[#E4EFE8] text-[#3E7A5E]" : "bg-[#F4EFE6] text-[#7C7363]")}>
                          {user.baselineCompleted ? "Complete" : "Open"}
                        </span>
                      </span>
                      <span className="font-semibold text-[#A89A82]">{formatDateTime(user.lastLoginAt)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-5">
          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Accounts</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Account status</h2>
              </div>
            </div>
            <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
              {accountStatusRows.map((item) => (
                <div className="flex items-center justify-between gap-4 px-4 py-3" key={item.label}>
                  <span className="text-sm font-semibold text-[#7C7363]">{item.label}</span>
                  <span className="font-serif text-2xl leading-none text-[#16352B]">{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Privacy</p>
                <h2 className="mt-1 font-serif text-3xl font-normal">Safe by default</h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#C7D1C8]">
              Reports show pseudonymized account and content data. Raw journal entries, chat text, and private reflections are not exposed here.
            </p>
          </article>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sedona-eyebrow">Journey</p>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Users by phase</h2>
            </div>
            <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-sm font-semibold text-[#7C7363]">{totalPhaseUsers} assigned</span>
          </div>

          <div className="mt-5 space-y-4">
            {phaseRows.map((phase) => {
              const width = totalPhaseUsers > 0 ? Math.round((phase.total / totalPhaseUsers) * 100) : 0;

              return (
                <div key={phase.phase}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-[#16352B]">{getPhaseLabel(phase.phase)}</span>
                    <span className="font-semibold text-[#7C7363]">{phase.total}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#E8DFD1]">
                    <div className="h-full rounded-full bg-[#B85028]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="sedona-eyebrow">Content</p>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Content readiness</h2>
              <p className="mt-1 text-sm leading-6 text-[#7C7363]">Current document status counts plus latest content records.</p>
            </div>
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" href="/admin/content">
              Manage content
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {contentStatusRows.map((item) => (
              <div className="rounded-2xl border border-[#E8DFD1] p-4" key={item.label}>
                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", item.className)}>{item.label}</span>
                <p className="mt-3 font-serif text-3xl leading-none text-[#16352B]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
            {isLoading ? <div className="px-4 py-6 text-center text-sm font-semibold text-[#7C7363]">Loading content records...</div> : null}
            {!isLoading && reportData?.recentContent.length === 0 ? <div className="px-4 py-6 text-center text-sm font-semibold text-[#7C7363]">No content records found yet.</div> : null}
            {!isLoading &&
              reportData?.recentContent.map((document) => (
                <Link className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#FBF7EF]" href={`/admin/content/${document.id}`} key={document.id}>
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                    <FileText aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#16352B]">{document.title}</span>
                    <span className="block text-sm capitalize text-[#7C7363]">
                      {document.type} - {document.phase ?? "No phase"} - v{document.version}
                    </span>
                  </span>
                  <span className="text-sm font-semibold capitalize text-[#3E7A5E]">{document.status}</span>
                </Link>
              ))}
          </div>
        </article>
      </div>

      <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="sedona-eyebrow">Audit log</p>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Recent admin activity</h2>
            <p className="mt-1 text-sm leading-6 text-[#7C7363]">Publish, unpublish, content updates, archive events, and admin session activity.</p>
          </div>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" onClick={loadReportData} type="button">
            Refresh activity
            <History aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E8DFD1]">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[minmax(240px,1.2fr)_minmax(220px,1fr)_0.75fr_0.65fr_0.6fr] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
              <span>Action</span>
              <span>Entity</span>
              <span>Status</span>
              <span>Admin</span>
              <span>Time</span>
            </div>
            <div className="divide-y divide-[#E8DFD1]">
              {isLoading ? <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">Loading admin activity...</div> : null}

              {!isLoading && reportData?.auditLogs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">No audit activity recorded yet.</div>
              ) : null}

              {!isLoading &&
                reportData?.auditLogs.map((item) => {
                  const entityText = getAuditEntityText(item);

                  return (
                    <div className="grid grid-cols-[minmax(240px,1.2fr)_minmax(220px,1fr)_0.75fr_0.65fr_0.6fr] items-center gap-4 px-4 py-3 text-sm" key={item.id}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                          <Activity aria-hidden="true" className="size-5" />
                        </span>
                        <span className="font-semibold text-[#16352B]">{formatLabel(item.action)}</span>
                      </div>
                      {item.entityType === "content_document" ? (
                        <Link className="truncate font-medium text-[#4F5C55] hover:text-[#B85028]" href={`/admin/content/${item.entityId}`}>
                          {entityText}
                        </Link>
                      ) : (
                        <span className="truncate font-medium text-[#4F5C55]">{entityText}</span>
                      )}
                      <span>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", auditToneClasses[item.action])}>{getAuditStatusText(item)}</span>
                      </span>
                      <span className="font-semibold text-[#7C7363]">{item.adminUserId ? `admin_${item.adminUserId.slice(0, 8)}` : "System"}</span>
                      <span className="font-semibold text-[#A89A82]">{formatDateTime(item.createdAt)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
