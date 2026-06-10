# Dota Core — Premium Esports Platform Redesign (PRD)

> Status: Draft for alignment
> Owner: Oleh
> Scope: Full-platform UI/UX/IA redesign of the Dota Core SPA, frontend-only, against the current API.

---

## Architecture note (read before building)

`.claude/architecture.md` describes a **different project ("DealerPilot")** and conflicts with this
codebase on routing (`*.routes.ts` vs the real `*.route.ts`), API client location (`src/services/http/`
vs the real `src/api/client.ts`), a `src/features/` layer that does not exist here, and styling paths.
The actual code consistently follows the **root [CLAUDE.md](../../CLAUDE.md)**.

**Decision for this PRD: the root `CLAUDE.md` is the source of truth.** `.claude/architecture.md` is
ignored as an out-of-repo template. This should be reconciled separately (delete or rewrite the stale
doc); do not treat its `features/`, `services/http/`, or `routeNames`-generator rules as binding here.

---

## Problem Statement

Dota Core is a functioning Dota 2 league/tournament management SPA, but it looks and behaves like a
hand-assembled hobby project rather than a competitive esports product. From the player's point of view:

- **It doesn't feel like a place for competitors.** The visual language is inconsistent (ad-hoc cyan,
  gold, and gray values scattered across files, no shared elevation or typography scale), so nothing
  feels intentional or premium. Next to FACEIT/ESEA/Challengermode it reads as amateur.
- **Key things are hard to reach.** Admin, Finances, and "Create Tournament" are buried inside a
  **hover-triggered** user dropdown in the header — invisible and unusable on touch. The active player
  can't tell at a glance where to go to join a tournament, check a bracket, or track their progress.
- **Mobile is an afterthought.** List pages (Players, Teams, Tournaments) hide search and filters behind
  an awkward swipe **carousel toolbar**; the user has to slide between "search" and "filter" slides to do
  the most common task on the page. Several dashboards are locked to fixed viewport heights (`78vh`,
  `flex-1 overflow-hidden`) that break on short or large screens.
- **Information is scattered and noisy.** The player profile splits identity, match stats, and favorite
  heroes into three stacked blocks with no hierarchy. The landing page spends large vertical real estate
  on FAQ and sponsor sections before showing anything competitive. Profile shows always-present empty
  placeholder cards ("not joined yet").
- **The competitive product isn't surfaced.** The backend already supports qualification + playoff
  **brackets**, a bracket **grid**, and **matches** with results/verification — but the UI exposes almost
  none of that as a first-class, scannable experience. There are no rankings, no progression, no
  achievements, no "match room" feel.
- **Accessibility and trust gaps.** Verification status is communicated by border color alone (fails for
  colorblind users); the mobile menu has no focus management or keyboard navigation; touch targets are
  small; terminology is inconsistent (MMR vs MMP, "Game Data" vs positions).

The result: a platform that works mechanically but does not feel professional, fast, trustworthy, or
addictive — and that leaves its strongest asset (real tournament brackets and matches) under-presented.

## Solution

Redesign Dota Core end-to-end into a premium, competitive-first esports platform — **natively within the
existing Vue 3 + TypeScript + Pinia + Element Plus + Tailwind architecture**, reusing all current
services, stores, and the typed API client. This is a product redesign (IA, UX, layout, component
hierarchy, visual language, interaction, mobile, accessibility, gamified competitive presentation), not a
reskin, but it ships against the **current API only** — no backend dependency.

The solution has five pillars:

1. **A real design system.** Promote the scattered colors into a single semantic token set built on the
   existing dark + cyan + gold identity (evolved, not replaced): `background / surface / elevated-surface`,
   `primary / secondary / success / warning / error / info`, plus a reserved `gold` for prize/elite
   accents. A typography scale (Display, H1–H4, Body, Small, Caption), a spacing scale, and elevation
   tiers. Element Plus is themed centrally through the global SCSS bundle (`main.scss` +
   `element-reset/*.scss`, `importStyle: false`) — never per-component.

2. **Restructured information architecture and navigation.** A refined, **click-based** top navigation
   with primary destinations always visible (Home, Tournaments, Teams, Players) and a proper user menu;
   role-gated entries (Admin, Finances, Create Tournament) surfaced correctly via `<RoleGuard>` instead of
   hidden in a hover dropdown. A real **mobile bottom tab bar** replaces the burger-only model for primary
   navigation, with the menu overlay reserved for secondary items. Dense staff areas (Admin, Finance) get
   a contextual sub-navigation.

