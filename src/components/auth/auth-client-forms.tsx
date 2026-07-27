"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import {
  AuthDivider,
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
  validateFirstName,
  validatePassword,
  validateResetCode,
  validateRequired,
} from "@/lib/auth/auth-form-validation";
import { authProviderIds } from "@/lib/auth/next-auth-config";
import { authRedirectRoot } from "@/lib/auth/routes";
import {
  submitForgotPassword,
  submitResetPassword,
} from "@/lib/auth/password-reset-service";
import { useToast } from "@/hooks/use-toast";

type FormStatus = "idle" | "error" | "success";
type OAuthProvider = (typeof authProviderIds)[keyof typeof authProviderIds];

interface FormAlertState {
  status: FormStatus;
  message: string;
}

type LoginErrors = Partial<Record<"email" | "password", string>>;
type SignupErrors = Partial<Record<"firstName" | "email" | "password", string>>;
type ForgotErrors = Partial<Record<"email", string>>;
type ResetErrors = Partial<Record<"resetCode" | "password" | "confirmPassword", string>>;

export function LoginAuthForm() {
  return (
    <AuthFormCard mode="login">
      <LoginPasswordForm />
    </AuthFormCard>
  );
}

export function SignupAuthForm() {
  return (
    <AuthFormCard mode="signup">
      <SignupPasswordForm />
    </AuthFormCard>
  );
}

function LoginPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const isBusy = isSubmitting || Boolean(loadingProvider);
  const flashMessage = searchParams.get("message");

  useEffect(() => {
    if (flashMessage === "password-reset") {
      const message = "Password updated successfully. Please sign in with your new password.";
      setAlert({ status: "success", message });
      toast({
        description: message,
        title: "Password updated",
        variant: "success",
      });
      router.replace("/login", { scroll: false });
    }
  }, [flashMessage, router, toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {
      email: validateEmail(email),
      password: validateRequired(password, "Password"),
    };

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setErrors({});
    setAlert(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        authMode: "login",
      });

      if (result?.error) {
        throw new Error(result.code ?? result.error);
      }

      window.location.assign(getRedirectTarget(authRedirectRoot));
    } catch (error) {
      const authError = normalizeAuthError(error);

      if (authError.code === "wrong_password") {
        setErrors({ password: "Check your password and try again." });
      }

      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Sign in failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderSignIn(provider: OAuthProvider) {
    const nextErrors: LoginErrors = {
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
      await signIn(provider, { redirectTo: getRedirectTarget(authRedirectRoot) }, getAuthorizationParams(provider, email));
    } catch (error) {
      const authError = normalizeAuthError(error);
      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Google sign in failed",
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  }

  return (
    <>
      <form className="space-y-3" noValidate onSubmit={handleSubmit}>
        <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />
        <AuthTextField
          autoComplete="email"
          disabled={isBusy}
          error={errors.email}
          id="login-email"
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
        <div className="space-y-2">
          <AuthTextField
            autoComplete="current-password"
            disabled={isBusy}
            error={errors.password}
            id="login-password"
            label="Password"
            onBlur={() => setErrors((current) => ({ ...current, password: validateRequired(password, "Password") }))}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder="Password"
            trailing={
              <PasswordVisibilityButton
                disabled={isBusy}
                isVisible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            }
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <div className="flex justify-end">
            <Link
              className="text-xs font-bold text-sedona-clay transition-colors hover:text-sedona-clayDark sm:text-sm"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <AuthPrimaryButton disabled={isBusy} isLoading={isSubmitting} loadingLabel="Signing in...">
          Sign in
        </AuthPrimaryButton>
      </form>
      <div className="mt-5 space-y-4">
        <AuthDivider />
        <SocialAuthButtons
          disabled={isSubmitting}
          loadingProvider={loadingProvider}
          onAppleSignIn={() => {
            const message = "Apple sign in is not connected yet.";
            setAlert({ status: "error", message });
            toast({
              description: message,
              title: "Apple unavailable",
              variant: "destructive",
            });
          }}
          onGoogleSignIn={() => handleProviderSignIn(authProviderIds.google)}
        />
      </div>
    </>
  );
}

function SignupPasswordForm() {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const isBusy = isSubmitting || Boolean(loadingProvider);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: SignupErrors = {
      email: validateEmail(email),
      firstName: validateFirstName(firstName),
      password: validatePassword(password),
    };

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setErrors({});
    setAlert(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        authMode: "signup",
        email,
        firstName,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.code ?? result.error);
      }

      window.location.assign(getRedirectTarget(authRedirectRoot));
    } catch (error) {
      const authError = normalizeAuthError(error);

      if (authError.code === "duplicate_email") {
        setErrors({ email: "An account already exists for this email." });
      }

      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Account creation failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderSignIn(provider: OAuthProvider) {
    const nextErrors: SignupErrors = {
      email: validateOptionalEmail(email),
      firstName: firstName.trim() ? validateFirstName(firstName) : undefined,
    };

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setAlert({ status: "error", message: "Please fix the highlighted fields or leave optional fields blank." });
      return;
    }

    setErrors({});
    setAlert(null);
    setLoadingProvider(provider);

    try {
      await signIn(provider, { redirectTo: getRedirectTarget(authRedirectRoot) }, getAuthorizationParams(provider, email));
    } catch (error) {
      const authError = normalizeAuthError(error);
      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Google sign up failed",
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  }

  return (
    <>
      <form className="space-y-3" noValidate onSubmit={handleSubmit}>
        <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />
        <AuthTextField
          autoComplete="given-name"
          disabled={isBusy}
          error={errors.firstName}
          id="signup-first-name"
          label="First name"
          onBlur={() => setErrors((current) => ({ ...current, firstName: validateFirstName(firstName) }))}
          onChange={(event) => {
            setFirstName(event.target.value);
            setErrors((current) => ({ ...current, firstName: undefined }));
          }}
          placeholder="First name"
          type="text"
          value={firstName}
        />
        <AuthTextField
          autoComplete="email"
          disabled={isBusy}
          error={errors.email}
          id="signup-email"
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
        <AuthTextField
          autoComplete="new-password"
          disabled={isBusy}
          error={errors.password}
          id="signup-password"
          label="Password"
          onBlur={() => setErrors((current) => ({ ...current, password: validatePassword(password) }))}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Password"
          trailing={
            <PasswordVisibilityButton
              disabled={isBusy}
              isVisible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          }
          type={showPassword ? "text" : "password"}
          value={password}
        />
        <AuthPrimaryButton disabled={isBusy} isLoading={isSubmitting} loadingLabel="Creating account...">
          Create account
        </AuthPrimaryButton>
      </form>
      <div className="mt-5 space-y-4">
        <AuthDivider />
        <SocialAuthButtons
          disabled={isSubmitting}
          loadingProvider={loadingProvider}
          onAppleSignIn={() => {
            const message = "Apple sign in is not connected yet.";
            setAlert({ status: "error", message });
            toast({
              description: message,
              title: "Apple unavailable",
              variant: "destructive",
            });
          }}
          onGoogleSignIn={() => handleProviderSignIn(authProviderIds.google)}
        />
      </div>
    </>
  );
}

