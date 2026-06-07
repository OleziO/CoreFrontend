---
name: check-schema-dts-for-api
description: How to discover available backend endpoints and DTO types
metadata:
  type: feedback
---

To discover backend methods/endpoints and their request/response types, read `src/api/types/schema.d.ts` rather than curling the live API (`api-json`).

**Why:** The user rejected a live `curl` of the OpenAPI spec and said "for methods and types check @schema.d.ts". The committed schema is the source of truth they want consulted.

**How to apply:** `schema.d.ts` is regenerated via `npm run api` (v1 backend) or `npm run api:prod-v2` (v2 finance backend at `v2.core-league-dota2.org`). The file may currently hold either v1 or v2 depending on the last regen. See [[finance-module-v2-backend]].
