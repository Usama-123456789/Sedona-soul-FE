import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json();

  return proxyAuthenticatedBackend("/safety/events", {
    body: JSON.stringify(body),
    method: "POST",
  });
}
