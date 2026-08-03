import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export async function GET() {
  return proxyAuthenticatedBackend("/safety/resources", {
    method: "GET",
  });
}