3. **Competitive surfaces brought to the front.** Tournaments become modern tournament pages with a
   readable **bracket/playoff grid**, match cards with clear status indicators, team comparison, and
   timelines — all from existing `/tournaments/{id}/playoff`, `/grid`, and `/matches` data. Player profiles
   are reorganized into a scannable hero header + stat blocks + match history + favorite heroes with strong
   hierarchy.

4. **Modernized components.** Tables-where-a-list-is-better become card/list/data-viz patterns; the mobile
   carousel toolbar is replaced with a persistent search + a filter sheet/drawer; modals stop proliferating
   for trivial inline operations; skeleton loaders, empty states, and consistent feedback (ElMessage) are
   standardized.

5. **Premium, high-energy motion.** A showpiece motion language (rich hover/lift, transitions, accent
   effects) standardized into reusable patterns, with a `prefers-reduced-motion` fallback kept as an
   accessibility baseline only.

Every screen in `src/views/` is audited and redesigned — including Admin and Finance, which receive the
full premium treatment (dashboards, data-viz, modern tables) rather than a minimal reskin. All Ukrainian
user-facing strings and the existing vue-i18n plumbing are preserved; no new locale is introduced.

## User Stories

### Design system & platform consistency
1. As a returning player, I want every screen to share the same colors, spacing, and typography, so that the platform feels intentional and trustworthy rather than hand-assembled.
2. As a player on any screen, I want consistent buttons (primary, secondary, ghost, outline, icon) and inputs, so that I always know what is clickable and what each action does.
3. As a colorblind player, I want status (verified, win/loss, live, prize) shown with icon + label, not color alone, so that I can read the platform reliably.
4. As a player, I want skeleton loaders and clear empty states everywhere, so that the app feels fast and never shows me a blank or broken-looking screen.
5. As a maintainer, I want all Element Plus theming to come from the global SCSS bundle and Tailwind tokens, so that visual changes are made in one place and stay consistent.
6. As a maintainer, I want a single semantic token set in `tailwind.colors.ts`, so that new components reference `primary/surface/elevated-surface/...` instead of raw hex values.

### Navigation & information architecture
7. As a player on desktop, I want primary destinations (Home, Tournaments, Teams, Players) always visible in the top bar, so that I never have to hunt for them.
8. As a player, I want the user menu to open on click (not hover), so that it works on touch and doesn't open by accident.
9. As an admin, I want Admin, Finances, and Create Tournament surfaced by my role, so that I reach staff tools without digging through a hover dropdown.
10. As a mobile player, I want a bottom tab bar for primary navigation, so that I can move around with my thumb without opening a menu.
11. As a mobile player, I want the overlay menu to trap focus, be keyboard-navigable, and clearly indicate open/close state, so that it's usable and accessible.
12. As a player, I want fewer clicks to reach my goal (join a tournament, view a match, manage my team, see my stats), so that the platform respects my time.
13. As a staff user in Admin or Finance, I want a contextual sub-navigation for the sections (requests, bugs, tournaments / balance, categories, forecast), so that I can move between dense tools quickly.

### Landing / Main
14. As a first-time visitor, I want the landing page to lead with the competitive product (live/upcoming tournaments, top players/teams), so that I immediately understand what this platform is for.
15. As a visitor, I want secondary content (FAQ, sponsors) below the competitive content, so that the most important information is seen first.
16. As a visitor on a low-end device, I want the landing animations to stay smooth, so that my first impression isn't jank. (Showpiece motion is the default; `prefers-reduced-motion` degrades gracefully.)
17. As a logged-out visitor, I want a clear, prominent way to sign in with Discord, so that I can join without confusion.

### Players (list & profile)
18. As a player browsing the roster, I want a persistent search bar and a filter sheet/drawer on mobile, so that I never swipe through a carousel to filter.
19. As a player, I want the player grid to load with skeletons and handle long/short lists gracefully, so that scrolling feels stable.
20. As a visitor on a player profile, I want a strong hero header (avatar, name, rank/MMR, verification, key links) that reads at a glance, so that I instantly know who this is.
21. As a player, I want my match stats (total, wins, losses, win rate) presented as a clear, scannable stat block, so that I understand my performance quickly.
22. As a player, I want my favorite heroes shown in a responsive grid (not always 3 cramped columns), so that it reads well on mobile.
23. As a player, I want my external links (Steam, Dotabuff, Discord) and role tags presented cleanly with comfortable touch targets, so that I can act on them easily.
24. As a viewer, I want consistent rank/verification visuals between the profile and the player cards, so that the identity feels coherent.

