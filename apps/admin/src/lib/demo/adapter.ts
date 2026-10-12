"use client";

/**
 * Demo-mode mock of the Admin API (/api/admin/v1). Same paths, same envelopes, same status codes
 * (401/403/404/422/423/429) as docs/API.md, so every screen exercises its real error handling.
 * State lives in memory and is mirrored to sessionStorage (best-effort) so CRUD survives reloads in the tab.
 */
import type { AdminUser, AuditLogEntry, BulkInput, DashboardData, MediaItem, Role } from "@/types/api";
import type { AdminNews, AdminPage, AdminRole, AdminUserRecord, AnyRecord, InboxRecord } from "@/types/admin";
import { ApiError } from "@/lib/api/errors";
import { ALL_PERMISSIONS, PERMISSION_RESOURCES, RESOURCE_ABILITIES, hasPermission, permissionsFor } from "@/lib/rbac";
import { DEMO_2FA, DEMO_EMAIL, DEMO_PASSWORD, DEMO_RECOVERY, seed, CITIES, type DemoDb } from "./seed";
import { tinyPdf } from "./media-art";
import type { RequestOptions } from "@/lib/api/client";

const KEY = "withaq-admin-demo-v3";
let db: DemoDb | null = null;
const attempts: number[] = [];

function load(): DemoDb {
  if (db) return db;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw) as DemoDb; if (parsed.version === 3) { db = parsed; return db; } }
  } catch { /* storage unavailable or corrupt → reseed */ }
  db = seed();
  persist();
  return db;
}
function persist() {
  try { if (db) sessionStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota / private mode: memory only */ }
}
export function resetDemo() { db = seed(); persist(); }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const fail = (status: number, message: string, errors: Record<string, string[]> = {}, retryAfter: number | null = null): never => {
  const kinds = { 401: "unauthenticated", 403: "forbidden", 404: "not_found", 419: "csrf", 422: "validation", 423: "locked", 429: "rate_limited" } as const;
  throw new ApiError(status, kinds[status as keyof typeof kinds] ?? "server", message, errors, retryAfter);
};

function currentUser(): AdminUserRecord | null {
  const d = load();
  if (!d.auth.userId) return null;
  return (d.collections.users as unknown as AdminUserRecord[]).find((u) => u.id === d.auth.userId) ?? null;
}
function requireUser(): AdminUserRecord {
  const u = currentUser();
  if (!u) fail(401, "Unauthenticated.");
  return u!;
}
function authorize(permission: string) {
  const u = requireUser();
  if (!hasPermission(u, permission)) fail(403, "This action is unauthorized.");
  return u;
}
function publicUser(u: AdminUserRecord): AdminUser {
  const { lockedUntil: _l, failedLoginAttempts: _f, ...rest } = u;
  return clone(rest);
}

function audit(action: AuditLogEntry["action"], resourceType: string | null, resourceId: string | number | null, label: string | null, changes: AuditLogEntry["changes"] = null) {
  const d = load();
  const u = currentUser();
  const list = d.collections["audit-logs"] as unknown as AuditLogEntry[];
  const nextId = list.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  list.unshift({
    id: nextId, user: u ? { id: u.id, name: u.name } : null, action, resourceType, resourceId: resourceId == null ? null : String(resourceId), resourceLabel: label,
    changes, ipAddress: "10.20.4.18", userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "demo", createdAt: now(),
  });
}

const labelOf = (r: AnyRecord): string => {
  for (const k of ["title", "name", "question", "label", "reference", "fullName", "filename", "slug"]) {
    const v = r[k];
    if (typeof v === "string" && v) return v;
    if (v && typeof v === "object" && "ar" in (v as object)) return String((v as { ar: string }).ar);
  }
  return `#${r.id}`;
};

