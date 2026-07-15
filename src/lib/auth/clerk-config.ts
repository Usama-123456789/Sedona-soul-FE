export const clerkRoutes = {
  signInUrl: "/login",
  signUpUrl: "/signup",
  afterSignInUrl: "/app/home",
  afterSignUpUrl: "/app/home",
} as const;

export const requiredClerkEnv = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;
