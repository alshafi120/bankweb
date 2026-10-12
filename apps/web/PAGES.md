# Public site — routes

Every route exists as `/ar/...` (RTL) and `/en/...` (LTR). Data comes from the public API (`API_BASE_URL`, `/api/v1`) through `src/lib/api/client.ts`. When `API_BASE_URL` is unset, the client falls back to demo content in `src/content/demo/*.ts`. Each page sets its own metadata (canonical, hreflang ar/en/x-default, OG, Twitter) and renders breadcrumbs with `BreadcrumbList` JSON-LD.

| Route | Data source (GET /api/v1…) | Form → POST /api/forms/… |
|---|---|---|
| `/` | `/pages/home/content` | — |
| `/about` `/board` `/executive-management` `/governance` `/csr` `/reports` `/privacy` `/terms` `/transfers` (`#send`, `#receive`) `/digital` | `/pages/{slug}` → `components/blocks/BlockRenderer` | — |
| `/{any-slug}` | `/pages/{slug}` (new CMS pages, 404 if missing) | — |
| `/personal` `/business` | `/pages/home/content`, `/services`, `/products?type=account`, `/financing`, `/cards` (filtered by `lib/segments.ts`) | — |
| `/services` | `/services` | — |
| `/accounts` · `/accounts/[id]` | `/products?type=account` | links to `/apply/account?type=` |
| `/financing` · `/financing/[id]` | `/financing` · `/financing/{id}` | calculator → `/apply/financing?product=&amount=&months=` |
| `/cards` · `/cards/[id]` | `/cards` · `/cards/{id}` | links to `/apply/card?type=` |
| `/offers` | `/offers` (active only) | — |
| `/branches` `/atms` `/agents` (`?city=`) | `/branches` · `/atms` · `/agents` | — |
| `/news` (`?category=&page=`) · `/news/[slug]` | `/news`, `/news-categories` · `/news/{slug}` | — |
| `/faq` | `/faqs` | — |
| `/careers` (`?city=&department=`) · `/careers/[slug]` | `/jobs` · `/jobs/{slug}` | `job` → `/jobs/{slug}/apply` (multipart, CV) |
| `/contact` | `/settings`, `/branches` | `callback` → `/contact` |
| `/complaints` | `/branches` | `complaint` → `/complaints` (multipart, optional attachment) |
| `/apply/account` · `/apply/financing` · `/apply/card` · `/apply/callback` | `/branches`, `/financing`, `/cards` | `account`/`financing`/`card` → `/applications`; `callback` → `/contact` |
| `/sitemap.xml` | `/sitemap` (falls back to static + demo routes) | — |

## Route handlers
- `POST /api/forms/[form]`: same-origin. Rejects bodies over 6 MB, re-validates with `lib/forms/validation.ts`, sniffs file types, handles the honeypot, and forwards to the API with `X-Forwarded-For`. With no API configured it returns a demo 201.
- `POST /api/revalidate`: requires the `X-Revalidate-Secret` header (timing-safe compare). Body `{ tags?, paths? }`.
- `POST /api/track`: cookieless page-view beacon, forwarded to `/track`.

Not-found and error screens: `app/[locale]/not-found.tsx` and `app/[locale]/error.tsx`.