/* ───────── list engine ───────── */
const SEARCH_KEYS = ["title", "name", "slug", "reference", "fullName", "email", "username", "question", "label", "filename", "resourceLabel", "city", "excerpt", "phone", "location"];
function textOf(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && !Array.isArray(v)) return Object.values(v as Record<string, unknown>).map(textOf).join(" ");
  return "";
}
function sortValue(v: unknown): string | number {
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "object" && v && "ar" in v) return String((v as { ar: string }).ar);
  if (typeof v === "object" && v && "name" in v) return String((v as { name: string }).name);
  return String(v);
}
function listRecords<T extends AnyRecord>(rows: T[], q: Record<string, unknown>) {
  let out = rows.slice();
  const search = String(q.search ?? "").trim().toLowerCase();
  if (search) out = out.filter((r) => SEARCH_KEYS.some((k) => textOf(r[k]).toLowerCase().includes(search)));
  if (q.status) out = out.filter((r) => String(r.status) === String(q.status));
  if (q.kind) out = out.filter((r) => String(r.kind) === String(q.kind));
  for (const [k, v] of Object.entries(q)) {
    const m = /^filter\[(.+)\]$/.exec(k);
    if (!m || v === undefined || v === "") continue;
    const f = m[1]!;
    if (f === "from") out = out.filter((r) => String(r.createdAt) >= String(v));
    else if (f === "to") out = out.filter((r) => String(r.createdAt).slice(0, 10) <= String(v));
    else if (f === "userId") out = out.filter((r) => String((r.user as { id: number } | null)?.id ?? "") === String(v));
    else if (f === "assignedTo") out = out.filter((r) => String((r.assignedTo as { id: number } | null)?.id ?? "none") === String(v));
    else if (f === "role") out = out.filter((r) => (r.roles as string[] | undefined)?.includes(String(v)));
    else out = out.filter((r) => String(r[f] ?? "") === String(v));
  }
  const sort = String(q.sort ?? "");
  if (sort) {
    const desc = sort.startsWith("-");
    const key = sort.replace(/^-/, "");
    out.sort((a, b) => {
      const av = sortValue(a[key]); const bv = sortValue(b[key]);
      const c = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "ar");
      return desc ? -c : c;
    });
  }
  const perPage = Math.min(100, Math.max(1, Number(q.perPage ?? 15)));
  const total = out.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(lastPage, Math.max(1, Number(q.page ?? 1)));
  return { data: clone(out.slice((page - 1) * perPage, page * perPage)), meta: { currentPage: page, lastPage, perPage, total } };
}

/* ───────── validation (mirrors FormRequests) ───────── */
function validate(resource: string, body: AnyRecord, id: number | null) {
  const errors: Record<string, string[]> = {};
  const rows = load().collections[resource] ?? [];
  if (typeof body.slug === "string") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) errors.slug = ["The slug may only contain lowercase letters, numbers and dashes. / الرابط المختصر يقبل أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط."];
    else if (rows.some((r) => r.slug === body.slug && r.id !== id)) errors.slug = ["The slug has already been taken. / الرابط المختصر مستخدم مسبقاً."];
  }
  if (resource === "users") {
    if (typeof body.email === "string" && rows.some((r) => r.email === body.email && r.id !== id)) errors.email = ["The email has already been taken. / البريد مستخدم مسبقاً."];
    if (typeof body.username === "string" && rows.some((r) => r.username === body.username && r.id !== id)) errors.username = ["The username has already been taken. / اسم المستخدم مستخدم مسبقاً."];
  }
  if (Object.keys(errors).length) fail(422, "The given data was invalid.", errors);
}

/* ───────── permission mapping for generic CRUD ───────── */
const permResource = (r: string) => (r === "faq-categories" ? "faqs" : r);
const bulkAbility = (a: BulkInput["action"]) => (a === "delete" ? "delete" : a === "publish" || a === "unpublish" ? "publish" : "update");

