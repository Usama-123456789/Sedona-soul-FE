import type { ReactNode } from "react";

import { MobileAppContainer } from "@/components/layouts/mobile-app-container";
import { SafeScrollArea } from "@/components/layouts/safe-scroll-area";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { UserBottomNavigation, UserSidebar } from "@/components/user/user-navigation";

export function UserAppShell({ children }: { children: ReactNode }) {
  return (
    <MobileAppContainer>
      <div className="min-h-dvh pwa:flex pwa:h-dvh">
        <UserSidebar />
        <SafeScrollArea bottomNav>{children}</SafeScrollArea>
        <UserBottomNavigation />
        <PwaInstallPrompt />
      </div>
    </MobileAppContainer>
  );
}
