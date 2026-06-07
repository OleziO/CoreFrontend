---
name: finance-module-v2-backend
description: The Finance Monitor module runs on a separate v2 backend with a limited API surface
metadata:
  type: project
---

The Finance Monitor view (`src/views/finance-monitor/`, route `/finance`) talks to a **separate v2 backend** (`VITE_API_PUBLIC_URL_V2`, `https://v2.core-league-dota2.org`) via `src/api/finance-client.ts` — NOT the main v1 API. Regenerate its types with `npm run api:prod-v2`.

As of 2026-06-07 the v2 finance API only exposes: `/bank/sync` (POST), `/operations` (GET feed; query: includeForecast/from/to), `/operations/{id}/rename`, `/operations/{id}/icon`, `/operations/group` (POST manual group), `/custom-categories` (POST create only), `/balance`, `/sponsors` (GET/POST/PUT with `matchers` string[] + kind BETKING/DUELO_GG), `/assets`, `/forecast` (GET/PUT).

**Gaps vs. requested features:** no team data, no team-gift auto-grouping, no category list/edit/delete/assign/hierarchy, no operations search/filter beyond date range. Such features need backend work or client-side workarounds. See [[check-schema-dts-for-api]].
