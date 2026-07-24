import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  adminRoot,
  authRedirectRoot,
  onboardingCompleteCookieName,
  onboardingRoot,
  signInUrl,
  userAppRoot,
} from "@/lib/auth/routes";

const authRoutes = ["/login", "/signup", "/signup/invite", "/forgot-password", "/reset-password"];

export function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

export function isOnboardingRoute(pathname: string) {
  return pathname === onboardingRoot;
}

export function isAuthRedirectRoute(pathname: string) {
  return pathname === authRedirectRoot;
}

export function isUserAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function hasCompletedOnboarding(request: NextRequest) {
  return request.cookies.get(onboardingCompleteCookieName)?.value === "true";
}

export function buildSignInRedirect(request: NextRequest) {
  const redirectUrl = new URL(signInUrl, request.url);
  redirectUrl.searchParams.set("redirect_url", request.url);

  return NextResponse.redirect(redirectUrl);
}

export function buildSignedInPublicRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL(authRedirectRoot, request.url));
}

export function buildAdminRootRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL(adminRoot, request.url));
}

export function buildUserAppRootRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL(userAppRoot, request.url));
}

export function buildOnboardingRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL(onboardingRoot, request.url));
}
