import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAppShell } from "@/components/user/user-app-shell";
import { signInUrl } from "@/lib/auth/routes";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl);
  }

  return <UserAppShell>{children}</UserAppShell>;
}
