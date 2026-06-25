# Mutation → Local-State Patch Convention — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every create/update/delete flow through one convention — service returns the resolved entity, a store action is the sole owner of reactive-state mutation, components call store actions — so admin actions update the UI with no page refresh.

**Architecture:** Three fixed layers. (1) Service methods stay network-only and return the resolved entity (full entity for create/update; the `id` for delete; re-fetch internally when the API returns a partial/void). (2) Store actions wrap the service call and apply `patch*InList` / `remove*FromList`, plus `queryCache.invalidateQueries` where a Colada cache exists. (3) Components/modals call the store action, never the service directly. Tournament mutations have two reactive targets (the list + the detail page's local ref); the detail page is refreshed via the existing `reloadTournament()`, promoted into a store action.

**Tech Stack:** Vue 3 (`<script setup>`), Pinia setup-stores, `@pinia/colada` (`queryCache` singleton), Element Plus, TypeScript, Vite. Auto-imports are active (stores/services/`ref`/`computed` need no manual import).

## Global Constraints

- **No test runner exists.** Per-task verification is: `npm run type-check` passes, `npm run lint` passes, plus the task's manual smoke in the running app (`npm run dev`).
- **ESLint naming:** interfaces `I*`, type aliases `T*`, enums `E*`. `max-len` 120. 2-space indent (`@typescript-eslint/indent`).
- **Auto-imports:** do NOT add manual imports for `ref`, `computed`, `defineStore`, store hooks (`useTournamentStore`), or service singletons (`tournamentsService`). `queryCache` IS a manual import: `import { queryCache } from '@/core/query-cache-client'`.
- **Preserve Ukrainian/Russian** user-facing strings and comments verbatim when moving code.
- **Services must not import stores** (preserves layering). Merge/re-fetch that produces a full entity lives in the service; applying it to reactive state lives in the store.
- **Patch only after a resolved (non-throwing) response.** A failed mutation must never mutate local state.
- Each phase is independently shippable; commit per task.

---

## File Structure

**Phase 1 — Tournaments**
- Modify: `src/views/tournaments/tournaments.store.ts` — add `createTournament`, `updateTournament`, `deleteTournament`, `reloadTournament` actions.
- Modify: `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue` — call store action instead of service + manual patch.
- Modify: `src/views/admin-panel/components/drawers/UpdateTournamentDrawer.vue` — same.
- Modify: `src/views/tournaments/components/TournamentAdminTab.vue` — `deleteTournament` via store action.
- Modify: `src/views/tournaments/Tournament.vue` — `reloadTournament` delegates to store action; wire orphan tech-loss modals to refresh.

**Phase 2 — Players**
- Modify: `src/views/players/players.service.ts` — make `setPlayerRolesByAdmin` return a full merged `TPlayer`; make `updatePlayer` return a hydrated `TPlayer`; have `deletePlayer` return the `id`.
- Modify: `src/views/players/players.store.ts` — add `updatePlayer`, `deletePlayer`, `setPlayerRoles` actions.
- Modify: `src/views/players/modals/PlayerEditProfileModal.vue` — call store actions.

**Phase 3 — Teams**
- Modify: `src/views/teams/teams.store.ts` — `createTeam`/`updateTeam` use `patchTeamInList`; add roster/verify/captaincy actions.
- Modify call sites in `src/views/teams/**` and `src/components/modals/**` that call roster/verify/captaincy service methods directly.

**Phase 4 — Verification + admin tabs**
- Create: `src/views/admin-panel/verification.store.ts` — owns the month cache + `loadMonth`/`refreshMonth` and per-request/slot actions.
- Modify: `src/views/admin-panel/components/tabs/VerificationTab.vue` — delegate to store.
- Modify: `src/views/admin-panel/components/drawers/VerificationDayDrawer.vue` — call store actions.
- Modify: `src/views/admin-panel/components/tabs/MmrRequestsTab.vue` — list mutation via store action (new `mmr-requests.store.ts`).

---

## PHASE 1 — Tournaments

### Task 1: Add list-scoped + reload actions to the tournaments store

**Files:**
- Modify: `src/views/tournaments/tournaments.store.ts`

**Interfaces:**
- Consumes: `tournamentsService.createTournament`, `.updateTournament`, `.deleteTournament`, `.reloadTournament`; existing `patchTournamentInList(next: TTournament)`, `removeTournamentFromList(id: string)`.
- Produces (new store actions):
  - `createTournament(data: TCreateTournamentDto): Promise<TTournament>`
  - `updateTournament(id: string, data: TUpdateTournamentDto): Promise<TTournament>`
  - `deleteTournament(id: string): Promise<void>`
  - `reloadTournament(id: string): Promise<TTournament | null>`

- [ ] **Step 1: Add the imports and actions**

At the top of `src/views/tournaments/tournaments.store.ts`, add the query-cache and DTO imports next to the existing `import { AxiosError } from 'axios'`:

```ts
import { AxiosError } from 'axios'
import { queryCache } from '@/core/query-cache-client'
import type { TCreateTournamentDto, TUpdateTournamentDto } from '@/api/types/api.types'
```

Inside the store, after `removeTournamentFromList` (currently ends line 18), add:

```ts
  function invalidateTournamentsCache () {
    queryCache.invalidateQueries({ key: ['tournaments'] })
  }

  async function createTournament (data: TCreateTournamentDto): Promise<TTournament> {
    const created = await tournamentsService.createTournament(data) as TTournament
    patchTournamentInList(created)
    invalidateTournamentsCache()
    return created
  }

  async function updateTournament (id: string, data: TUpdateTournamentDto): Promise<TTournament> {
    const updated = await tournamentsService.updateTournament(id, data) as TTournament
    patchTournamentInList(updated)
    invalidateTournamentsCache()
    return updated
  }

  async function deleteTournament (id: string): Promise<void> {
    await tournamentsService.deleteTournament(id)
    removeTournamentFromList(id)
    invalidateTournamentsCache()
  }

  /**
   * Перечитує турнір з беку та оновлює і список, і поточну сутність деталки.
   * Повертає TTournament або null (помилку показує сервіс через ElMessage).
   */
  async function reloadTournament (id: string): Promise<TTournament | null> {
    const fresh = await tournamentsService.reloadTournament(id)
    if (fresh) patchTournamentInList(fresh)
    return fresh
  }
```

Add the four new actions to the `return { ... }` block:

```ts
  return {
    tournamentsData,
    loading,
    getTournaments,
    findTournament,
    patchTournamentInList,
    removeTournamentFromList,
    createTournament,
    updateTournament,
    deleteTournament,
    reloadTournament
  }
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS (no errors). If `TCreateTournamentDto`/`TUpdateTournamentDto` are not exported from `api.types`, open `src/api/types/api.types.ts` and confirm the exact exported alias names, then use those.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS, no new warnings on `tournaments.store.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/views/tournaments/tournaments.store.ts
git commit -m "feat(tournaments): add list-scoped + reload store actions"
```

---

### Task 2: Route the tournament drawers through the store actions

**Files:**
- Modify: `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue:428-449`
- Modify: `src/views/admin-panel/components/drawers/UpdateTournamentDrawer.vue:201-208`

**Interfaces:**
- Consumes: `useTournamentStore().createTournament`, `.updateTournament` (Task 1).

- [ ] **Step 1: CreateTournamentDrawer — use store actions**

The drawer currently calls the service then manually patches + invalidates. Replace the create/update block (around lines 428-449) so the patch + invalidate live in the store. Find:

```ts
  const saved = isEditMode.value && props.tournament
    ? await tournamentsService.updateTournament(props.tournament.id, basePayload as UpdateTournamentDto)
    : await tournamentsService.createTournament(basePayload as CreateTournamentDto)
```

Replace with:

```ts
  const saved = isEditMode.value && props.tournament
    ? await tournamentStore.updateTournament(props.tournament.id, basePayload as UpdateTournamentDto)
    : await tournamentStore.createTournament(basePayload as CreateTournamentDto)
```

Then DELETE the now-redundant `tournamentStore.patchTournamentInList(saved)` and both `queryCache.invalidateQueries({ key: ['tournaments'] })` lines (the store action does these). Keep the banner-upload calls and the `ElMessage.success(...)`. If `queryCache` is no longer referenced in the file, remove its import (`import { queryCache } from '@/core/query-cache-client'`); ESLint will flag it otherwise. Confirm `tournamentStore` is already defined in the file (it is — it calls `tournamentStore.patchTournamentInList` today).

- [ ] **Step 2: UpdateTournamentDrawer — use store action**

Find (around line 201):

```ts
    const updated = await tournamentsService.updateTournament(
```

Change the call target to `tournamentStore.updateTournament(`. Then DELETE the `tournamentStore.patchTournamentInList(updated)` and `queryCache.invalidateQueries({ key: ['tournaments'] })` lines (lines ~205, ~208). Keep the success `ElMessage` and drawer close. Confirm `tournamentStore` is defined; it is (line 205 uses it today). Remove the `queryCache` import if now unused.

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS, no unused-import warnings.

- [ ] **Step 4: Manual smoke**

Run `npm run dev`. As an admin: open the tournaments list, create a tournament → it appears in the list with no refresh; edit it → the card updates in place; both without reload.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue src/views/admin-panel/components/drawers/UpdateTournamentDrawer.vue
git commit -m "refactor(tournaments): drawers patch list via store action"
```

---

### Task 3: Tournament delete via store action

**Files:**
- Modify: `src/views/tournaments/components/TournamentAdminTab.vue:437-438`

**Interfaces:**
- Consumes: `tournamentStore.deleteTournament` (Task 1).

- [ ] **Step 1: Replace service+remove with store action**

Find (around lines 437-438):

```ts
    await tournamentsService.deleteTournament(props.tournament.id)
    tournamentStore.removeTournamentFromList(props.tournament.id)
```

Replace both lines with:

```ts
    await tournamentStore.deleteTournament(props.tournament.id)
```

`tournamentStore` is already defined (line 261). Keep the surrounding navigation/toast logic intact.

- [ ] **Step 2: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 3: Manual smoke**

As admin, delete a tournament from its admin tab → it disappears from the tournaments list with no refresh, and you are navigated away.

- [ ] **Step 4: Commit**

```bash
git add src/views/tournaments/components/TournamentAdminTab.vue
git commit -m "refactor(tournaments): delete via store action"
```

---

### Task 4: Detail page reload + orphan tech-loss modal wiring

**Files:**
- Modify: `src/views/tournaments/Tournament.vue:344-348` (reload delegates to store)
- Modify: `src/views/tournaments/Tournament.vue:223-231` (TechLossPlayoff modal refresh)
- Modify: `src/views/tournaments/components/TournamentQualificationTab.vue:208-224` (TechLossQualification modal refresh)

**Interfaces:**
- Consumes: `tournamentStore.reloadTournament` (Task 1).

- [ ] **Step 1: `reloadTournament` in Tournament.vue delegates to the store**

Find (around lines 344-348):

```ts
async function reloadTournament () {
  const data = await tournamentsService.reloadTournament(tournamentId)
```

Keep the function but change the data source to the store action so the list + detail stay in sync through one path:

```ts
async function reloadTournament () {
  const data = await tournamentStore.reloadTournament(tournamentId)
```

Then DELETE the now-redundant `useTournamentStore().patchTournamentInList(data)` line (~348) — the store action already patches the list. Keep `tournament.value = data` (or the existing local-ref assignment) so the detail page ref updates. `tournamentStore` is defined at line 150.

- [ ] **Step 2: TechLossPlayoff modal — refresh detail after tech-loss**

Find (around lines 223-231) the `openTechLossPlayoff` opener. Its `onSubmitted` currently only sets `playoff.value = response`. Add a tournament refresh so tournament-level state (standings/teams) is not stale:

```ts
function openTechLossPlayoff () {
  openAppModal('TechLossPlayoffModal', {
    tournamentId,
    teams: playoff.value?.teams ?? [],
    onSubmitted: (response: TPlayoff) => {
      playoff.value = response
      void reloadTournament()
    }
  })
}
```

- [ ] **Step 3: TechLossQualification modal — refresh detail after tech-loss**

In `TournamentQualificationTab.vue`, the `openTechLossModal` opener (lines 208-224) optimistically patches `qualificationPhase` but never refreshes tournament-level data. After the optimistic patch, emit the existing `patch-tournament` event so the parent re-syncs. At the end of the `onSubmitted` callback (after `qualificationPhase.value = { ...q, matches: list }`), add:

```ts
      const t = props.tournament
      if (t) emit('patch-tournament', { ...t, qualification: { ...q, matches: list } })
```

(`emit('patch-tournament', ...)` is already used by `onSubmitted` at line 245, so the event and its parent handler exist.)

- [ ] **Step 4: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 5: Manual smoke**

As admin on a tournament detail page: (a) submit a playoff result → bracket + tournament update, no refresh; (b) tech-loss in playoff → bracket updates and tournament data refreshes; (c) tech-loss in qualification → the match shows the winner and the parent tournament reflects it; all with no page reload.

- [ ] **Step 6: Commit**

```bash
git add src/views/tournaments/Tournament.vue src/views/tournaments/components/TournamentQualificationTab.vue
git commit -m "refactor(tournaments): detail reload via store action; wire tech-loss refresh"
```

---

## PHASE 2 — Players

### Task 5: Service returns full entities for player mutations

**Files:**
- Modify: `src/views/players/players.service.ts:43-55,138-147`

**Interfaces:**
- Produces:
  - `updatePlayer(id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer>` (full, re-fetched if PATCH partial)
  - `deletePlayer(id: string): Promise<string>` (returns the deleted id)
  - `setPlayerRolesByAdmin(playerId: string, roles: TAdminPlayerRoleItem[]): Promise<TPlayer>` (full merged player)

- [ ] **Step 1: `updatePlayer` returns a hydrated full player**

The PATCH may return a partial body. Re-fetch to guarantee a full `TPlayer`. Replace (lines 43-49):

```ts
  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>) {
    return await apiClient.patch('/players/{id}',
      data as Partial<components['schemas']['UpdatePlayerDto']>,
      {
        dynamicKeys: { id }
      })
  }
```

with:

```ts
  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    await apiClient.patch('/players/{id}',
      data as Partial<components['schemas']['UpdatePlayerDto']>,
      {
        dynamicKeys: { id }
      })
    return await apiClient.get('/players/{id}', { dynamicKeys: { id } }) as TPlayer
  }
```

- [ ] **Step 2: `deletePlayer` returns the id**

Replace (lines 51-55):

```ts
  async deletePlayer (id: string) {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
  }
```

with:

```ts
  async deletePlayer (id: string): Promise<string> {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
    return id
  }
```

- [ ] **Step 3: `setPlayerRolesByAdmin` returns a full merged player**

The roles endpoint returns `{ roles, verifiedAt }`. Re-fetch the player and merge those fields (mirrors `mergeRolesIntoPlayer` that currently lives in the modal). Replace (lines 138-147):

```ts
  async setPlayerRolesByAdmin (
    playerId: string,
    roles: TAdminPlayerRoleItem[]
  ) {
    return await apiClient.patch('/admin/players/{playerId}/roles',
      { roles },
      {
        dynamicKeys: { playerId }
      })
  }
```

with:

```ts
  async setPlayerRolesByAdmin (
    playerId: string,
    roles: TAdminPlayerRoleItem[]
  ): Promise<TPlayer> {
    const result = await apiClient.patch('/admin/players/{playerId}/roles',
      { roles },
      {
        dynamicKeys: { playerId }
      }) as { roles: TPlayer['roles']; verifiedAt: string | null }
    const fresh = await apiClient.get('/players/{id}', { dynamicKeys: { id: playerId } }) as TPlayer
    return { ...fresh, roles: result.roles, verifiedAt: result.verifiedAt }
  }
```

- [ ] **Step 4: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS. If the `result` cast type mismatches the schema, import `TAdminPlayerRolesResult` from `@/api/types/api.types` (used today in `PlayerEditProfileModal`) and use it instead of the inline type.

- [ ] **Step 5: Commit**

```bash
git add src/views/players/players.service.ts
git commit -m "feat(players): service returns full entities for update/delete/roles"
```

---

### Task 6: Add player mutation actions to the store

**Files:**
- Modify: `src/views/players/players.store.ts`

**Interfaces:**
- Consumes: `playersService.updatePlayer`, `.deletePlayer`, `.setPlayerRolesByAdmin` (Task 5); existing `patchPlayerInList(updated: TPlayer)`, `players` ref.
- Produces (new store actions):
  - `updatePlayer(id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer>`
  - `deletePlayer(id: string): Promise<void>`
  - `setPlayerRoles(playerId: string, roles: TAdminPlayerRoleItem[]): Promise<TPlayer>`

- [ ] **Step 1: Add the actions**

At the top of `src/views/players/players.store.ts`, extend the existing type import:

```ts
import type { TUserRoleCatalog, TAdminPlayerRoleItem, TUpdatePlayerDto } from '@/api/types/api.types'
```

After `patchPlayerInList` (ends line 29), add:

```ts
  function removePlayerFromList (id: string) {
    players.value = players.value.filter(p => p.id !== id)
  }

  async function updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    const updated = await playersService.updatePlayer(id, data)
    patchPlayerInList(updated)
    return updated
  }

  async function deletePlayer (id: string): Promise<void> {
    const removedId = await playersService.deletePlayer(id)
    removePlayerFromList(removedId)
  }

  async function setPlayerRoles (
    playerId: string,
    roles: TAdminPlayerRoleItem[]
  ): Promise<TPlayer> {
    const updated = await playersService.setPlayerRolesByAdmin(playerId, roles)
    patchPlayerInList(updated)
    return updated
  }
```

Add `removePlayerFromList`, `updatePlayer`, `deletePlayer`, `setPlayerRoles` to the `return { ... }` block.

- [ ] **Step 2: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/views/players/players.store.ts
git commit -m "feat(players): add update/delete/setRoles store actions"
```

---

### Task 7: PlayerEditProfileModal uses store actions

**Files:**
- Modify: `src/views/players/modals/PlayerEditProfileModal.vue:445,500-524`

**Interfaces:**
- Consumes: `playersStore.updatePlayer`, `playersStore.setPlayerRoles` (Task 6). `playersStore` is defined at line 269.

- [ ] **Step 1: Steam-disconnect update via store**

Find (line 445):

```ts
    const updated = await playersService.updatePlayer(props.player.id, {
      steamId: ''
    })
```

Change the call target to `playersStore.updatePlayer(...)` (same args). Keep `emit('updated', updated)` and `props.onUpdated?.(updated)` — they propagate to the parent view; the store patch keeps the shared list in sync.

- [ ] **Step 2: `onSubmit` uses store actions; drop the local merge helper**

In `onSubmit` (lines 511-517), replace:

```ts
    let updated = await playersService.updatePlayer(props.player.id, payload)

    if (canManageRoles.value && rolesChanged.value) {
      const result = await playersService.setPlayerRolesByAdmin(props.player.id, buildRolesPayload())
      updated = mergeRolesIntoPlayer(updated, result)
    }
```

with:

```ts
    let updated = await playersStore.updatePlayer(props.player.id, payload)

    if (canManageRoles.value && rolesChanged.value) {
      updated = await playersStore.setPlayerRoles(props.player.id, buildRolesPayload())
    }
```

Then DELETE the now-unused `mergeRolesIntoPlayer` helper (lines 474-481) and the `TAdminPlayerRolesResult` import if it becomes unused (ESLint will flag it). Keep the `emit('submit', form.value)` / `emit('updated', updated)` lines.

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS, no unused-symbol warnings.

- [ ] **Step 4: Manual smoke**

As admin, open a player's edit modal: change MMR/positions → save → the player card/list reflects it with no refresh; change roles → the roles update in place; disconnect Steam → reflected without reload.

- [ ] **Step 5: Commit**

```bash
git add src/views/players/modals/PlayerEditProfileModal.vue
git commit -m "refactor(players): edit modal patches via store actions"
```

---

## PHASE 3 — Teams

### Task 8: Teams store create/update use patchTeamInList

**Files:**
- Modify: `src/views/teams/teams.store.ts:49-80`

**Interfaces:**
- Consumes: existing `patchTeamInList(next: TTeam)`, `teamsService.createTeam`, `.updateTeam`.

- [ ] **Step 1: `createTeam` patches via helper**

In `createTeam` (lines 49-66), replace `teams.value.unshift(newTeam)` with `patchTeamInList(newTeam)`. The service already returns a fully hydrated team.

- [ ] **Step 2: `updateTeam` patches via helper (replace Object.assign)**

Replace `updateTeam` (lines 68-80):

```ts
  async function updateTeam (id: string, data: TUpdateTeamPayload) {
    loading.value = true
    try {
      const updatedTeam = await teamsService.updateTeam(id, data)
      const currTeam = await findTeam(id)
      if (currTeam) {
        Object.assign(currTeam, updatedTeam)
      }
      return updatedTeam
    } finally {
      loading.value = false
    }
  }
```

with:

```ts
  async function updateTeam (id: string, data: TUpdateTeamPayload) {
    loading.value = true
    try {
      const updatedTeam = await teamsService.updateTeam(id, data)
      patchTeamInList(updatedTeam)
      return updatedTeam
    } finally {
      loading.value = false
    }
  }
```

(`patchTeamInList` replaces the whole entity rather than shallow-merging, so partial responses can't leave stale fields, and it inserts the team if absent.)

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS. If `findTeam` becomes unused, leave it — it is part of the public store API and used elsewhere.

- [ ] **Step 4: Manual smoke**

Create a team → appears in the teams list; edit a team profile → list + detail reflect changes; both with no refresh.

- [ ] **Step 5: Commit**

```bash
git add src/views/teams/teams.store.ts
git commit -m "refactor(teams): create/update patch list via patchTeamInList"
```

---

### Task 9: Add roster/verify/captaincy store actions for teams

**Files:**
- Modify: `src/views/teams/teams.store.ts`

**Interfaces:**
- Consumes: `teamsService.addPlayerToTeam`, `.removePlayerFromTeam`, `.removeCoach`, `.verifyTeam`, `.unverifyTeam`, `.transferCaptaincy` (all return `TTeam | null` except `transferCaptaincy` which returns `TTeam`); `patchTeamInList`; `usePlayersStore().setPlayerTeamIdClientside` / `.clearTeamMembershipClientside`.
- Produces (new store actions, each patches the team list and returns the team):
  - `addPlayerToTeam(teamId: string, body: TAddTeamPlayerDto): Promise<TTeam | null>`
  - `removePlayerFromTeam(teamId: string, playerId: string, penalty?: ERemovePlayerPenalty): Promise<TTeam | null>`
  - `removeCoach(teamId: string): Promise<TTeam | null>`
  - `verifyTeam(teamId: string): Promise<TTeam | null>`
  - `unverifyTeam(teamId: string): Promise<TTeam | null>`
  - `transferCaptaincy(teamId: string, newCaptainPlayerId: string): Promise<TTeam>`

- [ ] **Step 1: Add the actions**

Add the team-service payload/enum imports to the existing import line at the top of `teams.store.ts`:

```ts
import {
  teamsService,
  type TCreateTeamPayload,
  type TUpdateTeamPayload,
  type TAddTeamPlayerDto
} from '@/views/teams/teams.service'
import type { ERemovePlayerPenalty } from '@/views/teams/teams.enums'
```

(Confirm `TAddTeamPlayerDto` is exported from `teams.service.ts`; if it is only an `api.types` alias, import it from `@/api/types/api.types` instead.)

After `updateTeam`, add:

```ts
  async function addPlayerToTeam (teamId: string, body: TAddTeamPlayerDto): Promise<TTeam | null> {
    const updated = await teamsService.addPlayerToTeam(teamId, body)
    if (updated) {
      patchTeamInList(updated)
      usePlayersStore().setPlayerTeamIdClientside(body.playerId, teamId)
    }
    return updated
  }

  async function removePlayerFromTeam (
    teamId: string,
    playerId: string,
    penalty?: ERemovePlayerPenalty
  ): Promise<TTeam | null> {
    const updated = await teamsService.removePlayerFromTeam(teamId, playerId, penalty)
    if (updated) {
      patchTeamInList(updated)
      usePlayersStore().setPlayerTeamIdClientside(playerId, null)
    }
    return updated
  }

  async function removeCoach (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.removeCoach(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function verifyTeam (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.verifyTeam(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function unverifyTeam (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.unverifyTeam(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function transferCaptaincy (teamId: string, newCaptainPlayerId: string): Promise<TTeam> {
    const updated = await teamsService.transferCaptaincy(teamId, newCaptainPlayerId)
    patchTeamInList(updated)
    return updated
  }
```

Add all six to the `return { ... }` block.

- [ ] **Step 2: Confirm `setPlayerTeamIdClientside` arg type**

`body.playerId` must be a `string`. Open `teams.service.ts` `TAddTeamPlayerDto` (the `AddTeamPlayerDto` alias) and confirm it has `playerId: string`. If the field is named differently, adjust the `setPlayerTeamIdClientside` call accordingly.

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/views/teams/teams.store.ts
git commit -m "feat(teams): add roster/verify/captaincy store actions"
```

---

### Task 10: Route team component call sites through the new store actions

**Files:**
- Modify: every component that calls `teamsService.{addPlayerToTeam,removePlayerFromTeam,removeCoach,verifyTeam,unverifyTeam,transferCaptaincy}` directly.

**Interfaces:**
- Consumes: the Task 9 store actions.

- [ ] **Step 1: Find the call sites**

Run:

```bash
grep -rn "teamsService\.\(addPlayerToTeam\|removePlayerFromTeam\|removeCoach\|verifyTeam\|unverifyTeam\|transferCaptaincy\)" src --include="*.vue" --include="*.ts"
```

- [ ] **Step 2: Redirect each to the store**

For each hit, replace `teamsService.X(...)` with `teamsStore.X(...)` (using the component's existing `useTeamsStore()` instance; add `const teamsStore = useTeamsStore()` if absent). The store action patches the list and returns the same `TTeam | null`, so any code using the return value (e.g. updating a local `team` ref) keeps working — keep those local assignments; they now coexist with the synced store list. Remove any manual `patchTeamInList`/local list filtering that the store action now owns.

Because these components were not all read during planning, for each file: read the function around the call site, confirm what it does with the return value, swap the call to the store action, and delete any now-duplicated list patching.

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 4: Manual smoke**

For each team admin action — add player, remove player (with and without penalty), remove coach, verify, unverify, transfer captaincy — confirm the team card/roster and the teams list update with no refresh, and that affected players' team membership updates.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(teams): roster/verify/captaincy call sites use store actions"
```

---

## PHASE 4 — Verification + admin tabs

### Task 11: Create the verification store (owns month cache + loadMonth)

**Files:**
- Create: `src/views/admin-panel/verification.store.ts`
- Reference (read first, do not yet modify): `src/views/admin-panel/components/tabs/VerificationTab.vue:81-172`, `src/services/verification.service.ts`

**Interfaces:**
- Consumes: `verificationService.fetchSlots`, `.fetchRequests`, `.processRequest`, `.completeRequest`, `.cancelRequest`, `.createSlots`, `.deleteSlot`.
- Produces (auto-imported as `useVerificationStore` — file lives under `src/views/**/*.store.ts`, which the auto-import config covers):
  - state: `cache` (per-day data), `loadingDates`
  - `loadMonth(anchor: string | Date, opts?: { silent?: boolean }): Promise<void>`
  - `refreshMonth(day: string): Promise<void>`
  - `processRequest(day: string, id: string): Promise<void>`
  - `completeRequest(day: string, id: string, payload: <existing payload type>): Promise<void>`
  - `cancelRequest(day: string, id: string): Promise<void>`
  - `createSlots(day: string, starts: string[]): Promise<void>`
  - `deleteSlot(day: string, slotId: string): Promise<void>`

- [ ] **Step 1: Read the current tab to copy the exact `loadMonth` logic and cache shape**

Read `VerificationTab.vue` lines 81-172 and note: the exact shape of `cache[date]`, the `loadingDates` set, the `range` computed for `fetchSlots`/`fetchRequests`, and the `completeRequest` payload type. Copy this logic verbatim into the store (it currently lives in the component). Keep all Ukrainian comments.

- [ ] **Step 2: Write the store**

Create `src/views/admin-panel/verification.store.ts` modeled on `tournaments.store.ts`. Move `loadMonth` and its helpers in unchanged; the per-request/slot actions call the service then call `refreshMonth(day)` (which is `loadMonth(day)`), preserving today's re-fetch behavior but behind a store action. Example shape (fill the cache/range details from Step 1):

```ts
export const useVerificationStore = defineStore('verification', () => {
  const cache = ref<Record<string, /* day-data type from Step 1 */ unknown>>({})
  const loadingDates = ref<Set<string>>(new Set())

  async function loadMonth (anchor: string | Date, opts?: { silent?: boolean }): Promise<void> {
    // ...verbatim from VerificationTab.vue:81-...
  }

  async function refreshMonth (day: string): Promise<void> {
    await loadMonth(day)
  }

  async function processRequest (day: string, id: string): Promise<void> {
    await verificationService.processRequest(id)
    await refreshMonth(day)
  }

  // completeRequest / cancelRequest / createSlots / deleteSlot follow the same shape

  return { cache, loadingDates, loadMonth, refreshMonth,
    processRequest /* , completeRequest, cancelRequest, createSlots, deleteSlot */ }
})
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS. Replace the `unknown` cache value type with the real type observed in Step 1 (define a `TVerificationDayData` alias if none exists).

- [ ] **Step 4: Commit**

```bash
git add src/views/admin-panel/verification.store.ts
git commit -m "feat(verification): add store owning month cache + actions"
```

---

### Task 12: VerificationTab + DayDrawer delegate to the store

**Files:**
- Modify: `src/views/admin-panel/components/tabs/VerificationTab.vue`
- Modify: `src/views/admin-panel/components/drawers/VerificationDayDrawer.vue:399-518`

**Interfaces:**
- Consumes: `useVerificationStore()` (Task 11).

- [ ] **Step 1: Tab reads cache/loadMonth from the store**

In `VerificationTab.vue`, replace the local `cache`/`loadingDates`/`loadMonth` definitions with the store: `const verificationStore = useVerificationStore()`, and reference `verificationStore.cache` / `verificationStore.loadingDates` / `verificationStore.loadMonth` in the template and handlers (`onDrawerRefresh`, the open handler, the `selectedDate` watcher). Keep `drawerDate` and `selectedDate` local UI state.

- [ ] **Step 2: Drawer calls store actions instead of service + emit('refresh')**

In `VerificationDayDrawer.vue`, the handlers (lines 399-518) currently call `verificationService.X(...)` then `emit('refresh')`. Pass the drawer's `date` (it has a `date` prop, line 42 in the tab binds `:date="drawerDate"`) and call the store action, which refreshes the month internally. E.g. `handleProcess`:

```ts
async function handleProcess (r) {
  await verificationStore.processRequest(props.date, r.id)
  ElMessage.success('Заявку взято в обробку')
}
```

Apply the same transform to `handleComplete`, `handleCancel`, `handleGenerate` (→ `createSlots`), `handleDeleteSlot` (→ `deleteSlot`). Remove the `emit('refresh')` calls and the `refresh` emit declaration if no longer used; remove the `@refresh="onDrawerRefresh"` binding and `onDrawerRefresh` in the tab if nothing else uses it. Keep all toasts and Ukrainian strings.

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 4: Manual smoke**

In the admin verification calendar: process / complete / cancel a request, generate slots, delete a slot → the day drawer and calendar update with no page refresh.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin-panel/components/tabs/VerificationTab.vue src/views/admin-panel/components/drawers/VerificationDayDrawer.vue
git commit -m "refactor(verification): tab + drawer delegate to verification store"
```

---

### Task 13: MMR requests list mutation via store action

**Files:**
- Create: `src/views/admin-panel/mmr-requests.store.ts`
- Modify: `src/views/admin-panel/components/tabs/MmrRequestsTab.vue:185-211`

**Interfaces:**
- Consumes: `mmrRequestsService.approveRequest`, `.rejectRequest`.
- Produces: `useMmrRequestsStore()` with `requests` ref, `fetchRequests`, `approve(id)`, `reject(id)` that remove the row from `requests` after the service call.

- [ ] **Step 1: Read the tab's request-loading logic**

Read `MmrRequestsTab.vue` around `fetchRequests` / `requests` / `activeFilter` (the portion above line 185) to copy the list-loading + filter logic into the store verbatim.

- [ ] **Step 2: Write the store**

Create `src/views/admin-panel/mmr-requests.store.ts` holding `requests = ref<TMmrUpdateRequest[]>([])`, a `fetchRequests(filter)` action (moved from the tab), and:

```ts
  async function approve (id: string): Promise<void> {
    await mmrRequestsService.approveRequest(id)
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  async function reject (id: string): Promise<void> {
    await mmrRequestsService.rejectRequest(id)
    requests.value = requests.value.filter((r) => r.id !== id)
  }
```

- [ ] **Step 3: Tab delegates to the store**

In `MmrRequestsTab.vue`, replace the bodies of the component's `approve`/`reject` (keep the `processingId` guard + toasts) so the service call + list filter become `await mmrStore.approve(row.id)` / `.reject(row.id)`, and source `requests` from the store. Example:

```ts
async function approve (row: TMmrUpdateRequest) {
  if (processingId.value) return
  processingId.value = row.id
  try {
    await mmrStore.approve(row.id)
    ElMessage.success('Запит схвалено')
  } catch {
    ElMessage.error('Не вдалося схвалити запит')
  } finally {
    processingId.value = null
  }
}
```

- [ ] **Step 4: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 5: Manual smoke**

In the admin MMR-requests tab, approve and reject requests → rows disappear from the list with no refresh.

- [ ] **Step 6: Commit**

```bash
git add src/views/admin-panel/mmr-requests.store.ts src/views/admin-panel/components/tabs/MmrRequestsTab.vue
git commit -m "refactor(mmr): approve/reject list mutation via store action"
```

---

### Task 14: Final sweep — confirm no orphan direct-service mutations remain

**Files:**
- Read-only audit across `src`.

- [ ] **Step 1: Sweep for remaining direct service mutation calls in components**

Run:

```bash
grep -rn "Service\.\(create\|update\|delete\|remove\|add\|set\|approve\|reject\|verify\|unverify\|join\|leave\|process\|complete\|cancel\|transfer\|submit\|disqualify\|start\)" src --include="*.vue" | grep -v "\.service\.ts"
```

- [ ] **Step 2: Classify each hit**

For each remaining hit, confirm it either (a) already routes its UI update correctly (e.g. detail-page optimistic patch + `reloadTournament`, documented as acceptable in the spec), or (b) is a genuine orphan. For any orphan, apply the convention: add/extend a store action and redirect the call. If none remain, note that in the commit message.

- [ ] **Step 3: Full type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit (if changes) or record clean sweep**

```bash
git add -A
git commit -m "chore: final mutation-convention sweep" --allow-empty
```

---

## Self-Review notes

- **Spec coverage:** List-scoped tournaments (Tasks 1-3), detail-scoped tournaments (Task 4), players update/delete/roles (Tasks 5-7), teams create/update (Task 8) + roster/verify/captaincy (Tasks 9-10), verification (Tasks 11-12), MMR (Task 13), and a closing audit (Task 14) — every section of the spec maps to a task.
- **Type consistency:** Store action names match between producer tasks and consumer tasks (`createTournament`/`updateTournament`/`deleteTournament`/`reloadTournament`; `updatePlayer`/`deletePlayer`/`setPlayerRoles`; team roster actions; verification + MMR actions).
- **Known read-gaps flagged in-task:** Tasks 10, 11, 12, 13 instruct reading specific un-read files (team call sites, verification tab internals, MMR fetch logic) before editing, since their full bodies were not loaded during planning. These are explicit "read first, then apply this transform" steps, not vague placeholders.
- **No test runner:** every task verifies via `type-check` + `lint` + a concrete manual smoke.
