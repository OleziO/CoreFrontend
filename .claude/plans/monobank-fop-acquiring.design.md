# Design: Tournament Entry Fees via Monobank ФОП Acquiring

> Source: Requirement — entry-fee payments move off the Monobank jar ("банка") onto Monobank ФОП
> acquiring («plata by mono»). A captain pays by card on Monobank's hosted page; Monobank pushes a
> signed callback; the payment settles without anyone matching a transfer comment.
>
> Repos: frontend `/Users/olleyo/projects/CoreFrontend` (Vue 3 + TS + Pinia + Element Plus),
> backend `/Users/olleyo/projects/dota-core-be` (NestJS + TypeORM).
>
> **Supersedes** the payment-rail decisions in
> [`tournament-monobank-payment-gate.md`](./tournament-monobank-payment-gate.md), whose first
> architectural decision reads *"Payment model: Monobank jar + comment match. No acquiring/invoice
> API."* That is exactly what this design reverses. Everything that plan established **outside** the
> rail — the `tournament_team_payment` table, the `CORE-XXXXXX` reference, the decoupled pay-then-join
> two-step, the server-authoritative join gate, the admin mark-paid override, frontend polling —
> stays as it is.

## Context discovered during planning

### The rail being replaced

- Intent: `TournamentPaymentsService.createIntentForCaptain` mints a `CORE-XXXXXX` reference and
  returns a prefilled jar link built by `buildJarUrl` (`?a=<UAH>&t=<reference>`), falling back to
  `MONOBANK_JAR_URL` when the tournament has no `paymentJarUrl`.
- Settlement: Monobank statement push → `WebhookController` (v2) → `IngestionService` →
  `TournamentPaymentRepository.reconcileTransactions`, whose rule is
  `comment ILIKE '%' || reference || '%'` with `amount >= entryFee` ⇒ `PAID`, short ⇒ `UNDERPAID`.
- Frontend: `TournamentJoinPanel.vue` renders `<a :href="paymentJarUrl">`; `Tournament.vue` polls
  `GET /tournaments/:id/payments/me`.

### Deployment shape (decisive for where the webhook lives)

One repo, **two bootstraps**:

- **v1** — `src/entry-points/http/api-v1/main.ts` boots `AppModule`. Owns `TournamentsModule`, the
  `/tournaments/:id/payments/*` endpoints and the `tournament_team_payment` table. Runs a global
  `ValidationPipe` with `forbidNonWhitelisted: true`.
- **v2** — `src/entry-points/http/api-v2/main.ts` boots `HttpApiModule`. Owns `WebhookControllerModule`
  (the Monobank **statement** webhook), sync, and the finance domain.

They are separate public origins (`api.core-league-dota2.org` / `v2.core-league-dota2.org`). Today an
entry fee is *created* in v1 but *settled* in v2, which writes into the v1-owned table via raw SQL.
That cross-app coupling is why a webhook registered against the wrong origin once left every payment
stuck at `PENDING` with no visible error.

### Monobank acquiring API (verified against the live docs)

| Concern | Detail |
| --- | --- |
| Auth | `X-Token: <merchant token>` — a **different** token from `MONOBANK_TOKEN` (Personal API) |
| Create | `POST /api/merchant/invoice/create` → `{ invoiceId, pageUrl }` |
| Create body | `amount` (**kopecks**), `ccy` (980), `merchantPaymInfo{ reference, destination }`, `redirectUrl`, `webHookUrl`, `validity` (seconds), `paymentType` |
| Status | `GET /api/merchant/invoice/status?invoiceId=…` |
| Statuses | `created`, `processing`, `hold`, `success`, `failure`, `reversed`, `expired` |
| Callback | `POST` to the invoice's own `webHookUrl`; body mirrors the status payload and carries `reference` back |
| Retries | Up to **3** if the receiver does not answer `200` |
| Signature | `x-sign` header, base64 → verify **SHA256 over the raw request body** with ECDSA, signature in ASN.1 DER |
| Public key | `GET /api/merchant/pubkey` → `{ key }`, base64 x.509. Docs: *cache it; refetch only when verification stops working* |

Two consequences shape the whole design:

1. **`webHookUrl` is per invoice.** There is no registration call, no activation probe, and therefore
   no repeat of the wrong-origin outage. The callback can be pointed at whichever app created the
   invoice.
