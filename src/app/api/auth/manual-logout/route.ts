import { NextResponse } from "next/server";

import { onboardingCompleteCookieName } from "@/lib/auth/routes";

const cookiesToClear = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  onboardingCompleteCookieName,
];

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: name !== onboardingCompleteCookieName,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }

  return response;
}
