import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyAdminBackend(`/admin/audio-chapters${search}`, {
    method: "GET",
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return proxyAdminBackend("/admin/audio-chapters", {
    body: JSON.stringify(body),
    method: "POST",
  });
}
