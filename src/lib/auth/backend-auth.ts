import { createHmac } from "node:crypto";

import type { Session } from "next-auth";

const backendApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const authTokenSecret = process.env.AUTH_TOKEN_SECRET ?? "";
const authTokenIssuer = process.env.AUTH_TOKEN_ISSUER ?? "sedona-soul-web";
const authTokenAudience = process.env.AUTH_TOKEN_AUDIENCE ?? "sedona-soul-api";

type BackendApiSuccess<T> = {
  ok: true;
  data: T;
};

type BackendApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type BackendUser = {
  id: string;
  authProvider: "authjs" | "credentials";
  authProviderUserId: string;
  email: string;
  preferredName: string | null;
  role: "user" | "admin";
  status: "active" | "disabled" | "deleted";
  onboardingComplete: boolean;
  baselineCompleted: boolean;
  currentPhase: "stabilize" | "heal" | "elevate" | string;
  currentModule: string | null;
  termsAcceptedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CredentialsAuthResult = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: BackendUser;
};

export class BackendAuthError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor({
    code,
    details,
    message,
    status,
  }: {
    code: string;
    details?: unknown;
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "BackendAuthError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export function createBackendAuthToken(session: Session) {
  const userId = session.user?.authProviderUserId ?? session.user?.id;
  const email = session.user?.email;
  const authProvider = session.user?.authProvider ?? "authjs";

  if (!userId || !email) {
    throw new BackendAuthError({
      code: "SESSION_USER_INCOMPLETE",
      message: "Signed-in user is missing the id or email required for backend sync.",
      status: 401,
    });
  }

  if (!authTokenSecret || authTokenSecret.length < 32) {
    throw new BackendAuthError({
      code: "AUTH_TOKEN_SECRET_MISSING",
      message: "AUTH_TOKEN_SECRET must be configured in the frontend environment.",
      status: 500,
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeBase64UrlJson({
    alg: "HS256",
    typ: "JWT",
  });
  const encodedPayload = encodeBase64UrlJson({
    sub: userId,
    email,
    name: session.user.name ?? undefined,
    provider: authProvider,
    role: session.user.role,
    iss: authTokenIssuer,
    aud: authTokenAudience,
    iat: now,
    exp: now + 60 * 60,
  });
  const signature = createHmac("sha256", authTokenSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}


export async function loginWithBackendCredentials(payload: { email: string; password: string }) {
  return backendPublicRequest<CredentialsAuthResult>("/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function signupWithBackendCredentials(payload: {
  email: string;
  password: string;
  passwordConfirmation: string;
  preferredName: string;
}) {
  return backendPublicRequest<CredentialsAuthResult>("/auth/signup", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function syncBackendUser(session: Session) {
  const token = createBackendAuthToken(session);

  return backendAuthRequest<{ created: boolean; user: BackendUser }>("/auth/sync", token, {
    body: JSON.stringify({
      preferredName: session.user.name,
    }),
    method: "POST",
  });
}

export async function getBackendCurrentUser(session: Session) {
  const token = createBackendAuthToken(session);

  return backendAuthRequest<{ user: BackendUser }>("/auth/me", token, {
    method: "GET",
  });
}

export async function completeBackendOnboarding(session: Session) {
  const token = createBackendAuthToken(session);

  return backendAuthRequest<{ user: BackendUser }>("/auth/onboarding/complete", token, {
    method: "POST",
  });
}


async function backendPublicRequest<T>(path: string, init: RequestInit) {
  if (!backendApiBaseUrl) {
    throw new BackendAuthError({
      code: "BACKEND_API_URL_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL must be configured.",
      status: 500,
    });
  }

  const response = await fetch(`${backendApiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as BackendApiSuccess<T> | BackendApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;

    throw new BackendAuthError({
      code: error?.code ?? "BACKEND_AUTH_REQUEST_FAILED",
      details: error?.details,
      message: error?.message ?? "Backend auth request failed.",
      status: response.status,
    });
  }

  return payload.data;
}

async function backendAuthRequest<T>(path: string, token: string, init: RequestInit) {
  if (!backendApiBaseUrl) {
    throw new BackendAuthError({
      code: "BACKEND_API_URL_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL must be configured.",
      status: 500,
    });
  }

  const response = await fetch(`${backendApiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as BackendApiSuccess<T> | BackendApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;

    throw new BackendAuthError({
      code: error?.code ?? "BACKEND_AUTH_REQUEST_FAILED",
      details: error?.details,
      message: error?.message ?? "Backend auth request failed.",
      status: response.status,
    });
  }

  return payload.data;
}

function encodeBase64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
