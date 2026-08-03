import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return proxyAuthenticatedBackend("/check-ins", {
    body: JSON.stringify(body),
    method: "POST",
  });
}