export function ForgotPasswordAuthForm() {
  const router = useRouter();
  const { toast } = useToast();
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
      await submitForgotPassword(email);
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}&message=reset-code-sent`);
    } catch (error) {
      const authError = normalizeAuthError(error);
      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Reset request failed",
        variant: "destructive",
      });
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
        <AuthPrimaryButton disabled={isSubmitting} isLoading={isSubmitting} loadingLabel="Sending code...">
          Send reset code
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [resetCode, setResetCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [alert, setAlert] = useState<FormAlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialAlert = useMemo(() => {
    if (searchParams.get("message") === "reset-code-sent") {
      return "A reset code has been sent. Check your email and enter it below.";
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!initialAlert) {
      return;
    }

    setAlert({ status: "success", message: initialAlert });
    toast({
      description: initialAlert,
      title: "Reset code sent",
      variant: "success",
    });

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("message");
    const queryString = nextSearchParams.toString();

    router.replace(queryString ? `/reset-password?${queryString}` : "/reset-password", { scroll: false });
  }, [initialAlert, router, searchParams, toast]);

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
      await submitResetPassword({ password, resetCode });
      router.push("/login?message=password-reset");
    } catch (error) {
      const authError = normalizeAuthError(error);

      if (authError.code === "invalid_reset_code" || authError.code === "expired_reset_code") {
        setErrors({ resetCode: getAuthErrorMessage(authError) });
      }

      const message = getAuthErrorMessage(authError);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Password reset failed",
        variant: "destructive",
      });
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
