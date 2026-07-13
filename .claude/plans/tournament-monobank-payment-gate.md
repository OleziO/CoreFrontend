# Plan: Tournament Entry-Fee Payment Gate (Monobank jar)

> Source: Requirement — teams must pay a tournament entry fee before joining. A captain clicks a button, is sent to a Monobank jar ("банка") with a prefilled description, pays, the backend finds the matching record via Monobank's data and marks the team paid, and the frontend polls until the team is allowed to join.
>
> Repos: frontend `/Users/olleyo/projects/CoreFrontend` (Vue 3 + TS + Pinia + Element Plus), backend `/Users/olleyo/projects/dota-core-be` (NestJS + TypeORM).

## Context discovered during planning

- **Backend already has a full Monobank subsystem** and this feature bridges it to tournament registration — it does not build payments from scratch:
  - Monobank client `src/connectors/monobank/monobank.service.ts` (`getStatement`, `parseWebhookPayload`; `X-Token` from `MONOBANK_TOKEN`; amounts in **kopecks**).
  - Webhook receiver `src/controllers/webhook-controller/webhook.controller.ts` (`GET`/`POST /webhook/monobank`).
  - Ingestion `src/use-cases/ingestion/ingestion.service.ts` (filters to `MONOBANK_ACCOUNT_ID`, upserts a `transaction`, then classifies).
  - **Classification** `src/use-cases/classification/classification.service.ts` matches `tx.comment` to sponsors/prize-teams (`matchIn(...)`) — this is the exact hook to extend for entry-fee references.
  - Manual backfill `POST /bank/sync` / `POST /bank/sync/reclassify` (`src/controllers/sync-controller/sync.controller.ts`).
  - Config via zod `EnvSchema` (`src/types/entities/env.ts`, already has `MONOBANK_*`) read through `ConfigConnectorService.getEnvConfig()`.
- **Tournament join** is `POST /tournaments/:id/join` → `qualification.service.ts:joinTournament()`, which inserts into `tournament_team` via **raw SQL** (`INSERT ... ON CONFLICT DO NOTHING`, ~lines 336-347) inside a transaction. Captain = the `team.captain` player matching `req.user.playerId`.
- `tournament_team` is a **bare `@ManyToMany` join table with no columns**, and a team is not in it until it joins — so paid status cannot live there.
- **No entry-fee field exists** — `Tournament` only has `prizePool` (`src/tournaments/tournaments.entity.ts`).
- Migrations: **TypeORM**, raw SQL `up`/`down`; two dirs (`src/migrations/`, `src/db/migrations/`) — confirm which the CLI targets (`src/config/postgres-connection.ts` + `package.json`) before adding one. Copy pattern: `src/migrations/1781307401418-TeamVerificationBlockedUntil.ts`.
- Cron pattern (if ever needed): `src/tournaments/tournament-playoff.scheduler.ts` (`@Cron`, re-entrancy guard). **Not used in this plan.**

- **Frontend** join UX:
  - `src/views/tournaments/Tournament.vue` — `registerOnTeamTournament()` (~378-396) calls the service then reloads; gating computeds (`isMyTeamInThisTournament`, `showJoinPrimary`, `freeSlots`, `captainJoinContextOk`) ~297-343.
  - `src/views/tournaments/components/TournamentJoinPanel.vue` — Join/Leave/Steam-login buttons; emits `join`/`leave`.
  - Service `src/views/tournaments/tournaments.service.ts` (`joinTournament`, `leaveTournament`, `reloadTournament`); store `tournaments.store.ts`.
  - Types: `src/views/tournaments/tournaments.d.ts` (`TTournament`, `TTournamentTeam`); regenerate `src/api/types/schema.d.ts` via `npm run api` after backend OpenAPI changes.
  - Captain detection: user role `'Капітан'` (`PROFILE_CAPTAIN_ROLE_UA`, `src/components/tournaments-tags/tournament.constants.ts:145`) + `authStore.user?.teamId`.
  - External redirect pattern: service returns `{ url }` → `window.location.href` (`src/store/modules/auth.ts:42/67`). This feature uses `window.open` (new tab) instead so the page keeps polling.
  - Polling pattern: `useIntervalFn` (`TournamentQualificationTab.vue:193`). Pinia-Colada `refetchInterval` is available via `useQueryWrapper` but unused today.
  - Route: detail is name `'tournament'`, path `tournaments/:id` (`tournaments.route.ts`). No dedicated join route — the gate lives in-page.

## Architectural decisions

Durable decisions that apply across all phases:

