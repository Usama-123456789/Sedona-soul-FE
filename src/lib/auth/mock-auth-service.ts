import type { AuthErrorCode } from "@/lib/auth/auth-form-validation";

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload extends LoginPayload {
  firstName: string;
}

interface ResetPayload {
  resetCode: string;
  password: string;
}

export class MockAuthServiceError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function submitMockLogin({ email, password }: LoginPayload) {
  await waitForAuth();

  if (email.toLowerCase().includes("wrong") || password.toLowerCase().includes("wrong")) {
    throw new MockAuthServiceError("wrong_password");
  }

  return { message: "Signed in successfully." };
}

export async function submitMockSignup({ email }: SignupPayload) {
  await waitForAuth();

  if (email.toLowerCase().includes("taken") || email.toLowerCase().includes("exists")) {
    throw new MockAuthServiceError("duplicate_email");
  }

  return { message: "Account created successfully." };
}

export async function submitMockForgotPassword() {
  await waitForAuth();

  return { message: "If this email is registered, reset instructions have been sent." };
}

export async function submitMockResetPassword({ resetCode }: ResetPayload) {
  await waitForAuth();

  if (resetCode.trim() === "000000") {
    throw new MockAuthServiceError("expired_reset_code");
  }

  if (resetCode.trim().toLowerCase() === "invalid") {
    throw new MockAuthServiceError("invalid_reset_code");
  }

  return { message: "Password updated successfully." };
}

function waitForAuth() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 650);
  });
}
