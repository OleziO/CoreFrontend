# Remove Divisions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the division concept entirely from the Dota Core league — backend and frontend, code and database — making every tournament open entry.

**Architecture:** Expand/contract across two independently-deployed repos. Phase 1 makes the backend accept a frontend that no longer sends `division` while deleting all division-based behaviour. Phase 2 strips division from the frontend. Phase 3 drops the field, the enum and the column. Each phase is deployable on its own; no phase breaks the other repo's currently-live version.

**Tech Stack:** NestJS + TypeORM + Postgres + Jest (`dota-core-be`); Vue 3 + TypeScript + Pinia + Element Plus + Vite (`CoreFrontend`).

**Spec:** [`.claude/plans/remove-divisions.design.md`](./remove-divisions.design.md)

## Global Constraints

- **Repos are separate checkouts.** `dota-core-be` at `/Users/olleyo/projects/dota-core-be`, `CoreFrontend` at `/Users/olleyo/projects/CoreFrontend`. Never edit one from the other's tasks.
- **Deploy order is mandatory:** Phase 1 → live → Phase 2 → live → Phase 3. `api-v1` runs `forbidNonWhitelisted: true` (`src/entry-points/http/api-v1/main.ts:51`), so any other order 400s admin tournament creation.
- **Branch:** `feat/remove-divisions`, branched off `feat/monobank-fop-acquiring` in **both** repos. That branch is the real trunk — FE `master` is 178 commits behind it and BE `main` 17 — so this work merges after the acquiring work does.
- **No test runner in `CoreFrontend`.** Frontend verification is `npm run lint` and `npm run type-check` only. Backend uses `npm test` (Jest).
- **Backend verification:** `npm run lint` and `npm test`.
- **Preserve Ukrainian/Russian user-facing copy.** New copy is written in Ukrainian, matching surrounding tone.
- **Naming:** frontend types use the `T`/`I`/`E` prefixes enforced by `@typescript-eslint/naming-convention`. `max-len` 120, 2-space indent.
- **Do not touch** `forecast_config`, `forecast-calculator.service.ts`, `ForecastCalculator.vue`, `finance.types.ts`. Their `divisions` is an unrelated financial-planning concept.
- **Do not run `npm run api`** until Task 13. The backend advertises `division` until Phase 3 ships.

---

# Phase 1 — Backend: neutralise

Deployable alone. Accepts both the current frontend (sends `division`) and the Phase 2 frontend (does not).

### Task 1: Extract the team-average helper before its host file dies

`computeTeamAvgRating` lives in `tournament-division.util.ts` but is not a division concept — it computes `team.avgRating`, shown on every team surface. It must survive the file's deletion in Task 11.

**Files:**
- Create: `src/teams/team-rating.util.ts`
- Create: `src/teams/team-rating.util.spec.ts`
- Modify: `src/tournaments/tournament-division.util.ts:51-57` (remove the function, import it instead)
- Modify: `src/teams/teams.service.ts:24-26` (import path)
- Modify: `src/qualification/qualification.service.ts:29` (import path)
- Modify: `src/tournaments/tournament-division.util.spec.ts:11-22` (remove the moved describe block)

**Interfaces:**
- Consumes: nothing.
- Produces: `computeTeamAvgRating(players: { rating: number }[]): number | null` from `src/teams/team-rating.util.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/teams/team-rating.util.spec.ts`:

```typescript
import { computeTeamAvgRating } from './team-rating.util';

const roster = (...ratings: number[]) => ratings.map((rating) => ({ rating }));

describe('computeTeamAvgRating', () => {
  it('returns null for an empty roster', () => {
    expect(computeTeamAvgRating([])).toBeNull();
  });

  it('averages the roster without rounding', () => {
    expect(computeTeamAvgRating(roster(1000, 2000, 3000, 4000, 5000))).toBe(
      3000,
    );
    expect(computeTeamAvgRating(roster(1, 2))).toBe(1.5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/olleyo/projects/dota-core-be && npx jest src/teams/team-rating.util.spec.ts
```

Expected: FAIL — `Cannot find module './team-rating.util'`.

- [ ] **Step 3: Create the new util**

Create `src/teams/team-rating.util.ts`:

