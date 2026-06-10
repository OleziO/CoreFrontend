# Plan: Dota Core — Premium Esports Platform Redesign

> Source: [.claude/plans/dota-core-redesign.prd.md](./dota-core-redesign.prd.md)
> Granularity: fine (big areas split). 20 vertical slices. Foundation is a single first phase.

## Architectural decisions

Durable decisions that apply across all phases:

- **Source of truth**: the root [CLAUDE.md](../../CLAUDE.md) governs conventions. `.claude/architecture.md`
  is a stale DealerPilot template and is **ignored** (no `src/features/`, no `*.routes.ts`, no
  `src/services/http/`). Reconciling that doc is a separate task, out of scope here.
- **Routes**: **no new routes.** Work within the existing structure — `tournaments` / `tournaments/:id`,
  players, teams, profile, admin, finance. Match info stays **modal/tab-based** inside the tournament
  detail page (match-result modals + matches tab already exist). Navigate only via `routeNames.xxx`.
- **Design tokens**: semantic tokens live in `tailwind/tailwind.colors.ts` (alias `@colors`) +
  `tailwind/tailwind.config.ts`. Evolve the existing identity — primary cyan `#43bfee`, reserved gold
  `#e8b931`, dark base `#0A0711` / navy `#0b1121` / card `#1e2330` — into `background / surface /
  elevated-surface / primary / secondary / success / warning / error / info / gold` plus
  typography (Display, H1–H4, Body, Small, Caption), spacing, and elevation scales.
- **Element Plus theming**: only via the global SCSS bundle — `src/assets/styles/main.scss` +
  `src/assets/styles/element-reset/*.scss`, `importStyle: false`. Never per-component style imports.
- **Data layer**: reuse the typed `apiClient` (`src/api/client.ts`) with `dynamicKeys` + literal `{id}`,
  and the existing `*.service.ts` / `*.store.ts` per view. Merge partial payloads on mutation (never blind
  replace). 401/token handling stays in the axios interceptor.
- **Role-gating & modals**: gate UI with `<RoleGuard :roles="[…]">` + `hasPlayerRole` (never raw string
  compare). Open global modals only via `useAppModals().open('Name', props)`.
- **Localization**: Ukrainian-only. Preserve existing strings; new text as vue-i18n keys (uk). No new locale.
- **Motion**: showpiece motion is the default; `prefers-reduced-motion` is an accessibility fallback only.
- **Code standards**: `<script setup lang="ts">`, named exports only, no `as any`, ESLint type prefixes
  (`I`/`T`/`E`), `max-len` 120, 2-space indent.
- **Per-phase verification**: every phase ends with `npm run lint` + `npm run type-check`, then
  `/review-short`. Legacy module structure is left as-is; only design system + targeted UX issues change.

---

## Phase 1: Design-system foundation

**Scope**: Semantic tokens, type/spacing/elevation scales, and central Element Plus theming.

### What to build

The single source of visual truth. Promote scattered colors into semantic tokens in `tailwind.colors.ts`
+ `tailwind.config.ts` (evolving cyan + gold on the dark base), add a typography scale, spacing scale, and
elevation ladder. Re-theme Element Plus globally through `main.scss` + `element-reset/*.scss` (button,
dialog, drawer, input, message-box, table, tabs) with `importStyle: false`. Standardize the shared status
treatment (verified / win-loss / live / prize / division) as **icon + label**, not color alone. Validate
the whole foundation by applying it to one representative existing screen.

### Acceptance criteria

- [ ] Semantic tokens (`background`, `surface`, `elevated-surface`, `primary`, `secondary`, `success`, `warning`, `error`, `info`, `gold`) exist in `@colors` and are usable from Tailwind classes and TS.
- [ ] Typography (Display, H1–H4, Body, Small, Caption), spacing, and elevation scales are defined as tokens/utilities.
- [ ] Element Plus buttons, inputs, dialogs, drawers, tables, tabs, and message-box reflect the new theme via the global SCSS bundle only (no per-component imports).
- [ ] A shared status component/util renders verification and result states with icon + label.
- [ ] One sample screen demonstrates the full foundation; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 2: Top navigation & header/footer chrome

**Scope**: Refined, click-based top nav and themed header/footer.

