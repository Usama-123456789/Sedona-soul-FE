import type { DefaultSession } from "next-auth";

import type { AppRole } from "@/lib/auth/admin";

type AuthProvider = "authjs" | "credentials";

declare module "next-auth" {
  interface Session {
    user: {
      authProvider: AuthProvider;
      authProviderUserId: string;
      baselineCompleted?: boolean;
      id: string;
      onboardingComplete?: boolean;
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    authProvider?: AuthProvider;
    authProviderUserId?: string;
    baselineCompleted?: boolean;
    onboardingComplete?: boolean;
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: AuthProvider;
    authProviderUserId?: string;
    baselineCompleted?: boolean;
    onboardingComplete?: boolean;
    role?: AppRole;
  }
}