- **Payment model**: Monobank **jar** + **comment match**. No acquiring/invoice API. Reuses the existing webhook + classification pipeline.
- **Entry fee**: new **`entryFee`** field (bigint **kopecks**, matching the finance subsystem) on the `Tournament` entity, set at tournament create/edit. `entryFee = 0` (or null) ⇒ **free ⇒ no payment gate**.
- **Storage**: new entity **`tournament_team_payment`**, keyed by `(tournamentId, teamId)`. Fields: `reference` (unique short code, e.g. `CORE-7F3K9Q`), `status` (`pending` | `underpaid` | `paid`), `amountPaid` (kopecks), `transactionId` (nullable link to matched `transaction`), `paidAt`, `createdAt`, `updatedAt`, optional `note`/`markedByAdminId` for manual overrides. The existing raw-SQL `tournament_team` join path is **not** modified.
- **Match rule**: a `transaction` counts toward a payment when its `comment` **contains the `reference`** AND `amount ≥ entryFee` ⇒ `paid`; reference present but `amount < entryFee` ⇒ `underpaid` (stays blocked). Amounts compared in kopecks.
- **Pay ⇄ Join relationship**: **decoupled, two-step**. A `paid` record only **unlocks** the Join button. Join still goes through `POST /tournaments/:id/join` with all existing eligibility checks (verification, division, free slots) at join time.
- **Join gate**: server-side authority — `joinTournament()` rejects when the tournament's `entryFee > 0` and the team has no `paid` payment record. FE mirrors the gate for UX but the backend enforces it.
- **Jar**: **single shared jar** URL from config (env), same for all tournaments; the per-registration `reference` disambiguates. Config must ensure the jar's Monobank account is covered by the statement/webhook the classifier reads (`MONOBANK_ACCOUNT_ID` coverage) — a config item, verified in Phase 3.
- **Reconciliation**: extend the existing **classification pipeline** (webhook = real-time primary path) + reuse manual `POST /bank/sync` reclassify for backfill/repair. **No new cron.**
- **Frontend redirect**: `window.open(jarUrl)` in a **new tab**; the tournament page stays mounted in a "Waiting for payment" state and **polls** the status endpoint (`useIntervalFn`), flipping to "Paid ✓ — you can now join" live.
- **Admin override**: an admin can force a team's payment to `paid` (offline/mis-commented payments), recorded with an audit note.
- **Refunds**: off-platform for this iteration. A `paid` record persists for that tournament; if the team can't join (full/ineligible) organizers handle money manually. No refund/void flow in code.
- **Permissions**: only the team **captain** can initiate/pay; others see read-only status. Free tournaments skip the gate entirely.
- **Language**: user-facing strings in Ukrainian, consistent with existing tournament UI. Type prefixes `T`/`I`/`E`, 2-space indent, `max-len` 120 (frontend ESLint). Regenerate API types with `npm run api` after backend schema changes.

---

## Phase 1: Entry fee + hard payment gate

**Scope**: Introduce the fee and the payment record, and enforce a server-side join gate — with an admin "mark paid" action as the only way to flip paid (no Monobank yet).

### What to build

End-to-end, an admin can create a tournament with an entry fee; a captain of a fee'd tournament is blocked from joining and sees a "payment required" state; an admin can mark that team as paid; the Join button then works. A free tournament (fee 0) joins directly as today.

- **Backend**
  - Add `entryFee` (kopecks) to the `Tournament` entity + create/edit DTOs + migration; expose it in the tournaments API responses.
  - Create the `tournament_team_payment` entity (fields per Architectural decisions) + migration; repository following the `tournament-playoff-team` entity/repository pattern.
  - Enforce the gate in `qualification.service.ts:joinTournament()`: if `entryFee > 0` and no `paid` payment for `(tournamentId, teamId)`, reject with a clear, typed error (distinct enough for the FE to map to a hint).
  - Admin-only endpoint to force `status = paid` on a `(tournamentId, teamId)` payment (creating the record if absent), recording `markedByAdminId`/`note`.
  - Include each team's payment status for the current tournament in the tournament detail payload (or a sibling endpoint) so the FE can gate.
- **Frontend**
  - `npm run api` to regenerate types; add `entryFee` display on the tournament (formatted ₴).
  - Admin create/edit tournament form: entry-fee input.
  - `TournamentJoinPanel.vue` / `Tournament.vue`: when the current captain's team is unpaid on a fee'd tournament, disable/replace the Join primary with a "Оплата потрібна" state; map the backend gate error in `joinFriendlyHintFromApi`.
  - Admin action (e.g. in the tournament teams list) to mark a team paid.

### Acceptance criteria

- [ ] `Tournament` has a persisted `entryFee` (kopecks); create/edit set it; API returns it; migration up/down clean.
- [ ] `tournament_team_payment` table exists with the specified columns and a unique `(tournamentId, teamId)` constraint; migration up/down clean.
- [ ] `POST /tournaments/:id/join` is rejected server-side for a captain whose team has `entryFee > 0` and no `paid` record; the rejection is a distinguishable typed error.
- [ ] A tournament with `entryFee = 0` (or null) joins with no gate, exactly as before.
- [ ] Admin force-paid endpoint flips status to `paid` (audit fields recorded) and afterwards the same team can join.
- [ ] FE shows the fee, shows a "payment required" state for unpaid captains, and enables Join once paid; non-captains are unaffected.

---

## Phase 2: Jar redirect + live polling

**Scope**: Captain-facing self-service payment — generate a reference, open the shared jar in a new tab with a prefilled comment, and poll status live. Confirmation still comes via the Phase-1 admin path (bank matcher lands in Phase 3).

### What to build

