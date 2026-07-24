import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyAdminBackend(`/admin/users${search}`, {
    method: "GET",
  });
}
