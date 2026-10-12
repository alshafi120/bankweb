"use client";

import type {
  AdminSession, AdminUser, AuditLogEntry, BulkInput, BulkResult, DashboardData, ListQuery, LoginInput, LoginResult,
  MediaItem, Paginated, Role, TwoFactorSetup, ApplicationStatus,
} from "@/types/api";
import type { AdminNews, AdminPage, AdminPageSection, AdminRole, AdminSettings, AnyRecord, InboxKind, InboxRecord, PermissionGroup, SignedUrl } from "@/types/admin";
import { http, upload, type Query } from "./client";

type One<T> = { data: T };

const unwrap = async <T>(p: Promise<One<T>>) => (await p).data;

export const authApi = {
  login: (input: LoginInput) => unwrap(http.post<One<LoginResult>>("/auth/login", input)),
  twoFactorChallenge: (body: { code: string } | { recoveryCode: string }) => unwrap(http.post<One<{ user: AdminUser }>>("/auth/two-factor-challenge", body)),
  logout: () => http.post<void>("/auth/logout"),
  me: () => unwrap(http.get<One<AdminUser>>("/auth/me")),
  forgotPassword: (email: string) => http.post<void>("/auth/forgot-password", { email }),
  resetPassword: (body: { token: string; email: string; password: string; passwordConfirmation: string }) => http.post<void>("/auth/reset-password", body),
  enableTwoFactor: () => unwrap(http.post<One<TwoFactorSetup>>("/auth/two-factor")),
  confirmTwoFactor: (code: string) => unwrap(http.post<One<{ recoveryCodes: string[] }>>("/auth/two-factor/confirm", { code })),
  disableTwoFactor: (password: string) => http.del<void>("/auth/two-factor", { password }),
  changePassword: (body: { currentPassword: string; password: string; passwordConfirmation: string }) => http.put<void>("/auth/password", body),
  sessions: () => unwrap(http.get<One<AdminSession[]>>("/auth/sessions")),
  revokeSession: (id: string) => http.del<void>(`/auth/sessions/${encodeURIComponent(id)}`),
  /** Demo only: switch the signed-in demo user's role. */
  demoSwitchRole: (role: Role) => unwrap(http.post<One<AdminUser>>("/demo/switch-role", { role })),
};

/** Generic CRUD for every resource in the framework. */
export const resourceApi = {
  list: <T = AnyRecord>(endpoint: string, q: ListQuery & Query) => http.get<Paginated<T>>(`/${endpoint}`, q),
  get: <T = AnyRecord>(endpoint: string, id: number | string) => unwrap(http.get<One<T>>(`/${endpoint}/${id}`)),
  create: <T = AnyRecord>(endpoint: string, body: unknown) => unwrap(http.post<One<T>>(`/${endpoint}`, body)),
  update: <T = AnyRecord>(endpoint: string, id: number | string, body: unknown) => unwrap(http.put<One<T>>(`/${endpoint}/${id}`, body)),
  remove: (endpoint: string, id: number | string) => http.del<void>(`/${endpoint}/${id}`),
  bulk: (endpoint: string, body: BulkInput) => unwrap(http.post<One<BulkResult>>(`/${endpoint}/bulk`, body)),
  reorder: (endpoint: string, ids: number[]) => http.patch<void>(`/${endpoint}/reorder`, { ids }),
};

export const pagesApi = {
  saveSections: (id: number, sections: AdminPageSection[]) => unwrap(http.put<One<AdminPage>>(`/pages/${id}/sections`, sections)),
  publish: (id: number) => unwrap(http.post<One<AdminPage>>(`/pages/${id}/publish`)),
  schedule: (id: number, publishAt: string) => unwrap(http.post<One<AdminPage>>(`/pages/${id}/schedule`, { publishAt })),
};

export const newsApi = {
  submit: (id: number) => unwrap(http.post<One<AdminNews>>(`/news/${id}/submit`)),
  approve: (id: number) => unwrap(http.post<One<AdminNews>>(`/news/${id}/approve`)),
  reject: (id: number, reason: string) => unwrap(http.post<One<AdminNews>>(`/news/${id}/reject`, { reason })),
  publish: (id: number) => unwrap(http.post<One<AdminNews>>(`/news/${id}/publish`)),
  schedule: (id: number, publishAt: string) => unwrap(http.post<One<AdminNews>>(`/news/${id}/schedule`, { publishAt })),
};

export const mediaApi = {
  list: (q: ListQuery & Query) => http.get<Paginated<MediaItem>>("/media", q),
  upload: (file: File, alt: { ar: string; en: string }, onProgress: (p: number) => void) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt[ar]", alt.ar);
    fd.append("alt[en]", alt.en);
    return upload<One<MediaItem>>("/media", fd, onProgress).then((r) => r.data);
  },
  update: (id: number, body: Pick<MediaItem, "alt">) => unwrap(http.put<One<MediaItem>>(`/media/${id}`, body)),
  remove: (id: number) => http.del<void>(`/media/${id}`),
};

export const inboxApi = {
  list: (kind: InboxKind, q: ListQuery & Query) => http.get<Paginated<InboxRecord>>(`/${kind}`, q),
  get: (kind: InboxKind, id: number) => unwrap(http.get<One<InboxRecord>>(`/${kind}/${id}`)),
  patch: (kind: InboxKind, id: number, body: { status?: ApplicationStatus; assignedTo?: number | null }) => unwrap(http.patch<One<InboxRecord>>(`/${kind}/${id}`, body)),
  addNote: (kind: InboxKind, id: number, body: string) => unwrap(http.post<One<InboxRecord>>(`/${kind}/${id}/notes`, { body })),
  /** CSV text (server sets Content-Disposition; we build a Blob client-side). */
  exportCsv: (kind: InboxKind, q: Query) => http.get<string>(`/${kind}/export`, q),
  signedFile: (kind: "complaints" | "job-applications", id: number) =>
    unwrap(http.get<One<SignedUrl>>(`/${kind}/${id}/${kind === "complaints" ? "attachment" : "cv"}`)),
};

export const usersApi = {
  setRoles: (id: number, roles: Role[]) => unwrap(http.put<One<AnyRecord>>(`/users/${id}/roles`, { roles })),
  unlock: (id: number) => http.post<void>(`/users/${id}/unlock`),
};

export const rolesApi = {
  permissions: () => unwrap(http.get<One<PermissionGroup[]>>("/permissions")),
  setPermissions: (id: number, permissions: string[]) => unwrap(http.put<One<AdminRole>>(`/roles/${id}/permissions`, { permissions })),
};

export const auditApi = { list: (q: ListQuery & Query) => http.get<Paginated<AuditLogEntry>>("/audit-logs", q) };
export const settingsApi = {
  get: () => unwrap(http.get<One<AdminSettings>>("/settings")),
  update: (body: Partial<AdminSettings>) => unwrap(http.put<One<AdminSettings>>("/settings", body)),
};
export const dashboardApi = { get: () => unwrap(http.get<One<DashboardData>>("/dashboard")) };
