export type ApiResult<T> = {
  ok?: true;
  data: T;
  message?: string;
};

export type ApiErrorShape = {
  ok?: false;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  code: string;
  message: string;
  details?: unknown;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type ApiClientOptions = RequestInit & {
  token?: string;
};

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor({ code, details, message, status }: ApiErrorShape & { status: number }) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResult<T> | ApiErrorShape | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorShape | null;
    const backendError = errorPayload?.error;

    throw new ApiClientError({
      code: backendError?.code ?? errorPayload?.code ?? "REQUEST_FAILED",
      details: backendError?.details ?? errorPayload?.details,
      message: backendError?.message ?? errorPayload?.message ?? "Request failed",
      status: response.status,
    });
  }

  return (payload as ApiResult<T>).data;
}
