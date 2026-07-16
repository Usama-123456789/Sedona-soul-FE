import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { adminRoot, signInUrl, userAppRoot } from "@/lib/auth/routes";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl);
  }

  redirect(session.user.role === "admin" ? adminRoot : userAppRoot);
}
