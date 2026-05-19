# Plan: Player Profile & Team Page Improvements

> Source PRD: [Player Profile & Team Page Improvements](./player-profile-team-improvements.prd.md)

Three independent features. Phases are ordered low-risk → high-risk; each is a complete vertical slice and ships on its own.

## Architectural decisions

Durable decisions that apply across all phases (verified against the live backend on 2026-05-19 via `npm run api`):

- **Roles backend contract**: `PATCH /admin/players/{playerId}/roles` with body `AdminSetPlayerRolesDto` = `{ roles: { name: "Гість"|"Гравець"|"Капітан"|"Медіа"|"Адмін"; isAdminRole: boolean }[] }`. It **replaces the full role set**, syncs Discord, and restamps `verifiedAt`. Response `AdminPlayerRolesResultDto` = `{ playerId, verifiedAt, roles: { id, name, isAdminRole, color }[] }`. This is a different path from the existing `POST/DELETE /admin/players/{playerId}/admin` (grant/revoke admin) and `PUT /admin/players/{playerId}/role` (primary role) — do **not** route the multiselect through `PATCH /players/{id}` (its `UpdatePlayerDto` has no roles field).
- **Roles catalog source**: existing `GET /user-roles` → `playersStore.userRolesCatalog` (`userRolesCatalogRef` in `players.service.ts`), items `{ id, name, isAdminRole, color }`. Multiselect binds by **role `name`** (matches the existing working pattern in `PLayersFilterModal.vue`); payload maps each selected name → `{ name, isAdminRole }`.
- **Roles UI host**: `src/views/players/modals/PLayerEditProfileModal.vue` (the admin edit form). Save flow extends the existing `onSubmit` (currently `playersService.updatePlayer`). Roles are persisted via a **separate service call** to the roles endpoint, sequenced with the existing profile patch.
- **Dota account ID**: player field is `steamId: string | null` (SteamID64). OpenDota needs the 32-bit `account_id` = `steamId - 76561197960265728n` (use BigInt for the subtraction, render as string). Gate all hero fetching on a present, convertible `steamId`.
- **Favorite Heroes data path**: **direct browser → OpenDota** (`https://api.opendota.com/api/players/{account_id}/heroes`), not the typed `apiClient`. New code lives in a dedicated module (a service + a `@pinia/colada` query via `useQueryWrapper` from `src/core/use-query.utils.ts`), keyed by `account_id`, `refetchOnWindowFocus: false`, `enabled` only when `account_id` resolves. Hero icons: Stratz CDN `https://cdn.stratz.com/images/dota2/heroes/{hero_short_name}_icon.png`, where `hero_short_name` derives from a `hero_id → name` map sourced once from OpenDota constants (`https://api.opendota.com/api/constants/heroes` or `/api/heroes`), itself a cached query.
- **Favorite Heroes UI host**: `src/views/players/Player.vue`, a new section appended after the stats grid (ends ~line 327) and before the "Профіль" section, reusing the existing stat-card container styling (`rounded-2xl border border-gray-800/90 bg-gradient-to-br …`).
- **Coach backend**: already present — `TeamResponseDto.coach?: PlayerResponseDto | null` is returned by `GET /teams/{id}`. **No backend work.** Country/flag is **not** modeled on the player anywhere, so it is out of scope (PRD says "if currently supported elsewhere").
- **Coach UI host**: `src/views/teams/Team.vue`, new section directly below the "Запас" (reserve) section, reusing the existing `PlayerCard` component (no new card logic). Implements PRD **Option A**.
- **Conventions**: follow CLAUDE.md — auto-imports (no manual imports for store/service/Vue APIs), `I`/`T`/`E` type-name prefixes, 2-space indent, `max-len` 120, preserve Ukrainian/Russian user-facing strings. New view-local types in the relevant `*.d.ts`; new service/store methods auto-imported by name. Verify each phase with `npm run lint` and `npm run type-check`.

---

## Phase 1: Roles multiselect in admin player edit form

**User stories**: Roles Multiselect — "Admin can open player edit page, see current assigned roles, add/remove roles, save profile successfully."

### What to build

In the admin player edit modal, add an Element Plus `multiple` `el-select` of roles, prefilled from the player's current `roles`, with options from the cached `GET /user-roles` catalog (mirroring the existing filter-modal multiselect). On save, after the existing profile patch succeeds, send the full selected role set to `PATCH /admin/players/{playerId}/roles` and merge the returned `AdminPlayerRolesResultDto` (roles + `verifiedAt`) back into local player state so the profile reflects changes immediately and after reload. Add a service method (auto-imported) for the roles call; do not reuse `updatePlayer`. Handle the multiselect being absent for non-admins (gate with the existing role-guard pattern). Surface success/failure via the existing `ElMessage` toast convention.

