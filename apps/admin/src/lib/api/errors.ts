/** Normalised API error. `kind` drives the UI (login redirect, no-permission state, field errors, …). */
export type ApiErrorKind = "unauthenticated" | "forbidden" | "not_found" | "csrf" | "validation" | "locked" | "rate_limited" | "server" | "network";

export class ApiError extends Error {
  constructor(
    public status: number,
    public kind: ApiErrorKind,
    message: string,
    public fieldErrors: Record<string, string[]> = {},
    public retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const kindOf = (status: number): ApiErrorKind =>
  status === 401 ? "unauthenticated" : status === 403 ? "forbidden" : status === 404 ? "not_found" : status === 419 ? "csrf"
    : status === 422 ? "validation" : status === 423 ? "locked" : status === 429 ? "rate_limited" : status === 0 ? "network" : "server";

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
