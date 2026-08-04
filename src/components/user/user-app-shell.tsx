import type { ReactNode } from "react";

import { MobileAppContainer } from "@/components/layouts/mobile-app-container";
import { SafeScrollArea } from "@/components/layouts/safe-scroll-area";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { SafetyLockedContent } from "@/components/user/safety-locked-content";
import { UserBottomNavigation, UserMobileLogout, UserSidebar } from "@/components/user/user-navigation";

export function UserAppShell({ children, isSafetyLocked = false }: { children: ReactNode; isSafetyLocked?: boolean }) {
  return (
    <MobileAppContainer>
      <div className="min-h-dvh w-full overflow-hidden bg-sedona-sand pwa:flex pwa:h-full pwa:min-h-0">
        <UserSidebar isSafetyLocked={isSafetyLocked} />
        <SafeScrollArea bottomNav>
          <SafetyLockedContent isSafetyLocked={isSafetyLocked}>{children}</SafetyLockedContent>
        </SafeScrollArea>
        <UserBottomNavigation isSafetyLocked={isSafetyLocked} />
        <UserMobileLogout />
        <PwaInstallPrompt />
      </div>
    </MobileAppContainer>
  );
}