### What to build

Restructure `Header.vue` into a refined top navigation: primary destinations (Home, Tournaments, Teams,
Players) always visible; a **click-based** (not hover) user menu; role-gated entries (Admin, Finances,
Create Tournament) surfaced via `<RoleGuard>`. Re-theme `Footer.vue` and `PageLayout.vue` to the new
system. Logged-out state shows a clear Discord sign-in.

### Acceptance criteria

- [ ] Primary destinations are always visible on desktop; nothing critical is hover-only.
- [ ] User menu opens on click and is keyboard- and touch-accessible.
- [ ] Admin / Finances / Create Tournament appear only for authorized roles via `<RoleGuard>` + `hasPlayerRole`.
- [ ] Header, footer, and layout use new tokens; active state is clear and accessible.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 3: Mobile navigation

**Scope**: Bottom tab bar + accessible mobile overlay.

### What to build

Add a **mobile bottom tab bar** for primary navigation. Repurpose `Burger.vue` / `MobileMenu.vue` as a
secondary overlay with focus trapping, keyboard navigation, and a clear open/close state. Ensure
role-gated items appear correctly on mobile.

### Acceptance criteria

- [ ] A thumb-reachable bottom tab bar provides primary navigation on mobile breakpoints.
- [ ] The overlay menu traps focus, is keyboard-navigable, and signals open/close clearly.
- [ ] Role-gated entries render correctly on mobile.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 4: Shared cards

**Scope**: PlayerCard, TeamCard, TournamentCard, UserCard on the new system.

### What to build

Redesign the shared cards to the new tokens with strong scanning hierarchy and icon+label status
(verification, division, prize, tournament state). Standardize hover/lift motion (drop disorienting 3D
tilt jank, keep showpiece feel). Fix TeamCard's confusing inline Dota-ID/copy/Dotabuff layout.

### Acceptance criteria

- [ ] All four cards share consistent spacing, elevation, and status treatment (icon + label).
- [ ] Verification/prize/division are readable without relying on color alone.
- [ ] Motion is standardized and respects reduced-motion.
- [ ] Touch targets are comfortable; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 5: Landing (Main)

**Scope**: Competitive-first landing page.

### What to build

Reorder `Main.vue` to lead with competitive content (live/upcoming tournaments, top players/teams), demote
FAQ and sponsors below it. Keep showpiece motion but prune the heavy decorative particle DOM into
reusable, performant effects. Clear Discord sign-in for logged-out visitors.

### Acceptance criteria

- [ ] Competitive content appears above FAQ/sponsors.
- [ ] Decorative DOM is reduced; landing stays smooth; reduced-motion degrades gracefully.
- [ ] Sign-in CTA is prominent for logged-out users.
- [ ] Responsive across mobile→ultrawide; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 6: Tournaments list + filters

**Scope**: Modern tournament list and filtering.

### What to build

Redesign `Tournaments.vue`: replace the mobile carousel toolbar with a persistent search + a filter
sheet/drawer (modernize `TournamentFilterModal`). Use the redesigned TournamentCard. Skeletons + empty
states. Fast scanning of status, division, prize, dates, participants.

### Acceptance criteria

- [ ] No carousel toolbar; search is persistent and filters open in a sheet/drawer.
- [ ] List shows skeletons while loading and a proper empty state.
- [ ] Cards scan fast and are consistent with Phase 4.
- [ ] Responsive; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 7: Tournament detail shell + tabs

**Scope**: Tournament page hero, join panel, participants & qualification tabs.

### What to build

Restructure `Tournament.vue` with a strong hero (`TournamentHeroSection`), a clear join/leave flow
(`TournamentJoinPanel`), and themed tab navigation across participants (`TournamentParcitipantsTab`) and
qualification (`TournamentQualificationTab`, matrix/leaderboard). Reuse existing services/stores and
`/tournaments/{id}` data.

### Acceptance criteria

- [ ] Tournament hero presents status, division, prize, dates, and participants with clear hierarchy.
- [ ] Join/leave and qualification submit flows are low-friction and role-gated correctly.
- [ ] Tabs are themed and responsive; qualification matrix/leaderboard read well on mobile.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 8: Bracket / playoff grid

