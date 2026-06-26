# Mutation → Local-State Patch Convention

**Date:** 2026-06-25
**Status:** Approved design, pending implementation plan
**Scope:** All create/update/delete flows across feature view modules (`src/views/**`)

## Problem

Most admin create/update/delete actions do not update the UI reactively — the
user must refresh the page to see the result. The codebase already has the right
building blocks (each store exposes a `patch*InList(entity)` helper plus a
remove/delete path), but many mutation flows never call them. Four divergent
patterns coexist:

1. **Fetch-fresh + merge** — e.g. player verify (`mergePlayerAfterVerifyMutation`
   → `patchPlayerInList`). Correct.
2. **Patch store + invalidate cache** — e.g. tournament create from the drawer
   (`patchTournamentInList` + `queryCache.invalidateQueries`). Correct, but the
   patch lives in the component instead of a store action.
3. **Re-fetch everything** — e.g. Teams mutations (re-fetch full team), and the
   Verification drawer's `emit('refresh')` → `loadMonth()`. Updates the UI, but
   heavier and inconsistent.
4. **Return response, patch nothing** — most Tournament playoff/join/leave
   actions, `setPlayerRolesByAdmin`, raw `updatePlayer`/`deletePlayer`. **These
   require a manual refresh** and are the core of the reported bug.

The fix is to establish a single convention and apply it everywhere, unifying the
working-but-divergent flows along the way.

## The Convention

Every create/update/delete flows through **three fixed layers**. The **store
action is the single owner of reactive-state mutation.**

### Layer 1 — Service (network only)

- A mutating service method performs the request and returns the **resolved
  entity** per the per-method contract below.
  - create / update → the **full hydrated entity** (`TTournament` / `TPlayer` /
    `TTeam`).
  - delete → the **`id`** that was deleted (not the response body).
- If an endpoint is known to return a **partial payload or `void`**, the service
  re-fetches (GET-by-id) or merges **inside the service**, so callers never
  receive a partial object.
- **Services do not import stores.** This preserves the documented layering
  (`store delegates to service`, never the reverse). The merge/re-fetch logic
  that produces a full entity lives in the service; the *application* of that
  entity to reactive state lives in the store.

### Layer 2 — Store action (single patch owner)

- A store action wraps the service call, then applies the result:
  - create / update → `patch*InList(entity)`
  - delete → `remove*FromList(id)`
- This is the **only** place reactive state is mutated for a given entity list.
- Patch happens **only after** a resolved (non-throwing) service response, so a
  failed mutation never corrupts local state.
- Where a Pinia Colada cache exists for the entity, the store action calls
  `queryCache.invalidateQueries({ key: [...] })` **after** the local patch
  (instant UI + eventual consistency). Today only tournaments uses this.

### Layer 3 — Component / modal

- Components call the **store action**, never the service directly, and never
  patch the store themselves.
- Components keep their own loading flags and toasts where they already have
  them.
- Existing direct `xxxService.*` calls in components/modals are redirected to a
  store action. (Notably: the Tournament create patch moves *out of*
  `CreateTournamentDrawer.vue` into a `tournamentStore` action.)

## Reactivity notes (Vue 3)

- Direct index assignment (`data.value[i] = next`) and `Array.prototype.splice`
  are both reactive under Vue 3's Proxy reactivity — existing
  `patch*InList` helpers are correct as written.
- `patch*InList` already handles "entity not found → insert," so patching from a
  card/detail view (where the list was never loaded) is safe.
- Teams' `updateTeam` currently uses `Object.assign(currTeam, updatedTeam)`. This
  is replaced by `patchTeamInList(fullTeam)` so (a) partial responses can't leave
  stale fields and (b) the entity is inserted if absent from the list.

## Per-method contract

"Re-fetch" below means **the service issues a GET-by-id and returns the full
entity**, so the store always splices a complete object.

### Tournaments — two reactive targets

Tournament mutations split across **two** state owners and the convention must
name which one a given flow updates:

1. **The list** — `tournamentsData[]` in `tournaments.store.ts`. Owns the
   tournaments list page and cards. Updated via
   `patchTournamentInList` / `removeTournamentFromList`.
