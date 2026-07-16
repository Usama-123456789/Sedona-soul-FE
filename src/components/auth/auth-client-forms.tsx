"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import {
  AuthFormAlert,
  AuthFormCard,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityButton,
  SocialAuthButtons,
} from "@/components/auth/auth-form-card";
import {
  getAuthErrorMessage,
  normalizeAuthError,
  validateEmail,
  validatePassword,
  validateResetCode,
} from "@/lib/auth/auth-form-validation";
import { authProviderIds } from "@/lib/auth/next-auth-config";
import { authRedirectRoot, onboardingRoot } from "@/lib/auth/routes";
import {
  submitMockForgotPassword,
  submitMockResetPassword,
} from "@/lib/auth/mock-auth-service";

type FormStatus = "idle" | "error" | "success";
type OAuthProvider = (typeof authProviderIds)[keyof typeof authProviderIds];

interface FormAlertState {
  status: FormStatus;
  message: string;
}

type OAuthErrors = Partial<Record<"email", string>>;
type ForgotErrors = Partial<Record<"email", string>>;
type ResetErrors = Partial<Record<"resetCode" | "password" | "confirmPassword", string>>;

export function LoginAuthForm() {
  return (
    <AuthFormCard mode="login">
      <OAuthAuthForm defaultRedirectTo={authRedirectRoot} mode="login" />
    </AuthFormCard>
  );
}

export function SignupAuthForm() {
  return (
    <AuthFormCard mode="signup">
      <OAuthAuthForm defaultRedirectTo={onboardingRoot} mode="signup" />
    </AuthFormCard>
  );
}

function OAuthAuthForm({ defaultRedirectTo, mode }: { defaultRedirectTo: string; mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<OAuthErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  async function handleProviderSignIn(provider: OAuthProvider) {
    const nextErrors: OAuthErrors = {
      email: validateOptionalEmail(email),
    };

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please enter a valid email or leave the field blank." });
      return;
    }

    setErrors({});
    setAlert(null);
    setLoadingProvider(provider);

    try {
      await signIn(provider, { redirectTo: getRedirectTarget(defaultRedirectTo) }, getAuthorizationParams(provider, email));
    } catch (error) {
      const authError = normalizeAuthError(error);
      setAlert({ status: "error", message: getAuthErrorMessage(authError) });
      setLoadingProvider(null);
    }
  }

  return (
    <>
      <form className="space-y-4" noValidate onSubmit={(event) => event.preventDefault()}>
        <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />
        <AuthTextField
          autoComplete="email"
          disabled={Boolean(loadingProvider)}
          error={errors.email}
          id={`${mode}-email`}
          label="Email"
          onBlur={() => setErrors((current) => ({ ...current, email: validateOptionalEmail(email) }))}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="Email"
          type="email"
          value={email}
        />
        <SocialAuthButtons
          loadingProvider={loadingProvider}
          onAppleSignIn={() => handleProviderSignIn(authProviderIds.apple)}
          onGoogleSignIn={() => handleProviderSignIn(authProviderIds.google)}
        />
      </form>
      <div className="mt-4 flex justify-center">
        <Link
          className="text-xs font-bold text-sedona-clay transition-colors hover:text-sedona-clayDark sm:text-sm"
          href="/forgot-password"
        >
          Need help accessing your account?
        </Link>
      </div>
    </>
  );
}

export function ForgotPasswordAuthForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: ForgotErrors = {
      email: validateEmail(email),
    };

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please enter a valid email address." });
      return;
    }

    setErrors({});
    setAlert(null);
    setIsSubmitting(true);

    try {
      const result = await submitMockForgotPassword();
      setAlert({ status: "success", message: result.message });
    } catch (error) {
      const authError = normalizeAuthError(error);
      setAlert({ status: "error", message: getAuthErrorMessage(authError) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />
        <AuthTextField
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email}
          id="email"
          label="Email"
          onBlur={() => setErrors((current) => ({ ...current, email: validateEmail(email) }))}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="Email"
          type="email"
          value={email}
        />
        <AuthPrimaryButton disabled={isSubmitting} isLoading={isSubmitting} loadingLabel="Sending link...">
          Send reset link
        </AuthPrimaryButton>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-sedona-stone">
        Already have a reset code?{" "}
        <Link className="text-sedona-clay transition-colors hover:text-sedona-clayDark" href="/reset-password">
          Create a new password
        </Link>
      </p>
    </>
  );
}

