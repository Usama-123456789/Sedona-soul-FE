import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { BackendAuthError, createBackendAuthToken } from "@/lib/auth/backend-auth";
import { getBackendUrl } from "@/lib/api/backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const jsonError = (code: string, message: string, status: number, details?: unknown) =>
  NextResponse.json(
    {
      ok: false,
      error: {
        code,
        details,
        message,
      },
    },
    { status },
  );

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return jsonError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  let token: string;

  try {
    token = createBackendAuthToken(session);
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }

    throw error;
  }

  const { id } = await params;
  const range = request.headers.get("range");
  const audioResponse = await fetch(getBackendUrl(`/audio-chapters/${encodeURIComponent(id)}/stream`), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
  });

  if (!audioResponse.ok || !audioResponse.body) {
    const payload = (await audioResponse.json().catch(() => null)) as
      | {
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
        }
      | null;

    return jsonError(
      payload?.error?.code ?? "AUDIO_STREAM_FAILED",
      payload?.error?.message ?? "Unable to load the audio file.",
      audioResponse.status || 502,
      payload?.error?.details,
    );
  }

  const headers = new Headers();
  const passthroughHeaders = [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
  ];

  for (const header of passthroughHeaders) {
    const value = audioResponse.headers.get(header);

    if (value) {
      headers.set(header, value);
    }
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "audio/mpeg");
  }

  return new Response(audioResponse.body, {
    headers,
    status: audioResponse.status,
    statusText: audioResponse.statusText,
  });
}
