import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  return proxyAuthenticatedBackend(`/audio-chapters/${encodeURIComponent(id)}/playback`, {
    method: "GET",
  });
}
