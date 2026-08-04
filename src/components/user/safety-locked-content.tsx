"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield } from "lucide-react";

import { entrySafetyRoot } from "@/lib/auth/routes";

export function SafetyLockedContent({
  children,
  isSafetyLocked,
}: {
  children: ReactNode;
  isSafetyLocked: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isEntrySafetyRoute = pathname === entrySafetyRoot;

  useEffect(() => {
    if (isSafetyLocked && !isEntrySafetyRoute) {
      router.replace(entrySafetyRoot);
    }
  }, [isEntrySafetyRoute, isSafetyLocked, router]);

  if (!isSafetyLocked || isEntrySafetyRoute) {
    return children;
  }

  return (
    <section className="flex min-h-dvh flex-1 items-center justify-center bg-sedona-pine px-5 py-10 text-[#F7F0E7] pwa:min-h-full">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/10 text-[#E7B27E]">
          <Shield aria-hidden="true" size={30} strokeWidth={1.8} />
        </div>
        <h1 className="mt-7 font-serif text-[40px] font-normal leading-tight">Safety comes first.</h1>
        <p className="mt-4 text-base leading-7 text-[#D8D1C4]/78">
          The app is holding workbook, audio, and chat access until the safety gate is clear.
        </p>
        <Link
          className="mt-7 inline-flex min-h-14 items-center justify-center rounded-[18px] bg-white/10 px-8 text-base font-bold text-white hover:bg-white/15"
          href={entrySafetyRoot}
        >
          Return to safety gate
        </Link>
      </div>
    </section>
  );
}
