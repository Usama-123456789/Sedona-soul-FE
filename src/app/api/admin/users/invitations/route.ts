import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyAdminBackend(`/admin/users/invitations${search}`, {
    method: "GET",
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return proxyAdminBackend("/admin/users/invitations", {
    body: JSON.stringify(body),
    method: "POST",
  });
}
