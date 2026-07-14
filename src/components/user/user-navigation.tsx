import Link from "next/link";
import { Heart, Home, LineChart, MessageSquare, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export const userNavItems = [
  { href: "/app/home", label: "Home", icon: Home, featured: false },
  { href: "/app/guide", label: "Guide", icon: MessageSquare, featured: false },
  { href: "/app/today", label: "Today", icon: Sun, featured: true },
  { href: "/app/partner", label: "Partner", icon: Heart, featured: false },
  { href: "/app/progress", label: "Progress", icon: LineChart, featured: false },
] as const;

export function UserSidebar() {
  return (
    <aside className="hidden w-[86px] shrink-0 flex-col gap-1 bg-sedona-pine px-3 py-6 text-sedona-sand pwa:flex lg:w-64 lg:px-4">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sedona-copper to-sedona-clayDark">
          <Heart aria-hidden="true" size={21} strokeWidth={1.8} />
        </div>
        <div className="hidden lg:block">
          <p className="font-serif text-xl leading-none text-[#F1EDE2]">Sedona Soul</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BDB5A6]">Recovery & Repair</p>
        </div>
      </div>

      <nav className="space-y-1">
        {userNavItems
          .filter((item) => !item.featured)
          .map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="flex items-center justify-center gap-3 rounded-[14px] px-3 py-3 text-[#E7E4D8] hover:bg-white/10 lg:justify-start"
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                <span className="hidden text-sm font-semibold lg:inline">{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="flex-1" />

      <Link
        className="flex items-center justify-center gap-3 rounded-[16px] bg-gradient-to-br from-sedona-copper to-[#A2461F] px-3 py-4 text-white shadow-[0_10px_22px_-10px_rgba(160,70,31,0.75)] lg:justify-start lg:px-4"
        href="/app/today"
      >
        <Sun aria-hidden="true" size={22} strokeWidth={1.8} />
        <span className="hidden text-sm font-semibold lg:inline">Daily check-in</span>
      </Link>
    </aside>
  );
}

export function UserBottomNavigation() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-sedona-creamLine bg-white/95 px-5 py-3 shadow-nav backdrop-blur pwa:hidden">
      {userNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={cn(
              item.featured
                ? "-my-8 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-sedona-copper text-white shadow-[0_12px_28px_-14px_rgba(176,79,36,0.75)]"
                : "flex min-w-12 flex-col items-center gap-1 text-[#A99C86]",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" size={item.featured ? 28 : 22} strokeWidth={1.9} />
            <span className={item.featured ? "text-xs font-semibold" : "text-[11px] font-semibold"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
