export type AudioChapterStatus = "draft" | "published" | "unpublished";

export type AudioDocument = {
  id: string;
  title: string;
  type: "audio";
  status: AudioChapterStatus;
  fileUrl: string | null;
  storageProvider: string | null;
  storageKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  version: number;
};

export type AdminAudioChapter = {
  id: string;
  title: string;
  phase: string | null;
  path: string | null;
  chapterOrder: number;
  durationSeconds: number | null;
  contentDocumentId: string;
  status: AudioChapterStatus;
  createdByAdminId?: string | null;
  updatedByAdminId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  audioDocument: AudioDocument | null;
};

export type UserAudioChapter = {
  id: string;
  title: string;
  phase: string | null;
  path: string | null;
  chapterOrder: number;
  durationSeconds: number | null;
  audio: {
    fileUrl: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    contentDocumentId: string;
    version: number;
  };
};

export type AudioPlaybackResponse = {
  chapter: {
    id: string;
    title: string;
    phase: string | null;
    path: string | null;
    chapterOrder: number;
    durationSeconds: number | null;
    contentDocumentId: string;
    contentVersion: number;
  };
  playback: {
    audioUrl: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    storageProvider: string;
    storageKey: string | null;
    isSignedUrl: boolean;
    expiresAt: string | null;
  };
};

export type AudioProgress = {
  id?: string;
  audioChapterId?: string;
  playbackTimestampSeconds: number;
  completed: boolean;
  playbackSpeed: number;
  completedAt?: string | null;
  updatedAt?: string;
};

export type AudioResumeResponse = {
  hasProgress: boolean;
  progress: AudioProgress | null;
  chapter: UserAudioChapter | null;
};