```typescript
/** The roster's mean rating, unrounded. Null for an empty roster. */
export function computeTeamAvgRating(
  players: { rating: number }[],
): number | null {
  if (!players.length) return null;
  return players.reduce((sum, p) => sum + p.rating, 0) / players.length;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/olleyo/projects/dota-core-be && npx jest src/teams/team-rating.util.spec.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Point the old module at the new one**

In `src/tournaments/tournament-division.util.ts`, delete the `computeTeamAvgRating` function body (lines 51-57) and add at the top of the file, after the existing import:

```typescript
import { computeTeamAvgRating } from '../teams/team-rating.util';
```

The file still uses it internally in `isTeamEligibleForDivision`. Do **not** re-export it; update the two consumers instead (next step).

- [ ] **Step 6: Update the two consumers' import paths**

In `src/teams/teams.service.ts`, the import block at `:24-26` currently pulls both helpers from the division util. Split it so `computeTeamAvgRating` comes from the new module and `resolveTeamDivision` still comes from the old one:

```typescript
import { resolveTeamDivision } from '../tournaments/tournament-division.util';
import { computeTeamAvgRating } from './team-rating.util';
```

In `src/qualification/qualification.service.ts:27-31`, the same split:

```typescript
import {
  DIVISION_RULES,
  isTeamEligibleForDivision,
} from '../tournaments/tournament-division.util';
import { computeTeamAvgRating } from '../teams/team-rating.util';
```

- [ ] **Step 7: Remove the moved tests from the old spec**

In `src/tournaments/tournament-division.util.spec.ts`, delete the `describe('computeTeamAvgRating', ...)` block (lines 11-22) and drop `computeTeamAvgRating` from the import at line 3. The remaining `DIVISION_RULES`, `isTeamEligibleForDivision` and `resolveTeamDivision` blocks stay for now — they die in Task 11.

- [ ] **Step 8: Verify nothing broke**

```bash
cd /Users/olleyo/projects/dota-core-be && npm test && npm run lint
```

Expected: all suites PASS, lint clean.

- [ ] **Step 9: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add src/teams/team-rating.util.ts src/teams/team-rating.util.spec.ts \
  src/tournaments/tournament-division.util.ts \
  src/tournaments/tournament-division.util.spec.ts \
  src/teams/teams.service.ts src/qualification/qualification.service.ts
git commit -m "refactor: extract computeTeamAvgRating out of the division util

The team average is not a division concept — it powers team.avgRating on
every team surface and must outlive the division removal.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Open entry — delete the MMR join gate

The behavioural heart of the change. Removes division eligibility and substitute validation from joining, and extracts the surviving roster checks into a testable private method.

**Files:**
- Modify: `src/qualification/qualification.service.ts:262-302` (extract + drop division gate), `:669-690` (delete `divisionRejectionMessage`), `:708-745` (delete `validateSubstitute`), imports at `:22-31`
- Create: `src/qualification/qualification.service.roster.spec.ts`
- Delete: `src/qualification/qualification.service.substitute.spec.ts`

**Interfaces:**
- Consumes: nothing from Task 1 (the division util is still intact).
- Produces: private `validateRoster(main: Player[], reserved: Player[]): void` on `QualificationService`, throwing `BadRequestException`.

- [ ] **Step 1: Write the failing test**

Create `src/qualification/qualification.service.roster.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import type { Player } from '../players/player.entity';

/**
 * Roster rules that survive the division removal. Tournaments are open entry:
 * no team-average bound and no per-player MMR cap. The only roster rules left
 * are verification, a non-empty main roster, and the reserve count.
 */