A captain on a fee'd tournament clicks "Оплатити внесок", a new tab opens the Monobank jar with the amount and a prefilled comment containing the unique reference, and the tournament page stays mounted showing "Очікуємо оплату… (ref `CORE-7F3K9Q`, ₴X)" while polling. When the payment becomes `paid` (in this phase, via an admin marking it), the panel flips to "Оплачено ✓" and unlocks Join — no page reload.

- **Backend**
  - Create/get payment-intent endpoint for the captain's team on a tournament: **idempotent** — returns the existing open `pending` record or creates one, yielding `{ reference, amount, jarUrl, status }`. `jarUrl` composed from the configured jar base + prefilled comment (reference) and amount where the jar URL scheme supports it.
  - Status endpoint returning the current `(tournamentId, teamId)` payment `{ status, reference, amountPaid }` for polling (captain-scoped).
  - Reference generation: collision-safe unique short code.
- **Frontend**
  - Service methods for create-intent and get-status; add a small `payments` slice or extend `tournaments.store.ts`.
  - "Оплатити внесок" button → call create-intent → `window.open(jarUrl, '_blank')` → enter "Waiting for payment" state.
  - Poll status with `useIntervalFn` (sensible interval, e.g. 3–5s; stop on `paid`/`underpaid`, on unmount, and after a max duration); reflect `pending`/`paid` live; on `paid`, reveal the Join primary.
  - Show reference + amount and a "Я вже оплатив / перевірити" manual re-check affordance.

### Acceptance criteria

- [ ] Create-intent is idempotent: repeated clicks return the same open reference, not duplicates.
- [ ] Clicking pay opens the jar in a new tab with the reference in the prefilled comment and the correct amount.
- [ ] The tournament page remains mounted and polls status without a full reload.
- [ ] When the payment flips to `paid` (admin-marked in this phase), the panel updates live to "paid" and unlocks Join; polling then stops.
- [ ] Polling stops on unmount and after a bounded max duration; no leaked intervals.
- [ ] Only the captain sees pay/poll controls; others see read-only status.

---

## Phase 3: Automatic Monobank reconciliation

**Scope**: Real payments confirm automatically — extend the classification pipeline to match open references against incoming transactions and flip status, removing the admin shortcut from the critical path.

### What to build

A real Monobank jar payment carrying the reference in its comment is pushed to the existing webhook, classified against open payment references, and the matching `tournament_team_payment` flips to `paid` (or `underpaid` if short) with `transactionId`/`amountPaid`/`paidAt` set — all visible to the polling frontend within seconds. Manual `POST /bank/sync` reclassify backfills any missed webhook.

- **Backend**
  - Extend `classification.service.ts` (alongside sponsor/prize-team matching): for each transaction, find an open payment whose `reference` is contained in `tx.comment`; if `amount ≥ entryFee` set `paid` (record `transactionId`, `amountPaid`, `paidAt`), else set `underpaid`. Idempotent and safe on reprocessing (reused by `reclassifyAll`).
  - Guard against double-matching / re-crediting a reference already `paid`.
  - Config: add the jar URL (and, if the jar is a separate account, its account id) to `EnvSchema`/config; ensure the classifier/ingestion sees jar-account transactions (`MONOBANK_ACCOUNT_ID` coverage). Update `.env.example`.
  - Confirm which migrations dir the CLI targets before shipping any Phase-3 migration.
- **Frontend**
  - No structural change; the existing poll now flips to `paid`/`underpaid` from real transactions. Surface `underpaid` distinctly if not already (leads into Phase 4).

### Acceptance criteria

- [ ] A transaction whose comment contains an open reference and whose amount ≥ fee flips that payment to `paid` with `transactionId`/`amountPaid`/`paidAt` set, via the webhook path, without admin action.
- [ ] A transaction with the reference but amount < fee sets `underpaid`, not `paid`, and the team stays blocked.
- [ ] Reprocessing the same transaction (e.g. via `reclassify`) does not double-credit or corrupt an already-`paid` record.
- [ ] Manual `POST /bank/sync` reclassify backfills a payment that was missed by the webhook.
- [ ] Jar URL / account config is read from config and documented in `.env.example`; jar-account transactions reach the classifier.
- [ ] The frontend poll from Phase 2 confirms a real payment end-to-end.

---

## Phase 4: Polish (optional / foldable)

**Scope**: Rough-edge UX and operability items; fold into 1–3 opportunistically or ship last.

### What to build

- `underpaid` state UX for the captain: show amount paid vs required and how to top up.
- Admin payments overview for a tournament (who paid, status, reference, matched transaction) with the manual mark-paid action surfaced there (audit note visible).
- Registration-window gating on the pay button (only during the tournament's registration period) and empty/error states.
- Copy pass on all Ukrainian strings; consistent ₴/kopeck formatting.

### Acceptance criteria

- [ ] Underpaid captains see a clear top-up prompt with paid/required amounts.
- [ ] Admins can view all teams' payment statuses for a tournament and mark paid from there with an audit note.
- [ ] Pay controls respect the registration window and free-tournament bypass.
- [ ] Currency formatting and Ukrainian copy are consistent across the flow.
