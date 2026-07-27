"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  Archive,
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  FileText,
  Headphones,
  History,
  Pencil,
  ShieldCheck,
  UploadCloud,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ContentType = "workbook" | "book" | "audio" | "video" | "resource";
type ContentStatus = "draft" | "published" | "unpublished";
type AuditAction =
  | "content_document_create"
  | "content_document_update"
  | "content_document_upload"
  | "content_document_publish"
  | "content_document_unpublish"
  | "content_document_archive";

type ContentDocument = {
  id: string;
  title: string;
  type: ContentType;
  phase: string | null;
  path: string | null;
  status: ContentStatus;
  fileUrl: string | null;
  storageProvider: string | null;
  storageKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  version: number;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  createdAt?: string;
  updatedAt: string;
};

type AdminAuditLog = {
  id: string;
  adminUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

type PlacementItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const typeIcons: Record<ContentType, LucideIcon> = {
  audio: Headphones,
  book: BookOpen,
  resource: ShieldCheck,
  video: Video,
  workbook: FileText,
};

const statusClasses: Record<ContentStatus, string> = {
  draft: "bg-[#E8ECF5] text-[#465980]",
  published: "bg-[#E4EFE8] text-[#3E7A5E]",
  unpublished: "bg-[#F7E5DA] text-[#B85028]",
};

const auditToneClasses: Record<AuditAction, string> = {
  content_document_archive: "bg-[#F7E5DA] text-[#B85028]",
  content_document_create: "bg-[#E4ECE6] text-[#12362C]",
  content_document_publish: "bg-[#E4EFE8] text-[#3E7A5E]",
  content_document_unpublish: "bg-[#F7E5DA] text-[#B85028]",
  content_document_update: "bg-[#E8ECF5] text-[#465980]",
  content_document_upload: "bg-[#E8ECF5] text-[#465980]",
};

const fallbackDocument: ContentDocument = {
  id: "content-preview",
  title: "Content document preview",
  type: "workbook",
  phase: "stabilize",
  path: "phase-1/chapter-c/regulate",
  status: "draft",
  fileUrl: "https://example.com/content.pdf",
  storageProvider: "linked",
  storageKey: "content/preview.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 2400000,
  version: 1,
  updatedAt: "Today",
};

const formatLabel = (value: string) =>
  value
    .replace(/^content_document_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatFileSize = (bytes: number | null) => {
  if (!bytes) {
    return "No file size";
  }

  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1000)} KB`;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Not available";
  }

  if (["Today", "Yesterday"].includes(value) || value.startsWith("Jul")) {
    return value;
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

const getPwaPlacement = (document: ContentDocument) => {
  if (document.type === "audio") {
    return "/app/audiobook";
  }

  if (document.type === "resource") {
    return "/app/today safety";
  }

  if (document.type === "video") {
    return "/app/guide tools";
  }

  return "/app/guide";
};

const readApiResponse = async <T,>(response: Response) => {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;
    throw new Error(error?.message ?? "Request failed.");
  }

  return payload.data;
};

const getMetadataText = (auditLog: AdminAuditLog) => {
  const metadata = auditLog.metadata ?? {};
  const previousStatus = typeof metadata.previousStatus === "string" ? metadata.previousStatus : null;
  const nextStatus = typeof metadata.nextStatus === "string" ? metadata.nextStatus : null;
  const previousVersion = typeof metadata.previousVersion === "number" ? metadata.previousVersion : null;
  const nextVersion = typeof metadata.nextVersion === "number" ? metadata.nextVersion : null;
  const changedFields = Array.isArray(metadata.changedFields) ? metadata.changedFields.filter((field): field is string => typeof field === "string") : [];

  if (previousStatus && nextStatus && previousStatus !== nextStatus) {
    return `${formatLabel(previousStatus)} to ${formatLabel(nextStatus)}${nextVersion ? `, v${nextVersion}` : ""}`;
  }

  if (changedFields.length > 0) {
    return `Updated ${changedFields.join(", ")}${nextVersion ? `, v${nextVersion}` : ""}`;
  }

  if (previousVersion && nextVersion && previousVersion !== nextVersion) {
    return `Version ${previousVersion} to ${nextVersion}`;
  }

  return "Admin activity recorded for this content item.";
};

export default function AdminContentDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ id?: string | string[] }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"publish" | "unpublish" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditErrorMessage, setAuditErrorMessage] = useState<string | null>(null);

  const visibleDocument = useMemo(
    () => document ?? (documentId ? { ...fallbackDocument, id: documentId } : fallbackDocument),
    [document, documentId],
  );
  const TypeIcon = typeIcons[visibleDocument.type];

  const loadDocument = useCallback(async () => {
    if (!documentId) {
      const message = "Content document id is missing.";
      setErrorMessage(message);
      toast({
        description: message,
        title: "Content could not load",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/content-documents/${encodeURIComponent(documentId)}`, {
        cache: "no-store",
      });
      const data = await readApiResponse<{ document: ContentDocument }>(response);
      setDocument(data.document);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load content document.";
      setErrorMessage(message);
      setDocument({ ...fallbackDocument, id: documentId });
      toast({
        description: `${message} Showing local placeholder details for now.`,
        title: "Content could not load",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, toast]);

  const loadAuditLogs = useCallback(async () => {
    if (!documentId) {
      setAuditLogs([]);
      setIsAuditLoading(false);
      return;
    }

    setIsAuditLoading(true);
    setAuditErrorMessage(null);

    const query = new URLSearchParams({
      entityId: documentId,
      entityType: "content_document",
      page: "1",
      pageSize: "20",
    });

    try {
      const response = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await readApiResponse<{ auditLogs: AdminAuditLog[] }>(response);
      setAuditLogs(data.auditLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load audit activity.";
      setAuditErrorMessage(message);
      setAuditLogs([]);
      toast({
        description: message,
        title: "Audit activity unavailable",
        variant: "destructive",
      });
    } finally {
      setIsAuditLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    void loadDocument();
    void loadAuditLogs();
  }, [loadAuditLogs, loadDocument]);

  const placementItems: PlacementItem[] = useMemo(
    () => [
      { label: "PWA location", value: getPwaPlacement(visibleDocument), icon: ExternalLink },
      { label: "Knowledge base", value: visibleDocument.status === "published" ? "Ready for sync" : "Not visible yet", icon: Bot },
      { label: "Version", value: `v${visibleDocument.version}`, icon: History },
      { label: "Updated", value: formatDateTime(visibleDocument.updatedAt), icon: Clock3 },
    ],
    [visibleDocument],
  );

  const updatePublishState = async (nextAction: "publish" | "unpublish") => {
    if (!documentId || actionLoading) {
      return;
    }

    setActionLoading(nextAction);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/content-documents/${encodeURIComponent(documentId)}/${nextAction}`, {
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await readApiResponse<{ document: ContentDocument }>(response);
      setDocument(data.document);
      toast({
        description:
          nextAction === "publish"
            ? `${data.document.title} is now visible to the PWA.`
            : `${data.document.title} is hidden from the PWA.`,
        title: nextAction === "publish" ? "Content published" : "Content unpublished",
        variant: "success",
      });
      await loadAuditLogs();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to ${nextAction} content document.`;
      setErrorMessage(message);
      toast({
        description: message,
        title: nextAction === "publish" ? "Publish failed" : "Unpublish failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="min-w-0">
          <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#B85028] hover:text-[#8F3E20]" href="/admin/content">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to content
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
              <TypeIcon aria-hidden="true" className="size-6" />
            </span>
            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusClasses[visibleDocument.status])}>
              {formatLabel(visibleDocument.status)}
            </span>
            <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">{formatLabel(visibleDocument.type)}</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-tight text-[#16352B]">{isLoading ? "Loading content..." : visibleDocument.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Review metadata, PWA visibility, publish state, and admin audit history for this content document.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" href="/admin/content">
            <Pencil aria-hidden="true" className="size-4" />
            Edit in list
          </Link>
          {visibleDocument.status === "published" ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#B85028] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-22px_rgba(184,80,40,0.75)] transition hover:bg-[#9D431F] disabled:opacity-60"
              disabled={actionLoading !== null}
              onClick={() => updatePublishState("unpublish")}
              type="button"
            >
              <Archive aria-hidden="true" className="size-4" />
              {actionLoading === "unpublish" ? "Unpublishing..." : "Unpublish"}
            </button>
          ) : (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#12362C] px-4 text-sm font-semibold text-[#F4EFE6] shadow-[0_14px_30px_-22px_rgba(18,54,44,0.8)] transition hover:bg-[#1B493B] disabled:opacity-60"
              disabled={actionLoading !== null}
              onClick={() => updatePublishState("publish")}
              type="button"
            >
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {actionLoading === "publish" ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">{errorMessage}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="flex flex-col gap-5">
          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="sedona-eyebrow">Details</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Content metadata</h2>
              </div>
              <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-sm font-semibold text-[#7C7363]">{visibleDocument.phase ?? "No phase"}</span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Path", visibleDocument.path ?? "No path"],
                ["File URL", visibleDocument.fileUrl ?? "No file URL"],
                ["Storage provider", visibleDocument.storageProvider ?? "No provider"],
                ["Storage key", visibleDocument.storageKey ?? "No storage key"],
                ["MIME type", visibleDocument.mimeType ?? "No MIME type"],
                ["File size", formatFileSize(visibleDocument.fileSizeBytes)],
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-[#E8DFD1] bg-[#FBF7EF] px-4 py-3" key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-[#33443E]">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#E4ECE6] text-[#12362C]">
                <Activity aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Activity</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Audit timeline</h2>
              </div>
            </div>

            {auditErrorMessage ? (
              <div className="mt-5 rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">{auditErrorMessage}</div>
            ) : null}

            <div className="mt-5 space-y-3">
              {isAuditLoading ? (
                <div className="rounded-2xl border border-dashed border-[#D8CBB7] bg-[#FBF7EF] p-6 text-center text-sm font-semibold text-[#7C7363]">Loading audit activity...</div>
              ) : null}

              {!isAuditLoading && auditLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D8CBB7] bg-[#FBF7EF] p-6 text-center text-sm font-semibold text-[#7C7363]">No audit activity recorded yet.</div>
              ) : null}

              {!isAuditLoading && auditLogs.map((auditLog) => (
                <div className="flex gap-3 rounded-2xl border border-[#E8DFD1] px-4 py-3" key={auditLog.id}>
                  <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl", auditToneClasses[auditLog.action])}>
                    <History aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#16352B]">{formatLabel(auditLog.action)}</p>
                      <span className="text-xs font-semibold text-[#A89A82]">{formatDateTime(auditLog.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#7C7363]">{getMetadataText(auditLog)}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">Admin {auditLog.adminUserId ? auditLog.adminUserId.slice(0, 8) : "removed"}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-5">
          <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Publish state</p>
                <h2 className="mt-1 font-serif text-3xl font-normal">
                  {visibleDocument.status === "published" ? "Visible in PWA" : "Hidden from PWA"}
                </h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
                {visibleDocument.status === "published" ? <CheckCircle2 aria-hidden="true" className="size-5" /> : <CircleDashed aria-hidden="true" className="size-5" />}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#C7D1C8]">
              Published content can be surfaced in the user app and included in knowledge-base sync. Draft and unpublished items stay admin-only.
            </p>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
                <UploadCloud aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Placement</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">PWA readiness</h2>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#E8DFD1] rounded-2xl border border-[#E8DFD1]">
              {placementItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-center gap-3 px-4 py-3" key={item.label}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">{item.label}</p>
                      <p className="truncate text-sm font-semibold text-[#16352B]">{item.value}</p>
                    </div>
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
