# Prompt for `dota-core-be`: league donations via Monobank ФОП acquiring

> Paste everything below this line into a Claude Code session opened in `dota-core-be`.
> The frontend side is already implemented in `CoreFrontend` (`TournamentStreamTab.vue`) and calls the
> endpoint described here. Nothing on the frontend needs to change if this contract is met.

---

Implement a public **donation** payment flow on the v1 API, reusing the Monobank ФОП acquiring rail that already
handles tournament entry fees. A visitor on a tournament page picks a preset amount (100 / 300 / 500 грн), the
frontend calls one endpoint, receives a Monobank hosted payment page URL, and opens it. Monobank settles the payment
through the existing signed callback.

## Read first

- `src/tournaments/tournament-payments.service.ts` — `createIntentForCaptain` is the reference implementation:
  find-or-create a row, reuse a live invoice, otherwise `acquiring.createInvoice(...)`, store `invoiceId` +
  `pageUrl`. `redirectUrlFor` / `apiOriginFrom` / `hasHost` show how both callback URLs are derived from request
  headers. Copy these patterns, do not invent new URL config.
- `src/tournaments/tournament-payment-callback.controller.ts` + `applyInvoiceCallback` — the callback receiver.
  It looks a payment up by `invoiceId`, then by `reference`.
- `src/tournaments/tournament-payment-transition.ts` — `nextPaymentState` is the pure status matrix
  (`PAID` is terminal; `failure|expired|reversed` clear the invoice and stay `PENDING`).
- `src/connectors/monobank-acquiring/*` — `createInvoice({ amount, reference, destination, redirectUrl, webHookUrl,
  validitySec })`. Amount is in **kopecks**.
- `.claude/plans/monobank-fop-acquiring.design.md` in the frontend repo for the original rail design and the
  raw-body signature trap.

## Contract the frontend already calls

```
POST /tournaments/:id/donations/intent
Body:     { "amount": number }          // kopecks, e.g. 10000 for 100 грн
200:      { "reference": string, "amount": number, "pageUrl": string | null }
```

- **No auth guard.** Anyone, logged in or not, may donate. The frontend axios interceptor hard-redirects on 401, so a
  `JwtAuthGuard` here would kick guests to the home page.
- `:id` is a tournament UUID (`ParseUUIDPipe`). 404 when the tournament does not exist.
- Validate `amount` with class-validator: integer, `>= 1000` (10 грн) and `<= 5_000_000` (50 000 грн). Reject anything
  else with 400 and a Ukrainian message, consistent with the existing DTO messages.
- `pageUrl` is `null` only when acquiring is not configured (`MONOBANK_MERCHANT_TOKEN` missing); the frontend shows
  «Сторінка оплати monobank не налаштована» in that case.
- Every call mints a **new** invoice. Donations have no natural key like team-per-tournament, so there is nothing to
  reuse; two clicks are two separate donations.

## Data model

New table `tournament_donation` (new entity + TypeORM migration, following `1789800000000-TournamentAcquiringInvoice.ts`
for style):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `tournamentId` | uuid FK → tournament | index |
| `reference` | varchar unique | reuse the `CORE-XXXXXX` generator pattern, but with a distinct prefix `DON-XXXXXX` so a callback can never be confused with an entry fee |
| `amount` | int | kopecks requested |
| `amountPaid` | int default 0 | kopecks settled |
| `status` | enum `PaymentStatus` | reuse the existing enum; `UNDERPAID` is never produced |
| `invoiceId` | varchar unique nullable | |
| `paymentPageUrl` | varchar nullable | |
| `donorPlayerId` | uuid nullable | set from the JWT **if** a valid bearer token is present; use an optional-auth approach, never a guard that rejects guests |
| `paidAt` | timestamptz nullable | |
| `createdAt` / `updatedAt` | timestamptz | |

Do not touch `tournament_team_payment`.

## Service

Create `src/tournaments/tournament-donations.service.ts`:

- `createIntent(tournamentId, amount, headers, donorPlayerId?)`:
  1. Load the tournament, 404 if missing. Donations are allowed in **any** tournament status, including `COMPLETED`.
  2. Generate a unique `DON-` reference, insert the row as `PENDING`.
  3. Derive `webHookUrl = ${apiOriginFrom(headers)}/webhook/monobank/acquiring` and
     `redirectUrl = ${spaOrigin}/tournaments/${tournamentId}` exactly as `TournamentPaymentsService` does, including
     the loud `InternalServerErrorException` when a host cannot be derived.
  4. `createInvoice` with `destination: \`Донат Core League — ${tournament.name}\``, `validitySec: 24 * 3600`.
  5. Store `invoiceId` + `pageUrl`, return the DTO.
- `applyInvoiceCallback(payload)`: same shape as the entry-fee one, driven by `nextPaymentState`. Reuse the function;
  it only needs `status`, `amountPaid`, `paidAt`, `invoiceId`, `paymentPageUrl` on the row.

## Callback routing

`TournamentPaymentCallbackController.receive` currently forwards every verified callback to
`TournamentPaymentsService.applyInvoiceCallback`, which logs an error when no `tournament_team_payment` matches.
Change the dispatch so one callback is routed by reference prefix / invoice lookup:

1. Try entry-fee payment by `invoiceId`, then by `reference`.
2. Else try donation by `invoiceId`, then by `reference`.
3. Else keep the existing unattributable `error` log and still answer 200.

Keep the controller answering 200 for anything with a valid signature. Do not add a second webhook URL; one receiver
for the whole acquiring merchant keeps the design's "no wrong-origin outage" property.

## Swagger

Annotate the controller method and a `TournamentDonationIntentDto` so `npm run api` on the frontend picks up
`/tournaments/{id}/donations/intent`. The frontend currently calls it through the untyped client and will switch to the
typed path once the schema regenerates.

## Tests (jest, existing suites are the template)

- DTO validation: rejects non-integer, below-min, above-max amounts.
- Intent: creates a row with a `DON-` reference, calls `createInvoice` with kopecks and the derived URLs, persists
  `invoiceId`/`pageUrl`; a second call creates a second row (no reuse).
- Callback dispatch: an entry-fee invoice still reaches `TournamentPaymentsService`; a donation invoice reaches the
  donations service; an unknown invoice logs and returns 200.
- Transition reuse: `success` → `PAID` with `amountPaid`, `failure|expired|reversed` → clears invoice, stays `PENDING`,
  callback after `PAID` is a no-op.

## Out of scope

Refunds, admin listing of donations, and receipts. Leave `UNDERPAID` untouched. Do not modify v2 or the finance
module.

## Done when

`npm run lint`, `npm run test`, and `npm run build` pass; the migration applies cleanly on an empty database and on the
current schema; `POST /tournaments/<uuid>/donations/intent` with `{ "amount": 10000 }` and **no** Authorization header
returns a `pageUrl` on `pay.mbnk.biz`.