2. **`merchantPaymInfo.reference` round-trips.** The existing `CORE-XXXXXX` reference carries through
   untouched, so the table's natural key survives the rail change.

### What must survive

`ClassificationService` matches statement comments to **sponsors and prize-teams**, which has nothing
to do with entry fees. `MonobankService`, `IngestionService`, `/bank/sync` and the v2 statement
webhook all stay. Only the entry-fee reconciliation path leaves.

## Architectural decisions

- **Rail**: Monobank acquiring invoices. Full cutover — the jar rail is removed, not kept alongside.
- **Money model**: `paymentType: 'debit'`. The card is charged on success. **Refunds are out of scope**
  and stay manual in the Monobank cabinet, exactly as they are today. No `REFUNDED` state, no cancel
  endpoint. This is reversible later without redesign.
- **Placement**: a new connector `src/connectors/monobank-acquiring/` in **v1**, consumed by
  `TournamentsModule`, with the callback served by v1. Entry fees become self-contained in the app
  that owns the table, and the v1↔v2 raw-SQL reconciliation path for entry fees is deleted.
  Rejected: folding merchant calls into `MonobankService` (welds two tokens, two base paths and
  Personal-API rate-limit retry logic into a class shared with v2); and hosting acquiring in v2
  (preserves and deepens the coupling that already caused an outage).
- **URL derivation**: both callback URLs come from the request, but from **different parts of it**,
  because they address different origins:
  - `webHookUrl` → the **API** origin, from `x-forwarded-proto` / `x-forwarded-host` (falling back to
    `host`), following the existing `BankWebhookController.webhookUrlFor(req)` at
    `bank-webhook.controller.ts:95`. The intent request necessarily arrives at v1, which is exactly
    the app that must receive the callback.
  - `redirectUrl` → the **SPA** origin, from the request's `Origin` header (the browser sets it on the
    XHR from the frontend), validated against `CORS_ORIGINS` and falling back to its first entry.
    The API host is *not* usable here — sending the captain back to the API after paying would strand
    them on a JSON endpoint.

  No new URL env vars: `API_BASE_URL` addresses v1 and has already misfired once in exactly this role.
- **`UNDERPAID` is retired, not removed.** An invoice is for an exact amount, so partial payment
  ceases to exist. The enum value stays for historical rows; nothing produces it again.
- **`PAID` is terminal.** No callback, in any order, ever downgrades a paid row. Monobank retries and
  may deliver out of order; the transition function is the single place this is enforced.
- **Invoice reuse**: a payment row stores its live `invoiceId` and `pageUrl`. A repeat click returns
  the existing page rather than minting invoices per click. `failure` / `expired` / `reversed` clear
  both and leave the row `PENDING`, so the captain simply pays again.
- **Invoice validity**: `min(24h, time until registrationEndsAt)`, clamped to a floor of 15 minutes.
  An invoice must not outlive the window it is paying into. The floor only bites in the last quarter
  hour of registration, where `getRegistrationBlockReason` is about to close the door anyway.

## Data model

`tournament_team_payment` gains two nullable columns:

| Column | Type | Purpose |
| --- | --- | --- |
| `invoiceId` | `varchar`, unique, nullable | Monobank invoice; the callback's lookup key |
| `paymentPageUrl` | `varchar`, nullable | Hosted page for the live invoice, so repeat clicks reuse it |

`transactionId` stays (historical jar matches) and is no longer written. `PaymentStatus` is unchanged.

`tournament.paymentJarUrl` is **dropped**. This is the one irreversible step in the migration: `down()`
can re-create the column but not the links it held.

## Flow

1. Captain clicks «Оплатити внесок» → `POST /tournaments/:id/payments/intent`.
2. Existing guards run unchanged: joinable status (`isJoinableStatus`), registration window
   (`getRegistrationBlockReason`), captain-of-a-team, `entryFee > 0`.
3. Find-or-create the payment row and its reference. If a live `invoiceId` exists, return its
   `pageUrl`; otherwise create an invoice and store both.
4. Captain pays on Monobank's page, then returns via `redirectUrl` to the tournament page.
5. Monobank `POST`s the signed callback to v1.
6. v1 verifies `x-sign` over the raw body, maps the status, updates the row, answers `200`.
7. The already-running frontend poll sees `PAID` and unlocks Join.

