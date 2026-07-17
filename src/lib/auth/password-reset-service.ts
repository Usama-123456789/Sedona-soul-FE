import { apiRequest } from "@/lib/api/client";

type ForgotPasswordResponse = {
  accepted: true;
  expiresInMinutes: number;
};

type ResetPasswordResponse = {
  passwordReset: true;
};

export async function submitForgotPassword(email: string) {
  await apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  return {
    message: "If this email is registered, a reset code has been sent."
  };
}

export async function submitResetPassword({
  password,
  resetCode,
}: {
  password: string;
  resetCode: string;
}) {
  await apiRequest<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      resetCode,
      password,
      passwordConfirmation: password,
    }),
  });

  return {
    message: "Password updated successfully."
  };
}