### Teams (list & profile)
25. As a player, I want the team list to use the same modern search/filter pattern as players, so that browsing is consistent.
26. As a captain, I want a clear team profile with roster, division, average rating, and verification, so that I can present and manage my team.
27. As a captain, I want roster management (invites, captain, add/remove player) to be obvious and low-friction, so that I can run my team without confusion.
28. As a player, I want the Dota team ID / copy / Dotabuff actions on a team card laid out clearly, so that I don't misread the inline controls.

### Tournaments, brackets & matches (the competitive core)
29. As a player, I want a modern tournament list with status, division, prize pool, dates, and participant count that scans fast, so that I can find a tournament to join.
30. As a player, I want an obvious, low-friction flow to join or leave a tournament and submit qualification, so that entering competition is effortless.
31. As a player or spectator, I want a readable playoff **bracket/grid** view built from the existing playoff data, so that I can follow who plays whom and who advances.
32. As a spectator, I want match cards with clear status indicators (upcoming / live / completed, verified result), so that I can see the state of a matchup at a glance.
33. As a player, I want a match detail view with team lineups and result, so that the matchup feels like a real "match room."
34. As a captain in a tournament, I want a team-comparison view for an upcoming matchup, so that I can scout the opponent.
35. As an organizer, I want the tournament creation drawer redesigned as a clear, validated, step-wise form, so that creating a tournament is fast and error-resistant.
36. As an organizer, I want banner/logo uploads and grid/playoff management presented clearly within the tournament admin surface, so that I can run the event.

### Profile & settings
37. As a player, I want my profile to hide empty placeholder cards and show only meaningful content, so that the page isn't padded with "not joined yet" noise.
38. As a player, I want my identity, MMR, positions, team, and links organized with clear hierarchy, so that I can read and edit my profile quickly.
39. As a player, I want the MMR request / update / unverified-update / position modals redesigned for clarity with consistent terminology (MMR, not MMP), so that I always understand the action.
40. As a player, I want Discord and game-data status in settings to use clear labels and obvious actions ("Update Player Data" relabeled to what it actually does), so that I know what each control will do.
41. As a player, I want my Steam/Discord/Dotabuff links and re-authentication handled in a clean settings layout, so that account linking is straightforward.

### Admin panel (full redesign)
42. As an admin, I want the panel's dated tab bar replaced with a modern, badge-counted section navigation, so that I can see how much work is pending in each area.
43. As an admin reviewing requests, I want a modern, scannable request workflow (not a cramped table) with clear actions, so that I can process requests quickly.
44. As an admin managing tournaments, I want a clear management surface for tournament details and actions, so that I can administer events efficiently.
45. As an admin, I want the admin surface to be fully responsive, so that I can act on requests from any device.
46. As an admin, I want player verification / role assignment actions to merge partial backend responses into state correctly, so that the UI never blanks out data after an action.

### Finance monitor (full redesign)
47. As a finance user, I want a balance overview and category breakdown presented as a real dashboard with data-viz, so that I can understand the league's finances at a glance.
48. As a finance user, I want the transaction feed to stop opening a separate modal for every trivial inline edit (rename, icon, group, category), so that bulk bookkeeping is fast.
49. As a finance user, I want the forecast calculator presented as a clear, interactive panel, so that I can model outcomes without friction.
50. As a finance user, I want the dashboard to use responsive layout instead of a fixed `78vh` grid, so that it works on small and large screens.

### Invites, auth & redirects
51. As an invited player, I want the invite acceptance page to clearly show the team, the invite, and a single obvious accept action, so that joining is unambiguous.
52. As a user mid-OAuth, I want the Discord callback and login-success screens to show clear, on-brand loading/confirmation states, so that I trust the redirect is working.

### Shared chrome & cards
53. As a player, I want the header, footer, and mobile menu to share one consistent, accessible design, so that the frame around every page feels coherent.
54. As a player, I want player/team/tournament cards to be visually consistent, scannable, and to communicate status with icon + label, so that lists are easy to read.
55. As a player, I want premium motion (hover/lift, transitions) that feels high-energy but never blocks me or breaks on reduced-motion settings, so that the platform feels alive yet usable.

### Responsiveness & accessibility (cross-cutting)
56. As a player on mobile, tablet, laptop, desktop, or ultrawide, I want each page reorganized for my breakpoint (not just shrunk), so that every device feels first-class.
57. As a keyboard user, I want focus order, focus traps in overlays, and visible focus states throughout, so that I can use the platform without a mouse.
58. As a screen-reader user, I want meaningful labels on icon-only controls and status elements, so that the interface is understandable.
59. As any user, I want comfortable touch targets and adequate contrast everywhere, so that the platform is usable and trustworthy.

