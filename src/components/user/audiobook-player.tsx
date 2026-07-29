"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Check,
  Circle,
  Image as ImageIcon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { PageShell } from "@/components/layouts/page-shell";
import {
  getAudioChapterPlayback,
  getAudioResumeProgress,
  listUserAudioChapters,
  saveAudioChapterProgress,
} from "@/lib/api/audio";
import { cn } from "@/lib/utils";
import type { AudioPlaybackResponse, AudioResumeResponse, UserAudioChapter } from "@/types/audio";

const playbackSpeeds = [1, 1.2, 1.5, 2];

const formatLabel = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatTime = (seconds: number | null | undefined) => {
  const normalizedSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const remainingSeconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getSubtitle = (chapter: UserAudioChapter | null) => {
  const path = chapter?.path ?? "";

  if (path.includes("orientation")) {
    return "Orientation";
  }

  if (path.includes("bleeding") || chapter?.title.includes("Stop the Bleeding")) {
    return "Conflict de-escalation";
  }

  if (path.includes("horsemen") || chapter?.title.includes("Get Oriented")) {
    return "Pain Body & the Four Horsemen";
  }

  if (path.includes("regulate") || chapter?.title.includes("Regulate")) {
    return "Nervous-system foundation";
  }

  if (path.includes("solo") || chapter?.title.includes("Solo")) {
    return "Up next";
  }

  return formatLabel(chapter?.path) || "Audiobook chapter";
};

export function AudiobookPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<{ chapterId: string | null; seconds: number; speed: number }>({
    chapterId: null,
    seconds: -1,
    speed: 1,
  });
  const [chapters, setChapters] = useState<UserAudioChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<AudioPlaybackResponse | null>(null);
  const [resume, setResume] = useState<AudioResumeResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [metadataDuration, setMetadataDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.2);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId],
  );

  const durationSeconds = playback?.chapter.durationSeconds ?? selectedChapter?.durationSeconds ?? metadataDuration;
  const remainingSeconds = Math.max(0, durationSeconds - currentTime);
  const progressPercent = durationSeconds > 0 ? Math.min(100, Math.max(0, (currentTime / durationSeconds) * 100)) : 0;
  const progressRangeStyle = {
    "--audio-progress": `${progressPercent}%`,
  } as CSSProperties;
  const hasPlaybackUrl = Boolean(playback?.playback.audioUrl);
  const audioSourceUrl = selectedChapterId && hasPlaybackUrl ? `/api/audio-chapters/${selectedChapterId}/stream` : undefined;

  const saveProgress = useCallback(
    async (completed = false, explicitTime?: number) => {
      const chapterId = selectedChapterId;
      const seconds = Math.max(0, Math.round(explicitTime ?? audioRef.current?.currentTime ?? currentTime));

      if (!chapterId || chapterId.startsWith("fallback-")) {
        return;
      }

      if (
        !completed &&
        lastSavedRef.current.chapterId === chapterId &&
        Math.abs(lastSavedRef.current.seconds - seconds) < 8 &&
        lastSavedRef.current.speed === playbackSpeed
      ) {
        return;
      }

      try {
        await saveAudioChapterProgress(chapterId, {
          completed,
          playbackSpeed,
          playbackTimestampSeconds: seconds,
        });

        lastSavedRef.current = {
          chapterId,
          seconds,
          speed: playbackSpeed,
        };

        if (completed) {
          setCompletedIds((currentIds) => new Set(currentIds).add(chapterId));
        }
      } catch {
        // Progress saving is retried on the next interval/user action.
      }
    },
    [currentTime, playbackSpeed, selectedChapterId],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInitialAudio = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [resumeResult, chapterResult] = await Promise.allSettled([
          getAudioResumeProgress(),
          listUserAudioChapters({ phase: "stabilize" }),
        ]);

        if (cancelled) {
          return;
        }

        if (chapterResult.status === "rejected") {
          throw chapterResult.reason;
        }

        const resumeData = resumeResult.status === "fulfilled" ? resumeResult.value : null;
        const chapterData = chapterResult.value;
        const sortedChapters = chapterData.sort((a, b) => a.chapterOrder - b.chapterOrder);
        setResume(resumeData);
        setChapters(sortedChapters);

        const resumeChapterId = resumeData?.chapter?.id;
        const nextSelectedId =
          resumeChapterId && sortedChapters.some((chapter) => chapter.id === resumeChapterId)
            ? resumeChapterId
            : sortedChapters[0]?.id ?? null;

        setSelectedChapterId(nextSelectedId);

        if (resumeData?.progress?.playbackSpeed) {
          setPlaybackSpeed(resumeData.progress.playbackSpeed);
        }

        if (resumeData?.progress?.completed && resumeChapterId) {
          setCompletedIds(new Set([resumeChapterId]));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load audiobook chapters.";

        if (cancelled) {
          return;
        }

        setErrorMessage(message);
        setResume(null);
        setChapters([]);
        setSelectedChapterId(null);
        setCurrentTime(0);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialAudio();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedChapterId || selectedChapterId.startsWith("fallback-")) {
      setPlayback(null);
      const fallbackTime = selectedChapterId === resume?.chapter?.id ? resume?.progress?.playbackTimestampSeconds ?? 0 : 0;
      setCurrentTime(fallbackTime);
      return;
    }

    let cancelled = false;

    const loadPlayback = async () => {
      setIsPlaybackLoading(true);
      setErrorMessage(null);
      setIsPlaying(false);
      setMetadataDuration(0);

      try {
        const data = await getAudioChapterPlayback(selectedChapterId);

        if (cancelled) {
          return;
        }

        const resumeTime =
          selectedChapterId === resume?.chapter?.id ? Math.round(resume.progress?.playbackTimestampSeconds ?? 0) : 0;

        setPlayback(data);
        setCurrentTime(resumeTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load chapter playback.";

        if (!cancelled) {
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsPlaybackLoading(false);
        }
      }
    };

    void loadPlayback();

    return () => {
      cancelled = true;
    };
  }, [resume, selectedChapterId]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.playbackRate = playbackSpeed;
    audio.muted = isMuted;
  }, [isMuted, playback, playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !audioSourceUrl) {
      return;
    }

    audio.load();
  }, [audioSourceUrl]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || selectedChapterId?.startsWith("fallback-")) {
      return;
    }

    const handleLoadedMetadata = () => {
      const resumeTime =
        selectedChapterId === resume?.chapter?.id ? Math.round(resume.progress?.playbackTimestampSeconds ?? 0) : currentTime;

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setMetadataDuration(Math.round(audio.duration));
      }

      if (resumeTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(resumeTime, Math.max(0, audio.duration - 1));
      }

      audio.playbackRate = playbackSpeed;
    };

    const handleError = () => {
      setIsPlaying(false);
      setErrorMessage("The audio file could not be loaded. Please check the uploaded file and try again.");
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || durationSeconds);
      void saveProgress(true, audio.duration || durationSeconds);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentTime, durationSeconds, playback, playbackSpeed, resume, saveProgress, selectedChapterId]);

  useEffect(() => {
    if (!isPlaying) {
      if (saveTimerRef.current) {
        window.clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      return;
    }

    saveTimerRef.current = window.setInterval(() => {
      void saveProgress(false);
    }, 15000);

    return () => {
      if (saveTimerRef.current) {
        window.clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [isPlaying, saveProgress]);

  const togglePlayback = async () => {
    if (!selectedChapter || isPlaybackLoading || !hasPlaybackUrl) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      void saveProgress(false);
      return;
    }

    setErrorMessage(null);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";

      setErrorMessage(`Playback could not start. ${message}`);
    }
  };

  const seekTo = (value: number) => {
    const nextTime = Math.min(Math.max(value, 0), durationSeconds || value);

    setCurrentTime(nextTime);

    if (audioRef.current && playback?.playback.audioUrl) {
      audioRef.current.currentTime = nextTime;
      void saveProgress(false, nextTime);
    }
  };

  const jumpBy = (seconds: number) => {
    seekTo(currentTime + seconds);
  };

  const selectChapter = (chapterId: string) => {
    if (chapterId === selectedChapterId) {
      return;
    }

    void saveProgress(false);
    audioRef.current?.pause();
    setPlayback(null);
    setSelectedChapterId(chapterId);
    setCurrentTime(0);
    setMetadataDuration(0);
    setIsPlaying(false);
  };

  const changeSpeed = () => {
    const currentIndex = playbackSpeeds.findIndex((speed) => speed === playbackSpeed);
    const nextSpeed = playbackSpeeds[(currentIndex + 1) % playbackSpeeds.length] ?? 1;

    setPlaybackSpeed(nextSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    const nextMutedState = !isMuted;

    setIsMuted(nextMutedState);

    if (audioRef.current) {
      audioRef.current.muted = nextMutedState;
    }
  };

  const displayChapter = selectedChapter ?? chapters[0] ?? null;
  const phaseLabel = displayChapter?.phase ? `Phase 1 · ${formatLabel(displayChapter.phase)}` : "Phase 1 · Stabilize";

  return (
    <PageShell className="relative min-h-full pb-12 pt-10 pwa:pb-12 pwa:pt-16 xl:pt-20" maxWidth="md">
      <div className="mx-auto flex w-full max-w-[760px] flex-col">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-[0.32em] text-[#AFA38F]">Audiobook</p>
          <Link
            aria-label="Close audiobook"
            className="flex size-11 items-center justify-center rounded-full bg-white text-[#7C7363] shadow-[0_12px_28px_-18px_rgba(48,30,16,0.42)] transition-colors hover:text-[#B85028] sm:size-12"
            href="/app/home"
          >
            <X aria-hidden="true" className="size-6" strokeWidth={1.9} />
          </Link>
        </div>

        <section className="mt-7 flex flex-col items-center text-center sm:mt-10">
          <div className="relative flex aspect-square w-[214px] max-w-[64vw] flex-col items-center justify-center overflow-hidden rounded-[30px] border border-dashed border-[#6F8275]/55 bg-[linear-gradient(150deg,#C7CCC2_0%,#8B9A8E_50%,#6F8275_100%)] text-[#54645B] shadow-[0_26px_52px_-28px_rgba(48,30,16,0.52)] sm:w-[244px]">
            <ImageIcon aria-hidden="true" className="size-9 opacity-55" strokeWidth={1.7} />
            <p className="mt-2 text-sm font-semibold">Cover art</p>
            <p className="mt-8 text-[11px] font-bold uppercase leading-[1.2] tracking-[0.22em] text-[#E7B27E]">
              High-Vibe
              <br />
              Relationships
            </p>
            <p className="mt-2 font-serif text-xl text-[#F6F1E8]">Recovery & Repair</p>
          </div>

          <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.24em] text-[#B85028]">{phaseLabel}</p>
          <h1 className="mt-2 font-serif text-[30px] font-normal leading-tight text-[#16352B] sm:text-[34px]">
            {displayChapter?.title ?? "Audiobook"}
          </h1>
          <p className="mt-1 text-[15px] font-semibold text-[#A89A82]">Read by your Soul Guide</p>

          {errorMessage ? (
            <div className="mt-5 w-full rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-left text-sm font-semibold text-[#B85028]">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-9 w-full">
            <input
              aria-label="Audio progress"
              className="sedona-audio-range w-full"
              max={durationSeconds || 0}
              min={0}
              onChange={(event) => seekTo(Number(event.target.value))}
              style={progressRangeStyle}
              type="range"
              value={Math.min(currentTime, durationSeconds || currentTime)}
            />
            <div className="mt-1 flex justify-between text-[15px] font-semibold text-[#A89A82]">
              <span>{formatTime(currentTime)}</span>
              <span>{durationSeconds ? `-${formatTime(remainingSeconds)}` : "--:--"}</span>
            </div>
            <div className="sr-only" aria-live="polite">
              {Math.round(progressPercent)} percent complete.
            </div>
          </div>

          <div className="mt-6 flex w-full items-center justify-center gap-6 text-[#5C685F] sm:gap-10">
            <button className="min-w-12 rounded-full px-2 py-2 text-[15px] font-semibold" onClick={changeSpeed} type="button">
              {playbackSpeed.toFixed(playbackSpeed % 1 === 0 ? 0 : 1)}x
            </button>
            <button
              aria-label="Rewind 15 seconds"
              className="relative flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/70"
              onClick={() => jumpBy(-15)}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-8" strokeWidth={1.8} />
              <span aria-hidden="true" className="absolute text-[9px] font-bold leading-none text-[#5C685F]">
                15
              </span>
            </button>
            <button
              aria-label={isPlaying ? "Pause audiobook" : "Play audiobook"}
              className="flex size-[86px] items-center justify-center rounded-full bg-[#C65B2B] text-white shadow-[0_22px_38px_-18px_rgba(198,91,43,0.95)] transition-transform active:scale-[0.98] disabled:opacity-60 sm:size-[92px]"
              disabled={!displayChapter || isPlaybackLoading || !hasPlaybackUrl}
              onClick={() => void togglePlayback()}
              type="button"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="size-8 fill-current" strokeWidth={1.8} />
              ) : (
                <Play aria-hidden="true" className="ml-1 size-8 fill-current" strokeWidth={1.8} />
              )}
            </button>
            <button
              aria-label="Forward 30 seconds"
              className="relative flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/70"
              onClick={() => jumpBy(30)}
              type="button"
            >
              <RotateCw aria-hidden="true" className="size-8" strokeWidth={1.8} />
              <span aria-hidden="true" className="absolute text-[9px] font-bold leading-none text-[#5C685F]">
                30
              </span>
            </button>
            <button
              aria-label={isMuted ? "Unmute audiobook" : "Mute audiobook"}
              className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-white/70"
              onClick={toggleMute}
              type="button"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" className="size-6 text-[#7C7363]" strokeWidth={1.8} />
              ) : (
                <Volume2 aria-hidden="true" className="size-6 text-[#7C7363]" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </section>

        <section className="mt-10">
          <p className="text-[12px] font-bold uppercase tracking-[0.32em] text-[#AFA38F]">Chapters</p>
          <div className="mt-3 rounded-[28px] bg-white p-3 shadow-[0_22px_44px_-30px_rgba(48,30,16,0.48)]">
            {isLoading ? (
              <div className="px-5 py-10 text-center text-sm font-semibold text-[#7C7363]">Loading audiobook...</div>
            ) : null}

            {!isLoading && chapters.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-serif text-2xl text-[#16352B]">No chapters available</p>
                <p className="mt-2 text-sm text-[#7C7363]">Published audio chapters will appear here once admin adds them.</p>
              </div>
            ) : null}

            {!isLoading &&
              chapters.map((chapter) => {
                const active = chapter.id === selectedChapterId;
                const completed = completedIds.has(chapter.id) || chapter.chapterOrder < (displayChapter?.chapterOrder ?? 0);
                const upNext = !active && !completed && chapter.chapterOrder > (displayChapter?.chapterOrder ?? 0);

                return (
                  <button
                    className={cn(
                      "grid min-h-[74px] w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-[23px] px-4 py-3 text-left transition-colors",
                      active ? "bg-[#F4EFE6]" : "hover:bg-[#FBF7EF]",
                    )}
                    key={chapter.id}
                    onClick={() => selectChapter(chapter.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full",
                        completed && "bg-[#DCECE2] text-[#3E7A5E]",
                        active && !completed && "bg-[#F7E5DA] text-[#B85028]",
                        !active && !completed && "border-2 border-[#D8CDBD] text-transparent",
                      )}
                    >
                      {completed ? <Check aria-hidden="true" className="size-4" strokeWidth={2.4} /> : null}
                      {active && !completed ? <Play aria-hidden="true" className="ml-0.5 size-3 fill-current" /> : null}
                      {!active && !completed ? <Circle aria-hidden="true" className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-base font-bold",
                          active && "text-[#16352B]",
                          completed && !active && "text-[#243C34]",
                          upNext && "text-[#A89A82]",
                          !active && !completed && !upNext && "text-[#243C34]",
                        )}
                      >
                        {chapter.title}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium text-[#A89A82]">{getSubtitle(chapter)}</span>
                    </span>
                    <span className="text-sm font-semibold text-[#A89A82]">{formatTime(chapter.durationSeconds)}</span>
                  </button>
                );
              })}
          </div>
        </section>

        <audio preload="metadata" ref={audioRef} src={audioSourceUrl}>
          <track kind="captions" />
        </audio>
      </div>
    </PageShell>
  );
}
