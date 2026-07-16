import { ResetPasswordAuthForm } from "@/components/auth/auth-client-forms";
import { AuthRecoveryCard } from "@/components/auth/auth-form-card";

export default function ResetPasswordPage() {
  return (
    <AuthRecoveryCard
      title="Create a new password"
      description="Use the reset code from your email, then choose a new password for your account."
    >
      <ResetPasswordAuthForm />
    </AuthRecoveryCard>
  );
}
