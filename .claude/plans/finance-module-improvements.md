# Plan: Finance Module Improvements

> Source PRD: [PRD: Finance Module Improvements](./finance-module-improvements.prd.md)
> Backend contract prompt: [finance-backend-implementation-prompt.md](./finance-backend-implementation-prompt.md)

Redesign the Finance Monitor (`src/views/finance-monitor/`, route `/finance`) to match the Players/Teams list patterns and design system, and extend it with background auto-sync, live team-gift grouping, real category management, and client-side search + a category breakdown.

## Architectural decisions

Durable decisions that apply across all phases:

- **Backend**: Finance runs on the **separate v2 backend** (`VITE_API_PUBLIC_URL_V2`, `https://v2.core-league-dota2.org`) via `src/api/finance-client.ts` (`financeClient`) — a distinct axios instance from the v1 `src/api/client.ts`, sharing the same interceptors. After the v2 OpenAPI changes land, regenerate types with `npm run api:prod-v2` (see [finance-backend-implementation-prompt.md](./finance-backend-implementation-prompt.md)).
- **Routes**:
  - Finance page = `financeMonitorRouteNames.financeMonitor` (`name: 'finance'`, path `'finance'`).
  - Team-gift rows link to a team page via `teamRouteNames.team` with `params: { id: teamId }`.
- **Access control**: Admin-gated. Today there are **two divergent checks** — the route guard in `src/router/index.ts` uses `hasAdminRole()` (`role.isAdminRole === true`) while `src/components/Header.vue` matches `role.name === 'Адмін'`. **Decision: converge both on a single helper** (the boolean-flag `hasAdminRole` from `src/views/finance-monitor/constants.ts`, promoted to a shared location if needed). Route guard, nav entry, and any in-page gating must use the same predicate.
- **Query layer**: All server state goes through `useQueryWrapper` (`src/core/use-query.utils.ts`) in `src/composables/query/use-finance-*.ts`, with cache keys namespaced under `['finance', ...]`. Mutations invalidate the relevant `['finance']` keys. Existing composables: `use-finance-balance`, `use-finance-operations`, `use-finance-forecast`, `use-finance-assets`.
- **Service/store convention**: `finance.service.ts` is the HTTP facade over `financeClient` and owns `ElMessage` toasts; composables wrap it via `useQueryWrapper`. Net-new files follow `.claude/architecture.md`; legacy structure is edited in place, not rewritten.
- **Feed data model** (from the v2 contract): `GET /operations?from&to&includeForecast` returns a flat list of feed items that are one of: plain `OPERATION`, **team-gift group** (`teamId`, `name`, `logoUrl`, team-page ref, `aggregatedAmount`, `count`, nested children), **"Other gifts" group** (same shape, no team identity), or **manual group** (now with nested children). Every operation (top-level and child) carries its assigned `category` (`id`, `label`, `icon`) or `null`. Gift detection/aggregation is **computed live per request** on the backend over the requested range.
- **Categories**: flat, single-per-operation, clearable. CRUD via `/custom-categories` (`GET`, `POST`, `PATCH /{id}`, `DELETE /{id}`); assignment via `PATCH /operations/{id}/category` with `{ categoryId: string | null }`. Categories carry `matchers: string[]` (mirrors the `/sponsors` matcher precedent) and an income/expense `sign`/bucket.
- **Currency**: UAH only; amounts in kopecks internally, formatted with helpers in `src/views/finance-monitor/utils/format-money.ts` (`formatUah`, `kopecksToUah`, `signColorClass`).
- **Layout**: balance card on top; transactions feed + forecast calculator side-by-side (both restyled); category-breakdown card added to the layout.
- **Search/grouping/breakdown are client-side**: free-text search, accordion expand, and the per-category income/expense breakdown are all computed over the loaded feed (small, unpaginated dataset). No backend search/pagination.
- **Localization**: preserve Ukrainian/Russian user-facing strings and comments when editing.

---

## Phase 0: Backend contract (prerequisite — separate v2 repo)

**User stories**: gates US 4–10, 13–21.

### What to build

Not implemented in this frontend repo. This is a **hard dependency** built/verified in the v2 finance backend, driven by [finance-backend-implementation-prompt.md](./finance-backend-implementation-prompt.md): operations feed returning team-gift groups + "Other gifts" + manual groups with nested children and per-row category; tolerant "Подарунок для &lt;Team&gt;" parsing and team resolution (id/name/logo); categories CRUD + matchers + sign/bucket; single-category assignment endpoint.

Frontend work on Phases 2–4 **must not start** until this contract is confirmed live and `npm run api:prod-v2` regenerates the v2 schema with the new endpoints/fields.

### Acceptance criteria

- [ ] v2 `/api-json` exposes the operations feed with nested groups + per-row category, the categories CRUD/assignment endpoints, and category `matchers`/`sign`.
- [ ] `npm run api:prod-v2` regenerates the schema and the new shapes are visible to the frontend types.
- [ ] Backend returns a verification table (have / built / skipped) confirming the contract.

