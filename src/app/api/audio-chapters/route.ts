import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyAuthenticatedBackend(`/audio-chapters${search}`, {
    method: "GET",
  });
}