**Scope**: Readable playoff bracket and team bracket.

### What to build

Redesign `TournamentBracket.vue` + `TournamentTeamBracket.vue` into a readable playoff/grid view from the
existing playoff + grid data. Clear round/advancement structure, status per matchup, responsive behavior
(horizontal scroll/zoom on small screens rather than crushing).

### Acceptance criteria

- [ ] The bracket clearly shows rounds, matchups, and who advances.
- [ ] Each matchup shows status (upcoming/live/completed, verified) with icon + label.
- [ ] Bracket is usable on mobile (no crushed layout).
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 9: Match surfaces & team comparison

**Scope**: Matches tab, match cards, result modals, comparison.

### What to build

Redesign `TournamentMatchesTab.vue`, the qualification matches list, and the match-result modals
(`MatchResultModal`, `PlayoffSubmitResultModal`, `QualificationAddResultModal`, tech-loss modals) into a
"match room" feel: clear match cards with status indicators, team lineups, and a team-comparison view for
upcoming matchups. All from existing `/matches` + playoff data; modal-based (no new route).

### Acceptance criteria

- [ ] Match cards show status, teams, and result clearly; lineups are visible.
- [ ] A team-comparison view exists for a matchup.
- [ ] Result/tech-loss modals are themed, validated, and consistent.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 10: Tournament creation & admin tab

**Scope**: CreateTournamentDrawer + TournamentAdminTab.

### What to build

Redesign `CreateTournamentDrawer.vue` into a clear, validated, step-wise form (banner/logo uploads
included). Modernize `TournamentAdminTab.vue` for playoff start/management actions. Role-gated; reuse
existing service/store mutations and partial-payload merging.

### Acceptance criteria

- [ ] Creation drawer is step-wise, validated, and error-resistant; uploads are clear.
- [ ] Admin tab actions (start/manage playoff, manage details) are clear and role-gated.
- [ ] State merges partial backend responses correctly.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 11: Players list

**Scope**: Modern players list with search + filter drawer.

### What to build

Redesign `Players.vue`: replace the carousel toolbar with persistent search + filter drawer; skeletons +
empty/short-list handling for the virtual grid; redesigned PlayerCard from Phase 4.

### Acceptance criteria

- [ ] No carousel toolbar; persistent search + filter drawer; active-filter count is obvious.
- [ ] Grid handles loading (skeletons) and short/empty lists gracefully.
- [ ] Responsive; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 12: Player profile

**Scope**: Player.vue + header, stats, favorite heroes.

### What to build

Restructure `Player.vue` into a scannable hero header (`PlayerProfileHeader`: avatar, name, rank/MMR,
verification icon+label, key links with comfortable targets) + a clear stat block (`PlayerMatchStats`) +
a responsive favorite-heroes grid (`PlayerFavoriteHeroes`, no forced 3-column cramping) + match history.
Consistent rank/verification visuals with the cards.

### Acceptance criteria

- [ ] Profile reads with clear hierarchy: identity → stats → heroes/history.
- [ ] Verification and rank use icon + label; links have comfortable touch targets.
- [ ] Favorite-heroes grid is responsive; loading/empty/error states are clean.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 13: Teams list

**Scope**: Modern teams list consistent with players.

### What to build

Redesign `Teams.vue` with the same persistent search + filter drawer pattern, skeletons/empty states, and
the redesigned TeamCard. Fix the team-count tooltip interaction.

### Acceptance criteria

- [ ] Teams list matches the players list pattern (no carousel).
- [ ] Loading/empty/count states are clear and consistent.
- [ ] Responsive; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 14: Team profile + roster management

**Scope**: Team.vue, roster, team modals.

### What to build

Redesign `Team.vue`: clear team profile (roster, division, average rating, verification) and low-friction
roster management (invites, captain, add/remove player) via existing modals and `/teams/{id}/...`
endpoints. Reuse roster hydrate utils and store.

### Acceptance criteria

- [ ] Team profile presents roster and key stats with clear hierarchy.
- [ ] Invite / captain / add-remove flows are obvious and role-gated.
- [ ] State merges partial responses correctly.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 15: Profile page

**Scope**: Profile.vue identity/MMR/positions/team.