---

## Phase 1: Auto-sync + redesign shell + admin gating

**User stories**: 1, 2, 3, 23, 24, 26, 27.

### What to build

The end-to-end shell of the redesigned page, independent of the new feed/category data:

- **Admin gating, unified.** Converge the route guard and the Header nav entry on a single admin predicate; a non-admin hitting `/finance` is redirected and the nav entry is hidden.
- **Background auto-sync.** On mount, fire a bank sync for `from = now − 2 months`, `to = now` (UAH default) without blocking first paint; show a subtle "syncing…" indicator; on completion invalidate `['finance']` queries so the feed + balance refetch. The existing manual-sync-with-custom-range flow remains available.
- **Restyled layout + states.** Restyle the layout to the shared design system (balance card on top; feed + forecast side-by-side; a placeholder slot reserved for the breakdown card added in Phase 4), reusing Players/Teams list/card/state patterns. Every section has consistent loading, empty, and error states. The balance card and forecast calculator are preserved (visual restyle only — no change to forecast logic).

### Acceptance criteria

- [ ] Non-admin users are redirected away from `/finance` and don't see the nav entry; both checks use one shared predicate.
- [ ] Opening the page triggers a non-blocking last-2-months sync with a visible subtle indicator; the page is interactive immediately.
- [ ] On sync completion the feed and balance refetch automatically (via `['finance']` invalidation).
- [ ] Manual sync with a custom date range still works.
- [ ] Layout matches the Players/Teams design system; balance card and forecast calculator are restyled and functionally unchanged.
- [ ] Loading, empty, and error states are present and consistent across balance, feed, and forecast sections.

---

## Phase 2: Team-gift grouping + unified group visualization

**User stories**: 4, 5, 6, 7, 8, 9, 10, 11, 12, 25.

### What to build

Render the grouped feed delivered by the Phase 0 contract:

- **Team-gift groups** render as a single row per team showing the team logo, name, aggregated amount, and gift count, with the name/logo linking to the team page (`teamRouteNames.team`).
- **"Other gifts"** unmatched gifts render as one catch-all group row (same shape, no team link).
- **Inline accordion.** Groups are collapsed by default and expand in place to reveal child transactions (original description, category, amount, date/time).
- **Unified groups.** Existing manual groups render with the same expandable visualization as auto groups; the manual-grouping flow (select operations → group) is retained and polished.
- Existing per-row rename + change-icon behavior is preserved on plain operations and group children.

Tolerant "Подарунок для &lt;Team&gt;" matching (spelling/casing/whitespace) and team resolution are backend responsibilities (Phase 0); the frontend consumes resolved groups.

### Acceptance criteria

- [ ] Team-gift transactions for a team collapse into one row showing logo, name, total amount, and gift count.
- [ ] The aggregated row links to the team's page.
- [ ] Gifts whose team isn't resolved appear under a single "Other gifts" group.
- [ ] Expanding any group (team-gift, "Other gifts", or manual) reveals its child transactions inline with description, category, amount, and date/time; collapsed by default.
- [ ] Manual and auto groups share one consistent expandable visualization.
- [ ] Manual grouping of selected operations still works.
- [ ] Rename and change-icon still work on operations and group children.

---

## Phase 3: Categories (CRUD drawer + matchers + assignment + chips)

**User stories**: 13, 14, 15, 16, 17, 18, 19, 20.

### What to build

Full category management end-to-end:

- **Management drawer.** A dedicated drawer lists all categories and supports create (label + icon), edit (label/icon), and delete. Each category can define **matcher rules** (`matchers: string[]`) for backend auto-assignment.
- **Row assignment.** From a transaction's row menu, assign at most one category or clear it (`PATCH /operations/{id}/category` with `{ categoryId }` / `null`).
- **Chips.** Each transaction (and group child) shows a category chip reflecting its current category.

### Acceptance criteria

- [ ] The drawer lists all existing categories.
- [ ] A category can be created with a label and icon.
- [ ] A category's label and icon can be edited.
- [ ] A category can be deleted (assigned operations fall back to no category).
- [ ] Matcher rules can be defined/edited on a category.
- [ ] A single category can be assigned to a transaction from its row menu, and cleared.
- [ ] A category chip is shown on each transaction reflecting its assignment.

---

## Phase 4: Search + category breakdown card

**User stories**: 21, 22.

### What to build

The two client-side analysis features over the loaded feed:

- **Free-text search.** A search input filters the loaded feed client-side by title, original description, and team name. A group row matches if the group itself or any of its children match.
- **Category-breakdown card.** A card summarizes income/expense (and net) per category for the current range, computed client-side from the loaded feed, placed in the layout slot reserved in Phase 1.

### Acceptance criteria

- [ ] Typing in the search box filters the visible feed by title, description, or team name without a network call.
- [ ] Group rows surface when the group or any child matches the query.
- [ ] The breakdown card shows per-category income, expense, and net for the current range, computed from the loaded feed.
- [ ] Search and breakdown stay consistent with the feed's loading/empty/error states.