/* ───────── dashboard ───────── */
function dashboard(): DashboardData {
  const d = load();
  const apps = d.collections.applications as unknown as InboxRecord[];
  const day = 86_400_000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const visits = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today.getTime() - (29 - i) * day);
    const dow = date.getDay();
    const base = 3100 + i * 38 + Math.round(Math.sin(i / 2.3) * 420) + (dow === 5 ? -900 : dow === 4 ? -350 : 0);
    return { date: date.toISOString().slice(0, 10), count: Math.max(800, base + ((i * 7919) % 260)) };
  });
  const dailyApplications = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today.getTime() - (13 - i) * day).toISOString().slice(0, 10);
    const sameDay = apps.filter((a) => a.createdAt.slice(0, 10) === date);
    return { date, account: sameDay.filter((a) => a.type === "account").length, financing: sameDay.filter((a) => a.type === "financing").length, card: sameDay.filter((a) => a.type === "card").length };
  });
  const byCity = new Map<string, number>();
  apps.forEach((a) => byCity.set(a.city, (byCity.get(a.city) ?? 0) + 1));
  const visitors = visits.reduce((s, v) => s + v.count, 0);
  const count = (k: string, pred: (r: AnyRecord) => boolean = () => true) => (d.collections[k] ?? []).filter(pred).length;
  return {
    kpis: {
      visitors, applications: apps.length, accountRequests: apps.filter((a) => a.type === "account").length, financingRequests: apps.filter((a) => a.type === "financing").length,
      cardRequests: apps.filter((a) => a.type === "card").length, complaints: count("complaints"), news: count("news", (n) => n.status === "published"),
      jobs: count("jobs", (j) => j.status === "active"), branches: count("branches", (b) => b.status === "active"),
    },
    charts: {
      visits, dailyApplications,
      topServices: [
        { label: "فتح حساب", count: 4820 }, { label: "حاسبة التمويل", count: 3915 }, { label: "البحث عن فرع", count: 3410 }, { label: "طلب بطاقة", count: 2260 },
        { label: "التحويلات", count: 1890 }, { label: "الدفع الإلكتروني", count: 1240 },
      ],
      topPages: [
        { path: "/", count: 28410 }, { path: "/financing", count: 9320 }, { path: "/accounts", count: 7880 }, { path: "/branches", count: 6150 },
        { path: "/cards", count: 4410 }, { path: "/news/solar-irrigation-financing-2026", count: 3120 }, { path: "/apply/account", count: 2890 }, { path: "/contact", count: 1760 },
      ],
      applicationsByCity: [...byCity.entries()].map(([city, c]) => ({ city, count: c })).sort((a, b) => b.count - a.count),
      trafficSources: [{ source: "search", count: Math.round(visitors * 0.41) }, { source: "direct", count: Math.round(visitors * 0.29) }, { source: "social", count: Math.round(visitors * 0.18) }, { source: "referral", count: Math.round(visitors * 0.08) }, { source: "campaign", count: Math.round(visitors * 0.04) }],
    },
  };
}

/* ───────── router ───────── */
type Ctx = { method: string; parts: string[]; query: Record<string, unknown>; body: AnyRecord };

const INBOX = new Set(["applications", "contact-requests", "complaints", "job-applications"]);
const CONTENT = new Set(["pages", "news", "news-categories", "services", "products", "financing-products", "cards", "offers", "banners", "faqs", "faq-categories", "branches", "atms", "agents", "jobs", "menus", "users", "roles", "media"]);

function find<T extends AnyRecord>(resource: string, id: string | number): T {
  const row = (load().collections[resource] ?? []).find((r) => String(r.id) === String(id));
  if (!row) fail(404, "Not found.");
  return row as T;
}

