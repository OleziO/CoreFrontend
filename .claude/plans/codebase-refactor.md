# Plan: Codebase Refactor — Styles, Views, Services, Stores

> Source: Inline requirement — maintainability-driven refactor of a Vue 3 + TypeScript + Element Plus + Tailwind Dota 2 league management app

## Architectural decisions

Durable decisions that apply across all phases:

- **Pattern**: Enforce existing patterns only — no new libraries or architectural approaches introduced
- **Services**: Class singleton instances (auto-imported). Services own the full operation: API call + store cache patch + `ElMessage` toast. Views call one service method; no business logic remains in views.
- **Stores**: Pure cache — hold data, expose getters and a `patch` method. Standardized shape: `data`, `loading`, `error` refs. Shared reactive state used across multiple views lives in the store, not the service.
- **Templates**: No inline `style="..."` attributes. All styling via Tailwind utility classes or named SCSS classes.
- **Element Plus overrides**: Keep `.el-*` selector approach in `element-reset/`. Extract shared glass-morphism pattern into a `@mixin glass-effect` to avoid duplication across override files.
- **Safety net**: `npm run type-check` + `npm run lint` passing is the definition of "done" for each phase. No test suite exists.
- **Scope**: Focus decomposition on the three mega-views — `Player.vue` (940 LOC), `Team.vue` (831 LOC), `Tournament.vue` (731 LOC). Smaller views (Profile, Main, etc.) are out of scope.

---

## Phase 1: Styles & Element Plus Overrides

**Scope**: Eliminate inline styles from all templates; extract shared SCSS mixins in `element-reset/`

### What to build

Audit all `.vue` files for `style="..."` attributes and replace each with the equivalent Tailwind utility class combination or a named SCSS class. No visual changes — this is a 1:1 translation.

In `src/assets/styles/element-reset/`, identify the repeated glass-morphism pattern (`bg-white/10`, `backdrop-blur-md`, `rounded-xl`, white text on dark, opacity-based borders). Extract it into a shared `@mixin glass-effect` (and variants like `glass-effect--input`, `glass-effect--dialog` if needed) in a new `_mixins.scss` partial. Replace all copy-pasted declarations in the 20+ override files with `@include glass-effect`.

### Acceptance criteria

- [ ] No `style="..."` attributes remain in any `.vue` file (verified by grep)
- [ ] A `_mixins.scss` partial exists in `src/assets/styles/` with at least the core glass-morphism mixin
- [ ] All `element-reset/` files that previously duplicated the glass pattern now use `@include`
- [ ] `npm run lint` passes with no new errors
- [ ] `npm run type-check` passes
- [ ] Visual appearance is unchanged (manual spot-check of buttons, inputs, dialogs, tables)

---

## Phase 2: Teams View — Tracer Bullet Refactor

**Scope**: Decompose `Team.vue` into sub-components; move all business logic into `teams.service.ts`; service owns cache patches; store becomes pure cache

### What to build

**Sub-component extraction from `Team.vue`:**
Split the template into focused sub-components under `src/views/teams/components/`. Each sub-component receives props and emits events — no direct store or service access inside them. Candidate splits based on the current template structure:
- `TeamRoster.vue` — player slot list, rank display
- `TeamCaptain.vue` — captain info, transfer action trigger
- `TeamVerificationBadge.vue` — admin verification toggle
- `TeamInvitePanel.vue` — invite creation and management

**Business logic extraction to `teams.service.ts`:**
Move all inline operations from `Team.vue` into service methods. Each service method is responsible for the full operation:
1. API call
2. `patchTeamInList()` / store update
3. `ElMessage` success or error toast

Operations to extract: player removal (with tournament-warning check), coach removal, captain transfer, team verification/unverification, player rank hydration (`hydrateTeamPlayersRanks`).

**Store cleanup (`teams.store.ts`):**
- Add standardized `loading` and `error` refs
- Remove any service calls that currently live in the store
- Keep `patchTeamInList()` as the store's single mutation method; it is called only from `teams.service.ts`, never from views
- Move any shared reactive state that is referenced across multiple files into the store

**Result:** `Team.vue` becomes a thin orchestrator — it opens modals, calls service methods, and renders sub-components. No `try/catch`, no `ElMessage`, no direct `apiClient` calls, no manual store patches.

### Acceptance criteria

