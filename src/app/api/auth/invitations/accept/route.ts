import { proxyBackendPost } from "@/lib/api/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json();

  return proxyBackendPost("/api/v1/auth/invitations/accept", body);
}