### Callback handling

- Signature invalid ⇒ **403**, no state change.
- Signature valid ⇒ always **200**, so Monobank stops retrying, even when the payload matches no row
  (logged as a warning rather than retried forever).
- Status mapping lives in a **pure function** — `(currentRow, payload) => nextState` — so the whole
  matrix is unit-testable with no database:

| Callback status | Effect |
| --- | --- |
| `success` | `PAID`, `amountPaid = finalAmount ?? amount`, `paidAt = modifiedDate ?? now` |
| `failure`, `expired`, `reversed` | clear `invoiceId`/`paymentPageUrl`, stay `PENDING` |
| `created`, `processing`, `hold` | no-op |
| any, when the row is already `PAID` | no-op |

### The raw-body trap

Signature verification must run over the **exact bytes received**, not re-serialised JSON. v1's
bootstrap therefore needs `NestFactory.create(AppModule, { rawBody: true })` (supported on the
project's NestJS 11). Without it every signature fails in a way that looks like a bad key.

## Removals

| Item | Location |
| --- | --- |
| `buildJarUrl` + `jarUrl` on the intent DTO | `tournament-payments.service.ts`, `tournament-payment-intent.dto.ts` |
| `paymentJarUrl` column, entity field, create/update DTO fields | `tournaments.entity.ts`, tournament DTOs, migration |
| `MONOBANK_JAR_URL` | `types/entities/env.ts`, `.env.example` |
| `TournamentPaymentRepository` | `src/repos/tournament-payment.repository.ts` + `repos.module.ts` |
| Jar URL field in the admin drawer | `CreateTournamentDrawer.vue` |

**This reaches into v2.** `IngestionService` currently stores an unwatched-account transaction *only
if it reconciled an entry fee*, so its gate simplifies to `if (!watched) return;`. `SyncService` has
two `reconcileTransactions` call sites and `sync.dto.ts` reports the resulting counts; all come out
together. This is finance code outside the feature's natural boundary — unavoidable under a full
cutover, and called out here so it is reviewed rather than discovered.

## Frontend

- `TTournamentPaymentIntent.jarUrl` → `pageUrl`.
- `TournamentJoinPanel.vue`: the link target and its copy («відкриється сторінка оплати monobank»
  instead of «відкриється банка monobank»). The `UNDERPAID` branch stays for historical rows.
- `CreateTournamentDrawer.vue`: the jar URL field is removed.
- Polling is untouched — it already does the right thing.
- `schema.d.ts` is hand-maintained until the backend deploys; `npm run api` is owed afterwards.

## Config

| Variable | Change |
| --- | --- |
| `MONOBANK_MERCHANT_TOKEN` | **new**, required. Acquiring merchant token — not `MONOBANK_TOKEN` |
| `MONOBANK_JAR_URL` | removed |
| `MONOBANK_API_URL` | reused; acquiring shares the `api.monobank.ua` host |

## Testing

There is no test runner in the frontend; the backend runs jest (9 suites today).

- **Signature verification** against a fixture key/signature pair, including the negative case and the
  refetch-once-on-failure behaviour.
- **Transition function** — the full status matrix above, including out-of-order delivery and the
  `PAID`-is-terminal rule.
- **Invoice validity** — clamped to 24h, shortened by an imminent `registrationEndsAt`.
- **Intent reuse** — a second call with a live invoice returns the stored page rather than creating one.
- Frontend: `type-check` + `lint` only.

## Prerequisites and risks

1. **A merchant token is required and is not yet confirmed to exist.** Nothing can be tested end to
   end without one; Monobank issues a sandbox token for development. This is the one open item — it
   gates verification, not design.
2. **Dropping `paymentJarUrl` is irreversible.** Recorded as accepted under the full-cutover decision;
   the alternative (keep the column unused for one release) was considered and rejected.
3. **In-flight payments.** Rows sitting at `PENDING` when this ships get a fresh invoice on the
   captain's next visit. Anyone who already transferred into the jar is settled by the existing admin
   mark-paid endpoint, which is unchanged.
4. **Deploy order.** `dota-core-be` ships before `CoreFrontend`: v1 sets `forbidNonWhitelisted`, so a
   frontend that stops sending `paymentJarUrl` is safe, but one expecting `pageUrl` from an old
   backend is not.
