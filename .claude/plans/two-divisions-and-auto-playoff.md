# Plan: Two Divisions + Auto-Start Playoff + Average-Only Substitution

> Source: User request (Ukrainian) —
> 1. Дивізіони (тепер 2): перший 0–6500, другий 6500–без ліміту; плейоф стартує автоматично, не адміном.
> 2. Прибираємо верхню межу по гравцю (рахуємо тільки середній); заміна валідна якщо середній ММР лишається в тому самому дивізіоні.
>
> Key context discovered during exploration: **the backend already ships the 2-division / no-per-player-cap model.** The frontend is stale (still shows 3 divisions, old avg bands 2500/4500/7000, and a per-player `max` cap). Playoff auto-start does not exist anywhere and the backend has **no scheduling infrastructure**. So the work is: (a) align the frontend to the backend, (b) build the auto-start scheduler, (c) remove the manual start UI.

## Architectural decisions

Durable decisions that apply across all phases:

- **Divisions**: 2 active divisions.
  - `DIVISION_I` — team average MMR ≤ **6500**.
  - `DIVISION_II` — team average MMR > 6500 (no upper limit).
  - `DIVISION_III` — legacy only. Hidden from all creation/edit UI and rejected by the backend on new tournaments, but tag/label/style maps are **kept** so pre-existing tournaments still render correctly.
- **MMR model**: division is a pure function of the **team average** (`sum(rating)/count`). No per-player MMR ceiling anywhere. Single threshold constant **6500** (already the only literal in backend `tournament-division.util.ts`).
- **Substitution**: valid iff the substitution keeps the team in the **same division** (i.e. average stays on the same side of 6500). The backend two-sided check in `qualification.service.ts validateSubstitute` already implements this — no rule change, only verify it still holds after the threshold/cap cleanup.
- **Playoff start**: fully automatic.
  - Trigger: `@nestjs/schedule` `@Cron` polling **every minute**.
  - Condition: `tournamentStatus === QUALIFICATIONS` **and** `now >= tournamentStartsAt`.
  - Team selection: automatic, via existing eligibility logic (`findEligibleQualificationTeamIds` / `tournament-playoff-team.eligibility.ts`); merge with any admin-staged `TournamentPlayoffTeam` rows if present.
  - Runs a **service-level** start path that bypasses `AdminGuard` (no authenticated admin actor).
  - **Idempotent**: existing `Playoff already started` guard + the `QUALIFICATIONS → PLAYOFF` status flip prevent double-start. A failed run (Challonge / Dota2 external calls) leaves status at `QUALIFICATIONS`, so the next minute's tick retries automatically.
- **Manual start removed**: the admin "Запустити плей-оф" button and staging-start action are removed from the frontend. Playoff can only be started by the scheduler.

### Key files (reference)

Frontend:
- `src/components/tournaments-tags/tournament.constants.ts` — division values, labels, MMR hints, `inferTournamentDivisionFromAvgRating`, `resolveTeamDivisionForDisplay` (central source of truth).
- `src/views/tournaments/components/TournamentAdminTab.vue` — `computeDivision` (the only client-side per-player `max` gate, lines ~268–287); playoff staging + `startPlayoff()` (lines ~381) + start button (~227).
- `src/views/main/Main.vue:519` — duplicated MMR-threshold FAQ copy.
- `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue`, `UpdateTournamentDrawer.vue` — division select fields.
- `src/components/team-tags/DivisionTag.vue` + `TeamRoster.vue` / `TeamProfileCard.vue` / `TeamAvg.vue` — division display + avg computation.
- `src/views/tournaments/tournaments.service.ts:105` — `startPlayoff` client call.

Backend:
- `src/tournaments/tournament-division.util.ts` — division from avg (already 6500, avg-only).
- `src/tournaments/tournaments.model.ts` — `TournamentDivision` / `TournamentStatus` enums.
- `src/tournaments/dto/create-tournament.dto.ts` (+ update DTO) — where to reject `DIVISION_III` on new tournaments.
- `src/qualification/qualification.service.ts` — `validateSubstitute` (~584), `joinTournament` division gate (~231).
- `src/playoff/playoff.service.ts:48` — `startPlayoff` (only place status → PLAYOFF, ~150).
- `src/tournaments/tournaments.controller.ts:221` — admin `POST :id/playoff/start`.
- `src/tournaments/tournaments.entity.ts` — `tournamentStartsAt` field (scheduler anchor).
- `src/app.module.ts` — where `ScheduleModule.forRoot()` is registered.

---

## Phase 1: Two-division / no-cap model (frontend align + backend guard)

**Scope**: Make the whole app reflect exactly 2 divisions split at a 6500 team-average, with no per-player MMR cap; keep legacy Division III renderable; reject new Division III tournaments on the backend.

### What to build

