import type {
  AdminAudioChapter,
  AudioChapterStatus,
  AudioPlaybackResponse,
  AudioProgress,
  AudioResumeResponse,
  UserAudioChapter,
} from "@/types/audio";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class FrontendApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "FrontendApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function readApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;

    throw new FrontendApiError(error?.message ?? "Request failed.", response.status, error?.code, error?.details);
  }

  return payload.data;
}

export type UploadedContentFile = {
  fileUrl: string;
  storageProvider: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  originalFilename: string;
};

export type ContentDocument = {
  id: string;
  title: string;
  type: "workbook" | "book" | "audio" | "video" | "resource";
  phase: string | null;
  path: string | null;
  status: AudioChapterStatus;
  fileUrl: string | null;
  storageProvider: string | null;
  storageKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  version: number;
  updatedAt: string;
};

export async function uploadAudioFile(file: File) {
  const response = await fetch("/api/admin/uploads/content-file?type=audio", {
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": file.name,
    },
    method: "POST",
  });

  const data = await readApiResponse<{ file: UploadedContentFile }>(response);

  return data.file;
}

export async function createAudioContentDocument(payload: {
  title: string;
  phase: string | null;
  path: string | null;
  status: AudioChapterStatus;
  fileUrl: string;
  storageProvider: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
}) {
  const response = await fetch("/api/admin/content-documents", {
    body: JSON.stringify({
      ...payload,
      type: "audio",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = await readApiResponse<{ document: ContentDocument }>(response);

  return data.document;
}

export async function updateAudioContentDocument(
  id: string,
  payload: Partial<{
    title: string;
    phase: string | null;
    path: string | null;
    status: AudioChapterStatus;
  }>,
) {
  const response = await fetch(`/api/admin/content-documents/${id}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  const data = await readApiResponse<{ document: ContentDocument }>(response);

  return data.document;
}

export async function listAdminAudioChapters(params: {
  page?: number;
  pageSize?: number;
  phase?: string;
  path?: string;
  status?: AudioChapterStatus | "all";
} = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 100),
  });

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.phase) {
    query.set("phase", params.phase);
  }

  if (params.path) {
    query.set("path", params.path);
  }

  const response = await fetch(`/api/admin/audio-chapters?${query.toString()}`, {
    cache: "no-store",
  });

  return readApiResponse<{
    chapters: AdminAudioChapter[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(response);
}

export async function createAdminAudioChapter(payload: {
  title: string;
  chapterOrder: number;
  durationSeconds: number | null;
  contentDocumentId: string;
  status: AudioChapterStatus;
}) {
  const response = await fetch("/api/admin/audio-chapters", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = await readApiResponse<{ chapter: AdminAudioChapter }>(response);

  return data.chapter;
}

export async function updateAdminAudioChapter(
  id: string,
  payload: Partial<{
    title: string;
    chapterOrder: number;
    durationSeconds: number | null;
    contentDocumentId: string;
    status: AudioChapterStatus;
  }>,
) {
  const response = await fetch(`/api/admin/audio-chapters/${id}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  const data = await readApiResponse<{ chapter: AdminAudioChapter }>(response);

  return data.chapter;
}

export async function archiveAdminAudioChapter(id: string) {
  const response = await fetch(`/api/admin/audio-chapters/${id}`, {
    method: "DELETE",
  });

  const data = await readApiResponse<{ archived: boolean; chapter: AdminAudioChapter }>(response);

  return data.chapter;
}

export async function listUserAudioChapters(params: { phase?: string; path?: string } = {}) {
  const query = new URLSearchParams();

  if (params.phase) {
    query.set("phase", params.phase);
  }

  if (params.path) {
    query.set("path", params.path);
  }

  const suffix = query.size ? `?${query.toString()}` : "";
  const response = await fetch(`/api/audio-chapters${suffix}`, {
    cache: "no-store",
  });

  const data = await readApiResponse<{ chapters: UserAudioChapter[] }>(response);

  return data.chapters;
}

export async function getAudioResumeProgress() {
  const response = await fetch("/api/audio-chapters/progress/resume", {
    cache: "no-store",
  });

  return readApiResponse<AudioResumeResponse>(response);
}

export async function getAudioChapterPlayback(id: string) {
  const response = await fetch(`/api/audio-chapters/${id}/playback`, {
    cache: "no-store",
  });

  return readApiResponse<AudioPlaybackResponse>(response);
}

export async function saveAudioChapterProgress(
  id: string,
  payload: {
    playbackTimestampSeconds: number;
    completed: boolean;
    playbackSpeed: number;
  },
) {
  const response = await fetch(`/api/audio-chapters/${id}/progress`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });

  const data = await readApiResponse<{ progress: AudioProgress }>(response);

  return data.progress;
}
