import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";

import { UserAppShell } from "@/components/user/user-app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await auth.protect();

  return <UserAppShell>{children}</UserAppShell>;
}
