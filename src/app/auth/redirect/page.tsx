import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { getBackendCurrentUser, syncBackendUser } from "@/lib/auth/backend-auth";
import { getRoleForEmail } from "@/lib/auth/admin";
import {
  adminRoot,
  entrySafetyCompleteCookieName,
  entrySafetyRoot,
  onboardingRoot,
  signInUrl,
  userAppRoot,
} from "@/lib/auth/routes";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl);
  }

  let redirectTarget = userAppRoot;

  try {
    const result =
      session.user.authProvider === "credentials" ? await getBackendCurrentUser(session) : await syncBackendUser(session);
    const user = result.user;

    if (getRoleForEmail(user.email) === "admin" || session.user.role === "admin") {
      redirectTarget = adminRoot;
    } else if (!user.onboardingComplete || !user.baselineCompleted) {
      redirectTarget = onboardingRoot;
    } else {
      const cookieStore = await cookies();

      if (cookieStore.get(entrySafetyCompleteCookieName)?.value !== "true") {
        redirectTarget = entrySafetyRoot;
      }
    }
  } catch (error) {
    console.error("Backend auth sync failed", error);
    redirectTarget = `${signInUrl}?auth_error=backend_sync_failed`;
  }

  redirect(redirectTarget);
}
