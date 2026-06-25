# Plan: Architecture Refactor

> Source: Align the full `src/` directory with `.claude/architecture.md` conventions — structural compliance, dead code removal, and style unification. Split into three tracks: Core, Views, and Styles.

## Architectural decisions

Durable constraints that apply across all phases:

- **Layer direction**: composable → store → service. Services never import stores or composables. Stores never import project orchestrating composables.
- **No `export default`**: all modules use named exports.
- **No `as any`**: fix the underlying type instead.
- **Utilities location**: `src/core/utils/` — not a root `src/utils/` folder.
- **Constants**: must be `.enums.ts` (auto-imported) or `.d.ts` types. Freestanding `*.constants.ts` files are not part of the architecture.
- **Queries**: server-state queries belong in `*.queries.ts` files (Pinia Colada pattern), co-located with their feature/view.
- **Icons**: Phosphor only going forward (`Ph*` components). No new FontAwesome.
- **Styling**: Tailwind first; semantic tokens from `tailwind.config.js` over raw hex/RGB; component-scoped SCSS for anything Tailwind can't express; global styles only in `src/assets/styles/`.
- **Misplaced code**: moved immediately, not flagged with TODOs.
- **Naming**: kebab-case folders, PascalCase `.vue`, `I`/`T`/`E` prefixes on interfaces/types/enums.

---

## Track 1 — Core

Shared infrastructure: `src/core/`, `src/services/`, `src/store/modules/`, `src/composables/`, `src/components/`, `src/types/`.

> Note: `src/utils/` and `src/constants/` were deleted in Phase 1.

---

### Phase 1: Structural fixes & naming compliance ✅ COMPLETE

**Scope**: Fix all hard-rule violations and misplaced files in the shared layer.

### What was built

- `src/utils/` deleted; 4 utilities moved to `src/core/utils/` (`api-errors.ts`, `dialog.utils.ts`, `formatters.ts`, `role-tag-styles.ts`); empty `types.ts` deleted; all 11 import sites updated.
- `src/constants/` deleted: `players.ts` (no consumers) deleted; `teams.ts` → `src/views/teams/teams.enums.ts`; `tournaments.ts` → `src/views/tournaments/tournaments.enums.ts`; empty `modals.ts` deleted; all import sites updated.
- `export default checkRoles` removed from `src/core/helpers.ts`; dead `checkRoles` function removed (zero consumers, delegated to `hasPlayerRole`).
- `src/types/general.types.ts` renamed to `src/types/general.enums.ts` (**deviation from plan**: plan said `.d.ts` but the file only contains `ERole` enum — a value-emitting construct that cannot live in a `.d.ts`). All 6 import sites updated.
- `src/components/bug-tags/status.constants.ts` → `status.enums.ts`; `src/components/player-tags/player.constants.ts` → `player.enums.ts`; all ~10 import sites updated.
- `src/composables/query/`: 7 dead/commented-out files deleted; `use-player-heroes.ts` moved to `src/views/players/composables/use-player-heroes.ts`; `use-tournaments.ts` moved to `src/views/tournaments/tournaments.queries.ts`. Import sites in `Player.vue` and `TournamentsDetails.vue` updated.
- `src/views/login-success/login-success.service.ts` deleted (empty, no consumers).
- `<script setup lang="ts"></script>` stub added to `src/layouts/PageLayout.vue`.

### Acceptance criteria

- [x] No root `src/utils/` folder; all utilities live under `src/core/utils/`.
- [x] No root `src/constants/` folder; constants absorbed into `.enums.ts` or `.d.ts`.
- [x] `src/core/helpers.ts` has zero `export default` declarations.
- [x] `src/types/general.types.ts` is renamed (`→ general.enums.ts`) and all imports updated.
- [x] No freestanding `*.constants.ts` files in `src/components/`.
- [x] `src/layouts/PageLayout.vue` has a `<script setup lang="ts">` block.
- [x] `npm run lint` and `npm run type-check` pass with no new errors.

---

### Phase 2: Dead code removal in the shared layer

**Scope**: Remove unused exports, orphaned files, and redundant logic from `src/services/`, `src/store/modules/`, `src/composables/`, and `src/components/`.

### What to build

- Grep each global service and composable for usage; delete exports with zero consumers.
- Verify `src/store/modules/toggler.ts` is still needed; delete if unused.
- Check each component in `src/components/` for actual usage; delete orphans.
- Remove `src/views/matches/` if `matches.service.ts` has no active route or consumer (confirm first).
- Review `src/views/tournaments/dev.service.ts` — delete if it is development scaffolding that leaked into the committed tree.

