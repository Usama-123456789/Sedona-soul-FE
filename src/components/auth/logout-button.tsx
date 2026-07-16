"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { onboardingCompleteCookieName, signInUrl } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";

interface LogoutButtonProps extends ButtonProps {
  label?: string;
}

export function LogoutButton({ className, disabled, label = "Log out", variant = "outline", ...props }: LogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    clearLocalSessionHints();
    await signOut({ redirectTo: signInUrl });
  }

  return (
    <Button
      className={cn("rounded-[16px] font-bold", className)}
      disabled={disabled || isSigningOut}
      onClick={handleLogout}
      type="button"
      variant={variant}
      {...props}
    >
      {isSigningOut ? (
        <>
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

function clearLocalSessionHints() {
  document.cookie = `${onboardingCompleteCookieName}=; path=/; max-age=0; samesite=lax`;
  window.localStorage.removeItem(onboardingCompleteCookieName);
}
