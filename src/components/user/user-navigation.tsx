"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LineChart, MessageSquare, Sun } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

export const userNavItems = [
  { href: "/app/home", label: "Home", icon: Home, featured: false },
  { href: "/app/guide", label: "Guide", icon: MessageSquare, featured: false },
  { href: "/app/today", label: "Today", icon: Sun, featured: true },
  { href: "/app/partner", label: "Partner", icon: Heart, featured: false },
  { href: "/app/progress", label: "Progress", icon: LineChart, featured: false },
] as const;

const isActiveRoute = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="User app navigation"
      className="hidden w-[82px] shrink-0 flex-col gap-1 bg-sedona-pine px-3 py-6 text-sedona-sand pwa:flex lg:w-[236px] lg:px-4 xl:w-64"
    >
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
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-3 rounded-[14px] px-3 py-3 text-[#E7E4D8] transition-colors hover:bg-white/10 focus-visible:ring-white/30 lg:justify-start lg:px-4",
                  active && "bg-white/[0.12] text-white shadow-[inset_3px_0_0_rgba(192,97,58,0.95)]",
                )}
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

      <div className="space-y-2">
        <LogoutButton
          className="min-h-12 w-full justify-center rounded-[14px] border-white/10 bg-white/5 px-3 py-3 text-[#E7E4D8] hover:bg-white/10 hover:text-white lg:justify-start lg:px-4"
          label="Logout"
          variant="ghost"
        />
        <Link
          aria-current={isActiveRoute(pathname, "/app/today") ? "page" : undefined}
          className="flex min-h-14 items-center justify-center gap-3 rounded-[16px] bg-gradient-to-br from-sedona-copper to-[#A2461F] px-3 py-4 text-white shadow-[0_10px_22px_-10px_rgba(160,70,31,0.75)] transition-transform active:scale-[0.98] lg:justify-start lg:px-4"
          href="/app/today"
        >
          <Sun aria-hidden="true" size={22} strokeWidth={1.8} />
          <span className="hidden text-sm font-semibold lg:inline">Daily check-in</span>
        </Link>
      </div>
    </aside>
  );
}

export function UserBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pwa:hidden"
    >
      <div className="grid h-[76px] w-full grid-cols-5 items-center rounded-[28px] border border-sedona-creamLine bg-white/95 px-3 shadow-nav backdrop-blur">
        {userNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={item.featured ? "Today check-in" : item.label}
              className={cn(
                "group relative flex min-h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-[18px] text-center transition-[color,transform,background-color] duration-200 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-sedona-copper focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                item.featured
                  ? "-mt-7 h-[68px] w-[68px] justify-center rounded-full bg-sedona-copper text-white shadow-[0_14px_28px_-14px_rgba(176,79,36,0.85)]"
                  : "text-[#A99C86] hover:bg-sedona-sand/70 hover:text-sedona-pineSoft",
                active && !item.featured && "bg-sedona-sand text-sedona-clay",
                active && item.featured && "bg-sedona-clay text-white shadow-[0_16px_32px_-14px_rgba(143,62,27,0.8)]",
              )}
              href={item.href}
              key={item.href}
            >
              {!item.featured && active ? (
                <span className="absolute top-1.5 h-1 w-5 rounded-full bg-sedona-clay" />
              ) : null}
              <Icon
                aria-hidden="true"
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  item.featured && "mb-0.5",
                  active && "scale-105",
                )}
                size={item.featured ? 28 : 22}
                strokeWidth={active ? 2.2 : 1.9}
              />
              <span
                className={cn(
                  "max-w-full truncate font-semibold leading-none",
                  item.featured ? "text-xs" : "text-[11px]",
                  active && !item.featured && "text-sedona-clay",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function UserMobileLogout() {
  return (
    <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40 pwa:hidden">
      <LogoutButton
        aria-label="Log out"
        className="h-11 rounded-full border-sedona-creamLine bg-white/95 px-4 text-xs text-sedona-clay shadow-card backdrop-blur hover:bg-[#FFF8F4]"
        label="Logout"
      />
    </div>
  );
}
