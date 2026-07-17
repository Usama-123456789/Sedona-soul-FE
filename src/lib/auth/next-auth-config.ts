export const nextAuthRoutes = {
  signInUrl: "/login",
  signUpUrl: "/signup",
  afterSignInUrl: "/app/home",
  afterSignUpUrl: "/onboarding",
} as const;

export const authProviderIds = {
  google: "google",
} as const;

export const requiredNextAuthEnv = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;
