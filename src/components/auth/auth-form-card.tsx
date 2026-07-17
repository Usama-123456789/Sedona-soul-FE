import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Apple, ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

interface AuthFormCardProps {
  children: ReactNode;
  mode?: AuthMode;
  className?: string;
}

export function AuthFormCard({ children, mode, className }: AuthFormCardProps) {
  return (
    <section
      className={cn(
        "w-full rounded-[26px] bg-sedona-sand p-4 text-sedona-pineSoft shadow-[0_24px_70px_-42px_rgba(0,0,0,.65)] sm:p-6",
        className,
      )}
    >
      {mode ? <AuthModeTabs activeMode={mode} /> : null}
      {children}
    </section>
  );
}

function AuthModeTabs({ activeMode }: { activeMode: AuthMode }) {
  const tabs = [
    { href: "/login", label: "Sign in", mode: "login" as const },
    { href: "/signup", label: "Create account", mode: "signup" as const },
  ];

  return (
    <nav className="mb-5 grid grid-cols-2 rounded-[16px] bg-[#E8DFD1] p-1" aria-label="Authentication">
      {tabs.map((tab) => {
        const isActive = tab.mode === activeMode;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-center rounded-[14px] px-4 text-center text-base font-bold transition-colors",
              isActive
                ? "bg-white text-sedona-pineSoft shadow-[0_8px_18px_-12px_rgba(48,30,16,.45)]"
                : "text-sedona-taupe hover:text-sedona-pineSoft",
            )}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  label: string;
  trailing?: ReactNode;
}

export function AuthTextField({ className, error, hint, label, trailing, ...props }: AuthTextFieldProps) {
  const fieldId = props.id ?? props.name?.toString();
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const hintId = fieldId ? `${fieldId}-hint` : undefined;
  const describedBy = [error ? errorId : undefined, hint && !error ? hintId : undefined].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5">
      <label className="sr-only" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative">
        <Input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          aria-label={label}
          className={cn(
            "h-[52px] rounded-[16px] border-sedona-creamLine bg-white px-5 text-base font-medium text-sedona-pineSoft shadow-[0_1px_1px_rgba(48,30,16,.05)] placeholder:text-sedona-taupe focus-visible:ring-sedona-clay focus-visible:ring-offset-sedona-sand sm:h-[56px]",
            error ? "border-sedona-clay bg-[#FFF8F4] focus-visible:ring-sedona-clay" : "",
            trailing ? "pr-14" : "",
            className,
          )}
          id={fieldId}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-sedona-taupe">
            {trailing}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs font-semibold leading-5 text-sedona-clay" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p className="text-xs font-medium leading-5 text-sedona-stone" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface PasswordVisibilityButtonProps {
  disabled?: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export function PasswordVisibilityButton({ disabled, isVisible, onToggle }: PasswordVisibilityButtonProps) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <button
      aria-label={isVisible ? "Hide password" : "Show password"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-sedona-taupe transition-colors hover:bg-sedona-sand hover:text-sedona-pineSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sedona-clay disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
    </button>
  );
}

interface AuthPrimaryButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingLabel?: string;
}

export function AuthPrimaryButton({
  children,
  className,
  disabled,
  isLoading,
  loadingLabel = "Loading...",
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <Button
      aria-busy={isLoading ? true : undefined}
      className={cn(
        "h-[54px] w-full rounded-[16px] bg-sedona-clay text-base font-bold text-white shadow-[0_16px_28px_-22px_rgba(143,62,27,.95)] hover:bg-sedona-clayDark sm:h-[58px] sm:text-lg",
        className,
      )}
      disabled={disabled || isLoading}
      type="submit"
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

interface AuthFormAlertProps {
  message?: string;
  variant?: "error" | "success";
}

export function AuthFormAlert({ message, variant = "error" }: AuthFormAlertProps) {
  if (!message) {
    return null;
  }

  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm font-semibold leading-5",
        variant === "success"
          ? "border-[#CFE2D6] bg-[#F3FAF4] text-sedona-sage"
          : "border-[#EAC7B7] bg-[#FFF8F4] text-sedona-clay",
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-5 text-sm font-semibold text-sedona-taupe">
      <span className="h-px flex-1 bg-sedona-creamLine" />
      <span>or</span>
      <span className="h-px flex-1 bg-sedona-creamLine" />
    </div>
  );
}

type SocialAuthProvider = "apple" | "google";

interface SocialAuthButtonsProps {
  disabled?: boolean;
  loadingProvider?: SocialAuthProvider | null;
  onAppleSignIn?: () => void;
  onGoogleSignIn?: () => void;
}

export function SocialAuthButtons({ disabled, loadingProvider, onAppleSignIn, onGoogleSignIn }: SocialAuthButtonsProps) {
  const isGoogleLoading = loadingProvider === "google";

  return (
    <div className="space-y-3">
      <Button
        className="h-[52px] w-full rounded-[16px] bg-sedona-pine text-base font-bold text-white opacity-70 hover:bg-sedona-pine sm:h-[56px]"
        disabled={disabled || Boolean(loadingProvider)}
        onClick={onAppleSignIn}
        type="button"
      >
        <Apple aria-hidden="true" className="h-5 w-5 fill-current" />
        Continue with Apple
      </Button>
      <Button
        aria-busy={isGoogleLoading ? true : undefined}
        className="h-[52px] w-full rounded-[16px] border-sedona-creamLine bg-white text-base font-bold text-sedona-stone hover:bg-white/90 sm:h-[56px]"
        disabled={disabled || Boolean(loadingProvider)}
        onClick={onGoogleSignIn}
        type="button"
        variant="outline"
      >
        {isGoogleLoading ? (
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-sedona-clay" />
        ) : (
          <span aria-hidden="true" className="text-xl font-black leading-none text-[#4285F4]">
            G
          </span>
        )}
        {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
      </Button>
    </div>
  );
}

interface AuthRecoveryCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthRecoveryCard({ children, description, title }: AuthRecoveryCardProps) {
  return (
    <AuthFormCard>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-sedona-clay transition-colors hover:text-sedona-clayDark"
        href="/login"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to sign in
      </Link>
      <div className="mb-5 space-y-2">
        <h2 className="font-serif text-[30px] leading-tight text-sedona-pineSoft sm:text-[34px]">{title}</h2>
        <p className="text-sm font-medium leading-6 text-sedona-stone sm:text-base">{description}</p>
      </div>
      {children}
    </AuthFormCard>
  );
}
