import type { ReactNode } from "react";

import { MobileAppContainer } from "@/components/layouts/mobile-app-container";
import { SafeScrollArea } from "@/components/layouts/safe-scroll-area";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { UserBottomNavigation, UserMobileLogout, UserSidebar } from "@/components/user/user-navigation";

export function UserAppShell({ children }: { children: ReactNode }) {
  return (
    <MobileAppContainer>
      <div className="min-h-dvh w-full overflow-hidden bg-sedona-sand pwa:flex pwa:h-full pwa:min-h-0">
        <UserSidebar />
        <SafeScrollArea bottomNav>{children}</SafeScrollArea>
        <UserBottomNavigation />
        <UserMobileLogout />
        <PwaInstallPrompt />
      </div>
    </MobileAppContainer>
  );
}