### What was built

- `src/services/user-roles.service.ts` deleted — zero consumers confirmed across all auto-import paths.
- `src/components/PlayerSlot.vue` and `AddPlayerCardButton.vue` deleted — only referenced in auto-generated `vite-components.d.ts`.
- `src/views/matches/` deleted entirely — `matchesService` had no route, no view, and zero import sites.
- `src/composables/use-form-config.ts` deleted — entire file was commented-out stubs with no consumers.
- `src/store/modules/toggler.ts` — removed 2 lines of commented-out `showAddPlayerToTeam` dead code.
- `dev.service.ts` retained: actively used by `TestMatchCreationModal` (registered in `use-app-modals`, opened from 4 components).
- Pre-existing type error in `TournamentParcitipantsTab.vue` fixed as a side-effect: added `TTournamentTeam` type alias to `tournaments.d.ts`; updated `TeamCard` prop to `TTeam | TTournamentTeam` with `'division' in props.team` narrowing.

### Acceptance criteria

- [x] No exported symbol in the shared layer has zero consumers.
- [x] No orphaned `.vue` components in `src/components/`.
- [x] `src/views/matches/` either has a route and a view component, or is deleted entirely.
- [x] `dev.service.ts` is gone (or intentionally retained with a documented reason). ← Retained: actively used by `TestMatchCreationModal` (registered in `use-app-modals`, called from 4 tournament components). Dev scaffolding judgment does not apply.
- [x] `npm run lint` and `npm run type-check` pass.

---

## Track 2 — Views

Each view is audited for: (a) architectural layer violations, (b) code that belongs in a different view, (c) misnamed files, (d) dead exports.

---

### Phase 3: Small views (auth, invites, login-success, main, matches) ✅ COMPLETE

**Scope**: Bring the low-complexity views into full compliance.

### What was built

- `POST_LOGIN_REDIRECT_KEY` moved from `invites.service.ts` to `src/services/auth.service.ts` (correct domain); `savePostLoginRedirect` / `consumePostLoginRedirect` helpers added to encapsulate localStorage access.
- `AuthCallback.vue` cross-view import of `POST_LOGIN_REDIRECT_KEY` replaced with `authService.consumePostLoginRedirect()`.
- `InvitePage.vue` localStorage.setItem call replaced with `authService.savePostLoginRedirect()`.
- `invites.service.ts`: `POST_LOGIN_REDIRECT_KEY` export removed; `acceptInvite` body changed from `{}` to `undefined` (correct for `requestBody?: never` endpoint); both `as any` casts removed.
- `src/views/main/main.route.ts` created; `src/views/login-success/login-success.route.ts` created; `route-names.ts` updated to spread both, removing the last inline route definitions.
- `matches/` deleted in Phase 2; `login-success/login-success.service.ts` deleted in Phase 2 — no stubs remain.
- No modals exist in these views; no filename audit needed.

### Acceptance criteria

- [x] Each small view has only the files it needs (no empty stubs).
- [x] `matches` is either a complete view or removed (deleted in Phase 2).
- [x] No route definitions live outside their view's `*.route.ts` file.
- [x] `npm run lint` and `npm run type-check` pass.

---

### Phase 4: Players view ✅ COMPLETE

**Scope**: Complete the in-progress refactor of `src/views/players/`.

### What was built

- Renamed `PLayerEditProfileModal.vue` → `PlayerEditProfileModal.vue` and `PLayersFilterModal.vue` → `PlayersFilterModal.vue` (two-step `git mv` for macOS case-insensitive FS); all references updated in `use-app-modals.ts` and `Player.vue`.
- `players.service.ts` layer violation fixed: removed `import { usePlayersStore }` — caching logic moved into `players.store.ts → fetchUserRoles`; `patchPlayerInList` calls moved to `Player.vue` and `UserCard.vue` (callers now own the state update after `setPlayerVerificationByAdmin`).
- `TeamCreateModal.vue` moved from `src/views/players/modals/` to `src/views/teams/modals/` (team-domain modal was in wrong view); import path in `use-app-modals.ts` updated.

### Acceptance criteria

