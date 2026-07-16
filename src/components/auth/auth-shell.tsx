import type { ReactNode } from "react";
import { Heart } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="h-dvh overflow-hidden bg-sedona-pine px-4 py-4 text-sedona-paper sm:px-6 sm:py-5">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[560px] flex-col items-center justify-center gap-4">
        <header className="flex w-full flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sedona-copper text-white shadow-float sm:h-16 sm:w-16">
            <Heart aria-hidden="true" className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.3} />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-[#E8B777] sm:mt-4 sm:text-[11px]">
            Sedona Soul · Recovery & Repair
          </p>
          <h1 className="mt-2 font-serif text-[36px] leading-[1.05] tracking-normal text-[#F8F1E7] sm:mt-3 sm:text-[44px]">
            Come as you are.
          </h1>
          <p className="mt-3 max-w-[400px] text-center text-sm font-medium leading-6 text-[#AEBEAF] sm:text-base">
            A private, trauma-informed companion for repairing your relationship — together or alone.
          </p>
        </header>

        {children}

        <p className="max-w-[440px] text-center text-xs font-medium leading-5 text-[#83998B] sm:text-sm">
          Your journal and check-ins are private to you. Nothing is shared with your partner unless you choose it.
        </p>
      </div>
    </main>
  );
}
