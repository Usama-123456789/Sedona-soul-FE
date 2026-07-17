import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { completeBackendOnboarding } from "@/lib/auth/backend-auth";

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

  try {
    const result = await completeBackendOnboarding(session);

    const response = NextResponse.json({ ok: true, data: result });
    response.cookies.set("sedona_onboarding_complete", "true", {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Unable to complete backend onboarding", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ONBOARDING_COMPLETE_FAILED",
          message: "Unable to save onboarding completion.",
        },
      },
      { status: 502 },
    );
  }
}
