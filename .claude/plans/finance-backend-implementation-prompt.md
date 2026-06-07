# Backend prompt: verify & implement Finance v2 endpoints

> Paste the block below into Claude Code **in the v2 finance backend repo** (the service behind `https://v2.core-league-dota2.org`). It asks the agent to verify the current API against this report and implement whatever is missing. The frontend PRD ([`finance-module-improvements.prd.md`](./finance-module-improvements.prd.md)) depends on this contract.

---

You are working in the **v2 finance backend** (the service serving `https://v2.core-league-dota2.org/api-json`, used by the CoreFrontend Finance Monitor). I audited the **live** OpenAPI and found it exposes only these paths: `/health`, `/webhook/monobank`, `/bank/sync`, `/operations`, `/operations/{id}/rename`, `/operations/{id}/icon`, `/operations/group`, `/custom-categories` (POST only), `/balance`, `/sponsors`, `/sponsors/{id}`, `/assets`, `/forecast`.

The frontend needs the capabilities below. **First verify** each against the actual codebase (the live spec may be stale or behind a flag/branch). For anything genuinely missing, **implement it**, following the existing architecture, validation (DTOs), and the `/sponsors` `matchers` precedent. Do not break existing endpoints. Report a verification table (have / missing / built) when done, and confirm the OpenAPI spec regenerates so the frontend can run `npm run api:prod-v2`.

## 1. Operations feed must return groups with nested children

`GET /operations` (query: `includeForecast`, `from`, `to`) currently returns a flat feed. It must also return:

- **Team-gift groups** — computed live for the requested range. Detect operations whose description matches **"Подарунок для <Team Name>"** with **tolerant** matching: case-insensitive, tolerate the misspelling **"Подрунок"** as well as **"Подарунок"**, collapse extra whitespace, and take `<Team Name>` as the trimmed text after "для" (strip trailing punctuation). Resolve `<Team Name>` to a real team (shared DB or a call to the v1 API) and return one group per resolved team for the range, each with: `teamId`, team `name`, resolved team `logoUrl`, a team-page reference/id, `aggregatedAmount` (sum), `count`, and the **nested child operations**.
- **"Other gifts" group** — a single catch-all group for gift descriptions whose team can't be resolved, same shape but without team identity.
- **Manual groups** — keep returning existing manual groups, now also including their **nested child operations**.
- **Category on every row** — each operation (top-level and group child) must include its assigned category (`id`, `label`, `icon`) or `null`.

Grouping is **computed live per request** (no manual action, no persisted group rows required for team gifts). Aggregation scope = the requested `from`/`to` range. Keep amounts in kopecks (UAH).

## 2. Team resolution

Add the ability for the v2 service to resolve a team by name (and return its logo asset URL + id) — via the shared database if available, otherwise a v1 API lookup. Matching should be reasonably tolerant (trimmed, case-insensitive). Expose nothing new publicly beyond what the feed needs.

## 3. Categories: full CRUD + assignment + auto-match

Currently only `POST /custom-categories` exists. Add:

- `GET /custom-categories` — list all categories (`id`, `label`, `icon`, `matchers`, and an income/expense `sign`/bucket if modeled).
- `PATCH /custom-categories/{id}` — edit `label`, `icon`, and `matchers`.
- `DELETE /custom-categories/{id}` — delete (decide + document behavior for operations currently assigned: unset to null is preferred).
- `PATCH /operations/{id}/category` — body `{ categoryId: string | null }`. **Single** category per operation; `null` clears it.
- **Matchers / auto-assign** — categories carry `matchers: string[]` (reuse the `/sponsors` matcher pattern). On ingest/serve, auto-assign a category to operations whose description matches, without overriding a manual assignment.

Categories are **flat** (no hierarchy) and **single-per-operation**.

## 4. Constraints / non-goals

- Everything is **UAH** (kopecks) — no multi-currency.
- No category hierarchy, no multi-category, no backend search/pagination (the frontend searches the loaded feed client-side).
- Preserve Ukrainian/Russian strings.

## 5. Deliverables

- Implement missing pieces with DTO validation matching existing style.
- Ensure the OpenAPI doc at `/api-json` reflects all new endpoints/fields.
- Return a table: each capability → "already implemented" / "implemented now" / "intentionally skipped (reason)".