- [x] No `PLayer*` typo filenames remain.
- [x] `players.store.ts` does not import project orchestrating composables.
- [x] `players.service.ts` does not import stores or composables.
- [x] No player-domain logic lives outside `src/views/players/` (or `src/components/` for truly shared UI).
- [x] `npm run lint` and `npm run type-check` pass.

---

### Phase 5: Teams view ✅ COMPLETE

**Scope**: Audit and clean `src/views/teams/`.

### What was built

- `teams.service.ts` layer violations fixed: removed all `useTeamsStore().patchTeamInList(...)` and `usePlayersStore().setPlayerTeamIdClientside(...)` calls from 7 service methods. Each caller in `Team.vue` and `ChangeCaptainModal.vue` now owns the store update.
- `team-roster-hydrate.ts` → `team-roster-hydrate.utils.ts` (view-local utility, correctly co-located); two import sites updated (`teams.service.ts`, `TeamsPlayersDrawer.vue`).
- `as any` removed from `transferCaptaincy` config (schema correctly types the path param) and `createInvite` (`as unknown as { ... }` used for the undocumented response schema).
- All 4 modal components confirmed used (`TeamCreateModal`, `ChangeCaptainModal`, `CreateInviteModal`, `TeamsFilterModal`). No dead exports found.
- `teams.types.d.ts` **kept as-is** (deviation): renaming to `teams.d.ts` causes vue-tsc to silently drop the ambient `TTeam` type declaration on macOS — confirmed bug where `teams.d.ts` (case-insensitive) conflicts with vue-tsc's virtual declaration for `Teams.vue`. Regular `tsc` works; vue-tsc `--build` does not.

### Acceptance criteria

- [x] `team-roster-hydrate.ts` is classified and co-located correctly → renamed to `team-roster-hydrate.utils.ts`.
- [~] Type file follows `teams.d.ts` naming convention → kept as `teams.types.d.ts` due to vue-tsc/macOS case-sensitivity bug; cannot be renamed safely.
- [x] `teams.store.ts` and `teams.service.ts` respect layer rules.
- [x] No dead exports remain.
- [x] `npm run lint` and `npm run type-check` pass.

---

### Phase 6: Tournaments view ✅ COMPLETE

**Scope**: The most complex view — audit `src/views/tournaments/` including its `utils/`, `components/qualification/`, and the many modals.

### What was built

- `tournaments/utils/playoff-errors.utils.ts` — tournaments-specific playoff error translation; correctly co-located and named. No move needed.
- `tournaments/utils/qualification-errors.utils.ts` — tournaments-specific qualification error translation; correctly co-located and named. No move needed.
- `components/qualification/qualification-matrix.utils.ts` — pure computation utility co-located with its consumers; no service logic present.
- All 8 modals confirmed used: `TournamentFilterModal`, `DueloPromoModal`, `PlayoffSubmitResultModal`, `TestMatchCreationModal`, `TechLossQualificationModal`, `TechLossPlayoffModal` (global via `use-app-modals`) + `MatchResultModal` (inline in `TournamentMatchesTab.vue`) + `QualificationAddResultModal` (inline in `TournamentQualificationTab.vue`). No dead modals.
- `tournaments.service.ts` — no layer violations: only imports `apiClient`, API types, `image-upload.service`, `ElMessage`, `getApiErrorMessage`. Zero store/composable imports.
- `tournaments.store.ts` — no layer violations: uses auto-imported `tournamentsService`, `ElMessage`, and `AxiosError` only.
- `components/qualification/` — all four qualification components are pure rendering/computation with no direct service calls. `QualificationQualificationTab.vue` correctly orchestrates service calls at the tab level.
- `playoff-errors.utils.ts` — already correctly named as `.utils.ts` (function exports); no reclassification needed.
- No player- or team-domain logic found that required relocation.

### Acceptance criteria

- [x] `tournaments/utils/` files are either in `src/core/utils/` or correctly scoped to the view.
- [x] All modal files are used; dead modals are deleted.
- [x] No layer violations in service or store.
- [x] `playoff-errors.ts` has the correct file type/suffix for its content.
- [x] `npm run lint` and `npm run type-check` pass.

---

### Phase 7: Admin-panel & Profile views ✅ COMPLETE

**Scope**: Audit `src/views/admin-panel/` and `src/views/profile/`.

### What was built