2. **The detail page's local ref** — `Tournament.vue:140` holds its own
   `tournament = ref<TTournament | null>(null)`; admin sub-tabs and result modals
   read it through `props.tournament`. Patching the *list* does **not** refresh
   this ref.

`Tournament.vue:344` `reloadTournament()` already re-fetches by id and updates
**both** targets (`tournament.value = fresh` **and** `patchTournamentInList(fresh)`).
Flows that work today do `emit('refresh')` → `reloadTournament()`.

- **List-scoped mutations** (create / update / delete from admin-panel drawers
  and the list page): store action → `patchTournamentInList` /
  `removeTournamentFromList`. `CreateTournamentDrawer` / `UpdateTournamentDrawer`
  already do this; keep.
- **Detail-scoped mutations** (join / leave / playoff staging / start /
  disqualify / match-submit / tech-loss, run inside the `Tournament.vue`
  subtree): the canonical refresh is `reloadTournament()`, which updates both
  targets. The fix is ensuring every such modal/tab reliably triggers it. The
  **per-call-site choice** (keep `emit('refresh')` where a parent path exists vs.
  promote `reloadTournament` into a store action for orphan modals) is made in
  the implementation plan. No new per-method list-patch is added for these.

The table below lists the list-scoped methods (store-patched directly). Detail-
scoped methods are handled by the `reloadTournament` wiring described above.

**List-scoped (store-patched directly):**

| Method | Service returns | Store action patches |
|---|---|---|
| `createTournament` | full `TTournament` (API returns full) | `patchTournamentInList` + invalidate `['tournaments']` |
| `updateTournament` | full `TTournament` (API returns full) | `patchTournamentInList` + invalidate `['tournaments']` |
| `deleteTournament` | the `id` | `removeTournamentFromList(id)` + invalidate |

**Detail-scoped (refresh via `reloadTournament`, per-call-site wiring decided in
the plan):**

| Method | UI refresh mechanism |
|---|---|
| `joinTournament` / `leaveTournament` | `reloadTournament()` (already wired via `emit('refresh')` in `TournamentAdminTab` / `Tournament.vue`) |
| `addPlayoffTeams` / `removePlayoffTeams` | local staging ref in `TournamentAdminTab`; `reloadTournament` on start |
| `startPlayoff` / `disqualifyPlayoffTeam` | `reloadTournament()` via existing `emit('refresh')` |
| `submitQualificationMatch` | wire `QualificationAddResultModal` → `reloadTournament()` |
| `submitPlayoffMatch` | wire `PlayoffSubmitResultModal` → `reloadTournament()` (currently missing) |
| `adminTechLossQualificationMatch` / `adminTechLossPlayoffMatch` | wire TechLoss modals → `reloadTournament()` (currently missing) |

`tournaments.store.ts` gains list-scoped mutating actions (create/update/delete)
that wrap the service and patch the list. The detail-scoped fix is wiring the
result modals to `reloadTournament`; whether a given orphan modal instead calls a
promoted `tournamentStore.reloadTournament(id)` action is decided per call site in
the plan. `CreateTournamentDrawer` / `UpdateTournamentDrawer` already patch the
list and only need to route through the new store action for consistency.

### Players (`src/views/players/`)

| Method | Service returns | Store action patches |
|---|---|---|
| `setPlayerVerificationByAdmin` | merged `TPlayer` (already done) | `patchPlayerInList` (already done — keep) |
| `setPlayerRolesByAdmin` | merged `TPlayer` (reuse merge-helper sibling) | `patchPlayerInList` |
| `updatePlayer` | full `TPlayer` (re-fetch if PATCH partial) | `patchPlayerInList` |
| `deletePlayer` | the `id` | remove from `players` list |

`players.store.ts` has `patchPlayerInList` but currently lacks update/delete/roles
actions wrapping the service — these are added.

### Teams (`src/views/teams/`)

