import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAppShell } from "@/components/user/user-app-shell";
import { getBackendUrl } from "@/lib/api/backend-proxy";
import { createBackendAuthToken } from "@/lib/auth/backend-auth";
import { entrySafetyCompleteCookieName, safetyLockCookieName, signInUrl } from "@/lib/auth/routes";
import type { ApiSuccess } from "@/lib/api/audio";
import type { DashboardContext } from "@/types/check-in";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl);
  }

  const cookieStore = await cookies();
  const hasEntrySafetyComplete = cookieStore.get(entrySafetyCompleteCookieName)?.value === "true";
  let isSafetyLocked = cookieStore.get(safetyLockCookieName)?.value === "true";

  try {
    const token = createBackendAuthToken(session);
    const response = await fetch(getBackendUrl("/dashboard"), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = (await response.json().catch(() => null)) as ApiSuccess<DashboardContext> | null;
    const dashboard = payload?.ok ? payload.data : null;

    const todaySession = dashboard?.dailySession.todaySession;
    const entrySafetyWasCleared =
      todaySession?.source === "entry_safety" && hasEntrySafetyComplete;

    if (todaySession?.status === "safety_exited" && !entrySafetyWasCleared) {
      isSafetyLocked = true;
    }
  } catch {
    // Keep the cookie-derived lock state if dashboard is temporarily unavailable.
  }

  return <UserAppShell isSafetyLocked={isSafetyLocked}>{children}</UserAppShell>;
}
