# Product registry governance (internal)

Maintainers: update `lib/product-registry.ts` when product maturity, URLs, or actions change. This document is **internal** — not linked from public marketing pages.

## Source of truth

| Field | Purpose |
| --- | --- |
| `id` | Stable slug — used in status probes and product pages |
| `name` / `publicName` | Display names |
| `maturity` | `live` \| `preview` \| `prototype` \| `internal` \| `planned` |
| `repository` | Owning repo (do not modify external repos from this site) |
| `productPagePath` | Marketing product page on smohix.run |
| `productUrl` | Primary open destination (HTTPS, allowlisted hosts only) |
| `docsUrl` | Documentation entry point |
| `healthCheck` | Optional `{ host, path }` for server-side probes |
| `availableActions` | CTAs — never `open_product` for `planned` |
| `capabilities` / `limitations` | Honest product copy |
| `pilotAvailable` | Whether pilot intake is offered |
| `lastVerifiedAt` | ISO date of last human review |

## Public URLs (verified 2026-08-01)

| Product | Maturity | Public URL |
| --- | --- | --- |
| Smohix Platform | live | Sign-in → `/hub` |
| Smohix AI | live | https://ai.smohix.run |
| Smohix Own API | live | `/docs/api`, `/api/health` |
| Identity | live | `/auth/sign-in` |
| Agents | prototype | `/automations` (signed in) |
| Analytics | preview | `/overview` (signed in) |
| Memory Pendant | prototype | Product page + pilot only |
| Projects | planned | `/settings/members` foundation |
| Knowledge | planned | `/runbooks` module |

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical site URL (default `https://smohix.run`) |
| `SMOHIX_AI_PUBLIC_URL` | Server | Override for AI product URL (default `https://ai.smohix.run`) |

Never expose Railway internal hostnames, service role keys, or API keys in registry URLs or public pages.

## Status probes

Implemented in `lib/status/adapters.ts`:

- Server-side fetch only (5s timeout, 60s cache)
- Allowlisted hosts: `smohix.run`, `ai.smohix.run`, localhost
- Returns `operational` \| `degraded` \| `unavailable` \| `unknown` \| `prototype` \| `planned`
- No uptime percentages without stored history
- No Railway deployment metadata in responses

## Release process

1. Update registry entry and `lastVerifiedAt`
2. Run `npm run test:product-registry`
3. Run `npm run verify:release` before deploy
4. Update product page copy in `components/experience/ProductExperienceSections.tsx` if needed

## Product owner placeholders

| Product | Owner | Last review |
| --- | --- | --- |
| Smohix Platform | _TBD_ | 2026-08-01 |
| Smohix AI | _TBD_ | 2026-08-01 |
| Smohix Own API | _TBD_ | 2026-08-01 |
| Memory Pendant | _TBD_ | 2026-08-01 |

## Route map

| Route | Behavior |
| --- | --- |
| `/products` | Product Access hub (primary) |
| `/demo` | Redirect → `/products` |
| `/explore` | Product orientation |
| `/tour` | Redirect → `/explore` |
| `/playground` | API request builder (examples only, no execution) |
| `/status` | Real status probes (not in sitemap) |

## Tests

```bash
npm run test:product-registry
```

Validates: duplicate IDs, allowlisted hosts, Smohix AI URL, maturity CTAs, no mock files, redirect config, status sanitizer, sitemap rules.