function route(ctx: Ctx): unknown {
  const { method, parts, query, body } = ctx;
  const d = load();
  const [r0, r1, r2] = parts;

  /* ── auth ── */
  if (r0 === "auth") {
    if (r1 === "login" && method === "POST") {
      const t = Date.now();
      while (attempts.length && attempts[0]! < t - 60_000) attempts.shift();
      attempts.push(t);
      if (attempts.length > 8) fail(429, "Too Many Attempts.", {}, 30);
      const login = String(body.login ?? "").trim().toLowerCase();
      const locked = d.auth.lockedUntil[login];
      if (locked && locked > t) fail(423, "Account locked.", {}, Math.ceil((locked - t) / 1000));
      const user = (d.collections.users as unknown as AdminUserRecord[]).find((u) => u.email === login || u.username === login);
      const ok = user && user.id === 1 && body.password === DEMO_PASSWORD;
      if (!ok) {
        d.auth.failed[login] = (d.auth.failed[login] ?? 0) + 1;
        if (d.auth.failed[login]! >= 5) {
          d.auth.lockedUntil[login] = t + 15 * 60_000; d.auth.failed[login] = 0; audit("lockout", "users", user?.id ?? null, login); persist();
          fail(423, "Account locked.", {}, 15 * 60);
        }
        audit("login_failed", null, null, login); persist();
        fail(422, "These credentials do not match our records.", { login: ["auth.failed"] });
      }
      d.auth.failed[login] = 0;
      d.auth.pending2fa = user!.id; persist();
      return { data: { twoFactorRequired: true, user: null } };
    }
    if (r1 === "two-factor-challenge" && method === "POST") {
      if (!d.auth.pending2fa) fail(401, "Unauthenticated.");
      const okCode = body.code === DEMO_2FA || (typeof body.recoveryCode === "string" && DEMO_RECOVERY.includes(body.recoveryCode.trim().toUpperCase()));
      if (!okCode) fail(422, "The provided two factor authentication code was invalid.", { [body.recoveryCode ? "recoveryCode" : "code"]: ["auth.2fa"] });
      d.auth.userId = d.auth.pending2fa; d.auth.pending2fa = null;
      const u = currentUser()!; u.lastLoginAt = now();
      audit("login", null, null, null); persist();
      return { data: { user: publicUser(u) } };
    }
    if (r1 === "forgot-password") return undefined;
    if (r1 === "reset-password") {
      if (!String(body.token ?? "").startsWith("demo")) fail(422, "This password reset token is invalid.", { email: ["passwords.token"] });
      return undefined;
    }
    if (r1 === "logout") { if (currentUser()) audit("logout", null, null, null); d.auth.userId = null; persist(); return undefined; }
    const u = requireUser();
    if (r1 === "me") return { data: publicUser(u) };
    if (r1 === "password" && method === "PUT") {
      if (body.currentPassword !== DEMO_PASSWORD) fail(422, "Invalid.", { currentPassword: ["The password is incorrect. / كلمة المرور الحالية غير صحيحة."] });
      return undefined;
    }
    if (r1 === "two-factor") {
      if (method === "POST" && !r2) {
        const secret = "JBSWY3DPEHPK3PXP";
        d.auth.twoFactorSecret = secret; persist();
        return { data: { secret, otpauthUrl: `otpauth://totp/Withaq:${u.email}?secret=${secret}&issuer=Withaq`, qrSvg: demoQr(secret) } };
      }
      if (r2 === "confirm") {
        if (body.code !== DEMO_2FA) fail(422, "Invalid code.", { code: ["auth.2fa"] });
        u.twoFactorEnabled = true; persist();
        return { data: { recoveryCodes: DEMO_RECOVERY } };
      }
      if (method === "DELETE") {
        if (body.password !== DEMO_PASSWORD) fail(422, "Invalid.", { password: ["The password is incorrect. / كلمة المرور غير صحيحة."] });
        u.twoFactorEnabled = false; persist(); return undefined;
      }
    }
    if (r1 === "sessions") {
      if (method === "GET") return { data: clone(d.sessions) };
      if (method === "DELETE" && r2) { d.sessions = d.sessions.filter((s) => s.id !== r2 || s.current); persist(); return undefined; }
    }
    fail(404, "Not found.");
  }

  if (r0 === "demo" && r1 === "switch-role") {
    const u = requireUser();
    const role = body.role as Role;
    u.roles = [role]; u.permissions = permissionsFor([role]); persist();
    return { data: publicUser(u) };
  }

  if (r0 === "dashboard") { authorize("dashboard.view"); return { data: dashboard() }; }
  if (r0 === "permissions") { authorize("roles.view"); return { data: PERMISSION_RESOURCES.map((r) => ({ resource: r, abilities: [...RESOURCE_ABILITIES[r]] })) }; }

  if (r0 === "settings") {
    if (method === "GET") { authorize("settings.view"); return { data: clone(d.settings) }; }
    authorize("settings.update");
    const before = clone(d.settings);
    d.settings = { ...d.settings, ...(body as object) };
    audit("update", "settings", null, "Settings", { before: before as unknown as Record<string, unknown>, after: clone(d.settings) as unknown as Record<string, unknown> }); persist();
    return { data: clone(d.settings) };
  }

  if (r0 === "audit-logs") { authorize("audit-logs.view"); return listRecords(d.collections["audit-logs"]!, query); }

  /* ── inbox ── */
  if (r0 && INBOX.has(r0)) {
    const perm = r0;
    if (method === "GET" && r1 === "export") {
      authorize(`${perm}.export`);
      const all = listRecords(d.collections[r0]!, { ...query, page: 1, perPage: 100 }).data as unknown as InboxRecord[];
      audit("export", r0, null, `${all.length} rows`); persist();
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = [["reference", "type", "status", "fullName", "phone", "city", "assignedTo", "createdAt"].join(","),
        ...all.map((a) => [a.reference, a.type, a.status, a.fullName, a.phoneMasked, a.city, a.assignedTo?.name ?? "", a.createdAt].map(esc).join(","))];
      return `﻿${rows.join("\r\n")}`;
    }
    if (method === "GET" && !r1) { authorize(`${perm}.view`); return listRecords(d.collections[r0]!, query); }
    const rec = find<InboxRecord & AnyRecord>(r0, r1!);
    if (method === "GET" && !r2) { authorize(`${perm}.view`); return { data: clone(rec) }; }
    if (method === "GET" && (r2 === "attachment" || r2 === "cv")) {
      authorize(`${perm}.view`);
      return { data: { url: tinyPdf(`${rec.reference} ${r2 === "cv" ? "CV" : "Attachment"}`), expiresAt: new Date(Date.now() + 300_000).toISOString(), filename: `${rec.reference}-${r2}.pdf` } };
    }
    authorize(`${perm}.update`);
    if (method === "PATCH") {
      const before = { status: rec.status, assignedTo: rec.assignedTo?.name ?? null };
      if (body.status) rec.status = body.status as InboxRecord["status"];
      if ("assignedTo" in body) {
        const uid = body.assignedTo as number | null;
        const u = uid ? (d.collections.users as unknown as AdminUserRecord[]).find((x) => x.id === uid) : null;
        rec.assignedTo = u ? { id: u.id, name: u.name } : null;
      }
      rec.updatedAt = now();
      audit("update", r0, rec.id, rec.reference, { before, after: { status: rec.status, assignedTo: rec.assignedTo?.name ?? null } }); persist();
      return { data: clone(rec) };
    }
    if (method === "POST" && r2 === "notes") {
      const u = requireUser();
      rec.notes.push({ id: Date.now(), body: String(body.body ?? "").slice(0, 2000), author: u.name, createdAt: now() });
      rec.updatedAt = now(); persist();
      return { data: clone(rec) };
    }
    fail(404, "Not found.");
  }

  /* ── content resources ── */
  if (r0 && CONTENT.has(r0)) {
    const rows = d.collections[r0]!;
    const pr = permResource(r0);
    if (method === "GET" && !r1) { authorize(`${pr}.view`); return listRecords(rows, query); }
    if (method === "POST" && r1 === "bulk") {
      const input = body as unknown as BulkInput;
      authorize(`${pr}.${bulkAbility(input.action)}`);
      let affected = 0;
      for (const rid of input.ids) {
        const idx = rows.findIndex((r) => r.id === rid);
        if (idx < 0) continue;
        affected++;
        const row = rows[idx]!;
        if (input.action === "delete") rows.splice(idx, 1);
        else if (input.action === "publish") row.status = "published";
        else if (input.action === "unpublish") row.status = "draft";
        else if (input.action === "archive") row.status = "archived";
        else if (input.action === "activate") { if (r0 === "users") row.isActive = true; else row.status = "active"; }
        else if (input.action === "deactivate") { if (r0 === "users") row.isActive = false; else row.status = "inactive"; }
      }
      audit(input.action === "delete" ? "delete" : input.action === "publish" ? "publish" : "update", r0, input.ids.join(","), `bulk ${input.action} (${affected})`); persist();
      return { data: { affected } };
    }
    if (method === "PATCH" && r1 === "reorder") {
      authorize(`${pr}.update`);
      const ids = (body.ids as number[]) ?? [];
      ids.forEach((rid, i) => { const row = rows.find((r) => r.id === rid); if (row) row.position = i + 1; });
      persist(); return undefined;
    }
    if (method === "POST" && !r1) {
      const u = authorize(`${pr}.create`);
      validate(r0, body, null);
      const rec: AnyRecord = { ...clone(body), id: ++d.seq, createdAt: now(), updatedAt: now() };
      if (r0 === "news") Object.assign(rec, { author: { id: u.id, name: u.name }, status: "draft", publishedAt: null, reviewedBy: null, reviewedAt: null, reviewNote: null });
      if (r0 === "pages") Object.assign(rec, { sections: [], status: rec.status ?? "draft" });
      if (r0 === "users") {
        const roles = (rec.roles as Role[]) ?? ["viewer"];
        delete rec.password;
        Object.assign(rec, { permissions: permissionsFor(roles), twoFactorEnabled: false, lastLoginAt: null, lockedUntil: null, failedLoginAttempts: 0 });
      }
      if (r0 === "roles") Object.assign(rec, { permissions: rec.permissions ?? [], usersCount: 0 });
      if ("position" in rec || ["services", "products", "financing-products", "cards", "offers", "banners", "faqs", "branches", "atms", "agents"].includes(r0)) rec.position = rows.length + 1;
      rows.unshift(rec);
      audit("create", r0, rec.id as number, labelOf(rec), { after: summarize(rec) }); persist();
      return { data: clone(rec) };
    }
    if (!r1) fail(405 as 404, "Method not allowed.");
    const rec = find<AnyRecord>(r0, r1!);

    if (method === "GET" && !r2) { authorize(`${pr}.view`); return { data: clone(rec) }; }

    // Pages: sections, publish, schedule
    if (r0 === "pages" && r2) {
      if (r2 === "sections") { authorize("pages.update"); (rec as unknown as AdminPage).sections = clone(body as unknown as AdminPage["sections"]); rec.updatedAt = now(); audit("update", "pages", rec.id, labelOf(rec), { after: { sections: (body as unknown as unknown[]).length } }); persist(); return { data: clone(rec) }; }
      if (r2 === "publish") { authorize("pages.publish"); Object.assign(rec, { status: "published", publishedAt: now(), publishAt: null, updatedAt: now() }); audit("publish", "pages", rec.id, labelOf(rec)); persist(); return { data: clone(rec) }; }
      if (r2 === "schedule") { authorize("pages.publish"); Object.assign(rec, { status: "scheduled", publishAt: body.publishAt, updatedAt: now() }); audit("publish", "pages", rec.id, labelOf(rec), { after: { publishAt: body.publishAt } }); persist(); return { data: clone(rec) }; }
    }
    // News workflow
    if (r0 === "news" && r2) {
      const n = rec as unknown as AdminNews;
      const u = requireUser();
      const ensure = (cond: boolean) => { if (!cond) fail(422, "Invalid status transition.", { status: ["Invalid status transition. / لا يمكن الانتقال لهذه الحالة."] }); };
      if (r2 === "submit") { authorize("news.update"); ensure(["draft"].includes(n.status)); n.status = "pending_review"; n.reviewNote = null; }
      else if (r2 === "approve") {
        authorize("news.approve"); ensure(n.status === "pending_review");
        // Maker/checker: nobody (not even super_admin) approves their own article.
        if (n.author?.id === u.id) fail(403, "Authors cannot approve their own articles (separation of duties).");
        Object.assign(n, { status: "approved", reviewedBy: { id: u.id, name: u.name }, reviewedAt: now() });
        audit("approve", "news", n.id, n.title.ar);
      } else if (r2 === "reject") {
        authorize("news.approve"); ensure(n.status === "pending_review");
        if (!String(body.reason ?? "").trim()) fail(422, "Reason required.", { reason: ["The reason field is required. / سبب الرفض مطلوب."] });
        Object.assign(n, { status: "draft", reviewedBy: { id: u.id, name: u.name }, reviewedAt: now(), reviewNote: String(body.reason) });
        audit("reject", "news", n.id, n.title.ar, { after: { reason: body.reason } });
      } else if (r2 === "publish") { authorize("news.publish"); ensure(["approved", "scheduled"].includes(n.status)); Object.assign(n, { status: "published", publishedAt: now(), publishAt: null }); audit("publish", "news", n.id, n.title.ar); }
      else if (r2 === "schedule") { authorize("news.publish"); ensure(["approved", "scheduled"].includes(n.status)); Object.assign(n, { status: "scheduled", publishAt: body.publishAt }); audit("publish", "news", n.id, n.title.ar, { after: { publishAt: body.publishAt } }); }
      else fail(404, "Not found.");
      n.updatedAt = now(); persist();
      return { data: clone(n) };
    }
    if (r0 === "users" && r2) {
      authorize("users.update");
      if (r2 === "roles") {
        const roles = body.roles as Role[];
        const before = { roles: rec.roles };
        Object.assign(rec, { roles, permissions: permissionsFor(roles) });
        audit("change_permissions", "users", rec.id, labelOf(rec), { before, after: { roles } }); persist(); return { data: clone(rec) };
      }
      if (r2 === "unlock") { Object.assign(rec, { lockedUntil: null, failedLoginAttempts: 0 }); d.auth.lockedUntil[String(rec.email)] = 0; audit("update", "users", rec.id, labelOf(rec), { after: { unlocked: true } }); persist(); return undefined; }
    }
    if (r0 === "roles" && r2 === "permissions") {
      authorize("roles.update");
      const before = { permissions: (rec as unknown as AdminRole).permissions.length };
      (rec as unknown as AdminRole).permissions = (body.permissions as string[]).filter((p) => ALL_PERMISSIONS.includes(p));
      // propagate to users holding the role (server derives permissions from roles)
      (d.collections.users as unknown as AdminUserRecord[]).forEach((u) => {
        if (u.roles.includes(rec.name as Role)) u.permissions = [...new Set(u.roles.flatMap((r) => ((d.collections.roles as unknown as AdminRole[]).find((x) => x.name === r)?.permissions ?? [])))];
      });
      audit("change_permissions", "roles", rec.id, labelOf(rec), { before, after: { permissions: (rec as unknown as AdminRole).permissions.length } }); persist();
      return { data: clone(rec) };
    }

    if (method === "PUT" && !r2) {
      authorize(`${pr}.update`);
      validate(r0, body, rec.id);
      const before = summarize(rec);
      const protectedKeys = r0 === "news" ? ["author", "status", "reviewedBy", "reviewedAt", "publishedAt"] : r0 === "users" ? ["permissions", "lockedUntil", "failedLoginAttempts", "twoFactorEnabled"] : [];
      for (const [k, v] of Object.entries(body)) if (!["id", "createdAt", ...protectedKeys].includes(k) && k !== "password") rec[k] = clone(v);
      if (r0 === "users" && Array.isArray(body.roles)) rec.permissions = permissionsFor(body.roles as Role[]);
      rec.updatedAt = now();
      audit("update", r0, rec.id, labelOf(rec), { before, after: summarize(rec) }); persist();
      return { data: clone(rec) };
    }
    if (method === "DELETE" && !r2) {
      authorize(`${pr}.delete`);
      if (r0 === "users" && rec.id === requireUser().id) fail(422, "You cannot delete yourself.", { id: ["You cannot delete your own account. / لا يمكنك حذف حسابك."] });
      const idx = rows.indexOf(rec); rows.splice(idx, 1);
      audit("delete", r0, rec.id, labelOf(rec), { before: summarize(rec) }); persist();
      return undefined;
    }
  }
  fail(404, "Not found.");
}