End-to-end, creating or viewing a tournament/team should express the 2-division model:
- Division inference and display everywhere use a single **6500 average** cut (`≤ 6500 → I`, `> 6500 → II`). All old avg bands (2500 / 4500 / 7000) and per-player `max` limits are removed from logic and from all human-readable copy (division hint tooltips, `Main.vue` FAQ).
- `TournamentAdminTab.computeDivision` no longer references `Math.max` / per-player caps — it matches the backend's avg-only, 6500 rule, so the "eligible teams" filter agrees with the backend.
- Tournament create/edit drawers only offer **Division I / II**; `DIVISION_III` is not selectable. Existing tournaments carrying `DIVISION_III` still render their tag/label/color correctly (maps retained).
- Backend rejects `DIVISION_III` on tournament create/update with a clear validation error, while the enum value stays for reading legacy records.
- Substitution behavior verified unchanged: a reserve swap that keeps the team on the same side of 6500 is allowed; one that would cross 6500 is rejected (existing backend two-sided check).

### Acceptance criteria

- [ ] Frontend division inference/display uses a single 6500 average threshold; no `2500` / `4500` / `7000` division band literals remain in `tournament.constants.ts`.
- [ ] `TournamentAdminTab.computeDivision` uses average only (no `Math.max` / per-player cap); admin "eligible teams" filter matches backend `computeTeamDivision`.
- [ ] No per-player MMR cap text remains in division hint tooltips or `Main.vue` FAQ copy; copy reflects "0–6500" and "6500+ / без ліміту".
- [ ] Create/Update tournament drawers offer only Division I and II; Division III is not selectable.
- [ ] A pre-existing `DIVISION_III` tournament/team still renders its division tag with correct label and styling.
- [ ] Backend rejects `DIVISION_III` on tournament create/update; the enum value remains available for reading old records.
- [ ] Substitution validation confirmed: same-division reserve swap allowed, cross-6500 swap rejected (no regression from cap removal).
- [ ] `npm run type-check` and `npm run lint` pass on the frontend; backend builds/tests pass.

---

## Phase 2: Playoff auto-start scheduler (backend)

**Scope**: Add scheduling infrastructure and an automatic, idempotent playoff-start job keyed off `tournamentStartsAt`.

### What to build

End-to-end, a tournament whose `tournamentStartsAt` has passed while still in `QUALIFICATIONS` transitions to `PLAYOFF` automatically within ~1 minute, with a bracket built from the eligible qualification teams — no admin action:
- Register `@nestjs/schedule` `ScheduleModule.forRoot()` in the app module.
- Add a service-level auto-start entry that: computes eligible teams (existing eligibility util, merged with any staged `TournamentPlayoffTeam` rows), runs the existing `startPlayoff` bracket-creation flow **without** requiring an admin actor/`AdminGuard`, and flips status to `PLAYOFF`.
- Add a `@Cron('*/1 * * * *')` (every-minute) job that selects tournaments where `tournamentStatus === QUALIFICATIONS` and `tournamentStartsAt <= now`, and invokes the auto-start entry for each.
- Guarantee idempotency and self-healing: the existing "already started" guard prevents double-start; a run that throws (Challonge/Dota2 failure) leaves status at `QUALIFICATIONS` and is retried on the next tick. Log start attempts, successes, and failures.

### Acceptance criteria

- [ ] `@nestjs/schedule` added and `ScheduleModule.forRoot()` registered; app boots with the cron active.
- [ ] Setting a `QUALIFICATIONS` tournament's `tournamentStartsAt` to a past time results in status → `PLAYOFF` within ~1 minute, with a bracket created from eligible teams.
- [ ] Auto-start selects eligible qualification teams automatically (no `teamIds` passed by a human) and merges any admin-staged teams.
- [ ] The auto-start path does not depend on `AdminGuard` / an authenticated request.
- [ ] Running twice does not create a second bracket or re-flip status (idempotent); a tournament already in `PLAYOFF`/`COMPLETED` is skipped.
- [ ] A simulated failure in the start flow leaves status at `QUALIFICATIONS` and the job retries on the next tick; attempts and outcomes are logged.
- [ ] Tournaments whose `tournamentStartsAt` is in the future are not started.

---

## Phase 3: Remove manual start / reflect automatic flow (frontend)

**Scope**: Remove the admin manual playoff-start UX and communicate that the playoff starts automatically at `tournamentStartsAt`.

### What to build

End-to-end, the admin no longer has a way to manually start the playoff; instead the admin panel shows when it will auto-start and reflects the transition once it happens:
- Remove the "Запустити плей-оф" button and the `startPlayoff()` action/handler from `TournamentAdminTab.vue` (and drop the now-unused client `startPlayoff` service call if nothing else uses it).
- Replace it with read-only messaging: the scheduled auto-start time (`tournamentStartsAt`) and current status; keep the existing playoff/bracket viewing, team listing, and match-management UI intact.
- Team staging UI: keep it if it still feeds the auto-start merge (pre-seeding); otherwise remove. Decide based on Phase 2's final merge behavior.

### Acceptance criteria

- [ ] The admin panel has no manual "start playoff" button/action; `startPlayoff` is no longer callable from the UI.
- [ ] The admin panel shows the tournament's auto-start time and status for a `QUALIFICATIONS` tournament.
- [ ] Once the backend flips a tournament to `PLAYOFF`, the frontend displays the started bracket without any manual step.
- [ ] Existing playoff viewing / match management (submit, tech-loss, disqualify) still works.
- [ ] No dead code left from the removed start flow; `npm run type-check` and `npm run lint` pass.