### Acceptance criteria

- [ ] Roles multiselect is visible in the admin player edit form, prefilled with the player's current roles.
- [ ] Options load from the existing `GET /user-roles` catalog; multi-selection works.
- [ ] Saving sends a full role set to `PATCH /admin/players/{playerId}/roles` and succeeds.
- [ ] Returned roles + `verifiedAt` are merged into local state; UI reflects changes without a hard reload and survives an actual reload.
- [ ] Profile MMR/positions save behavior is unchanged (no regression to existing `onSubmit`).
- [ ] `npm run lint` and `npm run type-check` pass.

---

## Phase 2: Coach block on team page

**User stories**: Coach Block — "Coach appears on team page roster section; layout matches existing team roster UI."

### What to build

In `Team.vue`, add a coach section immediately below the reserve ("Запас") section (PRD Option A), rendering `team.coach` via the existing `PlayerCard` component (avatar, nickname, name, click-through to player page — identical behavior to roster cards, no `isCaptain`). When `team.coach` is null: hide the section when the roster is not editable; show the existing add-player-style placeholder when the roster is editable (consistent with how main/reserve render add buttons). No new card or roster-rendering logic.

### Acceptance criteria

- [ ] Coach section renders below substitutes when `team.coach` is present.
- [ ] Coach card visually matches existing player cards and click-through navigates to the player page like other roster cards.
- [ ] Empty state: section hidden when not editable; lightweight add placeholder shown when editable.
- [ ] No duplicated roster/card rendering logic introduced (reuses `PlayerCard`).
- [ ] `npm run lint` and `npm run type-check` pass.

---

## Phase 3: Favorite Heroes — data tracer bullet

**User stories**: Favorite Heroes — "Fetch favorite heroes for the player using their Dota account ID; data loads from OpenDota correctly."

### What to build

A complete data path, rendered minimally end-to-end: resolve `account_id` from `player.steamId` (BigInt conversion), a cached hero-constants query (`hero_id → short name`), and a cached player-heroes query against OpenDota — both via `useQueryWrapper` with `refetchOnWindowFocus: false` and `enabled` gated on a resolvable `account_id`. Render a bare, unstyled list in the new Player.vue section: hero icon (Stratz CDN URL built from the hero map), hero name, `games` count, sorted by games desc, top N. No polished styling, no full edge-state UX yet — just prove the external API → screen path works and is cached (no duplicate requests on remount/navigation).

### Acceptance criteria

- [ ] `steamId` → OpenDota `account_id` conversion is correct (BigInt) and returns no section when `steamId` is missing/invalid.
- [ ] Player-heroes and hero-constants queries hit OpenDota and are cached via `@pinia/colada` (no repeated requests on revisit within cache window).
- [ ] A minimal list renders top heroes by games played with a working Stratz CDN icon URL and hero name.
- [ ] `npm run lint` and `npm run type-check` pass.

---

## Phase 4: Favorite Heroes — polished UI + edge states

**User stories**: Favorite Heroes — "Block appears in player statistics section; hero icons load from Stratz CDN; empty/loading/error states work properly; UI does not shift aggressively during loading."

### What to build

Promote the Phase 3 list into styled hero cards that visually align with the existing stat cards (same container/border/gradient system), responsive grid, showing hero image, name, matches played, and winrate (`win / games`) when available. Add all states with stable layout (skeleton/placeholder sized to final cards to avoid layout shift): loading, empty OpenDota response, request failure, no linked Dota account (clear message, not an error), and missing/broken hero image (graceful fallback). Final visual polish and Ukrainian/Russian labels consistent with the surrounding profile UI.

### Acceptance criteria

- [ ] "Favorite Heroes" block matches existing stat-card visual style and is responsive.
- [ ] Each card shows hero image (Stratz CDN), name, matches played, and winrate when available.
- [ ] Loading state has stable layout (no aggressive shift); skeletons match final card dimensions.
- [ ] Distinct, non-error handling for: no linked Dota account, empty response, request failure, missing hero image (fallback).
- [ ] Labels are in the surrounding UI's language; section integrates cleanly into the lower statistics area.
- [ ] `npm run lint` and `npm run type-check` pass.
