"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Play } from "lucide-react";

import { getAudioResumeProgress, listUserAudioChapters } from "@/lib/api/audio";
import type { AudioResumeResponse, UserAudioChapter } from "@/types/audio";

const formatMinutesLeft = (chapter: UserAudioChapter | null, seconds: number) => {
  const durationSeconds = chapter?.durationSeconds ?? 0;

  if (!durationSeconds) {
    return "";
  }

  const minutesLeft = Math.max(1, Math.round((durationSeconds - seconds) / 60));

  return `${minutesLeft} min left`;
};

const getFallbackLabel = (chapter: UserAudioChapter | null) => {
  if (!chapter) {
    return "Audiobook ready";
  }

  return `Start listening · ${chapter.title}`;
};

export function AudiobookResumeCard({ initialResume }: { initialResume?: AudioResumeResponse | null }) {
  const [resume, setResume] = useState<AudioResumeResponse | null>(initialResume ?? null);
  const [firstChapter, setFirstChapter] = useState<UserAudioChapter | null>(null);
  const [isLoading, setIsLoading] = useState(!initialResume);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    if (initialResume !== undefined) {
      setResume(initialResume);
      setIsLoading(false);

      if (initialResume?.chapter) {
        setFirstChapter(null);
        return;
      }
    }

    let cancelled = false;

    const loadResume = async () => {
      setIsLoading(true);
      setIsUnavailable(false);

      try {
        const resumeResult = await getAudioResumeProgress().catch(() => null);

        if (cancelled) {
          return;
        }

        setResume(resumeResult);

        if (!resumeResult?.chapter) {
          const chapters = await listUserAudioChapters({ phase: "stabilize" });

          if (!cancelled) {
            setFirstChapter(chapters.sort((a, b) => a.chapterOrder - b.chapterOrder)[0] ?? null);
          }
        }
      } catch {
        if (!cancelled) {
          setIsUnavailable(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadResume();

    return () => {
      cancelled = true;
    };
  }, [initialResume]);

  const cardState = useMemo(() => {
    const chapter = resume?.chapter ?? firstChapter;
    const progressSeconds = resume?.progress?.playbackTimestampSeconds ?? 0;

    if (isLoading) {
      return {
        helper: "Loading",
        label: "Finding your listening place...",
      };
    }

    if (isUnavailable) {
      return {
        helper: "",
        label: "Audiobook temporarily unavailable",
      };
    }

    if (resume?.hasProgress && resume.chapter) {
      return {
        helper: formatMinutesLeft(resume.chapter, progressSeconds),
        label: `Continue listening · ${resume.chapter.title}`,
      };
    }

    return {
      helper: chapter?.durationSeconds ? formatMinutesLeft(chapter, 0) : "",
      label: getFallbackLabel(chapter),
    };
  }, [firstChapter, isLoading, isUnavailable, resume]);

  return (
    <Link
      aria-label={cardState.label}
      className="group flex items-center gap-4 rounded-[22px] bg-[#12362C] px-5 py-4 text-[#F1EDE2] shadow-[0_16px_34px_-20px_rgba(18,54,44,0.72)] transition-transform active:scale-[0.99] min-[575px]:col-span-2 min-[575px]:px-6"
      href="/app/audiobook"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#C65B2B] text-white shadow-[0_12px_22px_-14px_rgba(198,91,43,0.95)]">
        <Play aria-hidden="true" className="ml-0.5 fill-current" size={22} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E7B27E]">Audiobook</p>
        <p className="mt-1 truncate text-[15px] font-semibold leading-tight text-[#F6F1E8] min-[575px]:text-base">
          {cardState.label}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 text-sm font-medium text-[#E7E4D8]/60">
        {cardState.helper ? <span className="hidden min-[420px]:inline">{cardState.helper}</span> : null}
        <ChevronRight
          aria-hidden="true"
          className="text-[#E7B27E] transition-transform group-hover:translate-x-0.5"
          size={22}
          strokeWidth={2.2}
        />
      </div>
    </Link>
  );
}
