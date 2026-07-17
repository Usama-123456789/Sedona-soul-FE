export type AuthErrorCode =
  | "duplicate_email"
  | "wrong_password"
  | "validation_error"
  | "auth_configuration_error"
  | "backend_auth_error"
  | "invalid_reset_code"
  | "expired_reset_code"
  | "rate_limited"
  | "network_error"
  | "unknown";

export interface AuthFormError {
  code: AuthErrorCode;
  message?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value: string, label: string) {
  return value.trim() ? undefined : `${label} is required.`;
}

export function validateEmail(value: string) {
  if (!value.trim()) {
    return "Email is required.";
  }

  return emailPattern.test(value.trim()) ? undefined : "Enter a valid email address.";
}

export function validateFirstName(value: string) {
  if (!value.trim()) {
    return "First name is required.";
  }

  return value.trim().length >= 2 ? undefined : "First name must be at least 2 characters.";
}

export function validatePassword(value: string) {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include an uppercase letter.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include a special character.";
  }

  return undefined;
}

export function validateResetCode(value: string) {
  if (!value.trim()) {
    return "Reset code is required.";
  }

  return value.trim().length >= 6 ? undefined : "Reset code must be at least 6 characters.";
}

export function normalizeAuthError(error: unknown): AuthFormError {
  if (isAuthFormError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("duplicate_email") || message.includes("already") || message.includes("exists") || message.includes("duplicate")) {
      return { code: "duplicate_email" };
    }

    if (message.includes("validation_error")) {
      return { code: "validation_error" };
    }

    if (message.includes("auth_configuration_error")) {
      return { code: "auth_configuration_error" };
    }

    if (message.includes("backend_auth_error")) {
      return { code: "backend_auth_error" };
    }

    if (message.includes("invalid_password_reset_token") || message.includes("invalid_reset_code")) {
      return { code: "invalid_reset_code" };
    }

    if (message.includes("expired_reset_code")) {
      return { code: "expired_reset_code" };
    }

    if (message.includes("invalid_credentials") || message.includes("password") || message.includes("credential")) {
      return { code: "wrong_password" };
    }

    if (message.includes("rate")) {
      return { code: "rate_limited" };
    }

    if (message.includes("network") || message.includes("fetch")) {
      return { code: "network_error" };
    }

    return { code: "unknown", message: error.message };
  }

  return { code: "unknown" };
}

export function getAuthErrorMessage(error: AuthFormError) {
  switch (error.code) {
    case "duplicate_email":
      return "An account with this email already exists. Try signing in instead.";
    case "wrong_password":
      return "Email or password is incorrect. Please check both and try again.";
    case "validation_error":
      return "Please check the account details and try again.";
    case "auth_configuration_error":
      return "Authentication is not configured correctly. Check the frontend environment settings.";
    case "backend_auth_error":
      return "We could not complete authentication with the backend. Please try again.";
    case "invalid_reset_code":
      return "That reset code does not look right. Check the code and try again.";
    case "expired_reset_code":
      return "That reset code has expired. Request a new reset code and try again.";
    case "rate_limited":
      return "Too many attempts. Please wait a moment before trying again.";
    case "network_error":
      return "We could not reach the auth service. Check your connection and try again.";
    case "unknown":
    default:
      return error.message ?? "Something went wrong. Please try again.";
  }
}

function isAuthFormError(error: unknown): error is AuthFormError {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error;
}
