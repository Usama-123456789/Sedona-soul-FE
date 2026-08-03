import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  return proxyAuthenticatedBackend(`/check-ins/${encodeURIComponent(id)}/pacing`, {
    body: JSON.stringify(body),
    method: "POST",
  });
}
