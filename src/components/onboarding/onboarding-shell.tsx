import type { ReactNode } from "react";

export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-sedona-sand text-sedona-pineSoft">{children}</main>
  );
}
