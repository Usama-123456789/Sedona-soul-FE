import { AuthPlaceholder } from "@/components/placeholders/auth-placeholder";

export default function ForgotPasswordPage() {
  return (
    <AuthPlaceholder
      eyebrow="Account access"
      title="Reset password"
      description="This route is reserved for the selected auth provider reset flow."
    />
  );
}
