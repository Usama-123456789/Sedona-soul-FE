import Link from "next/link";

import { AuthPlaceholder } from "@/components/placeholders/auth-placeholder";

export default function LoginPage() {
  return (
    <AuthPlaceholder
      eyebrow="Welcome back"
      title="Log in to Sedona Soul"
      description="Email auth wiring belongs in Phase 1. This route is ready for the login form."
      footer={
        <Link className="font-semibold text-[#9A4220]" href="/signup">
          Create an account
        </Link>
      }
    />
  );
}
