"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Archive,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileAudio,
  Headphones,
  ListMusic,
  Pencil,
  Plus,
  Search,
  UploadCloud,
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
import {
  archiveAdminAudioChapter,
  createAdminAudioChapter,
  createAudioContentDocument,
  listAdminAudioChapters,
  updateAdminAudioChapter,
  updateAudioContentDocument,
  uploadAudioFile,
} from "@/lib/api/audio";
import { cn } from "@/lib/utils";
import type { AdminAudioChapter, AudioChapterStatus } from "@/types/audio";

type AudioCreateForm = {
  title: string;
  phase: string;
  path: string;
  chapterOrder: string;
  duration: string;
  status: AudioChapterStatus;
  file: File | null;
};

type AudioEditForm = {
  title: string;
  chapterOrder: string;
  duration: string;
  status: AudioChapterStatus;
};

type MetricTile = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "pine" | "clay" | "blue" | "sage";
};

const statusOptions: Array<AudioChapterStatus | "all"> = ["all", "draft", "published", "unpublished"];
const phaseOptions = ["all", "stabilize", "heal", "elevate"];

const emptyCreateForm: AudioCreateForm = {
  chapterOrder: "1",
  duration: "",
  file: null,
  path: "phase-1/chapter-c/regulate",
  phase: "stabilize",
  status: "draft",
  title: "",
};

const toneClasses: Record<MetricTile["tone"], string> = {
  blue: "bg-[#E8ECF5] text-[#465980]",
  clay: "bg-[#F7E5DA] text-[#B85028]",
  pine: "bg-[#E4ECE6] text-[#12362C]",
  sage: "bg-[#E4EFE8] text-[#3E7A5E]",
};

const statusClasses: Record<AudioChapterStatus, string> = {
  draft: "bg-[#E8ECF5] text-[#465980]",
  published: "bg-[#E4EFE8] text-[#3E7A5E]",
  unpublished: "bg-[#F7E5DA] text-[#B85028]",
};

const formatLabel = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds || seconds <= 0) {
    return "No duration";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const parseDuration = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (!trimmedValue.includes(":")) {
    const seconds = Number(trimmedValue);

    return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null;
  }

  const parts = trimmedValue.split(":").map((part) => Number(part));

  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;

    return Math.round(minutes * 60 + seconds);
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;

    return Math.round(hours * 3600 + minutes * 60 + seconds);
  }

  return null;
};

