import Link from "next/link";
import { BarChart3, FileText, Headphones, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";

const adminNavItems: Array<{ href: string; icon: LucideIcon; label: string }> = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/content", icon: FileText, label: "Content" },
  { href: "/admin/reports", icon: BarChart3, label: "Reports" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/safety", icon: ShieldCheck, label: "Safety" },
  { href: "/admin/audio", icon: Headphones, label: "Audio" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-[#F4EFE6] text-[#16352B]">
      <aside className="hidden w-72 shrink-0 bg-[#12362C] p-6 text-[#F4EFE6] lg:block">
        <div className="mb-8">
          <p className="font-serif text-2xl">Sedona Soul</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#BDB5A6]">Admin</p>
        </div>
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#E7E4D8] hover:bg-white/10" href={item.href} key={item.href}>
                <Icon aria-hidden="true" className="size-5 shrink-0 text-[#D9D2C3]" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-[#E4DBCE] bg-white/70 px-6 py-4 backdrop-blur">
          <p className="text-sm font-semibold text-[#7C7363]">Admin dashboard foundation</p>
          <LogoutButton className="h-10 border-[#E4DBCE] bg-white px-4 text-sm text-[#7C7363]" />
        </header>
        <div className="p-6">{children}</div>
      </section>
    </main>
  );
}
