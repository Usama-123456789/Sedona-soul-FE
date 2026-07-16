import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { authRedirectRoot } from "@/lib/auth/routes";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (session?.user) {
    redirect(authRedirectRoot);
  }

  return <AuthShell>{children}</AuthShell>;
}
