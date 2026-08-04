import { NextResponse } from "next/server";

import { entrySafetyCompleteCookieName, onboardingCompleteCookieName, safetyLockCookieName } from "@/lib/auth/routes";

const cookiesToClear = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  onboardingCompleteCookieName,
  safetyLockCookieName,
  entrySafetyCompleteCookieName,
];

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const name of cookiesToClear) {
    const isClientCookie =
      name === onboardingCompleteCookieName || name === safetyLockCookieName || name === entrySafetyCompleteCookieName;

    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: !isClientCookie,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }

  return response;
}