/** Compact before/after snapshot for the audit log (no data-URIs, no HTML blobs). */
function summarize(rec: AnyRecord): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (["id", "createdAt", "updatedAt", "sections", "seo", "permissions", "content", "body", "items"].includes(k)) continue;
    if (typeof v === "string") out[k] = v.startsWith("data:") ? "[file]" : v.slice(0, 140);
    else if (v && typeof v === "object" && "ar" in v && "en" in v) out[k] = { ar: String((v as { ar: unknown }).ar).replace(/<[^>]+>/g, "").slice(0, 100), en: String((v as { en: unknown }).en).replace(/<[^>]+>/g, "").slice(0, 100) };
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
  }
  return out;
}

/** A fake but well-formed QR-like SVG (path + rects only) to exercise the sanitizer. */
function demoQr(secret: string): string {
  const n = 25; const cells: string[] = [];
  let h = 0; for (const c of secret) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const finder = (x: number, y: number) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0C3A36"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0C3A36"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
    h = (h * 1103515245 + 12345) >>> 0;
    if ((h >>> 16) % 2) cells.push(`M${x} ${y}h1v1h-1z`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}<path d="${cells.join("")}" fill="#0C3A36"/><script>alert(1)</script></svg>`;
}

export async function demoRequest<T>(method: string, path: string, opts: RequestOptions): Promise<T> {
  await sleep(method === "GET" ? 120 + Math.random() * 180 : 220 + Math.random() * 220);
  const [p] = path.split("?");
  const parts = p!.split("/").filter(Boolean).map(decodeURIComponent);
  const query = (opts.query ?? {}) as Record<string, unknown>;
  const body = (opts.body ?? {}) as AnyRecord;
  return clone(route({ method, parts, query, body }) ?? null) as T;
}

const MIME_KIND: [RegExp, MediaItem["kind"]][] = [[/^image\//, "image"], [/^video\/mp4$/, "video"], [/^application\/pdf$/, "pdf"], [/wordprocessingml|msword/, "document"]];

export async function demoUpload<T>(_path: string, form: FormData, onProgress: (p: number) => void): Promise<T> {
  const u = authorize("media.create");
  const file = form.get("file") as File;
  if (!file) fail(422, "The file field is required.", { file: ["The file field is required."] });
  if (file.size > 5 * 1024 * 1024) fail(422, "Too large.", { file: ["The file may not be greater than 5120 kilobytes."] });
  const kind = MIME_KIND.find(([re]) => re.test(file.type))?.[1];
  if (!kind) fail(422, "Bad type.", { file: ["The file must be a file of type: jpg, png, webp, svg, mp4, pdf, docx."] });
  for (let p = 10; p <= 100; p += 15) { onProgress(Math.min(100, p)); await sleep(70 + Math.random() * 60); }
  let url = "";
  let width: number | null = null; let height: number | null = null;
  if (kind === "image" || kind === "pdf") {
    url = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => res(""); fr.readAsDataURL(file); });
    if (kind === "image") {
      await new Promise<void>((res) => { const img = new Image(); img.onload = () => { width = img.naturalWidth; height = img.naturalHeight; res(); }; img.onerror = () => res(); img.src = url; });
    }
  } else url = URL.createObjectURL(file);
  const d = load();
  const item: MediaItem = {
    id: ++d.seq, url, filename: file.name, mime: file.type, kind: kind!, size: file.size, width, height,
    alt: { ar: String(form.get("alt[ar]") ?? ""), en: String(form.get("alt[en]") ?? "") }, uploader: { id: u.id, name: u.name }, createdAt: now(),
  };
  d.collections.media!.unshift(item as unknown as AnyRecord);
  audit("create", "media", item.id, item.filename); persist();
  onProgress(100);
  return { data: clone(item) } as T;
}

export const demoInfo = { email: DEMO_EMAIL, password: DEMO_PASSWORD, code: DEMO_2FA, recovery: DEMO_RECOVERY, cities: CITIES };