- [ ] `Team.vue` script block contains no `try/catch`, no `ElMessage` calls, no direct `apiClient` usage
- [ ] `teams.service.ts` owns all operations: player removal, coach removal, captain transfer, verification toggle, rank hydration
- [ ] Each service method handles its own store patch and error/success toast
- [ ] `teams.store.ts` has standardized `loading`, `error`, and `data` refs
- [ ] Store is only mutated from `teams.service.ts`, not from views
- [ ] `Team.vue` template is split into at least 3 focused sub-components
- [ ] Sub-components receive all data via props; no direct store/service injection inside them
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] All team operations (add/remove player, transfer captain, verify) work correctly in the browser

---

## Phase 3: Players & Tournaments Views

**Scope**: Apply the same pattern validated in Phase 2 to `Player.vue` and `Tournament.vue`

### What to build

**Players (`Player.vue` → `players.service.ts` + sub-components):**

Sub-components under `src/views/players/components/`:
- `PlayerVerificationPanel.vue` — verification state toggle
- `PlayerRolePanel.vue` — role assignment display and action trigger
- `PlayerMmrPanel.vue` — MMR request and approval flow
- `PlayerProfileHeader.vue` — avatar, name, Steam/Discord links

Business logic to extract to `players.service.ts`: verification toggle mutation, role assignment, MMR request initiation and approval. Each method owns its API call + store patch + toast.

Move `userRolesCatalogRef` (currently a reactive ref living in `players.service.ts` but used across views) into `players.store.ts` as a proper cached getter. The service fetches and populates it; the store exposes it.

**Tournaments (`Tournament.vue` → `tournaments.service.ts` + sub-components):**

Sub-components under `src/views/tournaments/components/`:
- `TournamentBracket.vue` — playoff bracket rendering
- `TournamentMatchRow.vue` — single match display + result submission trigger
- `TournamentQualificationTable.vue` — qualification stage standings
- `TournamentAdminControls.vue` — admin-only state transitions

Business logic to extract to `tournaments.service.ts`: match result submission, qualification state transitions, playoff bracket state management. Each method owns its API call + store patch + toast.

### Acceptance criteria

- [ ] `Player.vue` script block contains no `try/catch`, no `ElMessage` calls, no direct `apiClient` usage
- [ ] `Tournament.vue` script block contains no `try/catch`, no `ElMessage` calls, no direct `apiClient` usage
- [ ] `userRolesCatalogRef` lives in `players.store.ts`, not in `players.service.ts`; all usages updated
- [ ] Both views split into at least 3 focused sub-components each
- [ ] Sub-components receive all data via props; no direct store/service injection inside them
- [ ] Both services own their full operation chain (API + cache + toast)
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] Player verification, role assignment, MMR request flow work in the browser
- [ ] Tournament match submission and bracket display work in the browser

---

## Phase 4: Store Standardization & Shared State Consolidation

**Scope**: Standardize all feature store shapes; consolidate shared reactive state; ensure stores are pure cache

### What to build

**Standardize store shape across all feature stores** (`teams.store.ts`, `players.store.ts`, `tournaments.store.ts`, and any others):
Every store exposes:
```ts
const data = ref<T | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
```
Plus feature-specific getters built on top of `data`. Remove ad-hoc reactive variables that duplicate this shape.

**Audit shared reactive state:** Find any reactive ref or computed that is imported or used from more than one view/component/service. Move it into the appropriate feature store. The store becomes the single source of truth; the service populates it, views read from it.

**Verify store/service contract across all features:** No store should call a service. No view should mutate store state directly (all mutations go through service methods that call `store.patch()`). Audit and fix any remaining violations after Phases 2 and 3.

**Clean up dead code:** Remove any unused refs, methods, or imports left over from earlier phases. Ensure auto-import declarations stay in sync (`npm run lint` will flag unused imports).

### Acceptance criteria

- [ ] All feature stores (`teams`, `players`, `tournaments`) have standardized `data`, `loading`, `error` refs
- [ ] No store calls a service method directly
- [ ] No view mutates store state directly (all mutations route through service methods)
- [ ] All shared reactive state (used in 2+ files) lives in a store, not a service or component
- [ ] No unused refs, methods, or imports in any store file (lint passes)
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] Full manual smoke-test: players list, team roster, tournament bracket, admin verification all work correctly