describe('QualificationService.validateRoster', () => {
  type RosterSurface = {
    validateRoster(main: Player[], reserved: Player[]): void;
  };

  const service = new QualificationService(
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
  ) as unknown as RosterSurface;

  const player = (rating: number, verified = true): Player =>
    ({
      id: `p${rating}`,
      rating,
      verifiedAt: verified ? new Date() : null,
    }) as unknown as Player;

  const roster = (...ratings: number[]) => ratings.map((r) => player(r));

  it('accepts a roster that the old DIVISION_I cap would have rejected', () => {
    // avg 9000, every player far over the retired 5500 cap. Open entry.
    expect(() =>
      service.validateRoster(roster(9000, 9000, 9000, 9000, 9000), []),
    ).not.toThrow();
  });

  it('accepts a wildly mismatched roster — no average bound applies', () => {
    expect(() =>
      service.validateRoster(roster(100, 100, 100, 100, 12000), []),
    ).not.toThrow();
  });

  it('accepts any reserve regardless of rating', () => {
    expect(() =>
      service.validateRoster(roster(1000, 1000, 1000, 1000, 1000), [
        player(12000),
      ]),
    ).not.toThrow();
  });

  it('still rejects an empty main roster', () => {
    expect(() => service.validateRoster([], [])).toThrow(BadRequestException);
  });

  it('still rejects an unverified main player', () => {
    const main = [...roster(1000, 1000, 1000, 1000), player(1000, false)];
    expect(() => service.validateRoster(main, [])).toThrow(BadRequestException);
  });

  it('still rejects an unverified reserve', () => {
    expect(() =>
      service.validateRoster(roster(1000, 1000, 1000, 1000, 1000), [
        player(2000, false),
      ]),
    ).toThrow(BadRequestException);
  });

  it('still rejects more than three reserves', () => {
    expect(() =>
      service.validateRoster(roster(1000, 1000, 1000, 1000, 1000), [
        player(1000),
        player(1000),
        player(1000),
        player(1000),
      ]),
    ).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/olleyo/projects/dota-core-be && npx jest src/qualification/qualification.service.roster.spec.ts
```

Expected: FAIL — `service.validateRoster is not a function`.

- [ ] **Step 3: Extract the roster checks and drop the division gate**

In `src/qualification/qualification.service.ts`, replace the block at `:262-302` (from `const unverifiedMain = main.filter(...)` through the closing brace of the `for (const sub of reserved)` loop) with a single call:

```typescript
      this.validateRoster(main, team.reservedPlayers ?? []);
```

Then add the new private method next to the other private helpers (where `divisionRejectionMessage` used to sit, around `:669`):

```typescript
  /**
   * Roster rules for joining. Tournaments are open entry — there is no MMR
   * bound and no per-player cap, so rating never appears here.
   */
  private validateRoster(main: Player[], reserved: Player[]): void {
    const unverifiedMain = main.filter((p) => !p.verifiedAt);
    if (unverifiedMain.length > 0) {
      throw new BadRequestException(
        'Всі основні гравці повинні бути верифіковані',
      );
    }

    // An empty roster is checked separately: the all-players-verified check
    // above passes vacuously on an empty list.
    if (!main.length) {
      throw new BadRequestException('У складі команди немає основних гравців');
    }

    if (reserved.length > MAX_RESERVED_PLAYERS) {
      throw new BadRequestException(
        `Дозволено не більше ${MAX_RESERVED_PLAYERS} запасних гравців`,
      );
    }

    for (const sub of reserved) {
      if (!sub.verifiedAt) {
        throw new BadRequestException(
          `Запасний гравець ${sub.id} не верифікований`,
        );
      }
    }
  }
```

- [ ] **Step 4: Delete the two division-only helpers**

Delete `divisionRejectionMessage` (the whole method and its doc comment, `:669-690`) and `validateSubstitute` (the whole method and its long doc comment, `:708-745`).

- [ ] **Step 5: Clean up the now-unused imports**

In the import block at `:22-31`, remove `TournamentDivision` (keep `TournamentStatus` and `isJoinableStatus`), and delete the entire division-util import and the `computeTeamAvgRating` import — none are used any more:

```typescript
import {
  TournamentStatus,
  isJoinableStatus,
} from '../tournaments/tournaments.model';
```

**Keep `import { Player } from '../players/player.entity';` (`:16`).** It was used only by the deleted `validateSubstitute`, but the new `validateRoster` signature needs it — do not remove it as unused.

- [ ] **Step 6: Delete the obsolete substitute spec**

```bash
cd /Users/olleyo/projects/dota-core-be && git rm src/qualification/qualification.service.substitute.spec.ts
```

Its entire subject (`validateSubstitute`) no longer exists. It is deleted, not rewritten.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd /Users/olleyo/projects/dota-core-be && npm test && npm run lint
```

Expected: the new roster suite PASSES with 7 tests; no suite references `validateSubstitute`; lint clean.

- [ ] **Step 8: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add -A src/qualification/
git commit -m "feat: open entry — drop the division MMR gate from joining

Tournaments no longer restrict entry by team-average MMR or per-player
rating cap. The surviving roster rules (verification, non-empty main,
reserve count) move into a testable validateRoster method.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Point Discord team channels at a single category

**Files:**
- Modify: `src/discord/discord-bot.service.ts:12-16` (constants), `:95-100` (signature)
- Modify: `src/teams/teams.service.ts:137-180` (`onTeamVerified`)
- Modify: `src/admin/admin.service.ts:351-385` (`syncDiscord`)

**Interfaces:**
- Consumes: nothing.
- Produces: `createTeamVoiceChannel(teamName: string, teamRoleId: string): Promise<string | null>` on `DiscordBotService`, replacing `createDivisionVoiceChannel`.

- [ ] **Step 1: Replace the category map with a single constant**

In `src/discord/discord-bot.service.ts`, replace lines 12-16:

```typescript
const DIVISION_CATEGORY_IDS: Record<string, string> = {
  DIVISION_I: '1421318941875245129',
  DIVISION_II: '1476565539013922878',
  DIVISION_III: '1502067359542677625',
};
```

with:

```typescript
// Every team voice channel lands in this one category.
const TEAM_VOICE_CATEGORY_ID = '1421318941875245129';
```

- [ ] **Step 2: Rename the method and drop its division parameter**

Replace the signature and the category lookup at `:95-106`:

```typescript
  /** Creates the team's private voice channel. Returns the channel ID or null on failure. */
  async createTeamVoiceChannel(
    teamName: string,
    teamRoleId: string,
  ): Promise<string | null> {
    if (!this.ready()) return null;
    try {
```

Inside the request body, change `parent_id: categoryId` to:

```typescript
            parent_id: TEAM_VOICE_CATEGORY_ID,
```

Update the catch-block log message from `createDivisionVoiceChannel failed` to `createTeamVoiceChannel failed`. Everything else in the method — the name, the four permission overwrites, the role grants — is unchanged.

- [ ] **Step 3: Simplify `onTeamVerified`**

In `src/teams/teams.service.ts`, delete the opening five lines of `onTeamVerified` (`:138-144`, the `resolveTeamDivision` call and its `if (!division)` early return) so the method begins:

```typescript
  private async onTeamVerified(team: Team): Promise<void> {
    const roleId = await this.discord.createTeamRole(team.name);
    if (!roleId) return;

    const channelId = await this.discord.createTeamVoiceChannel(
      team.name,
      roleId,
    );
```

This also fixes a latent bug: a team whose division could not be resolved previously skipped Discord setup entirely — no role, no channel.

Update the closing log line (`:178`) to drop the division:

```typescript
    this.logger.log(
      `Discord setup complete for team ${team.id}: role=${roleId} channel=${channelId ?? 'null'}`,
    );
```

- [ ] **Step 4: Simplify `syncDiscord`**

In `src/admin/admin.service.ts`, delete the `resolveTeamDivision` call and its `if (!division)` skip block (`:352-360`), so the loop body opens directly with `let roleId = team.discordRoleId;`. Update the channel creation call (`:377`):

```typescript
        channelId = await this.discord.createTeamVoiceChannel(
          team.name,
          roleId,
        );
```

- [ ] **Step 5: Remove the now-unused imports**

Delete `import { resolveTeamDivision } from '../tournaments/tournament-division.util';` from `src/admin/admin.service.ts:19`. In `src/teams/teams.service.ts`, `resolveTeamDivision` is still used at `:778` for the team response payload — **leave that import in place**; it goes in Task 11.

- [ ] **Step 6: Verify**

```bash
cd /Users/olleyo/projects/dota-core-be && npm run build && npm test && npm run lint
```

Expected: build succeeds, all suites pass, lint clean.

```bash
grep -rn "createDivisionVoiceChannel\|DIVISION_CATEGORY_IDS" src/
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add src/discord/discord-bot.service.ts src/teams/teams.service.ts src/admin/admin.service.ts
git commit -m "refactor: file every team voice channel under one Discord category

Drops the per-division category routing. Also fixes teams with an
unresolvable division silently skipping Discord setup entirely.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Make `division` optional on the create DTO

The contract change that unblocks Phase 2. Tiny, but it must be deployed before the frontend stops sending the field.

**Files:**
- Modify: `src/tournaments/dto/create-tournament.dto.ts:37-45`

- [ ] **Step 1: Make the field optional**

Replace the `division` property block:

```typescript
  @ApiPropertyOptional({
    enum: TournamentDivision,
    enumName: 'TournamentDivision',
    deprecated: true,
    description:
      'Deprecated and ignored. Tournaments are open entry; this field is removed once the frontend stops sending it.',
  })
  @IsOptional()
  @IsEnum(TournamentDivision)
  division?: TournamentDivision;
```

Confirm `ApiPropertyOptional` and `IsOptional` are already imported — both are used by `entryFee` directly above, so no import change is needed.

- [ ] **Step 2: Verify both shapes are accepted**

```bash
cd /Users/olleyo/projects/dota-core-be && npm run build && npm run lint
```

Expected: clean.

Then, against a locally running backend, confirm a create payload **without** `division` is accepted and one **with** it is still accepted. Both must return 201.

- [ ] **Step 3: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add src/tournaments/dto/create-tournament.dto.ts
git commit -m "refactor: accept tournament creation without a division

Opens the window for the frontend to stop sending the field. The value is
already ignored; the field itself is removed in the contract step.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: DEPLOY PHASE 1**

Merge `feat/remove-divisions` into `master` on `dota-core-be` and deploy. **Phase 2 must not ship before this is live.** Verify in production that creating a tournament still works and that a verified team still receives its Discord channel.

---

# Phase 2 — Frontend: remove all division UI

Starts only after Phase 1 is live. Consumers are removed before definitions so `type-check` passes at every task boundary.

### Task 5: Remove division from cards, profiles and badges

**Files:**
- Modify: `src/components/TeamCard.vue`, `src/components/TournamentCard.vue`, `src/views/teams/components/TeamProfileCard.vue`, `src/views/tournaments/components/TournamentHeroSection.vue`, `src/views/admin-panel/components/TournamentRow.vue`, `src/views/tournaments/components/TournamentAdminTab.vue`, `src/views/tournaments/components/TournamentParcitipantsTab.vue`, `src/components/status/status.presets.ts:46,57`

- [ ] **Step 1: Strip the division badge from every display surface**

In each of the seven `.vue` files, remove the `<DivisionTag>` usage (and any wrapping element that exists only to hold it), the division-derived computed properties, and any now-unused imports from `tournament.constants`. Leave `avgRating` display untouched — it stays.

In `src/components/status/status.presets.ts`, remove `| 'division'` from the `TStatusPresetKey` union (`:46`) and the `division:` entry from `STATUS_PRESETS` (`:57`). If `PhShieldChevron` becomes unused, remove its import.

- [ ] **Step 2: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
```

Expected: both clean. Type-check catches any computed you removed that is still referenced in a template.

```bash
grep -rn -i "division" src/components/ src/views/teams/components/ src/views/admin-panel/components/TournamentRow.vue
```

Expected: hits only in `src/components/team-tags/DivisionTag.vue` and `src/components/tournaments-tags/tournament.constants.ts`, both of which die in Task 9.

- [ ] **Step 3: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/components/ src/views/teams/components/ src/views/tournaments/components/ src/views/admin-panel/components/
git commit -m "refactor: drop the division badge from every card and profile

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Remove division filtering

**Files:**
- Modify: `src/views/tournaments/modals/TournamentFilterModal.vue`, `src/views/teams/modals/TeamFilterModal.vue:70`, `src/views/tournaments/tournaments.enums.ts` (`DEFAULT_TOURNAMENT_FILTERS`), `src/views/tournaments/Tournaments.vue`, `src/views/teams/Teams.vue`

- [ ] **Step 1: Remove the filter controls and state**

In `TournamentFilterModal.vue`, delete the division checkbox/select group, its bound state and the division key in the emitted filter payload. Do the same for the `divisions` handling in `TeamFilterModal.vue:70`.

In `tournaments.enums.ts`, remove the `division: []` key from `DEFAULT_TOURNAMENT_FILTERS`:

```typescript
export const DEFAULT_TOURNAMENT_FILTERS = {
  status: [],
  type: []
}
```

In `Tournaments.vue` and `Teams.vue`, remove the division entries from the query-param assembly. A stale `?division=` in a bookmarked URL is simply ignored — no migration needed.

- [ ] **Step 2: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
```

Expected: both clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/views/tournaments/ src/views/teams/
git commit -m "refactor: remove division filters from tournaments and teams

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Remove the pre-payment and join gating

This is the frontend-only gate from `0a42149`. It exists nowhere else, so deleting it here is the whole removal.

**Files:**
- Modify: `src/views/tournaments/components/TournamentJoinPanel.vue:109-111,120,133`
- Modify: `src/views/tournaments/Tournament.vue` (`joinFriendlyHintFromApi`)

- [ ] **Step 1: Remove the block reason from the join panel**

In `TournamentJoinPanel.vue`:

- Delete the `<p v-if="divisionBlockReason">` element (`:109-111`) and change the sibling `<p v-else ...>{{ paymentStatusHint }}</p>` to an unconditional `<p>`.
- Remove `:disabled="!!divisionBlockReason"` from the pay button (`:120`) and from the join button (`:133`).
- Delete the `divisionBlockReason` prop/computed and any division imports.

- [ ] **Step 2: Remove the division branch from the join-error mapping**

In `Tournament.vue`, delete the division cases from `joinFriendlyHintFromApi` and the prop passing `divisionBlockReason` into `TournamentJoinPanel`. The backend no longer emits those errors as of Phase 1.

- [ ] **Step 3: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
grep -rn "divisionBlockReason" src/
```

Expected: type-check and lint clean; grep returns nothing.

- [ ] **Step 4: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/views/tournaments/
git commit -m "refactor: drop the division pre-payment and join gate

Tournaments are open entry, so the pay and join buttons are never blocked
on roster composition.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Clean the admin tournament drawers

**Files:**
- Modify: `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue:47-53,310-314,329-330,364,455,502,521,549,553`
- Modify: `src/views/admin-panel/components/drawers/UpdateTournamentDrawer.vue:54-64,146,153-154,163,213`

- [ ] **Step 1: Stop sending `division` on create**

In `CreateTournamentDrawer.vue`, delete: the `<el-form-item>` wrapping the division `<el-select>` (`:47-53`), the `divisionOptions` computed (`:329-330`), the `division` key in the form state (`:364`), its clause in `isFormValid` (`:455`), the two assignments in the prefill and reset handlers (`:502`, `:521`), the guard in the submit handler (`:549`), the `division` key in the submit payload (`:553`), and the three division imports (`:310-314`).

Phase 1 is live, so the backend accepts a payload without the field.

- [ ] **Step 2: Delete the dead `division_id` block on update**

In `UpdateTournamentDrawer.vue`, delete the division `<el-form-item>` (`:54-64`), the `division_id` field in the local type (`:146`), the `divisions` ref and its TODO comment (`:153-154`), the `division_id` default (`:163`), and simplify the `fields` filter (`:213`) — with `division_id` gone from `tournamentFields` in Task 9, the filter is no longer needed:

```typescript
const fields = tournamentFields
```

This block is dead code: it targets the retired numeric `division_id` model, its options array is a hardcoded empty ref, and the field is filtered out of rendering anyway.

- [ ] **Step 3: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
```

Expected: both clean.

- [ ] **Step 4: Manually confirm tournament creation**

With Phase 1 deployed, run `npm run dev`, open the admin panel, and create a tournament. Expected: 201, no `division` in the request payload, tournament appears in the list.

- [ ] **Step 5: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/views/admin-panel/
git commit -m "refactor: stop sending division from the admin tournament drawers

Also deletes the update drawer's dead division_id block, a vestige of the
retired numeric division model.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Delete the division definitions

Nothing consumes them now, so the definitions can go.

**Files:**
- Delete: `src/components/team-tags/DivisionTag.vue`
- Modify: `src/components/tournaments-tags/tournament.constants.ts` (remove the division block, ~62 refs)
- Modify: `src/views/tournaments/tournaments.enums.ts:5,42-48`
- Modify: `src/api/types/api.types.ts:6`

- [ ] **Step 1: Delete the component**

```bash
cd /Users/olleyo/projects/CoreFrontend && git rm src/components/team-tags/DivisionTag.vue
```

- [ ] **Step 2: Remove the division block from the constants**

In `src/components/tournaments-tags/tournament.constants.ts`, delete `DIVISION_RULES`, the division value arrays (`TOURNAMENT_DIVISION_VALUES`, `TOURNAMENT_DIVISION_CREATE_VALUES`), the legacy `DIVISION_3` alias map, `tournamentDivisionLabelMap`, the tooltip/description map, the badge-class map, the `TTournamentDivisionValue` type, and the long explanatory comments about tiers and boundaries. Keep every non-division export in the file.

- [ ] **Step 3: Remove the dead legacy array and field**

In `src/views/tournaments/tournaments.enums.ts`, delete the `divisions` array (`:42-48`) — a 5-entry vestige of the pre-enum model that nothing imports — and the `{ label: 'ID Дівізіону', model: 'division_id', ... }` entry from `tournamentFields` (`:5`).

- [ ] **Step 4: Drop the type re-export**

In `src/api/types/api.types.ts:6`, delete:

```typescript
export type TTournamentDivision = components['schemas']['TournamentDivision']
```

- [ ] **Step 5: Verify the frontend is division-free**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
grep -rn -i "division" src/ --include="*.ts" --include="*.vue" | grep -v "schema.d.ts" | grep -v "schema-v2.d.ts" | grep -v finance
```

Expected: type-check and lint clean. Grep returns **nothing** — the only remaining hits repo-wide are the generated schema files (regenerated in Task 13) and the out-of-scope finance forecast.

- [ ] **Step 6: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add -A src/components/ src/views/tournaments/tournaments.enums.ts src/api/types/api.types.ts
git commit -m "refactor: delete DivisionTag and the division rule tables

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Rewrite the user-facing copy

**Files:**
- Modify: `src/views/main/Main.vue:440-441` (feature card), `:520-521` (FAQ entry), `:533` (stale payment sentence)

- [ ] **Step 1: Replace the feature card**

The `features` array holds exactly four items rendered as a grid, so this entry is replaced, not deleted. At `:439-442`:

```javascript
  {
    icon: PhShieldStar,
    title: 'Турніри для всіх рівнів',
    description: 'Відкрита реєстрація — будь-яка верифікована команда може заявитися на турнір.'
  },
```

- [ ] **Step 2: Delete the divisions FAQ entry**

Delete the whole `{ q: 'Які є дивізіони і який рівень MMR потрібен?', a: '...' }` object (`:519-522`), including its trailing comma.

- [ ] **Step 3: Fix the stale payment instruction**

At `:533`, the answer ends with «Капітан оплачує внесок одним платежем не пізніше ніж за 2 дні до Play-off, вказавши в коментарі назву команди та дивізіон.» That instruction is stale independently of divisions: `0dc0c93` removed the Monobank jar rail, and entry fees now run on acquiring invoices confirmed by webhook, so there is no payment comment to fill in. Replace that final sentence with:

```
Капітан оплачує внесок одним платежем не пізніше ніж за 2 дні до Play-off — кнопкою «Оплатити внесок» на сторінці турніру, через сторінку оплати monobank. Зарахування відбувається автоматично.
```

- [ ] **Step 4: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
grep -rn -i "дивізіон" src/views/main/Main.vue
```

Expected: clean; grep returns nothing.

- [ ] **Step 5: Review the rendered page**

Run `npm run dev`, open the main page, and confirm the feature grid still shows four cards and the FAQ reads correctly with the entry removed.

- [ ] **Step 6: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/views/main/Main.vue
git commit -m "docs: rewrite division copy and fix the stale payment instruction

Entry fees moved to acquiring invoices in 0dc0c93, so the jar payment
comment instruction no longer applied.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: DEPLOY PHASE 2**

Merge and deploy `CoreFrontend`. **Phase 3 must not ship before this is live.** Verify in production: tournaments list, team profiles, admin tournament creation, and the join/pay flow.

---

# Phase 3 — Backend: contract

Starts only after Phase 2 is live and no client sends or reads `division`.

### Task 11: Remove the field, the enum and the util

**Files:**
- Modify: `src/tournaments/dto/create-tournament.dto.ts` (remove `division`), `src/teams/dto/team-response.dto.ts:93-94`, `src/tournaments/tournaments.model.ts:25-29`, `src/tournaments/tournaments.entity.ts:27-28`, `src/teams/teams.service.ts:778`
- Delete: `src/tournaments/tournament-division.util.ts`, `src/tournaments/tournament-division.util.spec.ts`

- [ ] **Step 1: Remove the field from both DTOs**

In `create-tournament.dto.ts`, delete the whole `division` property block added in Task 4, plus the `TournamentDivision` import. In `team-response.dto.ts`, delete the `@ApiPropertyOptional` decorator and the `division` property (`:93-94`) and the `TournamentDivision` import (`:3`).

- [ ] **Step 2: Remove the response mapping**

In `src/teams/teams.service.ts`, delete `division: resolveTeamDivision(team.mainPlayers ?? []),` (`:778`) and the `resolveTeamDivision` import. `avgRating` on the next line stays.

- [ ] **Step 3: Remove the enum and the column**

Delete the `TournamentDivision` enum from `src/tournaments/tournaments.model.ts:25-29`. In `src/tournaments/tournaments.entity.ts`, delete the `division` column (`:27-28`) and drop `TournamentDivision` from the import at `:8`.

- [ ] **Step 4: Delete the util and its spec**

```bash
cd /Users/olleyo/projects/dota-core-be
git rm src/tournaments/tournament-division.util.ts src/tournaments/tournament-division.util.spec.ts
```

The avg-rating function and its tests already moved to `src/teams/team-rating.util.ts` in Task 1.

- [ ] **Step 5: Verify the backend is division-free**

```bash
cd /Users/olleyo/projects/dota-core-be && npm run build && npm test && npm run lint
grep -rn -i "division" src/ --include="*.ts" | grep -v forecast
```

Expected: build, tests and lint all clean. Grep returns only the forecast files (out of scope) and the historical `CREATE TYPE` line in `src/migrations/1780358677674-InitialSchema.ts`, which must never be edited — past migrations are immutable.

- [ ] **Step 6: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add -A src/
git commit -m "refactor: remove the division field, enum and rule table

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Drop the column and the enum type

Kept as a standalone destructive migration, matching the precedent in `0dc0c93` so it can be deployed and reviewed on its own.

**Files:**
- Create: `src/migrations/<timestamp>-DropTournamentDivision.ts`

- [ ] **Step 1: Generate the migration file**

```bash
cd /Users/olleyo/projects/dota-core-be
npm run migration:create -- src/migrations/DropTournamentDivision
```

This is the **v1** data source (`src/data-source.ts` → `src/migrations/`), because `tournament` is a v1 table. Do not use the `:v2` variants.

- [ ] **Step 2: Write the migration**

Replace the generated file's body, keeping the generated class name and timestamp:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Destructive: drops the tournament division column and its enum type. Kept
 * standalone so it can be reviewed and deployed on its own. The down() path
 * restores the schema but cannot restore the values — the recreated column is
 * null for every existing row.
 */
export class DropTournamentDivision<TIMESTAMP> implements MigrationInterface {
  name = 'DropTournamentDivision<TIMESTAMP>';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament" DROP COLUMN "division"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tournament_division_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tournament_division_enum" AS ENUM('DIVISION_I', 'DIVISION_II', 'DIVISION_III')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament" ADD "division" "public"."tournament_division_enum"`,
    );
  }
}
```

Replace `<TIMESTAMP>` in both the class name and the `name` field with the timestamp the generator produced.

- [ ] **Step 3: Test the migration both ways against a local database**

```bash
cd /Users/olleyo/projects/dota-core-be
npm run migration:run
npm run migration:revert
npm run migration:run
```

Expected: `up` drops cleanly, `revert` recreates the column and type, and re-running `up` drops it again. Confirm after `up`:

```sql
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'tournament' AND column_name = 'division';
-- expect zero rows
SELECT 1 FROM pg_type WHERE typname = 'tournament_division_enum';
-- expect zero rows
```

- [ ] **Step 4: Commit**

```bash
cd /Users/olleyo/projects/dota-core-be
git add src/migrations/
git commit -m "feat: drop the tournament division column and enum type

Destructive and irreversible in data terms: down() restores the schema but
not the values. Kept standalone per the 0dc0c93 precedent.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: DEPLOY PHASE 3**

Merge and deploy `dota-core-be`, then run `npm run migration:run:prod`. Verify tournament creation, team payloads and the join flow in production.

---

### Task 13: Regenerate the frontend API types

**Files:**
- Modify: `src/api/types/schema.d.ts` (generated)

- [ ] **Step 1: Regenerate against the deployed backend**

With Phase 3 live:

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run api
```

- [ ] **Step 2: Confirm the schema is division-free**

```bash
cd /Users/olleyo/projects/CoreFrontend
grep -n -i "division" src/api/types/schema.d.ts
```

Expected: no output. If `TournamentDivision` still appears, Phase 3 is not actually deployed — stop and check.

- [ ] **Step 3: Verify**

```bash
cd /Users/olleyo/projects/CoreFrontend && npm run type-check && npm run lint
```

Expected: both clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/olleyo/projects/CoreFrontend
git add src/api/types/schema.d.ts
git commit -m "chore: regenerate API types after the division removal

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Rollback

- **Phases 1-2** are pure code — revert the merge and redeploy.
- **After Task 12** the column is gone. `down()` restores the schema but every value is null; division data is not recoverable. Take a database snapshot before running the production migration.
