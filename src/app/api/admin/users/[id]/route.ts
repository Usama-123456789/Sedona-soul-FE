import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  return proxyAdminBackend(`/admin/users/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  return proxyAdminBackend(`/admin/users/${encodeURIComponent(id)}`, {
    body: JSON.stringify(body),
    method: "PATCH",
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  return proxyAdminBackend(`/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
