import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { clerkRoutes } from "@/lib/auth/clerk-config";

const isUserAppRoute = (pathname: string) => pathname === "/app" || pathname.startsWith("/app/");

export default clerkMiddleware(async (auth, request) => {
  if (!isUserAppRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (!userId) {
    const signInUrl = new URL(clerkRoutes.signInUrl, request.url);
    signInUrl.searchParams.set("redirect_url", request.url);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
