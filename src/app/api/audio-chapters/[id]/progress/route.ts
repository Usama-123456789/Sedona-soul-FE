import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  return proxyAuthenticatedBackend(`/audio-chapters/${encodeURIComponent(id)}/progress`, {
    body: JSON.stringify(body),
    method: "PUT",
  });
}