## Implementation Decisions

### Source of truth & conventions
- The **root `CLAUDE.md`** governs all conventions. `.claude/architecture.md` is disregarded for this work
  (stale DealerPilot template). View modules keep the real convention: `*.route.ts` exporting
  `xxxRouteNames` + `xxxRoutes`, `*.service.ts` singletons with `ElMessage` toasts, `*.store.ts` Pinia
  setup-stores wrapping services, with `components/`, `modals/`, `composables/`, `*.d.ts`, `*.enums.ts`,
  `*.queries.ts` as used today. No `src/features/` layer is introduced.
- All new types follow ESLint naming: `I` interfaces, `T` type aliases, `E` enums; `max-len` 120;
  2-space indent; `<script setup lang="ts">`; named exports only; no `as any`.
- Reuse the typed `apiClient` (`src/api/client.ts`) with `dynamicKeys` and literal `{id}` placeholders.
  Reuse existing services/stores/business logic and merge-on-mutation patterns (e.g.
  `mergePlayerAfterVerifyMutation`) — never blindly replace state, since admin actions return partial
  payloads. The 401/token handling stays in the interceptor; do not duplicate.

### Design system (real tokens, not abstractions)
- Extend `tailwind/tailwind.colors.ts` (alias `@colors`) and `tailwind/tailwind.config.ts` with semantic
  tokens: `background`, `surface`, `elevated-surface`, `primary` (evolved from cyan `#43bfee`), `secondary`,
  `success`, `warning`, `error`, `info`, plus a reserved `gold` (`#e8b931`) for prize/elite accents. Keep
  the existing dark base (`#0A0711` / navy `#0b1121` / card `#1e2330`) but formalize an elevation ladder.
- Element Plus is themed centrally via the global SCSS bundle: `src/assets/styles/main.scss` +
  `src/assets/styles/element-reset/*.scss` (button, dialog, drawer, input, message-box, table, tabs), with
  `importStyle: false`. No per-component Element Plus style imports.
- Add a typography scale (Display, H1–H4, Body, Small, Caption) and a spacing/elevation scale as Tailwind
  tokens / SCSS utilities. Standardize button variants (primary, secondary, ghost, outline, icon), input
  variants (text, search, select, date, filter), and feedback patterns (ElMessage toasts, alerts, empty
  states, loading + skeleton loaders).
- Status semantics (verified, win/loss, live, prize, division) get a shared icon+label treatment so color
  is never the sole signal.

### Navigation & IA
- Refined **top navigation**: primary destinations always visible, **click-based** user menu, role-gated
  entries (Admin, Finances, Create Tournament) surfaced via `<RoleGuard :roles="[…]">` and `hasPlayerRole`
  (never raw string comparison). Refactor `Header.vue` accordingly.
- Add a **mobile bottom tab bar** for primary navigation; repurpose `MobileMenu.vue`/`Burger.vue` for
  secondary items with proper focus trapping and keyboard support.
- Dense staff areas (Admin, Finance) gain a **contextual sub-navigation** for their sections.
- Global modals continue to be registered once and opened via `useAppModals().open('Name', props)` — one
  `useModals` call per module preserved.

### Per-surface redesign (all of `src/views/` + shared chrome)
- **main** (`Main.vue`): reorder to lead with competitive content; demote FAQ/sponsors; keep showpiece
  motion but prune heavy particle DOM into reusable, performant effects.
- **players** (`Players.vue`, `Player.vue`, `PlayerProfileHeader`, `PlayerMatchStats`,
  `PlayerFavoriteHeroes`): replace carousel toolbar with persistent search + filter drawer; restructure
  profile into hero header + stat blocks + match history + responsive hero grid.
- **teams** (`Teams.vue`, `Team.vue`, components/modals): consistent list pattern; clearer team profile and
  roster management.
- **tournaments** (`Tournaments.vue`, `Tournament.vue`, `TournamentCard`, `TournamentsDetails`,
  `CreateTournamentDrawer`, components/modals/queries): modern tournament pages, a readable **bracket/grid**
  from `/tournaments/{id}/playoff` + `/grid`, match cards with status, match detail with lineups from
  `/matches`, team comparison, and a redesigned, validated creation drawer.
- **profile** (`Profile.vue`, `ProfileSettings.vue`, MMR/position modals): remove empty placeholder cards,
  re-hierarchy identity/MMR/positions/team/links, redesign modals with consistent terminology.
