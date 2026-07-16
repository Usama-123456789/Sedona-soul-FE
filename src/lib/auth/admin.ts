export type AppRole = "admin" | "user";

export function getRoleForEmail(email?: string | null): AppRole {
  if (!email) {
    return "user";
  }

  const adminEmails = new Set(
    (process.env.AUTH_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  return adminEmails.has(email.toLowerCase()) ? "admin" : "user";
}
