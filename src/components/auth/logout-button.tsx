"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
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
    clearBrowserSession();

    try {
      await fetch("/api/auth/manual-logout", {
        cache: "no-store",
        method: "POST",
      });
    } finally {
      window.location.replace(signInUrl);
    }
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

function clearBrowserSession() {
  window.localStorage.clear();
  window.sessionStorage.clear();

  for (const cookieName of getVisibleCookieNames()) {
    expireCookie(cookieName);
  }

  expireCookie(onboardingCompleteCookieName);
  expireCookie("authjs.session-token");
  expireCookie("__Secure-authjs.session-token");
  expireCookie("authjs.callback-url");
  expireCookie("__Secure-authjs.callback-url");
  expireCookie("authjs.csrf-token");
  expireCookie("__Host-authjs.csrf-token");
}

function getVisibleCookieNames() {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name));
}

function expireCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}