### What to build

Redesign `Profile.vue`: remove always-present empty placeholder cards ("not joined yet"); re-hierarchy
identity, MMR, positions, team, and external links; comfortable actions and touch targets.

### Acceptance criteria

- [ ] Empty placeholder cards are gone; only meaningful content shows.
- [ ] Identity/MMR/positions/team/links are organized with clear hierarchy.
- [ ] Responsive; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 16: Profile settings + MMR/position modals

**Scope**: ProfileSettings.vue and the MMR/position modals.

### What to build

Redesign `ProfileSettings.vue` (Discord + game-data status with clear labels; relabel "Update Player Data"
to what it does) and the modals (`ProfileRequestMmrModal`, `ProfileUpdateMmrModal`,
`ProfileUpdateMmrUnverifiedModal`, `ProfileUpdatePositionModal`) for clarity and consistent terminology
(MMR, not MMP). Role-gated verified/unverified states.

### Acceptance criteria

- [ ] Settings labels are clear; actions state what they do.
- [ ] MMR/position modals are themed, validated, and terminology-consistent.
- [ ] Verified/unverified states gated correctly via `<RoleGuard>`.
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 17: Admin panel

**Scope**: AdminPanel + RequestsDetails + TournamentsDetails.

### What to build

Full redesign of `AdminPanel.vue`: replace the dated tab bar with modern, **badge-counted** section
navigation; redesign the request workflow (`RequestsDetails`) into a scannable, action-clear surface; and
the admin `TournamentsDetails` management view. Fully responsive. Preserve partial-payload merge behavior
on verify/role actions.

### Acceptance criteria

- [ ] Section nav shows pending counts as badges; layout is modern (not a cramped table).
- [ ] Request review and tournament management actions are clear and efficient.
- [ ] Verify/role actions merge partial responses without blanking state.
- [ ] Responsive; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 18: Finance monitor

**Scope**: FinanceMonitor + breakdown, forecast, transaction feed.

### What to build

Full dashboard redesign of `FinanceMonitor.vue`: balance overview + category breakdown
(`CategoryBreakdownCard`) with real data-viz; transaction feed (`TransactionFeed`) with fewer inline modals
for trivial edits; forecast calculator (`ForecastCalculator`) as a clear interactive panel. Replace the
fixed `78vh` grid with responsive layout. Uses `finance-client.ts` / `finance.service.ts` as today.

### Acceptance criteria

- [ ] Balance + category breakdown render as a dashboard with data-viz.
- [ ] Transaction edits (rename/icon/group/category) are low-friction (not modal-per-action).
- [ ] Forecast panel is interactive and clear; layout is responsive (no fixed-height grid).
- [ ] `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 19: Invites, auth callback & login-success

**Scope**: InvitePage, AuthCallback, LoginSuccess.

### What to build

Redesign `InvitePage.vue` into a clear, single-action accept flow (team + invite shown plainly). Give
`AuthCallback.vue` and `LoginSuccess.vue` clear, on-brand loading/confirmation states. The router
`beforeEach` OAuth/Steam/auth-gating logic is untouched.

### Acceptance criteria

- [ ] Invite page shows the team/invite and one obvious accept action.
- [ ] OAuth callback and login-success show trustworthy on-brand loading/confirmation states.
- [ ] No changes to routing/auth logic; `lint` + `type-check` pass; `/review-short` clean.

---

## Phase 20: Cross-cutting a11y & responsive sweep

**Scope**: Platform-wide accessibility and responsive pass.

### What to build

A final pass across all redesigned surfaces: per-breakpoint layout checks (mobile, tablet, laptop,
desktop, ultrawide — reorganize, not shrink), focus order + visible focus + overlay focus traps, labels on
icon-only controls, status-by-icon+label completeness, touch-target sizing, and contrast. Fix gaps surfaced
by earlier phases.

### Acceptance criteria

- [ ] Every page is verified across the five target breakpoints with reorganized (not shrunk) layouts.
- [ ] Keyboard navigation, focus traps, and visible focus work platform-wide.
- [ ] Icon-only controls are labeled; status never relies on color alone; contrast/touch targets meet baseline.
- [ ] `lint` + `type-check` pass; `/review-short` clean.
