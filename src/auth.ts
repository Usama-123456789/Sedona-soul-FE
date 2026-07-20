import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { getRoleForEmail, type AppRole } from "@/lib/auth/admin";
import { BackendAuthError, loginWithBackendCredentials, signupWithBackendCredentials } from "@/lib/auth/backend-auth";
import { signInUrl } from "@/lib/auth/routes";

type AuthProvider = "authjs" | "credentials";

type BackendSessionUser = {
  authProvider?: AuthProvider;
  authProviderUserId?: string;
  baselineCompleted?: boolean;
  onboardingComplete?: boolean;
  role?: AppRole;
};

class BackendCredentialsSignin extends CredentialsSignin {
  code: string;

  constructor(code: string) {
    super();
    this.code = code;
  }
}


function readCredentialValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readProvider(value: unknown): AuthProvider | undefined {
  return value === "authjs" || value === "credentials" ? value : undefined;
}

function readRole(value: unknown): AppRole | undefined {
  return value === "admin" || value === "user" ? value : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    jwt({ token, user }) {
      const backendUser = user as (typeof user & BackendSessionUser) | undefined;

      if (backendUser) {
        token.authProvider = backendUser.authProvider ?? "authjs";
        token.authProviderUserId = backendUser.authProviderUserId ?? token.sub ?? backendUser.id;
        token.baselineCompleted = backendUser.baselineCompleted;
        token.onboardingComplete = backendUser.onboardingComplete;
        token.role = getRoleForEmail(token.email) === "admin" ? "admin" : backendUser.role ?? "user";
      }

      token.role = getRoleForEmail(token.email) === "admin" ? "admin" : token.role ?? "user";
      token.authProvider = token.authProvider ?? "authjs";
      token.authProviderUserId = token.authProviderUserId ?? token.sub ?? "";

      return token;
    },
    session({ session, token }) {
      const authProviderUserId = readString(token.authProviderUserId) ?? readString(token.sub) ?? "";

      session.user.id = authProviderUserId;
      session.user.authProvider = readProvider(token.authProvider) ?? "authjs";
      session.user.authProviderUserId = authProviderUserId;
      session.user.baselineCompleted = readBoolean(token.baselineCompleted);
      session.user.onboardingComplete = readBoolean(token.onboardingComplete);
      session.user.role = readRole(token.role) ?? getRoleForEmail(token.email);

      return session;
    },
  },
  pages: {
    signIn: signInUrl,
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        authMode: { label: "Auth mode", type: "text" },
        email: { label: "Email", type: "email" },
        firstName: { label: "First name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const authMode = readCredentialValue(credentials?.authMode);
        const email = readCredentialValue(credentials?.email).toLowerCase();
        const password = readCredentialValue(credentials?.password);
        const firstName = readCredentialValue(credentials?.firstName);

        if (!email || !password) {
          return null;
        }

        let result;

        try {
          result =
            authMode === "signup"
              ? await signupWithBackendCredentials({
                  email,
                  password,
                  passwordConfirmation: password,
                  preferredName: firstName,
                })
              : await loginWithBackendCredentials({ email, password });
        } catch (error) {
          if (error instanceof BackendAuthError) {
            throw new BackendCredentialsSignin(getCredentialsSigninCode(error));
          }

          throw error;
        }

        return {
          id: result.user.authProviderUserId,
          authProvider: result.user.authProvider,
          authProviderUserId: result.user.authProviderUserId,
          baselineCompleted: result.user.baselineCompleted,
          email: result.user.email,
          image: null,
          name: result.user.preferredName ?? result.user.email,
          onboardingComplete: result.user.onboardingComplete,
          role: getRoleForEmail(result.user.email) === "admin" ? "admin" : result.user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});

function getCredentialsSigninCode(error: BackendAuthError) {
  if (error.code === "EMAIL_ALREADY_REGISTERED") {
    return "duplicate_email";
  }

  if (error.code === "INVALID_CREDENTIALS") {
    return "invalid_credentials";
  }

  if (error.code === "USER_NOT_ACTIVE") {
    return "inactive_account";
  }

  if (error.code === "VALIDATION_ERROR") {
    return "validation_error";
  }

  if (error.code === "BACKEND_API_URL_MISSING" || error.code === "AUTH_TOKEN_SECRET_MISSING") {
    return "auth_configuration_error";
  }

  return "backend_auth_error";
}
