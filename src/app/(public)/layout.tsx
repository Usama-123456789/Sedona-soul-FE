import type { ReactNode } from "react";

import { MobileAppContainer } from "@/components/layouts/mobile-app-container";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <MobileAppContainer className="px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">{children}</div>
    </MobileAppContainer>
  );
}
