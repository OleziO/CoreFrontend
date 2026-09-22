# Design: remove divisions

**Date:** 2026-09-22
**Repos:** `dota-core-be` (backend), `CoreFrontend` (frontend)
**Status:** approved design, pending implementation plan

## Goal

Remove the division concept from the league entirely — backend and frontend, code
and database. Tournaments become **open entry**: any verified team meeting the
existing non-division rules (captain, verified players, roster size, paid entry
fee) may join any tournament.

## Background

Divisions have churned three times: three tiers → two (`bd2f6f5`, PR #16/#17) →
back to three (`302cf12`, PR #18, 2026-07-16). The current model is three tiers
defined in `tournament-division.util.ts`:

| Enum | Label | Team AVG MMR | Per-player cap |
|---|---|---|---|
| `DIVISION_I` | Початковий | 0–3 500 | 5 500 |
| `DIVISION_II` | Любительський | 0–7 000 | — |
| `DIVISION_III` | Аматорський | 7 000+ | — |

Divisions currently do four jobs. All four are removed:

1. **Join eligibility** — team AVG bounds + per-player rating cap
   (`qualification.service.ts:277`)
2. **Substitute validation** — a reserve may not push the roster out of the
   division (`validateSubstitute:708`)
3. **Pre-payment gate** — payment and join buttons disabled while the roster does
   not match the tournament's division. This is **frontend-only** UX gating
   (`0a42149` touches no backend file); the backend's sole authority is the join
   gate above. Removed as part of step 2, not step 1.
4. **Discord routing** — team voice channel parented to a division category
   (`discord-bot.service.ts:12`)

## Decisions

| Question | Decision |
|---|---|
| What replaces the MMR join gate? | **Nothing — open entry.** No MMR restriction on joining. |
| Finance forecast `divisions` (jsonb buckets)? | **Out of scope.** Unrelated financial-planning concept that shares the name. `forecast_config`, `ForecastCalculator.vue` and `finance.types.ts` are untouched. |
| Where do Discord team channels go? | **One category**, ID `1421318941875245129` (the former Division I category, renamed manually in Discord). |
| Rollout across two repos? | **Expand/contract, three steps**, including the destructive migration. |
| Divisions FAQ entry? | **Deleted outright.** |
| Stale jar-comment payment copy? | **Fixed in this change.** |

## Why expand/contract is mandatory

`api-v1` runs `forbidNonWhitelisted: true`
(`src/entry-points/http/api-v1/main.ts:51`) and `CreateTournamentDto.division`
is currently **required** (`@IsEnum`, no `@IsOptional`). A naive two-repo swap
breaks admin tournament creation in *either* order:

- **BE first** → FE still sends `division` → `400 property division should not exist`
- **FE first** → BE still requires it → `400 division must be a valid enum value`

Making the field optional first opens a window in which both the old and new
frontend are valid. This follows the precedent in `0dc0c93`, which split the
additive invoice migration from the destructive column drop
"so each can be deployed and reviewed on its own."

## What must survive

Two things live inside division code but are not division concepts. Both must be
preserved, not deleted with the surrounding file:

- **`computeTeamAvgRating`** (`tournament-division.util.ts:51`) computes
  `team.avgRating` (`teams.service.ts:779`), displayed on every team surface
  since `009b95a`. Extract to `src/teams/team-rating.util.ts`, moving its tests
  out of `tournament-division.util.spec.ts` with it.
- **Team Discord role + private voice channel.** Only `parent_id` was
  division-derived. Channel naming, permission overwrites, the team role and the
  staff/moderator grants are all division-independent and stay as they are.

## Step 1 — BE: neutralise

Non-breaking in both directions; deployable on its own. Accepts a frontend that
sends `division` and one that does not.

- `tournaments/dto/create-tournament.dto.ts:44` — add `@IsOptional()`. The field
  is still accepted but no longer used.
- `qualification/qualification.service.ts` — delete the division eligibility gate
  (`:277-284`), the substitute division check (`:298-300`), `validateSubstitute`
  (`:708`) and `divisionRejectionMessage` (`:669`). **This is the behavioural
  change: open entry.**
- `discord/discord-bot.service.ts` — replace the `DIVISION_CATEGORY_IDS` record
  with a single `TEAM_VOICE_CATEGORY_ID = '1421318941875245129'` constant
  (hardcoded, matching the neighbouring `STAFF_FULL_ACCESS_ROLE_ID` and
  `VIEW_JOIN_ROLE_IDS`). Rename `createDivisionVoiceChannel` →
  `createTeamVoiceChannel` and drop its `division` parameter.
- `teams/teams.service.ts:138-151` and `admin/admin.service.ts:352-379` — drop
  the `resolveTeamDivision` call and the "no determinable division — skipping
  Discord setup" bail-out. A verified team now always gets its channel. This
  also fixes a latent bug: a team with an empty roster currently skips Discord
  setup entirely rather than just skipping the category.
- Extract `computeTeamAvgRating` to `teams/team-rating.util.ts`; split the spec.

At the end of step 1 the division column still exists and is still written on
create, but influences nothing.

## Step 2 — FE: remove all division UI

Deployable once step 1 is live.

**Deletions**

- `components/team-tags/DivisionTag.vue` — delete.
- `components/tournaments-tags/tournament.constants.ts` — remove the division
  block (62 refs): `DIVISION_RULES`, `TOURNAMENT_DIVISION_*` value lists, and the
  label / tooltip / badge-class maps.
- `views/tournaments/tournaments.enums.ts:42` — delete the dead 5-entry
  `divisions` array (vestige of the pre-enum model; nothing imports it).
- `views/admin-panel/components/drawers/UpdateTournamentDrawer.vue` — delete the
  `division_id` block entirely. It is dead code: it targets the old numeric
  model, its `divisions` ref is a hardcoded empty array with a TODO, and
  `division_id` is explicitly filtered out of the rendered fields at `:213`.

**Stop sending the field**

- `views/admin-panel/components/drawers/CreateTournamentDrawer.vue` — remove the
  selector, `divisionOptions`, the form field and the create payload key.

**Remove display and filtering**

- Filters: `views/tournaments/modals/TournamentFilterModal.vue`,
  `views/teams/modals/TeamFilterModal.vue`, and `division` in
  `DEFAULT_TOURNAMENT_FILTERS`. Stale `?division=` query params are simply
  ignored.
- Cards and profiles: `components/TeamCard.vue`, `components/TournamentCard.vue`,
  `views/teams/components/TeamProfileCard.vue`,
  `views/tournaments/components/TournamentHeroSection.vue`,
  `views/admin-panel/components/TournamentRow.vue`,
  `views/tournaments/components/TournamentAdminTab.vue`,
  `views/tournaments/components/TournamentParcitipantsTab.vue`.
- `views/tournaments/components/TournamentJoinPanel.vue` — remove
  `divisionBlockReason`, its payment-blocked message (`:110`) and the two
  `:disabled="!!divisionBlockReason"` bindings on the pay (`:120`) and join
  (`:133`) buttons. This is the pre-payment gate from `0a42149`; it exists only
  here, so deleting it is the whole removal.
- `components/status/status.presets.ts` — remove the `division` preset (`:57`)
  and the `'division'` member of the `TStatusPresetKey` union (`:46`).
- `views/tournaments/Tournament.vue` — remove the division rejection-hint mapping
  in `joinFriendlyHintFromApi`.
- `api/types/api.types.ts` — drop the `TTournamentDivision` re-export.

**Copy (`views/main/Main.vue`)**

- `:440` feature card — replace, do not delete; the grid holds exactly four
  items. «Структуровані дивізіони» → **«Турніри для всіх рівнів»**, description
  → «Відкрита реєстрація — будь-яка верифікована команда може заявитися на
  турнір.»
- `:520` FAQ «Які є дивізіони і який рівень MMR потрібен?» — delete the entry.
- `:533` FAQ payment answer — remove «вказавши в коментарі назву команди та
  дивізіон». This sentence is stale independently of divisions: `0dc0c93`
  removed the Monobank jar rail, and entry fees now run on acquiring invoices
  with webhook confirmation, so there is no payment comment to fill in.

`npm run api` is **not** run in this step — the backend still advertises
`division` until step 3.

## Step 3 — BE: contract

Deployable once step 2 is live.

- `tournaments/dto/create-tournament.dto.ts` — remove the `division` field.
- `teams/dto/team-response.dto.ts:93` — remove `division` from the team payload.
- `tournaments/tournaments.model.ts:25` — delete the `TournamentDivision` enum.
- `tournaments/tournaments.entity.ts:27` — remove the `division` column.
- Delete `tournaments/tournament-division.util.ts` and its spec (the avg-rating
  parts already moved in step 1).
- **Standalone destructive migration**, kept separate from any other change per
  the `0dc0c93` precedent:
  `ALTER TABLE "tournament" DROP COLUMN "division"` and
  `DROP TYPE "public"."tournament_division_enum"`.

Afterwards, run `npm run api` in `CoreFrontend` to regenerate
`src/api/types/schema.d.ts` and confirm no `DIVISION_*` remains.

## Data loss

Dropping `tournament.division` discards the recorded division of every past
tournament. This is intended and irreversible once the migration runs. The
`down()` migration can recreate the column and enum type but cannot restore
values. Historical tournaments keep their names, brackets, results and payments.

## Testing

No test runner is configured in `CoreFrontend`; verification there is
`npm run lint` and `npm run type-check`.

On the backend:

- Update `qualification.service.substitute.spec.ts` — the division-based
  substitute cases are deleted, not rewritten.
- `tournament-division.util.spec.ts` — the `computeTeamAvgRating` describe block
  moves to `team-rating.util.spec.ts`; the rest is deleted.
- Add a regression test asserting a high-MMR roster can join a tournament that
  would previously have been rejected, pinning open entry.

## Out of scope

- `forecast_config.divisions`, `forecast-calculator.service.ts`,
  `ForecastCalculator.vue`, `finance.types.ts` — separate financial-planning
  concept, untouched.
- Renaming or merging Discord categories in the guild itself — a manual admin
  task, done outside the codebase.
- Any change to how `avgRating` is computed or displayed.
