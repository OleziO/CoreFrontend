# Playoff Bracket Feature — Implementation Plan

## Context

Backend (NestJS) adds a full playoff phase on top of the existing qualification
flow. Endpoints are live on **stage** (`https://stage.core-league-dota2.org`,
which is what `.env.dev` `VITE_API_PUBLIC_URL` points at) but **not on
production** (`https://api.core-league-dota2.org`, the URL hard-coded in the
`npm run api` script). The committed `src/api/types/schema.d.ts` therefore has
**no** `playoff` paths or DTOs yet.

Confirmed stage schema shapes:

- `PlayoffTeamsDto` = `{ teamIds: string[] }`
- `PlayoffResponseDto` = `{ embedUrl: string; teams: TeamResponseDto[] }`
- `SubmitPlayoffMatchDto` = `{ dotaMatchId: string }`
- `PlayoffMatch` = `{ id, playoffId, playoff, teamAId, teamA, teamBId, teamB, winnerId|null, winner|null, dotaMatchId|null, challongeMatchId, createdAt }`

Paths:
- `GET  /tournaments/{id}/qualification/teams` → `TeamResponseDto[]` (eligible)
- `GET/POST/DELETE /tournaments/{id}/playoff/teams` → `TeamResponseDto[]` (staging)
- `POST /tournaments/{id}/playoff/start` → `PlayoffResponseDto` (200/201; 409 if started)
- `POST /tournaments/{id}/playoff/disqualify` → `PlayoffResponseDto`
- `POST /tournaments/{id}/playoff/submit` → `PlayoffMatch` (any JWT user)
- `GET  /tournaments/{id}/playoff` → `PlayoffResponseDto` (public, 404 if not started)

## Architecture decisions

1. **Regenerate `schema.d.ts` from stage**, not from the prod `npm run api`
   script (prod would erase the new paths). Command:
   `npx openapi-typescript https://stage.core-league-dota2.org/api-json -o src/api/types/schema.d.ts`.
   Note this as a one-liner in the PR description so it can be re-run from prod
   once the backend ships there.
2. **Type aliases** in `src/api/types/api.types.ts` following existing
   convention: `TPlayoffResponse`, `TPlayoffMatch`, `TPlayoffTeamsDto`,
   `TSubmitPlayoffMatchDto`.
3. **Service**: extend `tournaments.service.ts` (singleton) with 7 typed
   methods using `apiClient` + `dynamicKeys`, mirroring existing 404→null
   handling in `fetchQualification`.
4. **Public bracket**: replace the `tournamentGridUrl`-based iframe in the
   "Сітка" tab with the `GET /playoff` `embedUrl`. Keep the existing
   `getBracketUrl` URL-normalisation logic. Fall back gracefully on 404
   ("playoff not started yet") and keep current empty states.
5. **Player match submission**: new modal `PlayoffSubmitResultModal.vue`
   modelled on `QualificationAddResultModal.vue` (same numeric-id input,
   validation, friendly-error mapping). Available to any logged-in user from
   the Сітка tab while status is `PLAYOFF`.
6. **Admin playoff management**: new tab inside `TournamentAdminTab.vue`
   ("Плей-оф") — eligible-team picker (`GET qualification/teams`), staged-team
   list (`GET/POST/DELETE playoff/teams`), Start Playoff button
   (`POST playoff/start`, 409-aware), and per-team Disqualify with
   `el-popconfirm` (`POST playoff/disqualify`).
7. **Friendly errors**: new `playoff-errors.ts` util mirroring
   `qualification-errors.ts`, mapping 400/404/409/503 + known backend
   messages to Ukrainian user text. Reuse `getApiErrorMessage`.
8. No new route — everything lives in the existing Tournament detail tabs.
9. No store changes required (component-local state, consistent with
   `TournamentAdminTab`/`TournamentQualificationTab`). Tournament refresh via
   the existing `reloadTournament`/`@refresh` emit.

## Phases (tracer-bullet vertical slices)

### Phase 1 — Types + service (foundation)
- Regenerate `schema.d.ts` from stage.
- Add `TPlayoffResponse`, `TPlayoffMatch`, `TPlayoffTeamsDto`,
  `TSubmitPlayoffMatchDto` to `api.types.ts`.
- Add service methods: `fetchQualificationTeams`, `getPlayoffTeams`,
  `addPlayoffTeams`, `removePlayoffTeams`, `startPlayoff`,
  `disqualifyPlayoffTeam`, `submitPlayoffMatch`, `fetchPlayoff` (404→null).
- Add `src/views/tournaments/utils/playoff-errors.ts`.
- Gate: `npm run lint` + `npm run type-check` clean.

### Phase 2 — Public bracket view (read path, visible end-to-end)
- In `Tournament.vue` Сітка tab: fetch `GET /playoff` on tab activation when
  `tournamentStatus === 'PLAYOFF'`; render `embedUrl` via existing
  `getBracketUrl`. Keep "not ready / available during playoff" empty states;
  add a 404 "playoff not started" state.
- Also update reusable `TournamentTeamBracket.vue` to accept an optional
  `embedUrl` prop so both stay consistent (backward compatible).
- Gate: lint + type-check; manual smoke against stage.

### Phase 3 — Player match submission
- New `PlayoffSubmitResultModal.vue` (clone of `QualificationAddResultModal`,
  swap service call → `submitPlayoffMatch`, errors → `playoff-errors`).
- Register in `use-app-modals.ts` as `PlayoffSubmitResultModal`.
- Add "Подати результат" button in the Сітка tab for logged-in users when
  status is `PLAYOFF`; on success refetch the playoff embed + tournament.
- Gate: lint + type-check.

### Phase 4 — Admin staging / start / disqualify
- Add "Плей-оф" sub-tab to `TournamentAdminTab.vue`:
  - Eligible-teams multiselect from `GET qualification/teams`.
  - Staged list with add/remove (`POST`/`DELETE playoff/teams`,
    optimistic-safe since idempotent).
  - "Запустити плей-оф" button → `POST playoff/start`; disable + 409 message
    once started; show resulting `embedUrl` confirmation.
  - Disqualify control per staged/active team → `POST playoff/disqualify`
    behind `el-popconfirm`; refresh teams + bracket.
- Gate: lint + type-check; `/review-short`.

## Acceptance criteria
- Type-check & lint pass; no `any`/`as` beyond existing service-layer pattern.
- Public users see the live Challonge bracket on the Сітка tab when a playoff
  has started; clean empty state otherwise (incl. 404).
- Logged-in users can submit a Dota match id; backend errors surface as
  readable Ukrainian messages (incl. 503 retry hint).
- Admins can stage teams, start the playoff once (409 handled), and
  disqualify a team with the bracket/list updating afterward.
- All user-facing strings in Ukrainian, consistent with surrounding code.

## Risks / notes
- `schema.d.ts` regen source divergence (stage vs prod) — documented in PR.
- Challonge `embedUrl` already includes `/module`; `getBracketUrl` handles
  the `/module` + query-param case, reuse as-is.
- `submit` is open to any JWT user (backend enforces captain rules); keep
  client validation light and rely on friendly error mapping.