- `UpdateTournamentDrawer.vue`: replaced manual error extraction (`e?.response?.data?.detail || ...`) with `getApiErrorMessage`; removed `console.log(e)`; tightened catch type to `unknown`.
- `TournamentRow.vue`: changed `tournament: any` prop to `tournament: TTournament`; removed dead commented-out `TournamentTypeTag` import.
- `RequestsDetails.vue`: fixed typo `'TPlayer Verification'` → `'Player Verification'`.
- `ProfileRequestMmrModal.vue`: moved from `src/views/players/modals/` (wrong domain) to `src/views/profile/components/modals/`; import path in `use-app-modals.ts` updated; replaced `catch (error: any)` + `console.error` + manual error extraction with `getApiErrorMessage`.
- `ProfileUpdateMmrUnverifiedModal.vue`: removed dead `// const authStore` comment; replaced `catch (error: any)` + `console.error` + manual extraction with `getApiErrorMessage`.
- `ProfileUpdateMmrModal.vue`: removed dead `// const authStore` comment.
- `ProfileUpdatePositionModal.vue`: removed dead `// const authStore` comment.
- `ProfileSettings.vue`: removed empty `watch(() => user.value?.rating, ...)` stub.
- Profile view confirmed no service needed — `Profile.vue` and `ProfileSettings.vue` make no network calls (all modal operations are TODO stubs).
- Admin-panel tabs (`PlayerVerificationTab`, `TeamVerificationTab`, `MmrRequestsTab`) are unimplemented stubs with no real API calls — left as-is per architecture rules (no opportunistic rewrites).

### Acceptance criteria

- [x] Admin-panel components delegate domain logic to the appropriate view services rather than re-implementing it.
- [x] Profile view has a service if it performs any network calls.
- [x] No dead components or exports.
- [x] `npm run lint` and `npm run type-check` pass.

---

## Track 3 — Styles

---

### Phase 8: Style audit and unification ✅ COMPLETE

**Scope**: `src/assets/styles/`, all `.vue` component `<style>` blocks, and Tailwind token usage across the entire `src/` tree.

### What was built

- Added `dark.navy: '#0b1121'`, `dark.card: '#1e2330'`, `accent.gold: '#e8b931'` to `tailwind.colors.ts`.
- Replaced `bg-[#111827]` → `bg-gray-900`, `bg-[#0b1121]` → `bg-dark-navy`, `bg-[#1e2330]` → `bg-dark-card` across all template files.
- Replaced raw hex in CSS custom property values in `_table.scss`, `_base.scss`, `_input.scss` with `theme()` references. Fixed duplicate `--el-table-header-text-color` declaration and an indentation nesting bug in `_table.scss`.
- Moved the identical 60-line `.custom-table` `<style scoped>` block from `PlayerVerificationTab.vue`, `TeamVerificationTab.vue`, `MmrRequestsTab.vue` into a shared `.custom-table` block in `_table.scss`; removed all three scoped blocks.
- All five tournament modals with `background-color: #1e2330` updated to `theme('colors.dark.card')`.
- `UpdateTournamentDrawer.vue` and `CreateTournamentDrawer.vue` color values replaced with `theme()` references.
- `_image.scss` `#ffffff` → `white`.
- `_input.scss` textarea focus `#43bfee` → `theme('colors.primary')`.
- Dead `.bg` CSS class in `PageLayout.vue` (not referenced in template) removed.
- `color="#fff"` props in `Main.vue` → `color="white"`.
- Remaining intentional arbitrary values: one-off hover states (`#0f1425`, `#10152b`), button gradient stops (`#06b6d4`, `#3b82f6`, `#6366f1`), complex gradient overlays in Tournament.vue decorative divs — these have no existing tokens and their values are contextually meaningful.

### Acceptance criteria

- [x] Named semantic tokens now exist for all repeatedly-used colors; one-off hover/gradient values remain as Tailwind arbitrary values (no token warranted).
- [x] No near-duplicate style patterns — 3 identical admin tab style blocks collapsed to one shared global rule.
- [x] No component-specific styles incorrectly in global SCSS files — all global styles in `_base.scss` are app-wide (`.app-root`, `*` scrollbar, `body`, etc.).
- [x] Duplicate El+ table override removed from 3 components; moved to `_table.scss`.
- [x] Dead `.bg` CSS rule removed from `PageLayout.vue`; duplicate `--el-table-header-text-color` removed from `_table.scss`.
- [~] Visual regression check: UI changes are color-equivalent (hex values mapped to identical or near-identical token values). Cannot be verified without a running browser session.
