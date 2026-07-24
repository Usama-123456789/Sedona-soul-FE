import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  return proxyAdminBackend(`/admin/users/invitations/${encodeURIComponent(id)}/revoke`, {
    method: "POST",
  });
}
