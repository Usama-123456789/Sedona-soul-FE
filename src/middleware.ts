import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildAdminRootRedirect,
  buildSignedInPublicRedirect,
  buildSignInRedirect,
  isAdminRoute,
  isAuthRedirectRoute,
  isAuthRoute,
  isOnboardingRoute,
  isUserAppRoute,
} from "@/lib/auth/route-guards";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = hasAuthSessionCookie(request);

  if (pathname === "/admin") {
    if (!hasSessionCookie) {
      return buildSignInRedirect(request);
    }

    return buildAdminRootRedirect(request);
  }

  if (pathname === "/app") {
    if (!hasSessionCookie) {
      return buildSignInRedirect(request);
    }

    return buildSignedInPublicRedirect(request);
  }

  if (isAuthRoute(pathname) && hasSessionCookie) {
    return buildSignedInPublicRedirect(request);
  }

  if (isAuthRedirectRoute(pathname) && !hasSessionCookie) {
    return buildSignInRedirect(request);
  }

  if (isOnboardingRoute(pathname)) {
    if (!hasSessionCookie) {
      return buildSignInRedirect(request);
    }
  }

  if ((isUserAppRoute(pathname) || isAdminRoute(pathname)) && !hasSessionCookie) {
    return buildSignInRedirect(request);
  }

  return NextResponse.next();
}

function hasAuthSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name === "authjs.session-token" || cookie.name === "__Secure-authjs.session-token");
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
