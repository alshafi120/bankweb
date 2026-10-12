# apps/admin — لوحة تحكم بنك وِثاق (Admin Dashboard / CMS)

Next.js 16 · React 19 · TypeScript strict · Tailwind 3.4 · clsx — no UI/chart libraries (charts, modals, toasts, DnD, command palette are hand-built).
Same identity as `apps/web` (jade / qamariya-saffron / lapis tokens, IBM Plex Sans Arabic + Plex Sans + Plex Mono self-hosted via `@fontsource`), light + dark, Arabic RTL default + English LTR.

## Run

```bash
cp .env.example .env.local   # demo mode by default
npm install
npm run dev                  # http://localhost:3001/ar
npm run build && npm start   # production
npm run typecheck
```

| Env | Where | Meaning |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | client | `true` → in-memory mock API (also forced when `API_ORIGIN` is unset) |
| `API_ORIGIN` | server only | Laravel origin; `/backend/*` is rewritten to it (same-origin → Sanctum first-party cookies) |
| `MEDIA_ORIGIN` | server only | optional CDN origin added to CSP `img-src`/`media-src`/`frame-src` |

**Demo login** (shown on the login page only in demo mode): `admin@withaq.example` / `Demo@Withaq2026!`, 2FA `123456` (recovery codes e.g. `WTQ7-K2M9-4XPA`). The topbar user menu can switch the demo role to preview RBAC hiding. Demo mutations persist in memory + `sessionStorage` (per tab).

## Structure

```
src/
  app/[locale]/(auth)/{login,forgot-password,reset-password}
  app/[locale]/(dashboard)/            page (dashboard) · [resource] · [resource]/new · [resource]/[id]
                                       pages/[id]/builder · media · applications · contact-requests · complaints
                                       job-applications · audit-logs · settings · profile
  proxy.ts                             locale redirect + nonce CSP + admin security headers
  resources/                           config-driven CRUD definitions (18 resources)
  screens/                             ResourceList / ResourceEdit (generic) + specialised screens
  components/{ui,shell,forms,data-table,charts,media,page-builder,auth,providers}
  lib/api/{client,endpoints,errors}.ts typed client (CSRF, 401/403/419/422/423/429 mapping)
  lib/demo/                            mock adapter + deterministic fictional seed
  lib/{rbac,sanitize,i18n,csv,password}.ts
  types/api.ts                         copy of packages/api-types (contract) · types/admin.ts (admin records composed from it)
```

## Notes / deviations
- `types/admin.ts` adds admin record shapes (AdminPage, AdminNews, InboxRecord …) composed only from contract primitives — the contract has no per-resource admin shapes.
- Built-in home blocks are stored as `type: "home:<HomeSectionType>"` in page sections to avoid colliding with generic `hero`/`faq`/`cta`.
- Cities are a fixed select (no `cities` endpoint in the API contract).
- `faq-categories` uses the `faqs.*` permissions (the permission list has no separate key).
