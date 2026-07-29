import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { BackendAuthError, createBackendAuthToken } from "@/lib/auth/backend-auth";

export const getBackendApiBaseUrl = () => {
  const apiUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL or BACKEND_API_URL is required.");
  }

  return apiUrl.replace(/\/$/, "");
};

export const getBackendUrl = (path: string) => {
  const baseUrl = getBackendApiBaseUrl();

  if (baseUrl.endsWith("/api/v1") && path.startsWith("/api/v1/")) {
    return `${baseUrl}${path.slice("/api/v1".length)}`;
  }

  return `${baseUrl}${path}`;
};

const apiError = (code: string, message: string, status: number, details?: unknown) =>
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

export async function proxyBackendPost(path: string, body: unknown) {
  const response = await fetch(getBackendUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  return NextResponse.json(payload, {
    status: response.status,
  });
}

export async function proxyAuthenticatedBackend(path: string, init: RequestInit = {}) {
  const session = await auth();

  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  let token: string;

  try {
    token = createBackendAuthToken(session);
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return apiError(error.code, error.message, error.status, error.details);
    }

    throw error;
  }

  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(getBackendUrl(path), {
    ...init,
    cache: "no-store",
    headers,
  });
  const payload = await response.json().catch(() => null);

  return NextResponse.json(
    payload ?? {
      ok: false,
      error: {
        code: "BACKEND_EMPTY_RESPONSE",
        message: "Backend returned an empty response.",
      },
    },
    { status: response.status },
  );
}
