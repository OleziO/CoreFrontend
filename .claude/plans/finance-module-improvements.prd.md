# PRD: Finance Module Improvements

> Source: User request (2026-06-07) — improve UI/UX, auto-sync, team-gift grouping, transaction grouping, and category management for the Finance Monitor module (`src/views/finance-monitor/`, route `/finance`).
>
> Finance runs on a **separate v2 backend** (`VITE_API_PUBLIC_URL_V2`, `https://v2.core-league-dota2.org`) via `src/api/finance-client.ts`. The live v2 OpenAPI currently lacks most endpoints these features need — see [`finance-backend-implementation-prompt.md`](./finance-backend-implementation-prompt.md) for the backend contract to be built/verified first.

## Problem Statement

The Finance Monitor page is hard to read and operate. Team-gift transactions ("Подарунок для <Team>") flood the feed as dozens of individual rows, drowning out everything else. There is no way to organize transactions: the only category action is "create" — categories can't be listed, edited, deleted, assigned, or used to filter or summarize. Transactions can't be searched. Bank data only appears after an admin manually opens a dialog and picks a date range, so the page is often stale on open. The layout (a fixed two-column split) and styling diverge from the rest of the app, and loading/empty/error states are inconsistent.

As a finance admin I want a clean, consistent, low-noise ledger that syncs itself, collapses repetitive gift transactions into meaningful team-level entries, and lets me categorize and find transactions quickly.

## Solution

Redesign the Finance Monitor to match the established Players/Teams list patterns and design system, and extend it so that:

- **Data is fresh on open.** The page auto-syncs the last 2 months in the background (non-blocking, with a subtle indicator) and refetches the feed + balance. A manual sync with a custom range remains available.
- **Team gifts collapse.** The backend detects "Подарунок для <Team Name>" (tolerant matching), resolves the team, and returns a single aggregated group per team for the current view range — showing the team logo, name, a link to the team page, the aggregated amount, and the gift count. Gifts whose team can't be resolved roll up into a single "Other gifts" group. Groups expand inline (accordion) to reveal child transactions (original description, category, amount, date/time).
- **Grouping is clearer.** Both auto team-gift groups and existing manual groups render as expandable rows with consistent visualization; manual grouping flow is retained and polished.
- **Categories are real.** Categories can be created, edited, deleted, and managed from a dedicated drawer (including auto-assign matcher rules). Each transaction can carry at most one category, assignable from its row menu. A category-breakdown card summarizes income/expense per category for the current range.
- **Transactions are searchable.** A free-text search filters the loaded feed client-side (by title, description, and team name).
- **The page is admin-gated** and consistent in its loading, empty, and error states.

## User Stories

1. As a finance admin, I want the page to automatically pull the last 2 months of bank data when I open it, so that I see current numbers without any manual action.
2. As a finance admin, I want the auto-sync to run in the background with a small "syncing…" indicator, so that I can start reading the feed immediately while data refreshes.
3. As a finance admin, I want to still trigger a manual sync for a custom date range, so that I can backfill or re-pull specific periods.
4. As a finance admin, I want all "Подарунок для <Team>" transactions for a team to collapse into one aggregated row, so that the feed isn't flooded with repetitive gift entries.
5. As a finance admin, I want each aggregated gift row to show the team logo and name, so that I can recognize the team at a glance.
6. As a finance admin, I want the aggregated gift row to link to the team's page, so that I can jump to that team's profile.
7. As a finance admin, I want the aggregated gift row to show the total amount and number of gifts, so that I understand the magnitude at a glance.
8. As a finance admin, I want to expand an aggregated gift row inline to see each individual gift (original description, amount, date/time, category), so that I can audit the details when needed.
9. As a finance admin, I want gifts whose team name doesn't match a known team to roll up into an "Other gifts" group, so that unmatched gifts still don't clutter the feed.
10. As a finance admin, I want the gift matching to tolerate the "Подрунок"/"Подарунок" spelling variants, casing, and extra whitespace, so that real-world bank descriptions still group correctly.
11. As a finance admin, I want manual groups to render the same expandable way as auto groups, so that grouping behaves consistently.
12. As a finance admin, I want to keep manually grouping selected operations, so that I can organize transactions the system didn't auto-group.
13. As a finance admin, I want to create a category with a label and icon, so that I can define how I organize transactions.
14. As a finance admin, I want to see a list of all existing categories, so that I know what's available before assigning.
15. As a finance admin, I want to edit a category's label/icon, so that I can fix or rename it.
16. As a finance admin, I want to delete a category, so that I can remove ones I no longer use.
17. As a finance admin, I want to assign a single category to a transaction from its row menu, so that categorizing is fast and in-context.
18. As a finance admin, I want to clear a transaction's category, so that I can correct mistakes.
19. As a finance admin, I want to define matcher rules on a category so new transactions get auto-categorized, so that I don't have to tag everything by hand.
20. As a finance admin, I want a category chip shown on each transaction, so that I can see its category at a glance.
21. As a finance admin, I want a category-breakdown card summarizing income/expense per category for the current range, so that I understand where money flows.
22. As a finance admin, I want to free-text search transactions by title, description, or team name, so that I can quickly find a specific transaction.
23. As a finance admin, I want the page styled like the Players/Teams pages, so that the app feels consistent.
24. As a finance admin, I want clear loading, empty, and error states on every section, so that I always know what's happening.
25. As a finance admin, I want to rename a transaction and change its icon (existing behavior), so that I can clean up unclear bank descriptions.
26. As a finance admin, I want the balance card and forecast calculator preserved (restyled), so that I keep the existing planning tools.
27. As a non-admin user, I want to be blocked from the Finance page, so that financial data stays restricted.

