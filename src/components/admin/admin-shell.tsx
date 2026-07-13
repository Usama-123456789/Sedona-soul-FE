import Link from "next/link";
import type { ReactNode } from "react";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/safety", label: "Safety" },
  { href: "/admin/audio", label: "Audio" },
  { href: "/admin/settings", label: "Settings" },
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
          {adminNavItems.map((item) => (
            <Link className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#E7E4D8] hover:bg-white/10" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <header className="border-b border-[#E4DBCE] bg-white/70 px-6 py-4 backdrop-blur">
          <p className="text-sm font-semibold text-[#7C7363]">Admin dashboard foundation</p>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </main>
  );
}
