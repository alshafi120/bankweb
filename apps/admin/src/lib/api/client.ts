"use client";

import { DEMO } from "@/lib/env";
import { ApiError, kindOf } from "./errors";

/**
 * Typed client for the Admin API.
 * Real mode: same-origin `/backend/api/admin/v1/*` (rewritten by next.config.ts) with Sanctum SPA cookies:
 *   GET /backend/sanctum/csrf-cookie → read XSRF-TOKEN cookie → send X-XSRF-TOKEN on every request.
 * Demo mode: an in-memory adapter (src/lib/demo) implementing the same endpoints.
 */

const ADMIN_BASE = "/backend/api/admin/v1";
const CSRF_URL = "/backend/sanctum/csrf-cookie";

export type Query = Record<string, string | number | boolean | undefined | null>;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions { query?: Query; body?: unknown; signal?: AbortSignal }

let csrfReady: Promise<void> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}

async function ensureCsrf(force = false) {
  if (force) csrfReady = null;
  csrfReady ??= fetch(CSRF_URL, { credentials: "include", headers: { Accept: "application/json" } }).then((r) => {
    if (!r.ok) { csrfReady = null; throw new ApiError(r.status, kindOf(r.status), "CSRF bootstrap failed"); }
  });
  return csrfReady;
}

export function buildQuery(q?: Query): string {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Global hooks set by the AuthProvider (401 → login). */
export const apiEvents = { onUnauthenticated: (() => {}) as () => void };

async function realRequest<T>(method: Method, path: string, opts: RequestOptions, retried = false): Promise<T> {
  await ensureCsrf();
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" };
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
  if (opts.body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${ADMIN_BASE}${path}${buildQuery(opts.query)}`, {
      method, credentials: "include", headers, signal: opts.signal,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "network", "Network error");
  }

  if (res.status === 419 && !retried) { await ensureCsrf(true); return realRequest<T>(method, path, opts, true); }
  if (res.status === 204 || res.status === 202) return undefined as T;

  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }

  if (!res.ok) {
    const body = (json ?? {}) as { message?: string; errors?: Record<string, string[]> };
    const retryAfter = Number(res.headers.get("Retry-After")) || null;
    const err = new ApiError(res.status, kindOf(res.status), body.message ?? res.statusText, body.errors ?? {}, retryAfter);
    if (err.kind === "unauthenticated" && !path.startsWith("/auth/login") && !path.startsWith("/auth/two-factor-challenge")) apiEvents.onUnauthenticated();
    throw err;
  }
  return json as T;
}

async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  if (DEMO) {
    const { demoRequest } = await import("@/lib/demo/adapter");
    try {
      return await demoRequest<T>(method, path, opts);
    } catch (e) {
      if (e instanceof ApiError && e.kind === "unauthenticated" && !path.startsWith("/auth/")) apiEvents.onUnauthenticated();
      throw e;
    }
  }
  return realRequest<T>(method, path, opts);
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  del: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
};

/** Upload with progress (XHR — fetch has no upload progress). Demo mode simulates progress. */
export async function upload<T>(path: string, form: FormData, onProgress: (pct: number) => void): Promise<T> {
  if (DEMO) {
    const { demoUpload } = await import("@/lib/demo/adapter");
    return demoUpload<T>(path, form, onProgress);
  }
  await ensureCsrf();
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ADMIN_BASE}${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) xhr.setRequestHeader("X-XSRF-TOKEN", xsrf);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => reject(new ApiError(0, "network", "Network error"));
    xhr.onload = () => {
      let json: { message?: string; errors?: Record<string, string[]> } & Record<string, unknown> = {};
      try { json = JSON.parse(xhr.responseText || "{}"); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as T);
      else reject(new ApiError(xhr.status, kindOf(xhr.status), json.message ?? "Upload failed", json.errors ?? {}, Number(xhr.getResponseHeader("Retry-After")) || null));
    };
    xhr.send(form);
  });
}
