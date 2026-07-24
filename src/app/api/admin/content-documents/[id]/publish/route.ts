import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAdminBackend(`/admin/content-documents/${encodeURIComponent(id)}/publish`, {
    body: JSON.stringify({}),
    method: "POST",
  });
}
