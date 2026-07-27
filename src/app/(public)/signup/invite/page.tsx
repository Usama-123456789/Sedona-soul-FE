"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Check, Info, ShieldCheck } from "lucide-react";

import { AuthFormAlert, AuthPrimaryButton, AuthTextField, PasswordVisibilityButton } from "@/components/auth/auth-form-card";
import { useToast } from "@/hooks/use-toast";
import { acceptUserInvitation } from "@/lib/auth/invitation-service";
import { authRedirectRoot } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";

type FormStatus = "error" | "success";
type InviteErrors = Partial<Record<"confirmPassword" | "consent" | "password" | "preferredName" | "token", string>>;

type AlertState = {
  message: string;
  status: FormStatus;
};

const passwordRules = [
  { id: "length", label: "8-128 characters", test: (value: string) => value.length >= 8 && value.length <= 128 },
  { id: "lowercase", label: "lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { id: "uppercase", label: "uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { id: "number", label: "number", test: (value: string) => /[0-9]/.test(value) },
  { id: "special", label: "special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export default function InviteSignupPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const inviteToken = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [preferredName, setPreferredName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<InviteErrors>({});
  const [alert, setAlert] = useState<AlertState | null>(() =>
    inviteToken ? null : { status: "error", message: "This invitation link is missing a token." },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passedRules = passwordRules.filter((rule) => rule.test(password)).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: InviteErrors = {
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      consent: hasAcceptedConsent ? undefined : "Please accept the privacy and sensitive-use consent to continue.",
      password: validateInvitePassword(password),
      preferredName: validateOptionalName(preferredName),
      token: inviteToken ? undefined : "Invitation token is missing.",
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
      const acceptedInvite = await acceptUserInvitation({
        password,
        passwordConfirmation: confirmPassword,
        preferredName: preferredName.trim(),
        termsAcceptedAt: new Date().toISOString(),
        token: inviteToken,
      });

      const result = await signIn("credentials", {
        authMode: "login",
        email: acceptedInvite.user.email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.code ?? result.error);
      }

      toast({
        description: "Your invitation was accepted. We are taking you into Sedona Soul now.",
        title: "Account created",
        variant: "success",
      });
      window.location.assign(authRedirectRoot);
    } catch (error) {
      const message = getInviteErrorMessage(error);
      setAlert({ status: "error", message });
      toast({
        description: message,
        title: "Invitation could not be accepted",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-[26px] bg-sedona-sand p-4 text-sedona-pineSoft shadow-[0_24px_70px_-42px_rgba(0,0,0,.65)] sm:p-6">
      <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-[#D9CDC0] bg-white/55 p-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#E4EFE8] text-sedona-sage">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sedona-blue">Private invitation</p>
          <h1 className="font-serif text-[28px] leading-tight text-sedona-pineSoft sm:text-[32px]">Create your account</h1>
        </div>
      </div>

      <form className="space-y-3" noValidate onSubmit={handleSubmit}>
        <AuthFormAlert message={alert?.message} variant={alert?.status === "success" ? "success" : "error"} />

        {errors.token ? (
          <p className="rounded-[16px] border border-[#EAC7B7] bg-[#FFF8F4] px-4 py-3 text-sm font-semibold text-sedona-clay">
            {errors.token}
          </p>
        ) : null}

        <AuthTextField
          autoComplete="given-name"
          disabled={isSubmitting}
          error={errors.preferredName}
          hint="Optional. This is the name your guide can use inside the app."
          id="invite-preferred-name"
          label="Preferred name"
          onBlur={() => setErrors((current) => ({ ...current, preferredName: validateOptionalName(preferredName) }))}
          onChange={(event) => {
            setPreferredName(event.target.value);
            setErrors((current) => ({ ...current, preferredName: undefined }));
          }}
          placeholder="Preferred name"
          type="text"
          value={preferredName}
        />

        <div className="space-y-2">
          <AuthTextField
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.password}
            id="invite-password"
            label="Password"
            onBlur={() => setErrors((current) => ({ ...current, password: validateInvitePassword(password) }))}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder="Password"
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
          <div className="rounded-[16px] border border-[#E2D8C8] bg-white/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-sedona-stone">
              <span>Password strength</span>
              <span>{passedRules} / {passwordRules.length}</span>
            </div>
            <div className="mb-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
              {passwordRules.map((rule) => (
                <span
                  className={cn(
                    "h-1.5 rounded-full",
                    rule.test(password) ? "bg-sedona-clay" : "bg-[#E7DDCF]",
                  )}
                  key={rule.id}
                />
              ))}
            </div>
            <ul className="grid gap-1.5 text-xs font-semibold text-sedona-stone sm:grid-cols-2">
              {passwordRules.map((rule) => {
                const isMet = rule.test(password);

                return (
                  <li className={cn("flex items-center gap-2", isMet ? "text-sedona-sage" : "text-sedona-stone")} key={rule.id}>
                    <Check aria-hidden="true" className={cn("h-3.5 w-3.5", isMet ? "opacity-100" : "opacity-25")} />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <AuthTextField
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirmPassword}
          id="invite-confirm-password"
          label="Confirm password"
          onBlur={() => setErrors((current) => ({ ...current, confirmPassword: validateConfirmPassword(password, confirmPassword) }))}
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

        <label
          className={cn(
            "flex cursor-pointer gap-3 rounded-[16px] border bg-white/70 p-4 text-sm font-medium leading-5 text-sedona-stone transition-colors",
            errors.consent ? "border-[#EAC7B7] bg-[#FFF8F4]" : "border-[#D9CDC0] hover:border-sedona-sage/60",
          )}
        >
          <input
            checked={hasAcceptedConsent}
            className="mt-1 h-4 w-4 shrink-0 accent-sedona-clay"
            disabled={isSubmitting}
            onChange={(event) => {
              setHasAcceptedConsent(event.target.checked);
              setErrors((current) => ({ ...current, consent: undefined }));
            }}
            type="checkbox"
          />
          <span>
            I understand my journal/check-ins are private, this app is not emergency support, and I accept the sensitive-use consent for this recovery companion.
          </span>
        </label>
        {errors.consent ? <p className="text-xs font-semibold text-sedona-clay">{errors.consent}</p> : null}

        <AuthPrimaryButton disabled={isSubmitting || !inviteToken} isLoading={isSubmitting} loadingLabel="Creating account...">
          Accept invitation
        </AuthPrimaryButton>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-[16px] bg-white/45 p-3 text-xs font-semibold leading-5 text-sedona-stone">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sedona-blue" />
        <p>
          Already have an account? <Link className="text-sedona-clay hover:text-sedona-clayDark" href="/login">Sign in</Link> and ask an admin for a fresh invitation if needed.
        </p>
      </div>
    </section>
  );
}

function validateOptionalName(value: string) {
  return value.trim().length > 0 && value.trim().length < 2 ? "Preferred name must be at least 2 characters." : undefined;
}

function validateInvitePassword(value: string) {
  if (!value) {
    return "Password is required.";
  }

  const failedRule = passwordRules.find((rule) => !rule.test(value));

  return failedRule ? "Password must include " + failedRule.label + "." : undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return "Confirm password is required.";
  }

  return password === confirmPassword ? undefined : "Passwords do not match.";
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function getInviteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("invalid_user_invitation") || message.includes("expired") || message.includes("invitation")) {
      return "This invitation is invalid, expired, revoked, or already accepted.";
    }

    if (message.includes("user_already_exists") || message.includes("already")) {
      return "An account already exists for this email. Please sign in instead.";
    }

    if (message.includes("validation")) {
      return "Please check the invitation details and try again.";
    }

    if (message.includes("credential") || message.includes("password")) {
      return "The invitation was accepted, but sign in did not complete. Please sign in with your new password.";
    }

    return error.message;
  }

  return "We could not accept this invitation. Please try again.";
}
