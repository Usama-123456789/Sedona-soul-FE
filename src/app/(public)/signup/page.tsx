import Link from "next/link";

import { AuthPlaceholder } from "@/components/placeholders/auth-placeholder";

export default function SignupPage() {
  return (
    <AuthPlaceholder
      eyebrow="Begin gently"
      title="Create your account"
      description="Signup, preferred name, and consent capture are implemented in Phase 1."
      footer={
        <Link className="font-semibold text-[#9A4220]" href="/login">
          I already have an account
        </Link>
      }
    />
  );
}