## Implementation Decisions

### Modules touched (frontend)

- `src/views/finance-monitor/` — primary redesign target: `FinanceMonitor.vue`, `components/` (BalanceCard, TransactionFeed, TransactionFeedItem, ForecastCalculator, BankSyncButton), `modals/`, `finance.service.ts`, `finance.types.ts`, `constants.ts`, `utils/`.
- `src/composables/query/use-finance-*.ts` — extend/add queries (operations with nested groups, categories list, category breakdown).
- `finance-monitor.route.ts` + router/nav — add admin role gating.
- Reuse existing teams route names (`teamRouteNames.team`) for gift-row links; reuse list/filter-bar/card components and patterns from `src/views/players` and `src/views/teams`.

### Backend contract (to build/verify on v2 — see companion prompt)

- **`GET /operations`** must return, in addition to plain `OPERATION` rows:
  - Live-computed **team-gift groups** (kind `TEAM_GIFT` or extend `GROUP`) — one per resolved team for the requested range, each with: `teamId`, team `name`, resolved `logoUrl`, team-page reference, `aggregatedAmount`, `count`, and **nested child operations**.
  - A single **"Other gifts"** group for unmatched gift descriptions, same shape minus team identity.
  - For every operation (and group child): its assigned `category` (id, label, icon) or null.
  - Manual groups continue to be returned, now also with nested children.
- **Team resolution** in v2: tolerant parse of "Подарунок для <Team Name>" (case-insensitive, "Подрунок"/"Подарунок" variants, trimmed, name = text after "для"), matched to a team (shared DB or v1 call), returning team id + name + logo asset URL.
- **Categories CRUD**: `GET /custom-categories` (list), `PATCH /custom-categories/{id}` (edit label/icon), `DELETE /custom-categories/{id}`. Existing `POST` stays.
- **Category assignment**: `PATCH /operations/{id}/category` with `{ categoryId: string | null }` (single category, clearable).
- **Category matchers** (auto-assign): categories carry a `matchers: string[]`; backend applies them when ingesting/serving operations. Managed via the CRUD endpoints.
- **Category sign/bucket**: categories usable as income/expense buckets so the FE can compute the breakdown from the loaded feed.

### Frontend behavior decisions

- **Auto-sync**: on mount, fire `POST /bank/sync` for `from = now − 2 months`, `to = now` (UAH account default). Non-blocking; show a subtle syncing indicator; on completion invalidate `['finance']` queries. Do not block first paint.
- **Search/filter**: free-text only, executed **client-side** over the loaded feed (small dataset, no pagination). Searches title, original description, and team name. Group rows match if the group or any child matches.
- **Grouping/expand**: inline accordion; collapsed by default; relies on nested children in the feed response.
- **Category breakdown card**: computed client-side from the loaded feed (per-category income/expense + net for the visible range).
- **Currency**: UAH only; reuse `formatUah` / kopecks helpers.
- **Access control**: gate `/finance` route + nav entry to admin roles (`hasAdminRole`); verify/standardize current enforcement.
- **Layout**: keep balance card on top, transactions + forecast side-by-side (both restyled to the shared design system), category-breakdown card added to the layout.

### Suggested phasing (vertical slices)

1. **Backend contract** — build/verify the v2 endpoints above (driven by the companion prompt) so the FE has a real contract.
2. **Auto-sync + redesign shell** — background 2-month sync, admin gating, restyled layout/components matching Players/Teams, consistent loading/empty/error states.
3. **Team-gift grouping** — render live team-gift groups (logo/name/link/total/count), "Other gifts" catch-all, inline accordion with child details; unify manual-group visualization.
4. **Categories** — management drawer (create/edit/delete + matchers), row-menu single-category assignment + clear, category chips.
5. **Search + breakdown** — free-text client-side search and the per-category income/expense breakdown card.

## Out of Scope

- Multi-currency / FX handling (UAH only).
- Category hierarchy / nesting (flat categories only).
- Multiple categories per transaction (single category only).
- Backend-side search/filtering or pagination of the feed (client-side over the full loaded set).
- Mobile-optimized layout (desktop-first admin tool; remain usable but not specially optimized).
- Drag-and-drop or bulk category assignment (row-menu picker only this round).
- Changes to forecast calculation logic (visual restyle only).

## Further Notes

- **Hard dependency**: Phases 3–5 depend on backend endpoints that do **not** exist on the live v2 API as of 2026-06-07. The companion file [`finance-backend-implementation-prompt.md`](./finance-backend-implementation-prompt.md) is the prompt for verifying/implementing them. Frontend work on those phases must not start until the contract is confirmed.
- Preserve Ukrainian/Russian user-facing strings and comments when editing.
- The existing `/sponsors` matcher mechanism (string `matchers` + `kind`) is a useful precedent for both team-gift matching and category auto-assign matchers — reuse the pattern on the backend where sensible.
- Follow `.claude/architecture.md` for any net-new files; leave legacy structure as-is where editing in place.
