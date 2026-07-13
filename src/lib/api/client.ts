export type ApiResult<T> = {
  data: T;
  message?: string;
};

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
