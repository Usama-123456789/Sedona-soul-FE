
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Archive,
  BookOpen,
  Bot,
  CheckCircle2,
  CircleDashed,
  Eye,
  FileText,
  Headphones,
  History,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ContentType = "workbook" | "book" | "audio" | "video" | "resource";
type ContentStatus = "draft" | "published" | "unpublished";
type PhaseFilter = "all" | "stabilize" | "heal" | "elevate";
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

type ContentDocumentsResponse = {
  documents: ContentDocument[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type ContentDocumentResponse = {
  archived?: boolean;
  document: ContentDocument;
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

type ContentFormState = {
  title: string;
  type: ContentType;
  phase: string;
  path: string;
  status: ContentStatus;
  fileUrl: string;
  storageProvider: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: string;
};

type MetricTile = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "pine" | "clay" | "blue" | "sage";
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

const contentTypeOptions: ContentType[] = ["workbook", "book", "audio", "video", "resource"];
const statusOptions: ContentStatus[] = ["draft", "published", "unpublished"];
const phaseOptions: PhaseFilter[] = ["all", "stabilize", "heal", "elevate"];

const mockDocuments: ContentDocument[] = [
  {
    id: "content-001",
    title: "Phase 1 Stabilize Workbook",
    type: "workbook",
    phase: "stabilize",
    path: "phase-1/chapter-c/regulate",
    status: "published",
    fileUrl: "https://example.com/workbooks/phase-1-stabilize.pdf",
    storageProvider: "s3",
    storageKey: "workbooks/phase-1-stabilize.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 2400000,
    version: 3,
    updatedAt: "Today",
  },
  {
    id: "content-002",
    title: "Sacred Pause Practice",
    type: "video",
    phase: "stabilize",
    path: "tools/sacred-pause",
    status: "draft",
    fileUrl: "https://example.com/videos/sacred-pause.mp4",
    storageProvider: "linked",
    storageKey: "videos/sacred-pause.mp4",
    mimeType: "video/mp4",
    fileSizeBytes: 68000000,
    version: 1,
    updatedAt: "Yesterday",
  },
  {
    id: "content-003",
    title: "Chapter 1 Audio - Stop the Bleeding",
    type: "audio",
    phase: "stabilize",
    path: "audio/phase-1/chapter-1",
    status: "published",
    fileUrl: "https://example.com/audio/chapter-1.mp3",
    storageProvider: "s3",
    storageKey: "audio/phase-1/chapter-1.mp3",
    mimeType: "audio/mpeg",
    fileSizeBytes: 18500000,
    version: 2,
    updatedAt: "Jul 20",
  },
  {
    id: "content-004",
    title: "Domestic Violence Hotline Resource",
    type: "resource",
    phase: "stabilize",
    path: "safety/domestic-violence-hotline",
    status: "published",
    fileUrl: "https://www.thehotline.org/",
    storageProvider: "linked",
    storageKey: null,
    mimeType: "text/html",
    fileSizeBytes: null,
    version: 1,
    updatedAt: "Jul 19",
  },
  {
    id: "content-005",
    title: "Phase 2 Heal Book Notes",
    type: "book",
    phase: "heal",
    path: "phase-2/overview",
    status: "unpublished",
    fileUrl: "https://example.com/book/phase-2-heal.pdf",
    storageProvider: "s3",
    storageKey: "book/phase-2-heal.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 4200000,
    version: 1,
    updatedAt: "Jul 18",
  },
];

const emptyForm: ContentFormState = {
  title: "",
  type: "workbook",
  phase: "stabilize",
  path: "",
  status: "draft",
  fileUrl: "",
  storageProvider: "linked",
  storageKey: "",
  mimeType: "",
  fileSizeBytes: "",
};

const typeIcons: Record<ContentType, LucideIcon> = {
  audio: Headphones,
  book: BookOpen,
  resource: ShieldCheck,
  video: Video,
  workbook: FileText,
};

const toneClasses: Record<MetricTile["tone"], string> = {
  blue: "bg-[#E8ECF5] text-[#465980]",
  clay: "bg-[#F7E5DA] text-[#B85028]",
  pine: "bg-[#E4ECE6] text-[#12362C]",
  sage: "bg-[#E4EFE8] text-[#3E7A5E]",
};

const auditToneClasses: Record<AuditAction, string> = {
  content_document_archive: "bg-[#F7E5DA] text-[#B85028]",
  content_document_create: "bg-[#E4ECE6] text-[#12362C]",
  content_document_publish: "bg-[#E4EFE8] text-[#3E7A5E]",
  content_document_unpublish: "bg-[#F7E5DA] text-[#B85028]",
  content_document_update: "bg-[#E8ECF5] text-[#465980]",
  content_document_upload: "bg-[#E8ECF5] text-[#465980]",
};

const formatLabel = (value: string) =>
  value
    .replace(/^content_document_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value: string) => {
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

const getAuditStatusText = (auditLog: AdminAuditLog) => {
  const metadata = auditLog.metadata ?? {};
  const previousStatus = typeof metadata.previousStatus === "string" ? metadata.previousStatus : null;
  const nextStatus = typeof metadata.nextStatus === "string" ? metadata.nextStatus : null;

  if (previousStatus && nextStatus && previousStatus !== nextStatus) {
    return `${formatLabel(previousStatus)} to ${formatLabel(nextStatus)}`;
  }

  if (nextStatus) {
    return formatLabel(nextStatus);
  }

  return formatLabel(auditLog.action);
};

const getAuditContentText = (auditLog: AdminAuditLog, documents: ContentDocument[]) => {
  const matchedDocument = documents.find((document) => document.id === auditLog.entityId);

  if (matchedDocument) {
    return matchedDocument.title;
  }

  const metadata = auditLog.metadata ?? {};
  const title = typeof metadata.title === "string" ? metadata.title : null;

  return title ?? auditLog.entityId;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) {
    return "No file size";
  }

  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }

  return `${Math.round(bytes / 1000)} KB`;
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

const getStatusClasses = (status: ContentStatus) =>
  cn(
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
    status === "published" && "bg-[#E4EFE8] text-[#3E7A5E]",
    status === "draft" && "bg-[#E8ECF5] text-[#465980]",
    status === "unpublished" && "bg-[#F7E5DA] text-[#B85028]",
  );

export default function AdminContentPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ContentDocument[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentFormState>(emptyForm);
  const [syncState, setSyncState] = useState("Ready to sync");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [auditActivity, setAuditActivity] = useState<AdminAuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [auditErrorMessage, setAuditErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const readApiResponse = useCallback(async <T,>(response: Response) => {
    const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

    if (!response.ok || !payload || payload.ok === false) {
      const error = payload && "error" in payload ? payload.error : null;
      throw new Error(error?.message ?? "Request failed.");
    }

    return payload.data;
  }, []);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const query = new URLSearchParams({ page: "1", pageSize: "100" });

    if (typeFilter !== "all") {
      query.set("type", typeFilter);
    }

    if (phaseFilter !== "all") {
      query.set("phase", phaseFilter);
    }

    if (statusFilter !== "all") {
      query.set("status", statusFilter);
    }

    try {
      const response = await fetch(`/api/admin/content-documents?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await readApiResponse<ContentDocumentsResponse>(response);

      setDocuments(data.documents);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load content documents.";
      setErrorMessage(message);
      setDocuments(mockDocuments);
      toast({
        description: `${message} Showing local placeholder content for now.`,
        title: "Content could not load",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [phaseFilter, readApiResponse, statusFilter, toast, typeFilter]);

  const loadAuditActivity = useCallback(async () => {
    setIsAuditLoading(true);
    setAuditErrorMessage(null);

    const query = new URLSearchParams({
      entityType: "content_document",
      page: "1",
      pageSize: "3",
    });

    try {
      const response = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await readApiResponse<{ auditLogs: AdminAuditLog[] }>(response);
      setAuditActivity(data.auditLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load audit activity.";
      setAuditErrorMessage(message);
      setAuditActivity([]);
      toast({
        description: message,
        title: "Audit activity unavailable",
        variant: "destructive",
      });
    } finally {
      setIsAuditLoading(false);
    }
  }, [readApiResponse, toast]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    void loadAuditActivity();
  }, [loadAuditActivity]);

  const metrics: MetricTile[] = useMemo(() => {
    const published = documents.filter((document) => document.status === "published").length;
    const drafts = documents.filter((document) => document.status === "draft").length;
    const unpublished = documents.filter((document) => document.status === "unpublished").length;

    return [
      { label: "Total content", value: String(documents.length), helper: "All metadata items", icon: FileText, tone: "pine" },
      { label: "Published", value: String(published), helper: "Visible to PWA", icon: CheckCircle2, tone: "sage" },
      { label: "Draft", value: String(drafts), helper: "Admin-only", icon: CircleDashed, tone: "blue" },
      { label: "Unpublished", value: String(unpublished), helper: "Hidden from users", icon: Archive, tone: "clay" },
    ];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        document.title.toLowerCase().includes(normalizedSearch) ||
        document.path?.toLowerCase().includes(normalizedSearch) ||
        document.phase?.toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === "all" || document.type === typeFilter;
      const matchesPhase = phaseFilter === "all" || document.phase === phaseFilter;
      const matchesStatus = statusFilter === "all" || document.status === statusFilter;

      return matchesSearch && matchesType && matchesPhase && matchesStatus;
    });
  }, [documents, phaseFilter, search, statusFilter, typeFilter]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (document: ContentDocument) => {
    setEditingId(document.id);
    setForm({
      title: document.title,
      type: document.type,
      phase: document.phase ?? "",
      path: document.path ?? "",
      status: document.status,
      fileUrl: document.fileUrl ?? "",
      storageProvider: document.storageProvider ?? "linked",
      storageKey: document.storageKey ?? "",
      mimeType: document.mimeType ?? "",
      fileSizeBytes: document.fileSizeBytes ? String(document.fileSizeBytes) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = form.title.trim();

    if (!normalizedTitle || isSaving) {
      return;
    }

    const fileSizeBytes = form.fileSizeBytes.trim() ? Number(form.fileSizeBytes) : null;
    const payload = {
      title: normalizedTitle,
      type: form.type,
      phase: form.phase.trim() || null,
      path: form.path.trim() || null,
      status: form.status,
      fileUrl: form.fileUrl.trim() || null,
      storageProvider: form.storageProvider.trim() || null,
      storageKey: form.storageKey.trim() || null,
      mimeType: form.mimeType.trim() || null,
      fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : null,
    };

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(editingId ? `/api/admin/content-documents/${editingId}` : "/api/admin/content-documents", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: editingId ? "PATCH" : "POST",
      });
      const data = await readApiResponse<ContentDocumentResponse>(response);

      setDocuments((currentDocuments) => {
        if (!editingId) {
          return [data.document, ...currentDocuments];
        }

        return currentDocuments.map((document) => (document.id === editingId ? data.document : document));
      });

      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({
        description: `${data.document.title} was ${editingId ? "updated" : "created"}.`,
        title: editingId ? "Content updated" : "Content created",
        variant: "success",
      });
      await loadAuditActivity();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save content document.";
      setErrorMessage(message);
      toast({
        description: message,
        title: "Content save failed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Extract<ContentStatus, "published" | "unpublished">) => {
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/content-documents/${id}/${status === "published" ? "publish" : "unpublish"}`, {
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await readApiResponse<ContentDocumentResponse>(response);

      setDocuments((currentDocuments) => currentDocuments.map((document) => (document.id === id ? data.document : document)));
      toast({
        description:
          status === "published"
            ? `${data.document.title} is now visible to the PWA.`
            : `${data.document.title} is hidden from the PWA.`,
        title: status === "published" ? "Content published" : "Content unpublished",
        variant: "success",
      });
      await loadAuditActivity();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update content status.";
      setErrorMessage(message);
      toast({
        description: message,
        title: status === "published" ? "Publish failed" : "Unpublish failed",
        variant: "destructive",
      });
    }
  };

  const archiveDocument = async (id: string) => {
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/content-documents/${id}`, {
        method: "DELETE",
      });
      const data = await readApiResponse<ContentDocumentResponse>(response);

      setDocuments((currentDocuments) => currentDocuments.map((document) => (document.id === id ? data.document : document)));
      toast({
        description: `${data.document.title} was archived.`,
        title: "Content archived",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive content document.";
      setErrorMessage(message);
      toast({
        description: message,
        title: "Archive failed",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="sedona-eyebrow">Admin content</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Content management</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Manage workbook, book, video, audio, and safety resource metadata before it appears inside the PWA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-10 rounded-full border-[#E4DBCE] bg-[#FBF7EF] px-4 text-[#7C7363] hover:border-[#CDBEA8] hover:text-[#16352B]"
            onClick={() => {
              setSyncState("Knowledge base sync queued");
              toast({
                description: "The admin request has been queued for the future knowledge-base sync workflow.",
                title: "Knowledge base sync queued",
              });
            }}
            type="button"
            variant="outline"
          >
            <Bot aria-hidden="true" className="size-4" />
            Sync KB
          </Button>
          <Button className="h-10 rounded-full bg-[#12362C] px-4 text-[#F4EFE6] hover:bg-[#1B493B]" onClick={openCreateDialog} type="button">
            <Plus aria-hidden="true" className="size-4" />
            New content
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1">
        {metrics.map((tile) => {
          const Icon = tile.icon;

          return (
            <article className="min-w-[220px] flex-1 rounded-[18px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]" key={tile.label}>
              <div className="flex items-center justify-between gap-4">
                <span className={cn("flex size-11 items-center justify-center rounded-2xl", toneClasses[tile.tone])}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">{syncState}</span>
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

      <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">{errorMessage}</div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="sedona-eyebrow">Library</p>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Content documents</h2>
            <p className="mt-1 text-sm leading-6 text-[#7C7363]">Draft and publish content metadata for future PWA screens.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_150px_150px_160px]">
            <label className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89A82]" />
              <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search content" value={search} />
            </label>
            <select
              className="h-11 rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
              onChange={(event) => setTypeFilter(event.target.value as "all" | ContentType)}
              value={typeFilter}
            >
              <option value="all">All types</option>
              {contentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
              onChange={(event) => setPhaseFilter(event.target.value as PhaseFilter)}
              value={phaseFilter}
            >
              {phaseOptions.map((phase) => (
                <option key={phase} value={phase}>
                  {phase === "all" ? "All phases" : formatLabel(phase)}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
              onChange={(event) => setStatusFilter(event.target.value as "all" | ContentStatus)}
              value={statusFilter}
            >
              <option value="all">All status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E8DFD1]">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[minmax(260px,1.25fr)_0.55fr_0.65fr_0.75fr_0.9fr_0.55fr_220px] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
              <span>Content</span>
              <span>Type</span>
              <span>Phase</span>
              <span>Status</span>
              <span>PWA placement</span>
              <span>Version</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#E8DFD1]">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">Loading content documents...</div>
              ) : null}
              {!isLoading && filteredDocuments.map((document) => {
                const TypeIcon = typeIcons[document.type];

                return (
                  <div className="grid grid-cols-[minmax(260px,1.25fr)_0.55fr_0.65fr_0.75fr_0.9fr_0.55fr_220px] items-center gap-4 px-4 py-4 text-sm" key={document.id}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-[#FBF7EF] text-[#B85028]">
                        <TypeIcon aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#16352B]">{document.title}</p>
                        <p className="mt-1 truncate text-xs font-medium text-[#A89A82]">{document.path ?? "No path"} - {formatFileSize(document.fileSizeBytes)}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#7C7363]">{formatLabel(document.type)}</span>
                    <span className="font-semibold text-[#7C7363]">{document.phase ? formatLabel(document.phase) : "None"}</span>
                    <span><span className={getStatusClasses(document.status)}>{formatLabel(document.status)}</span></span>
                    <span className="font-medium text-[#7C7363]">{getPwaPlacement(document)}</span>
                    <span className="font-semibold text-[#7C7363]">v{document.version}</span>
                    <div className="flex items-center justify-end gap-2">
                      <Link className="rounded-full border border-[#E4DBCE] p-2 text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" href={`/admin/content/${document.id}`}>
                        <Eye aria-hidden="true" className="size-4" />
                        <span className="sr-only">View {document.title}</span>
                      </Link>
                      <button className="rounded-full border border-[#E4DBCE] p-2 text-[#7C7363] transition hover:border-[#CDBEA8] hover:text-[#16352B]" onClick={() => openEditDialog(document)} type="button">
                        <Pencil aria-hidden="true" className="size-4" />
                        <span className="sr-only">Edit {document.title}</span>
                      </button>
                      {document.status === "published" ? (
                        <button className="rounded-full border border-[#E4DBCE] px-3 py-2 text-xs font-semibold text-[#B85028] transition hover:border-[#E8BDA9]" onClick={() => updateStatus(document.id, "unpublished")} type="button">
                          Unpublish
                        </button>
                      ) : (
                        <button className="rounded-full border border-[#D9E7DD] px-3 py-2 text-xs font-semibold text-[#3E7A5E] transition hover:border-[#B8D5C4]" onClick={() => updateStatus(document.id, "published")} type="button">
                          Publish
                        </button>
                      )}
                      <button className="rounded-full border border-[#E4DBCE] p-2 text-[#B85028] transition hover:border-[#E8BDA9]" onClick={() => archiveDocument(document.id)} type="button">
                        <Archive aria-hidden="true" className="size-4" />
                        <span className="sr-only">Archive {document.title}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {!isLoading && filteredDocuments.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#D8CBB7] bg-[#FBF7EF] p-8 text-center">
            <p className="font-serif text-2xl text-[#16352B]">No content matches these filters</p>
            <p className="mt-2 text-sm text-[#7C7363]">Try clearing filters or add a new content document.</p>
          </div>
        ) : null}
      </article>

      <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Audit activity</p>
            <h2 className="mt-1 font-serif text-3xl font-normal">Recent content changes</h2>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
            <History aria-hidden="true" className="size-5" />
          </span>
        </div>
        {auditErrorMessage ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#EDB879]">{auditErrorMessage}</div>
        ) : null}

        <div className="mt-5 space-y-3">
          {isAuditLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm font-semibold text-[#C7D1C8]">Loading activity...</div>
          ) : null}

          {!isAuditLoading && auditActivity.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm font-semibold text-[#C7D1C8]">No content changes recorded yet.</div>
          ) : null}

          {!isAuditLoading && auditActivity.map((item) => (
            <Link className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10" href={`/admin/content/${item.entityId}`} key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{formatLabel(item.action)}</span>
                <span className="text-xs font-semibold text-[#EDB879]">{formatDateTime(item.createdAt)}</span>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-[#C7D1C8]">{getAuditContentText(item, documents)}</p>
              <span className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", auditToneClasses[item.action])}>{getAuditStatusText(item)}</span>
            </Link>
          ))}
        </div>
      </article>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit content document" : "New content document"}</DialogTitle>
              <DialogDescription>Add the metadata that matches Fatiq&apos;s content document API. File upload itself can be connected later.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#7C7363]">Title</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Phase 1 Stabilize Workbook" required value={form.title} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Type</span>
                <select className="h-11 w-full rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm" onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ContentType }))} value={form.type}>
                  {contentTypeOptions.map((type) => (
                    <option key={type} value={type}>{formatLabel(type)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Status</span>
                <select className="h-11 w-full rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm" onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ContentStatus }))} value={form.status}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{formatLabel(status)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Phase</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, phase: event.target.value }))} placeholder="stabilize" value={form.phase} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Path</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))} placeholder="phase-1/chapter-c/regulate" value={form.path} />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#7C7363]">File URL</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, fileUrl: event.target.value }))} placeholder="https://example.com/content.pdf" type="url" value={form.fileUrl} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Storage provider</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, storageProvider: event.target.value }))} placeholder="s3, r2, linked" value={form.storageProvider} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">Storage key</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, storageKey: event.target.value }))} placeholder="workbooks/phase-1.pdf" value={form.storageKey} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">MIME type</span>
                <Input onChange={(event) => setForm((current) => ({ ...current, mimeType: event.target.value }))} placeholder="application/pdf" value={form.mimeType} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#7C7363]">File size bytes</span>
                <Input min="0" onChange={(event) => setForm((current) => ({ ...current, fileSizeBytes: event.target.value }))} placeholder="2400000" type="number" value={form.fileSizeBytes} />
              </label>
            </div>

            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} type="button" variant="outline">Cancel</Button>
              <Button className="bg-[#B85028] text-white hover:bg-[#9D431F]" disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : editingId ? "Save changes" : "Create content"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