export function ResetPasswordAuthForm() {
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: ResetErrors = {
      resetCode: validateResetCode(resetCode),
      password: validatePassword(password),
      confirmPassword: confirmPassword === password ? undefined : "Passwords do not match.",
    };

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required.";
    }

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setErrors({});
    setAlert(null);
    setIsSubmitting(true);

    try {
      const result = await submitMockResetPassword({ password, resetCode });
      setAlert({ status: "success", message: result.message });
    } catch (error) {
      const authError = normalizeAuthError(error);

      if (authError.code === "invalid_reset_code" || authError.code === "expired_reset_code") {
        setErrors({ resetCode: getAuthErrorMessage(authError) });
      }

      setAlert({ status: "error", message: getAuthErrorMessage(authError) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />
      <AuthTextField
        autoComplete="one-time-code"
        disabled={isSubmitting}
        error={errors.resetCode}
        id="reset-code"
        label="Reset code"
        onBlur={() => setErrors((current) => ({ ...current, resetCode: validateResetCode(resetCode) }))}
        onChange={(event) => {
          setResetCode(event.target.value);
          setErrors((current) => ({ ...current, resetCode: undefined }));
        }}
        placeholder="Reset code"
        type="text"
        value={resetCode}
      />
      <AuthTextField
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password}
        id="new-password"
        label="New password"
        onBlur={() => setErrors((current) => ({ ...current, password: validatePassword(password) }))}
        onChange={(event) => {
          setPassword(event.target.value);
          setErrors((current) => ({ ...current, password: undefined }));
        }}
        placeholder="New password"
        trailing={
          <PasswordVisibilityButton
            disabled={isSubmitting}
            isVisible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
          />
        }
        type={showPassword ? "text" : "password"}
        value={password}
      />
      <AuthTextField
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.confirmPassword}
        id="confirm-password"
        label="Confirm password"
        onBlur={() =>
          setErrors((current) => ({
            ...current,
            confirmPassword: confirmPassword === password ? undefined : "Passwords do not match.",
          }))
        }
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setErrors((current) => ({ ...current, confirmPassword: undefined }));
        }}
        placeholder="Confirm password"
        trailing={
          <PasswordVisibilityButton
            disabled={isSubmitting}
            isVisible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((current) => !current)}
          />
        }
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
      />
      <AuthPrimaryButton disabled={isSubmitting} isLoading={isSubmitting} loadingLabel="Updating password...">
        Update password
      </AuthPrimaryButton>
    </form>
  );
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function validateOptionalEmail(value: string) {
  return value.trim() ? validateEmail(value) : undefined;
}

function getRedirectTarget(defaultRedirectTo: string) {
  if (typeof window === "undefined") {
    return defaultRedirectTo;
  }

  const redirectUrl = new URLSearchParams(window.location.search).get("redirect_url");

  if (!redirectUrl) {
    return defaultRedirectTo;
  }

  try {
    const parsedRedirectUrl = new URL(redirectUrl, window.location.origin);

    if (parsedRedirectUrl.origin !== window.location.origin) {
      return defaultRedirectTo;
    }

    return `${parsedRedirectUrl.pathname}${parsedRedirectUrl.search}${parsedRedirectUrl.hash}`;
  } catch {
    return defaultRedirectTo;
  }
}

function getAuthorizationParams(provider: OAuthProvider, email: string) {
  const normalizedEmail = email.trim();

  if (provider !== authProviderIds.google || !normalizedEmail) {
    return undefined;
  }

  return { login_hint: normalizedEmail };
}
