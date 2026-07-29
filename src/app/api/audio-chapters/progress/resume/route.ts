import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export async function GET() {
  return proxyAuthenticatedBackend("/audio-chapters/progress/resume", {
    method: "GET",
  });
}
