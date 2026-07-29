import { proxyAdminBackend } from "@/lib/api/admin-backend-proxy";

export async function POST(request: Request) {
  const { search } = new URL(request.url);
  const contentType = request.headers.get("Content-Type") ?? "application/octet-stream";
  const fileName = request.headers.get("X-File-Name") ?? request.headers.get("X-Upload-Filename") ?? "";
  const body = await request.arrayBuffer();

  return proxyAdminBackend(`/admin/uploads/content-file${search}`, {
    body,
    headers: {
      "Content-Type": contentType,
      "X-File-Name": fileName,
    },
    method: "POST",
  });
}