- **admin-panel** (`AdminPanel.vue`, `RequestsDetails`, `TournamentsDetails`): full redesign — badge-counted
  section nav, modern request workflow, responsive; preserve partial-payload merge behavior.
- **finance-monitor** (`FinanceMonitor.vue`, `CategoryBreakdownCard`, `ForecastCalculator`,
  `TransactionFeed`): full dashboard redesign with data-viz, fewer inline modals, responsive layout
  replacing fixed-height grids. Uses `src/api/finance-client.ts` / `finance.service.ts` as today.
- **invites** (`InvitePage.vue`), **auth** (`AuthCallback.vue`), **login-success** (`LoginSuccess.vue`):
  clear, on-brand loading/confirmation/accept states. OAuth/Steam/auth-gating routing in the single router
  `beforeEach` is untouched.
- **shared chrome**: `Header`, `Footer`, `Burger`, `MobileMenu`, `PageLayout`, `PlayerCard`, `TeamCard`,
  `TournamentCard`, `UserCard` redesigned to one consistent, accessible system.

### Component modernization
- Convert table-heavy patterns to card/list/data-viz where it improves scanning; modernize filters, forms,
  modals, drawers, dropdowns, tooltips, tabs, accordions, pagination, search; standardize skeletons and
  empty states. Prefer Element Plus components themed via the global bundle; prefer VueUse for behavior.

### Motion & accessibility
- **Showpiece motion is the default** (rich hover/lift, transitions, accent effects), standardized into
  reusable patterns. A `prefers-reduced-motion` fallback is retained as an accessibility baseline only.
- Accessibility baseline across the platform: focus order + visible focus, focus traps in overlays,
  keyboard nav, labeled icon-only controls, status by icon+label, comfortable touch targets, adequate
  contrast.

### Localization
- **Ukrainian-only.** Preserve all existing Ukrainian strings and the vue-i18n setup; new UI text is added
  as i18n keys in Ukrainian. No English/other locale and no language switcher in this scope.

### Verification per slice
- After each slice: `npm run lint` and `npm run type-check` must pass, then run `/review-short`. ESLint
  type-prefix, `max-len` 120, and 2-space indent are non-negotiable.

## Out of Scope

- **Competitive systems without backend support:** leaderboards/rankings, achievements, reputation systems,
  and seasonal progression. No endpoints exist for these (`/leaderboard`, achievements schema, seasons).
  Captured as **Future** below; not built — not even with placeholder data — in this PRD.
- **Backend / API changes.** Strictly frontend, against the current OpenAPI surface. No new or modified
  endpoints are assumed; `npm run api` regeneration is only for unrelated backend changes.
- **New locales** (English/Russian) and a language switcher.
- **Reconciling/rewriting `.claude/architecture.md`** itself (flagged above; handled as a separate task).
- **Test infrastructure.** No test runner is configured and none is added here.
- **Build/deploy pipeline, committed `dist/` and `stats.html` artifacts** — left untouched unless explicitly
  building.

## Further Notes

- **Backend capabilities that ARE available and should be exploited:** tournament `qualification` and
  `playoff` flows, `/tournaments/{id}/playoff`, `/tournaments/{id}/grid`, per-match verify/result, and
  `/matches` + `/matches/{id}`. These make brackets, match cards, match detail/"match rooms," and team
  comparison real, buildable surfaces — they are the centerpiece of the competitive redesign.
- **Current identity to evolve:** dark base `#0A0711` (+ navy `#0b1121`, card `#1e2330`), primary cyan
  `#43bfee`, gold accent `#e8b931`. Today these live as ad-hoc values; the work formalizes them into
  semantic tokens without abandoning brand recognition.
- **Known UX debts to fix opportunistically while in each file:** MMR/MMP terminology drift, "Game Data"
  labeling, verification-by-color-only, fixed-height dashboards (`78vh`, `flex-1 overflow-hidden`), hover
  user menu, mobile carousel toolbars, always-present empty placeholder cards.
- **Legacy-code rule:** when editing files that predate current conventions, adopt the new design system
  and fix the targeted UX issues, but do not opportunistically restructure surrounding module layout.
- **Sequencing recommendation (for the follow-on plan):** (1) design-system foundation + Element Plus
  theming, (2) shared chrome + navigation/IA + cards, (3) competitive core (tournaments → bracket → match),
  (4) players + teams + profile, (5) admin + finance, (6) invites/auth/redirect polish + a11y/responsive
  sweep. Each as a vertical slice with lint + type-check + `/review-short`.
- This PRD intentionally captures the **full platform vision** in one document per the chosen scope;
  translate it into phased tracer-bullet slices via `prd-to-plan` before implementation.
