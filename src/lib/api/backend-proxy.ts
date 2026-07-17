import { NextResponse } from "next/server";

const getBackendApiUrl = () => {
  const apiUrl = process.env.BACKEND_API_URL;

  if (!apiUrl) {
    throw new Error("BACKEND_API_URL is required.");
  }

  return apiUrl.replace(/\/$/, "");
};

export async function proxyBackendPost(path: string, body: unknown) {
  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  return NextResponse.json(payload, {
    status: response.status,
  });
}
