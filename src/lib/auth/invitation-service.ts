import { apiRequest } from "@/lib/api/client";

type InvitationAcceptResponse = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
  user: {
    email: string;
    id: string;
    preferredName: string | null;
    role: "admin" | "user";
  };
};

export async function acceptUserInvitation(payload: {
  password: string;
  passwordConfirmation: string;
  preferredName?: string;
  termsAcceptedAt?: string;
  token: string;
}) {
  return apiRequest<InvitationAcceptResponse>("/auth/invitations/accept", {
    method: "POST",
    body: JSON.stringify({
      password: payload.password,
      passwordConfirmation: payload.passwordConfirmation,
      preferredName: payload.preferredName || undefined,
      termsAcceptedAt: payload.termsAcceptedAt,
      token: payload.token,
    }),
  });
}
