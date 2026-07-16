import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { userAppRoot, signInUrl } from "@/lib/auth/routes";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl);
  }

  if (session.user.role !== "admin") {
    redirect(userAppRoot);
  }

  return <AdminShell>{children}</AdminShell>;
}
