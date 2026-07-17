import { ForgotPasswordAuthForm } from "@/components/auth/auth-client-forms";
import { AuthRecoveryCard } from "@/components/auth/auth-form-card";

export default function ForgotPasswordPage() {
  return (
    <AuthRecoveryCard
      title="Reset password"
      description="Enter the email connected to your account and we will send a reset code."
    >
      <ForgotPasswordAuthForm />
    </AuthRecoveryCard>
  );
}
