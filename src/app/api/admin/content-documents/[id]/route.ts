import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAdminBackend(`/admin/content-documents/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  return proxyAdminBackend(`/admin/content-documents/${encodeURIComponent(id)}`, {
    body: JSON.stringify(body),
    method: "PATCH",
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAdminBackend(`/admin/content-documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
