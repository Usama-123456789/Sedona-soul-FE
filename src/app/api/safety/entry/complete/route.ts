import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { entrySafetyCompleteCookieName, safetyLockCookieName } from "@/lib/auth/routes";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(safetyLockCookieName, "", {
    expires: new Date(0),
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set(entrySafetyCompleteCookieName, "true", {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