const formatFileSize = (bytes: number | null | undefined) => {
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
    return "Not updated";
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

const getNextChapterOrder = (chapters: AdminAudioChapter[]) => {
  const maxOrder = chapters.reduce((max, chapter) => Math.max(max, chapter.chapterOrder), 0);

  return String(maxOrder + 1);
};

export function AdminAudioManager() {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<AdminAudioChapter[]>([]);
  const [createForm, setCreateForm] = useState<AudioCreateForm>(emptyCreateForm);
  const [editForm, setEditForm] = useState<AudioEditForm | null>(null);
  const [editingChapter, setEditingChapter] = useState<AdminAudioChapter | null>(null);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AudioChapterStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadChapters = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await listAdminAudioChapters({
        page: 1,
        pageSize: 100,
        phase: phaseFilter === "all" ? undefined : phaseFilter,
        status: statusFilter,
      });

      setChapters(data.chapters);
      setCreateForm((currentForm) => ({
        ...currentForm,
        chapterOrder: currentForm.chapterOrder || getNextChapterOrder(data.chapters),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load audio chapters.";
      setErrorMessage(message);
      toast({
        description: message,
        title: "Audio chapters unavailable",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [phaseFilter, statusFilter, toast]);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  const metrics: MetricTile[] = useMemo(() => {
    const published = chapters.filter((chapter) => chapter.status === "published").length;
    const draft = chapters.filter((chapter) => chapter.status === "draft").length;
    const totalDurationSeconds = chapters.reduce((total, chapter) => total + (chapter.durationSeconds ?? 0), 0);

    return [
      { label: "Audio chapters", value: String(chapters.length), helper: "Metadata records", icon: ListMusic, tone: "pine" },
      { label: "Published", value: String(published), helper: "Visible in PWA", icon: CheckCircle2, tone: "sage" },
      { label: "Draft", value: String(draft), helper: "Admin-only", icon: CircleDashed, tone: "blue" },
      { label: "Runtime", value: formatDuration(totalDurationSeconds), helper: "Known duration", icon: Clock3, tone: "clay" },
    ];
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return chapters.filter((chapter) => {
      const matchesSearch =
        !normalizedSearch ||
        chapter.title.toLowerCase().includes(normalizedSearch) ||
        chapter.path?.toLowerCase().includes(normalizedSearch) ||
        chapter.phase?.toLowerCase().includes(normalizedSearch) ||
        chapter.audioDocument?.title.toLowerCase().includes(normalizedSearch);

      return matchesSearch;
    });
  }, [chapters, search]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setCreateForm((currentForm) => ({
      ...currentForm,
      file,
      title: currentForm.title || file?.name.replace(/\.[^/.]+$/, "") || "",
    }));

    if (!file) {
      return;
    }

    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setCreateForm((currentForm) => ({
          ...currentForm,
          duration: currentForm.duration || formatDuration(Math.round(audio.duration)),
        }));
      }

      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = createForm.title.trim();
    const chapterOrder = Number(createForm.chapterOrder);
    const durationSeconds = parseDuration(createForm.duration);

    if (!title || !createForm.file || !Number.isInteger(chapterOrder) || chapterOrder <= 0 || isSaving) {
      setErrorMessage("Please add an audio file, title, and positive chapter order.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const uploadedFile = await uploadAudioFile(createForm.file);
      const documentRecord = await createAudioContentDocument({
        fileSizeBytes: uploadedFile.fileSizeBytes,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
        path: createForm.path.trim() || null,
        phase: createForm.phase.trim() || null,
        status: createForm.status,
        storageKey: uploadedFile.storageKey,
        storageProvider: uploadedFile.storageProvider,
        title,
      });
      const chapter = await createAdminAudioChapter({
        chapterOrder,
        contentDocumentId: documentRecord.id,
        durationSeconds,
        status: createForm.status,
        title,
      });

      setChapters((currentChapters) => [chapter, ...currentChapters].sort((a, b) => a.chapterOrder - b.chapterOrder));
      setCreateForm({
        ...emptyCreateForm,
        chapterOrder: getNextChapterOrder([chapter, ...chapters]),
      });
      toast({
        description: `${chapter.title} is linked to ${documentRecord.title}.`,
        title: "Audio chapter created",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create audio chapter.";
      setErrorMessage(message);
      toast({
        description: message,
        title: "Audio upload failed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (chapter: AdminAudioChapter) => {
    setEditingChapter(chapter);
    setEditForm({
      chapterOrder: String(chapter.chapterOrder),
      duration: chapter.durationSeconds ? formatDuration(chapter.durationSeconds) : "",
      status: chapter.status,
      title: chapter.title,
    });
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingChapter || !editForm || isSaving) {
      return;
    }

    const title = editForm.title.trim();
    const chapterOrder = Number(editForm.chapterOrder);
    const durationSeconds = parseDuration(editForm.duration);

    if (!title || !Number.isInteger(chapterOrder) || chapterOrder <= 0) {
      toast({
        description: "Please add a title and positive chapter order before saving.",
        title: "Chapter needs details",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedChapter = await updateAdminAudioChapter(editingChapter.id, {
        chapterOrder,
        durationSeconds,
        status: editForm.status,
        title,
      });

      if (editingChapter.audioDocument && editingChapter.audioDocument.status !== editForm.status) {
        await updateAudioContentDocument(editingChapter.contentDocumentId, {
          status: editForm.status,
        });
      }

      setChapters((currentChapters) =>
        currentChapters
          .map((chapter) => (chapter.id === updatedChapter.id ? updatedChapter : chapter))
          .sort((a, b) => a.chapterOrder - b.chapterOrder),
      );
      setEditingChapter(null);
      setEditForm(null);
      toast({
        description: `${updatedChapter.title} was updated.`,
        title: "Audio chapter updated",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update audio chapter.";
      toast({
        description: message,
        title: "Audio update failed",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const archiveChapter = async (chapter: AdminAudioChapter) => {
    if (isArchivingId) {
      return;
    }

    setIsArchivingId(chapter.id);

    try {
      const updatedChapter = await archiveAdminAudioChapter(chapter.id);

      setChapters((currentChapters) =>
        currentChapters.map((currentChapter) => (currentChapter.id === updatedChapter.id ? updatedChapter : currentChapter)),
      );
      toast({
        description: `${updatedChapter.title} is now hidden from the PWA.`,
        title: "Audio chapter archived",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive audio chapter.";
      toast({
        description: message,
        title: "Archive failed",
        variant: "destructive",
      });
    } finally {
      setIsArchivingId(null);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] xl:flex-row xl:items-center xl:justify-between xl:px-6">
        <div>
          <p className="sedona-eyebrow">Admin audio</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Audiobook manager</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Upload chapter audio, create its linked content document, and publish chapters into the user PWA.
          </p>
        </div>
        <Button
          className="h-10 rounded-full border-[#E4DBCE] bg-[#FBF7EF] px-4 text-[#7C7363] hover:border-[#CDBEA8] hover:text-[#16352B]"
          onClick={() => void loadChapters()}
          type="button"
          variant="outline"
        >
          <Headphones aria-hidden="true" className="size-4" />
          Refresh audio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((tile) => {
          const Icon = tile.icon;

          return (
            <article
              className="rounded-[18px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]"
              key={tile.label}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={cn("flex size-11 items-center justify-center rounded-2xl", toneClasses[tile.tone])}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">
                  Audio
                </span>
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
        <div className="flex flex-col gap-2">
          <p className="sedona-eyebrow">Upload</p>
          <h2 className="font-serif text-3xl font-normal text-[#16352B]">Create audiobook chapter</h2>
          <p className="max-w-3xl text-sm leading-6 text-[#7C7363]">
            The uploaded file becomes an audio content document. The chapter record stores order, duration, and publish status.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">
            {errorMessage}
          </div>
        ) : null}

        <form className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.65fr_0.85fr_0.85fr]" onSubmit={handleCreateSubmit}>
          <label className="flex min-h-[142px] cursor-pointer flex-col justify-center rounded-[18px] border border-dashed border-[#D8CDBD] bg-[#FBF7EF] px-5 py-4 transition-colors hover:border-[#B85028]/50">
            <span className="flex items-center gap-3 text-sm font-semibold text-[#16352B]">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#B85028] shadow-sm">
                <UploadCloud aria-hidden="true" className="size-5" />
              </span>
              Upload audio file
            </span>
            <span className="mt-3 line-clamp-2 text-sm leading-6 text-[#7C7363]">
              {createForm.file ? `${createForm.file.name} - ${formatFileSize(createForm.file.size)}` : "MP3, M4A, AAC, WAV, or OGG direct upload."}
            </span>
            <input accept="audio/*" className="sr-only" onChange={handleFileChange} type="file" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-4">
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Chapter title</span>
              <Input
                className="mt-2"
                onChange={(event) => setCreateForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
                placeholder="C · Regulate"
                value={createForm.title}
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Order</span>
              <Input
                className="mt-2"
                min={1}
                onChange={(event) => setCreateForm((currentForm) => ({ ...currentForm, chapterOrder: event.target.value }))}
                placeholder="4"
                type="number"
                value={createForm.chapterOrder}
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Duration</span>
              <Input
                className="mt-2"
                onChange={(event) => setCreateForm((currentForm) => ({ ...currentForm, duration: event.target.value }))}
                placeholder="44:30"
                value={createForm.duration}
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Phase</span>
              <select
                className="mt-2 h-11 w-full rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
                onChange={(event) => setCreateForm((currentForm) => ({ ...currentForm, phase: event.target.value }))}
                value={createForm.phase}
              >
                <option value="stabilize">Stabilize</option>
                <option value="heal">Heal</option>
                <option value="elevate">Elevate</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Status</span>
              <select
                className="mt-2 h-11 w-full rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
                onChange={(event) =>
                  setCreateForm((currentForm) => ({ ...currentForm, status: event.target.value as AudioChapterStatus }))
                }
                value={createForm.status}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">PWA path</span>
              <Input
                className="mt-2"
                onChange={(event) => setCreateForm((currentForm) => ({ ...currentForm, path: event.target.value }))}
                placeholder="phase-1/chapter-c/regulate"
                value={createForm.path}
              />
            </label>
            <div className="flex items-end">
              <Button className="h-11 w-full rounded-full bg-[#B85028] text-white hover:bg-[#A34520]" disabled={isSaving} type="submit">
                <Plus aria-hidden="true" className="size-4" />
                {isSaving ? "Creating..." : "Create chapter"}
              </Button>
            </div>
          </div>
        </form>
      </article>

      <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="sedona-eyebrow">Library</p>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Audio chapters</h2>
            <p className="mt-1 text-sm leading-6 text-[#7C7363]">Published chapters appear in the PWA audiobook player.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[260px_150px_170px]">
            <label className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89A82]" />
              <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search audio" value={search} />
            </label>
            <select
              className="h-11 rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
              onChange={(event) => setPhaseFilter(event.target.value)}
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
              onChange={(event) => setStatusFilter(event.target.value as AudioChapterStatus | "all")}
              value={statusFilter}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All status" : formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E8DFD1]">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[90px_minmax(260px,1.3fr)_0.7fr_0.75fr_0.75fr_minmax(220px,1fr)_180px] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
              <span>Order</span>
              <span>Chapter</span>
              <span>Phase</span>
              <span>Duration</span>
              <span>Status</span>
              <span>Document</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#E8DFD1]">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm font-semibold text-[#7C7363]">Loading audio chapters...</div>
              ) : null}

              {!isLoading && filteredChapters.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-serif text-2xl text-[#16352B]">No audio chapters yet</p>
                  <p className="mt-2 text-sm text-[#7C7363]">Upload the first chapter above to prepare the audiobook MVP.</p>
                </div>
              ) : null}

              {!isLoading &&
                filteredChapters.map((chapter) => (
                  <div
                    className="grid grid-cols-[90px_minmax(260px,1.3fr)_0.7fr_0.75fr_0.75fr_minmax(220px,1fr)_180px] items-center gap-4 px-4 py-4 text-sm"
                    key={chapter.id}
                  >
                    <span className="font-serif text-3xl text-[#B85028]">{chapter.chapterOrder}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-[#F7E5DA] text-[#B85028]">
                        <FileAudio aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#16352B]">{chapter.title}</p>
                        <p className="mt-1 truncate text-xs font-medium text-[#A89A82]">{chapter.path ?? "No path"}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#7C7363]">{chapter.phase ? formatLabel(chapter.phase) : "None"}</span>
                    <span className="font-semibold text-[#7C7363]">{formatDuration(chapter.durationSeconds)}</span>
                    <span>
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusClasses[chapter.status])}>
                        {formatLabel(chapter.status)}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#7C7363]">{chapter.audioDocument?.title ?? "No document"}</p>
                      <p className="mt-1 truncate text-xs font-medium text-[#A89A82]">
                        {formatFileSize(chapter.audioDocument?.fileSizeBytes)} - {formatDateTime(chapter.updatedAt)}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        className="h-9 rounded-full border-[#E4DBCE] bg-white px-3 text-[#7C7363]"
                        onClick={() => openEditDialog(chapter)}
                        type="button"
                        variant="outline"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Edit
                      </Button>
                      <Button
                        className="h-9 rounded-full border-[#E8BDA9] bg-[#FFF7F3] px-3 text-[#B85028]"
                        disabled={isArchivingId === chapter.id || chapter.status === "unpublished"}
                        onClick={() => void archiveChapter(chapter)}
                        type="button"
                        variant="outline"
                      >
                        <Archive aria-hidden="true" className="size-4" />
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </article>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingChapter(null);
            setEditForm(null);
          }
        }}
        open={Boolean(editingChapter && editForm)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit audio chapter</DialogTitle>
            <DialogDescription>Update chapter metadata. File replacement stays in content management for later scope.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <form className="grid gap-4" id="audio-edit-form" onSubmit={handleEditSubmit}>
              <label>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Chapter title</span>
                <Input
                  className="mt-2"
                  onChange={(event) => setEditForm((currentForm) => currentForm && { ...currentForm, title: event.target.value })}
                  value={editForm.title}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Order</span>
                  <Input
                    className="mt-2"
                    min={1}
                    onChange={(event) => setEditForm((currentForm) => currentForm && { ...currentForm, chapterOrder: event.target.value })}
                    type="number"
                    value={editForm.chapterOrder}
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Duration</span>
                  <Input
                    className="mt-2"
                    onChange={(event) => setEditForm((currentForm) => currentForm && { ...currentForm, duration: event.target.value })}
                    placeholder="44:30"
                    value={editForm.duration}
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#A89A82]">Status</span>
                  <select
                    className="mt-2 h-11 w-full rounded-control border border-[#E4DBCE] bg-white px-3 text-sm font-semibold text-[#7C7363] shadow-sm"
                    onChange={(event) =>
                      setEditForm((currentForm) =>
                        currentForm ? { ...currentForm, status: event.target.value as AudioChapterStatus } : currentForm,
                      )
                    }
                    value={editForm.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </label>
              </div>
            </form>
          ) : null}
          <DialogFooter>
            <Button
              className="rounded-full border-[#E4DBCE] bg-white text-[#7C7363]"
              onClick={() => {
                setEditingChapter(null);
                setEditForm(null);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button className="rounded-full bg-[#12362C] text-[#F4EFE6] hover:bg-[#1B493B]" disabled={isSaving} form="audio-edit-form" type="submit">
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