| Method | Service returns | Store action patches |
|---|---|---|
| `createTeam` | full `TTeam` (re-fetch, existing) | `patchTeamInList` (replace `unshift`) |
| `updateTeam` | full `TTeam` (re-fetch, existing) | `patchTeamInList` (replace `Object.assign`) |
| `addPlayerToTeam` | full `TTeam` (existing re-fetch) | `patchTeamInList` |
| `removePlayerFromTeam` | full `TTeam` (existing re-fetch) | `patchTeamInList` + `clear/setPlayerTeamIdClientside` |
| `removeCoach` | full `TTeam` | `patchTeamInList` |
| `verifyTeam` / `unverifyTeam` | full `TTeam` (existing re-fetch) | `patchTeamInList` |
| `transferCaptaincy` | full `TTeam` | `patchTeamInList` |
| `deleteTeam` (dissolve) | the `id` | remove from list (existing) + `clearTeamMembershipClientside` |

Teams already re-fetches full entities in the service; this phase only swaps the
store's `unshift`/`Object.assign` for `patchTeamInList`, and routes the roster
ops that bypass the store today through store actions.

### Verification + remaining admin tabs (`src/views/admin-panel/`)

- **Verification** keeps the `loadMonth(date)` re-fetch mechanism (granular
  list-patching is out of scope as too risky), but it is **moved into a store
  action** so the layering is uniform. The drawer calls a
  `verificationStore.refreshMonth(date)` action instead of
  `emit('refresh')` → parent `loadMonth`. The per-request actions
  (`processRequest`, `completeRequest`, `cancelRequest`, slot create/delete) call
  their service method through a store action that then triggers the month
  refresh.
- **MMR requests** (`MmrRequestsTab.vue` `approve`/`reject`): the component's
  inline `requests.value.filter(...)` moves into a store action; the service
  return value (the updated request) is used if present.
- Any other admin tab performing a mutation inline is routed through a store
  action following the same rule.

## Error handling & edge cases

- Services keep throwing and toasting exactly as today. Store actions patch only
  on a resolved response.
- Delete actions remove by the `id` passed in, independent of response body
  (handles `void` deletes).
- `patch*InList` insert-if-absent keeps card/detail-view mutations safe.
- `queryCache.invalidateQueries` runs after the local patch, only for entities
  that have a Colada cache (tournaments today).

## Phasing (each phase independently shippable)

- **Phase 1 — Tournaments.** Add list-scoped store actions (create/update/delete)
  that wrap the service and patch the list; route the two tournament drawers
  through them. Wire the detail-scoped result modals (`PlayoffSubmitResultModal`,
  `TechLossQualificationModal`, `TechLossPlayoffModal`, `QualificationAddResultModal`)
  to refresh the detail page via `reloadTournament()` — per call site, either an
  existing `emit('refresh')` path or a promoted `tournamentStore.reloadTournament`
  action for orphan modals. Highest-impact, worst module.
- **Phase 2 — Players.** Add update/delete/roles store actions; make
  `setPlayerRolesByAdmin` return a merged `TPlayer`; redirect callers.
- **Phase 3 — Teams.** Replace store `unshift`/`Object.assign` with
  `patchTeamInList`; route roster/captaincy/verify ops through store actions.
- **Phase 4 — Verification + admin tabs.** Relocate `loadMonth` into a
  `verificationStore` action; move MMR `approve`/`reject` list mutation into a
  store action; sweep remaining admin-tab inline mutations.

## Verification (no test runner exists)

There is no configured test runner (`.claude/CLAUDE.md`). Each phase is verified
by:

1. `npm run type-check` — passes.
2. `npm run lint` — passes (respects the type-prefix / 2-space / max-len rules).
3. **Manual smoke per phase:** perform each mutating action in the running app
   and confirm the UI updates **without a page refresh**:
   - Phase 1: create/edit/delete a tournament; join/leave; add/remove playoff
     teams; start playoff; submit a qualification + playoff match.
   - Phase 2: edit a player; change roles via admin; delete a player.
   - Phase 3: create/edit a team; add/remove roster player; verify/unverify;
     transfer captaincy; remove coach; dissolve team.
   - Phase 4: process/complete/cancel a verification request; create/delete a
     slot; approve/reject an MMR request.

## Non-goals

- No change to network/endpoint behavior or OpenAPI types.
- No conversion of Verification to granular per-item patching (keep `loadMonth`).
- No unrelated refactors; legacy structure outside these flows is left as-is per
  `.claude/CLAUDE.md`.
- No new query-layer adoption (`useQueryWrapper`) for these flows; existing
  service-through-store delegation is retained.
