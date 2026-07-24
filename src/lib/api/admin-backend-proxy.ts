import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { BackendAuthError, createBackendAuthToken } from "@/lib/auth/backend-auth";

const getBackendApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.BACKEND_API_URL ?? "";

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be configured.");
  }

  return apiUrl.replace(/\/$/, "");
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

export async function proxyAdminBackend(path: string, init: RequestInit = {}) {
  const session = await auth();

  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);
  }

  if (session.user.role !== "admin") {
    return apiError("FORBIDDEN", "Admin access is required.", 403);
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

  const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
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
