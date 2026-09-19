# Monobank ФОП Acquiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move tournament entry fees off the Monobank jar onto Monobank ФОП acquiring — the captain pays by card on Monobank's hosted page and a signed per-invoice callback settles the payment, replacing statement comment-matching.

**Architecture:** A new `monobank-acquiring` connector in the **v1** app (which owns `tournament_team_payment`) creates invoices and serves their callback. All decision logic — signature verification, status transitions, invoice validity — lives in pure functions tested without a database or network. The v2 statement pipeline keeps running for sponsors and prize-teams; only the entry-fee reconciliation path is deleted.

**Tech Stack:** NestJS 11 + TypeORM + zod + jest (backend); Vue 3 + TS + Pinia + Element Plus (frontend). Node `crypto` for ECDSA verification. No new dependencies.

**Spec:** [`.claude/plans/monobank-fop-acquiring.design.md`](./monobank-fop-acquiring.design.md)

## Global Constraints

- Amounts are **kopecks** everywhere, integers. `ccy` is `980` (UAH).
- Backend lint is prettier-enforced; run `npx eslint --fix <file>` before committing or CI fails.
- Type-name prefixes are mandatory: interfaces `I`, type aliases `T`, enums `E`.
- Ukrainian user-facing strings and comments are preserved as-is; new user-facing errors are Ukrainian.
- v1 runs `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — any new request field must be on a DTO or the request 400s.
- Backend tests: `npx jest` from `/Users/olleyo/projects/dota-core-be`. Frontend has **no test runner** — verification is `npm run type-check` and `npx eslint`.
- Deploy order is always `dota-core-be` before `CoreFrontend`.
- Backend repo: `/Users/olleyo/projects/dota-core-be`. Frontend repo: `/Users/olleyo/projects/CoreFrontend`.

## File Structure

**Backend — created**

| File | Responsibility |
| --- | --- |
| `src/connectors/monobank-acquiring/monobank-acquiring.signature.ts` | Pure ECDSA webhook signature verification |
| `src/connectors/monobank-acquiring/monobank-acquiring.signature.spec.ts` | Its tests |
| `src/connectors/monobank-acquiring/monobank-acquiring.types.ts` | Invoice status union, callback payload zod schema |
| `src/connectors/monobank-acquiring/monobank-acquiring.service.ts` | HTTP client: create invoice, status, cached pubkey, verify |
| `src/connectors/monobank-acquiring/monobank-acquiring.service.spec.ts` | Its tests (mocked HTTP) |
| `src/connectors/monobank-acquiring/monobank-acquiring.module.ts` | DynamicModule wiring the HTTP client to the merchant base URL |
| `src/tournaments/tournament-payment-transition.ts` | Pure `nextPaymentState` — the callback status matrix |
| `src/tournaments/tournament-payment-transition.spec.ts` | Its tests |
| `src/tournaments/invoice-validity.ts` | Pure `invoiceValiditySeconds` |
| `src/tournaments/invoice-validity.spec.ts` | Its tests |
| `src/tournaments/tournament-payment-callback.controller.ts` | `POST /webhook/monobank/acquiring` on v1 |
| `src/tournaments/request-origin.util.ts` | Derives API origin and SPA origin from a request |
| `src/tournaments/request-origin.util.spec.ts` | Its tests |
| `src/migrations/<ts>-TournamentAcquiringInvoice.ts` | Adds invoice columns, drops `paymentJarUrl` |

**Backend — modified**

`src/types/entities/env.ts`, `.env.example`, `src/app.module.ts`, `src/tournaments/tournaments.module.ts`, `src/tournaments/tournament-team-payment.entity.ts`, `src/tournaments/tournaments.entity.ts`, `src/tournaments/dto/tournament-payment-intent.dto.ts`, `src/tournaments/dto/create-tournament.dto.ts`, `src/tournaments/tournament-payments.service.ts`, `src/tournaments/tournaments.controller.ts`, `src/entry-points/http/api-v1/main.ts`, `src/use-cases/ingestion/ingestion.service.ts`, `src/use-cases/sync/sync.service.ts`, `src/controllers/sync-controller/sync.dto.ts`, `src/repos/repos.module.ts`

**Backend — deleted:** `src/repos/tournament-payment.repository.ts`

**Frontend — modified**

`src/views/tournaments/tournaments.d.ts`, `src/views/tournaments/components/TournamentJoinPanel.vue`, `src/views/tournaments/Tournament.vue`, `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue`, `src/api/types/schema.d.ts`

---

### Task 1: Webhook signature verification

The riskiest piece, built first so nothing downstream is blocked by it. Monobank documents the key as "Base64-encoded x.509" — community implementations decode that to **either** a PEM block or raw DER, so this accepts both rather than guessing.

**Files:**
- Create: `src/connectors/monobank-acquiring/monobank-acquiring.signature.ts`
- Test: `src/connectors/monobank-acquiring/monobank-acquiring.signature.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `verifyWebhookSignature(rawBody: Buffer, signatureB64: string, publicKeyB64: string): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { generateKeyPairSync, createSign } from 'node:crypto';
import { verifyWebhookSignature } from './monobank-acquiring.signature';

/** Monobank signs with ECDSA/SHA256 and sends an ASN.1 DER signature, base64-encoded. */
describe('verifyWebhookSignature', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  const body = Buffer.from('{"invoiceId":"inv_1","status":"success"}', 'utf8');

  const sign = (payload: Buffer): string =>
    createSign('SHA256').update(payload).sign(privateKey).toString('base64');

  /** The key as Monobank may send it: base64 of a PEM block. */
  const pemB64 = Buffer.from(
    publicKey.export({ type: 'spki', format: 'pem' }) as string,
    'utf8',
  ).toString('base64');

  /** The key as Monobank may equally send it: base64 of raw DER. */
  const derB64 = (
    publicKey.export({ type: 'spki', format: 'der' }) as Buffer
  ).toString('base64');

  it('accepts a valid signature when the key arrives base64-PEM', () => {
    expect(verifyWebhookSignature(body, sign(body), pemB64)).toBe(true);
  });

  it('accepts a valid signature when the key arrives base64-DER', () => {
    expect(verifyWebhookSignature(body, sign(body), derB64)).toBe(true);
  });

  it('rejects a signature made over different bytes', () => {
    const other = Buffer.from('{"invoiceId":"inv_1","status":"failure"}');
    expect(verifyWebhookSignature(body, sign(other), pemB64)).toBe(false);
  });

  it('rejects a signature from a different key', () => {
    const stranger = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const foreign = createSign('SHA256')
      .update(body)
      .sign(stranger.privateKey)
      .toString('base64');
    expect(verifyWebhookSignature(body, foreign, pemB64)).toBe(false);
  });

  it('returns false rather than throwing on malformed input', () => {
    expect(verifyWebhookSignature(body, 'not-base64!!', pemB64)).toBe(false);
    expect(verifyWebhookSignature(body, sign(body), 'garbage')).toBe(false);
    expect(verifyWebhookSignature(body, '', pemB64)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/olleyo/projects/dota-core-be && npx jest src/connectors/monobank-acquiring/monobank-acquiring.signature.spec.ts`
Expected: FAIL — `Cannot find module './monobank-acquiring.signature'`

- [ ] **Step 3: Write the implementation**

```ts
import { createPublicKey, createVerify, type KeyObject } from 'node:crypto';

const PEM_PREFIX = '-----BEGIN';

/**
 * Monobank's `GET /api/merchant/pubkey` returns a base64 "x.509 public key".
 * In practice that decodes to either a PEM block or raw DER depending on the
 * integration, so both are accepted rather than betting on one.
 */
function toPublicKey(publicKeyB64: string): KeyObject {
  const decoded = Buffer.from(publicKeyB64, 'base64');
  const asText = decoded.toString('utf8').trim();
  if (asText.startsWith(PEM_PREFIX)) {
    return createPublicKey({ key: asText, format: 'pem' });
  }
  return createPublicKey({ key: decoded, format: 'der', type: 'spki' });
}

/**
 * Verifies an acquiring webhook's `x-sign` header.
 *
 * The digest MUST be taken over the exact bytes received — re-serialising the
 * parsed JSON changes whitespace and key order and fails every time. See the
 * `rawBody: true` bootstrap option in the v1 entry point.
 *
 * Returns false (never throws) so a malformed push is a 403, not a 500.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureB64: string,
  publicKeyB64: string,
): boolean {
  if (!signatureB64 || !publicKeyB64) return false;
  try {
    return createVerify('SHA256')
      .update(rawBody)
      .verify(toPublicKey(publicKeyB64), Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/connectors/monobank-acquiring/monobank-acquiring.signature.spec.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Lint and commit**

```bash
cd /Users/olleyo/projects/dota-core-be
npx eslint --fix src/connectors/monobank-acquiring/
git add src/connectors/monobank-acquiring/
git commit -m "feat: verify Monobank acquiring webhook signatures"
```

---

### Task 2: Payment state transition

The full callback matrix as a pure function, so out-of-order and duplicate deliveries are provable without a database. Monobank retries up to three times and does not guarantee ordering.

**Files:**
- Create: `src/tournaments/tournament-payment-transition.ts`
- Test: `src/tournaments/tournament-payment-transition.spec.ts`

**Interfaces:**
- Consumes: `PaymentStatus` from `./tournament-team-payment.model`.
- Produces: `TInvoiceCallback`, `TPaymentSnapshot`, `TPaymentStateChange`, and `nextPaymentState(current: TPaymentSnapshot, callback: TInvoiceCallback, now: Date): TPaymentStateChange | null` — `null` means "no change".

- [ ] **Step 1: Write the failing test**

```ts
import { PaymentStatus } from './tournament-team-payment.model';
import {
  nextPaymentState,
  type TInvoiceCallback,
  type TPaymentSnapshot,
} from './tournament-payment-transition';

describe('nextPaymentState', () => {
  const now = new Date('2026-09-19T12:00:00Z');

  const pending: TPaymentSnapshot = {
    status: PaymentStatus.PENDING,
    amountPaid: 0,
    paidAt: null,
    invoiceId: 'inv_1',
    paymentPageUrl: 'https://pay.mbnk.biz/inv_1',
  };

  const callback = (patch: Partial<TInvoiceCallback>): TInvoiceCallback => ({
    invoiceId: 'inv_1',
    status: 'created',
    ...patch,
  });

  it('settles a successful invoice', () => {
    const next = nextPaymentState(
      pending,
      callback({ status: 'success', amount: 50000, finalAmount: 50000 }),
      now,
    );
    expect(next).toEqual({
      status: PaymentStatus.PAID,
      amountPaid: 50000,
      paidAt: now,
      invoiceId: 'inv_1',
      paymentPageUrl: null,
    });
  });

  it('prefers finalAmount over amount', () => {
    const next = nextPaymentState(
      pending,
      callback({ status: 'success', amount: 50000, finalAmount: 49900 }),
      now,
    );
    expect(next?.amountPaid).toBe(49900);
  });

  it('uses the callback modifiedDate as paidAt when present', () => {
    const next = nextPaymentState(
      pending,
      callback({
        status: 'success',
        amount: 50000,
        modifiedDate: '2026-09-19T11:30:00Z',
      }),
      now,
    );
    expect(next?.paidAt).toEqual(new Date('2026-09-19T11:30:00Z'));
  });

  it.each(['failure', 'expired', 'reversed'] as const)(
    'clears the invoice and stays PENDING on %s',
    (status) => {
      const next = nextPaymentState(pending, callback({ status }), now);
      expect(next).toEqual({
        status: PaymentStatus.PENDING,
        amountPaid: 0,
        paidAt: null,
        invoiceId: null,
        paymentPageUrl: null,
      });
    },
  );

  it.each(['created', 'processing', 'hold'] as const)(
    'is a no-op for the in-flight status %s',
    (status) => {
      expect(nextPaymentState(pending, callback({ status }), now)).toBeNull();
    },
  );

  it('never downgrades a payment that is already PAID', () => {
    const paid: TPaymentSnapshot = {
      status: PaymentStatus.PAID,
      amountPaid: 50000,
      paidAt: new Date('2026-09-18T00:00:00Z'),
      invoiceId: 'inv_1',
      paymentPageUrl: null,
    };
    for (const status of ['failure', 'expired', 'reversed', 'success'] as const) {
      expect(nextPaymentState(paid, callback({ status }), now)).toBeNull();
    }
  });

  it('ignores an unknown status rather than guessing', () => {
    const rogue = { invoiceId: 'inv_1', status: 'teapot' } as unknown as TInvoiceCallback;
    expect(nextPaymentState(pending, rogue, now)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/tournaments/tournament-payment-transition.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
import { PaymentStatus } from './tournament-team-payment.model';

/** Invoice lifecycle states Monobank reports. */
export type TInvoiceStatus =
  | 'created'
  | 'processing'
  | 'hold'
  | 'success'
  | 'failure'
  | 'reversed'
  | 'expired';

/** The fields of an acquiring callback this decision needs. */
export type TInvoiceCallback = {
  invoiceId: string;
  status: TInvoiceStatus;
  amount?: number;
  finalAmount?: number;
  reference?: string;
  modifiedDate?: string;
};

/** The mutable part of a `tournament_team_payment` row. */
export type TPaymentSnapshot = {
  status: PaymentStatus;
  amountPaid: number;
  paidAt: Date | null;
  invoiceId: string | null;
  paymentPageUrl: string | null;
};

export type TPaymentStateChange = TPaymentSnapshot;

/** Statuses that end the invoice without money arriving. */
const DEAD_STATUSES: ReadonlySet<string> = new Set([
  'failure',
  'reversed',
  'expired',
]);

/**
 * The next state of a payment row given one callback, or null when nothing
 * changes.
 *
 * Monobank retries a callback up to three times and does not guarantee
 * ordering, so this must be idempotent and order-independent. PAID is terminal:
 * once money has landed, no later push — including a duplicate success or a
 * stale failure — moves the row. Refunds are out of scope by design, so
 * `reversed` only releases the invoice; reconciling the money back is a manual
 * cabinet operation.
 */
export function nextPaymentState(
  current: TPaymentSnapshot,
  callback: TInvoiceCallback,
  now: Date,
): TPaymentStateChange | null {
  if (current.status === PaymentStatus.PAID) return null;

  if (callback.status === 'success') {
    const paid = callback.finalAmount ?? callback.amount ?? current.amountPaid;
    const modified = callback.modifiedDate
      ? new Date(callback.modifiedDate)
      : null;
    return {
      status: PaymentStatus.PAID,
      amountPaid: paid,
      paidAt:
        modified && !Number.isNaN(modified.getTime()) ? modified : now,
      invoiceId: callback.invoiceId,
      paymentPageUrl: null,
    };
  }

  if (DEAD_STATUSES.has(callback.status)) {
    // The captain simply pays again; the next intent mints a fresh invoice.
    return {
      status: current.status,
      amountPaid: current.amountPaid,
      paidAt: current.paidAt,
      invoiceId: null,
      paymentPageUrl: null,
    };
  }

  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/tournaments/tournament-payment-transition.spec.ts`
Expected: PASS

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --fix src/tournaments/tournament-payment-transition.ts src/tournaments/tournament-payment-transition.spec.ts
git add src/tournaments/tournament-payment-transition.ts src/tournaments/tournament-payment-transition.spec.ts
git commit -m "feat: add acquiring callback state transition"
```

---

### Task 3: Invoice validity window

**Files:**
- Create: `src/tournaments/invoice-validity.ts`
- Test: `src/tournaments/invoice-validity.spec.ts`

**Interfaces:**
- Produces: `INVOICE_MAX_VALIDITY_SEC`, `INVOICE_MIN_VALIDITY_SEC`, `invoiceValiditySeconds(now: Date, registrationEndsAt: Date): number`

- [ ] **Step 1: Write the failing test**

```ts
import {
  INVOICE_MAX_VALIDITY_SEC,
  INVOICE_MIN_VALIDITY_SEC,
  invoiceValiditySeconds,
} from './invoice-validity';

describe('invoiceValiditySeconds', () => {
  const now = new Date('2026-09-19T12:00:00Z');
  const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000);

  it('caps at 24 hours when registration is far away', () => {
    expect(invoiceValiditySeconds(now, inHours(240))).toBe(
      INVOICE_MAX_VALIDITY_SEC,
    );
  });

  it('shortens to the remaining registration window', () => {
    expect(invoiceValiditySeconds(now, inHours(3))).toBe(3 * 3600);
  });

  it('floors at the minimum when registration is nearly over', () => {
    expect(invoiceValiditySeconds(now, inHours(0.05))).toBe(
      INVOICE_MIN_VALIDITY_SEC,
    );
  });

  it('floors at the minimum when the deadline has already passed', () => {
    expect(invoiceValiditySeconds(now, inHours(-5))).toBe(
      INVOICE_MIN_VALIDITY_SEC,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/tournaments/invoice-validity.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
/** Monobank's own default and our cap: an invoice lives at most a day. */
export const INVOICE_MAX_VALIDITY_SEC = 24 * 60 * 60;

/**
 * Floor for the window. It only bites in the last quarter hour of registration,
 * where `getRegistrationBlockReason` is about to refuse the intent anyway; a
 * zero- or negative-length invoice would be rejected by Monobank outright.
 */
export const INVOICE_MIN_VALIDITY_SEC = 15 * 60;

/**
 * How long an invoice should stay payable: never longer than the registration
 * window it is paying into, never longer than a day.
 */
export function invoiceValiditySeconds(
  now: Date,
  registrationEndsAt: Date,
): number {
  const remaining = Math.floor(
    (registrationEndsAt.getTime() - now.getTime()) / 1000,
  );
  return Math.max(
    INVOICE_MIN_VALIDITY_SEC,
    Math.min(INVOICE_MAX_VALIDITY_SEC, remaining),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/tournaments/invoice-validity.spec.ts`
Expected: PASS

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --fix src/tournaments/invoice-validity.ts src/tournaments/invoice-validity.spec.ts
git add src/tournaments/invoice-validity.ts src/tournaments/invoice-validity.spec.ts
git commit -m "feat: clamp acquiring invoice validity to the registration window"
```

---

### Task 4: Request origin derivation

`webHookUrl` and `redirectUrl` address **different** origins. The API origin comes from the proxy headers (the pattern already used by `bank-webhook.controller.ts:95`); the SPA origin comes from the browser's `Origin` header, validated against `CORS_ORIGINS`. Sending the captain back to the API host after paying would strand them on a JSON endpoint.

**Files:**
- Create: `src/tournaments/request-origin.util.ts`
- Test: `src/tournaments/request-origin.util.spec.ts`

**Interfaces:**
- Produces: `TRequestHeaders = Record<string, string | string[] | undefined>`, `apiOriginFrom(headers: TRequestHeaders): string`, `spaOriginFrom(headers: TRequestHeaders, allowedOrigins: string[]): string | null`

- [ ] **Step 1: Write the failing test**

```ts
import { apiOriginFrom, spaOriginFrom } from './request-origin.util';

describe('apiOriginFrom', () => {
  it('prefers the forwarded proto and host', () => {
    expect(
      apiOriginFrom({
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.core-league-dota2.org',
        host: 'internal:3000',
      }),
    ).toBe('https://api.core-league-dota2.org');
  });

  it('falls back to host and http when not proxied', () => {
    expect(apiOriginFrom({ host: 'localhost:3000' })).toBe(
      'http://localhost:3000',
    );
  });

  it('takes the first entry of a comma-joined forwarded chain', () => {
    expect(
      apiOriginFrom({
        'x-forwarded-proto': 'https,http',
        'x-forwarded-host': 'api.example.org,internal',
      }),
    ).toBe('https://api.example.org');
  });
});

describe('spaOriginFrom', () => {
  const allowed = ['https://core-league-dota2.org', 'http://localhost:5173'];

  it('returns the Origin header when it is allowed', () => {
    expect(
      spaOriginFrom({ origin: 'http://localhost:5173' }, allowed),
    ).toBe('http://localhost:5173');
  });

  it('falls back to the first allowed origin when the header is absent', () => {
    expect(spaOriginFrom({}, allowed)).toBe('https://core-league-dota2.org');
  });

  it('refuses an origin that is not allow-listed', () => {
    expect(
      spaOriginFrom({ origin: 'https://evil.example' }, allowed),
    ).toBe('https://core-league-dota2.org');
  });

  it('returns null when nothing is configured and no header is sent', () => {
    expect(spaOriginFrom({}, [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/tournaments/request-origin.util.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
export type TRequestHeaders = Record<string, string | string[] | undefined>;

function firstValue(raw: string | string[] | undefined): string | null {
  if (raw === undefined) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const first = value?.split(',')[0]?.trim();
  return first ? first : null;
}

/**
 * Public origin of THIS api, for the invoice's `webHookUrl`.
 *
 * Derived from the request rather than `API_BASE_URL`: that env var addresses
 * the v1 host and once pointed a Monobank webhook at the wrong app of a
 * two-app deployment, which silently stopped every entry fee from reconciling.
 * The intent request necessarily arrives at the app that must receive the
 * callback, so the request itself is the reliable source.
 */
export function apiOriginFrom(headers: TRequestHeaders): string {
  const proto = firstValue(headers['x-forwarded-proto']) ?? 'http';
  const host =
    firstValue(headers['x-forwarded-host']) ?? firstValue(headers.host) ?? '';
  return `${proto}://${host}`;
}

/**
 * Public origin of the SPA, for the invoice's `redirectUrl` — where Monobank
 * returns the captain after paying. This is NOT the api origin.
 *
 * The browser sets `Origin` on the XHR that creates the intent, which is the
 * frontend's own origin. It is checked against the configured allow-list so a
 * forged header cannot turn our invoice into an open redirect; anything
 * unrecognised falls back to the first configured origin.
 */
export function spaOriginFrom(
  headers: TRequestHeaders,
  allowedOrigins: string[],
): string | null {
  const allowed = allowedOrigins.map((o) => o.trim()).filter(Boolean);
  const origin = firstValue(headers.origin);
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0] ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/tournaments/request-origin.util.spec.ts`
Expected: PASS

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --fix src/tournaments/request-origin.util.ts src/tournaments/request-origin.util.spec.ts
git add src/tournaments/request-origin.util.ts src/tournaments/request-origin.util.spec.ts
git commit -m "feat: derive api and spa origins from the intent request"
```

---

### Task 5: Acquiring connector service and module

**Files:**
- Create: `src/connectors/monobank-acquiring/monobank-acquiring.types.ts`, `.service.ts`, `.service.spec.ts`, `.module.ts`
- Modify: `src/types/entities/env.ts`, `.env.example`

**Interfaces:**
- Consumes: `verifyWebhookSignature` (Task 1); `TInvoiceStatus` (Task 2); `HttpClientConnectorService` (`get<T>(url, config?)`, `post<T>(url, data?, config?)` — both return the response **body**); `ConfigConnectorService.getEnvConfig()`.
- Produces: `TCreateInvoiceParams`, `TCreatedInvoice`, `InvoiceCallbackSchema`, and `MonobankAcquiringService` with `createInvoice(params): Promise<TCreatedInvoice>`, `getInvoiceStatus(invoiceId): Promise<unknown>`, `verifyCallback(rawBody: Buffer, signatureB64: string): Promise<boolean>`; plus `MonobankAcquiringModule.register(): DynamicModule`.

- [ ] **Step 1: Add the merchant token to the env schema**

In `src/types/entities/env.ts`, immediately after the `MONOBANK_ACCOUNT_ID` line:

```ts
  // Monobank ACQUIRING (ФОП) merchant token — a different credential from
  // MONOBANK_TOKEN, which is the Personal API token used for statements.
  // Issued in the merchant cabinet; Monobank also publishes a sandbox token.
  MONOBANK_MERCHANT_TOKEN: z.string().default(''),
```

And in `.env.example`, after `MONOBANK_ACCOUNT_ID`:

```
# Monobank acquiring (ФОП) merchant token — NOT the same as MONOBANK_TOKEN
MONOBANK_MERCHANT_TOKEN=
```

- [ ] **Step 2: Write the types module**

`src/connectors/monobank-acquiring/monobank-acquiring.types.ts`:

```ts
import { z } from 'zod';
import type { TInvoiceStatus } from '../../tournaments/tournament-payment-transition';

/** Request body for `POST /api/merchant/invoice/create`. */
export type TCreateInvoiceParams = {
  /** Kopecks. */
  amount: number;
  reference: string;
  /** Human-readable purpose shown on the payment page. */
  destination: string;
  redirectUrl: string;
  webHookUrl: string;
  validitySec: number;
};

export type TCreatedInvoice = {
  invoiceId: string;
  pageUrl: string;
};

/**
 * Type-only import: pins this list to the domain union in
 * `tournament-payment-transition.ts` so the two cannot drift. A value import
 * would invert the layering; `satisfies` gives the same guarantee at compile
 * time with no runtime edge.
 */
const INVOICE_STATUSES = [
  'created',
  'processing',
  'hold',
  'success',
  'failure',
  'reversed',
  'expired',
] as const satisfies readonly TInvoiceStatus[];

const InvoiceStatusSchema = z.enum(INVOICE_STATUSES);

/**
 * The acquiring callback body. Deliberately permissive about fields we do not
 * act on (`paymentInfo`, `cancelList`, `walletData`) — a new field from
 * Monobank must not turn a real payment into a parse failure.
 */
export const InvoiceCallbackSchema = z
  .object({
    invoiceId: z.string().min(1),
    status: InvoiceStatusSchema,
    amount: z.number().int().optional(),
    finalAmount: z.number().int().optional(),
    reference: z.string().optional(),
    modifiedDate: z.string().optional(),
    failureReason: z.string().optional(),
    errCode: z.string().optional(),
  })
  .passthrough();

export type TInvoiceCallbackPayload = z.infer<typeof InvoiceCallbackSchema>;

const CreateInvoiceResponseSchema = z.object({
  invoiceId: z.string().min(1),
  pageUrl: z.string().min(1),
});

const PubkeyResponseSchema = z.object({ key: z.string().min(1) });

export { CreateInvoiceResponseSchema, PubkeyResponseSchema };
```

- [ ] **Step 3: Write the failing service test**

`src/connectors/monobank-acquiring/monobank-acquiring.service.spec.ts`:

```ts
import { MonobankAcquiringService } from './monobank-acquiring.service';

type THttpStub = {
  get: jest.Mock;
  post: jest.Mock;
};

describe('MonobankAcquiringService', () => {
  let http: THttpStub;
  let service: MonobankAcquiringService;

  const config = {
    getEnvConfig: () => ({ MONOBANK_MERCHANT_TOKEN: 'merchant-token' }),
  };

  beforeEach(() => {
    http = { get: jest.fn(), post: jest.fn() };
    service = new MonobankAcquiringService(
      http as never,
      config as never,
    );
  });

  it('creates an invoice with kopecks, UAH and the reference', async () => {
    http.post.mockResolvedValue({
      invoiceId: 'inv_1',
      pageUrl: 'https://pay.mbnk.biz/inv_1',
    });

    const created = await service.createInvoice({
      amount: 50000,
      reference: 'CORE-7F3K9Q',
      destination: 'Внесок за участь у турнірі',
      redirectUrl: 'https://spa.example/tournaments/t1',
      webHookUrl: 'https://api.example/webhook/monobank/acquiring',
      validitySec: 3600,
    });

    expect(created).toEqual({
      invoiceId: 'inv_1',
      pageUrl: 'https://pay.mbnk.biz/inv_1',
    });

    const [url, body, requestConfig] = http.post.mock.calls[0];
    expect(url).toBe('/api/merchant/invoice/create');
    expect(body).toMatchObject({
      amount: 50000,
      ccy: 980,
      paymentType: 'debit',
      validity: 3600,
      redirectUrl: 'https://spa.example/tournaments/t1',
      webHookUrl: 'https://api.example/webhook/monobank/acquiring',
      merchantPaymInfo: {
        reference: 'CORE-7F3K9Q',
        destination: 'Внесок за участь у турнірі',
      },
    });
    expect(requestConfig.headers['X-Token']).toBe('merchant-token');
  });

  it('rejects when the merchant token is not configured', async () => {
    const unconfigured = new MonobankAcquiringService(
      http as never,
      { getEnvConfig: () => ({ MONOBANK_MERCHANT_TOKEN: '' }) } as never,
    );
    await expect(
      unconfigured.createInvoice({
        amount: 1,
        reference: 'CORE-1',
        destination: 'x',
        redirectUrl: 'https://a',
        webHookUrl: 'https://b',
        validitySec: 900,
      }),
    ).rejects.toThrow('MONOBANK_MERCHANT_TOKEN');
    expect(http.post).not.toHaveBeenCalled();
  });

  it('fetches the public key once and reuses it', async () => {
    http.get.mockResolvedValue({ key: 'a2V5' });
    await service.getPublicKey();
    await service.getPublicKey();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get.mock.calls[0][0]).toBe('/api/merchant/pubkey');
  });

  it('refetches the key once when verification fails, then gives up', async () => {
    http.get
      .mockResolvedValueOnce({ key: 'stale' })
      .mockResolvedValueOnce({ key: 'fresh' });

    const verified = await service.verifyCallback(
      Buffer.from('{}'),
      'c2ln',
    );

    expect(verified).toBe(false);
    // once for the initial key, once for the post-failure refresh
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/connectors/monobank-acquiring/monobank-acquiring.service.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 5: Write the service**

`src/connectors/monobank-acquiring/monobank-acquiring.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import type { AxiosRequestConfig } from 'axios';
import { ConfigConnectorService } from '../config/config-connector.service';
import { HttpClientConnectorService } from '../http-client/http-client-connector.service';
import { verifyWebhookSignature } from './monobank-acquiring.signature';
import {
  CreateInvoiceResponseSchema,
  PubkeyResponseSchema,
  type TCreatedInvoice,
  type TCreateInvoiceParams,
} from './monobank-acquiring.types';

/** ISO 4217 for the hryvnia; every invoice is in UAH. */
const CCY_UAH = 980;

/**
 * Client for the Monobank acquiring («plata by mono») merchant API.
 *
 * Separate from `MonobankService` on purpose: that one speaks the Personal API
 * with `MONOBANK_TOKEN` and carries rate-limit retry logic for endpoints capped
 * at one call per minute. Acquiring uses a different credential, a different
 * path prefix and has no such cap, so sharing a class would mean two tokens and
 * two contracts in one place.
 */
@Injectable()
export class MonobankAcquiringService {
  private readonly logger = new Logger(MonobankAcquiringService.name);

  /** Cached per the docs' explicit instruction not to fetch it per webhook. */
  private publicKeyB64: string | null = null;

  constructor(
    private readonly http: HttpClientConnectorService,
    private readonly config: ConfigConnectorService,
  ) {}

  async createInvoice(
    params: TCreateInvoiceParams,
  ): Promise<TCreatedInvoice> {
    const raw = await this.http.post<unknown>(
      '/api/merchant/invoice/create',
      {
        amount: params.amount,
        ccy: CCY_UAH,
        paymentType: 'debit',
        validity: params.validitySec,
        redirectUrl: params.redirectUrl,
        webHookUrl: params.webHookUrl,
        merchantPaymInfo: {
          reference: params.reference,
          destination: params.destination,
        },
      },
      this.authConfig(),
    );
    return CreateInvoiceResponseSchema.parse(raw);
  }

  getInvoiceStatus(invoiceId: string): Promise<unknown> {
    return this.http.get<unknown>(
      `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
      this.authConfig(),
    );
  }

  /** Cached key; pass `force` to bypass the cache after a failed verification. */
  async getPublicKey(force = false): Promise<string> {
    if (!force && this.publicKeyB64) return this.publicKeyB64;
    const raw = await this.http.get<unknown>(
      '/api/merchant/pubkey',
      this.authConfig(),
    );
    this.publicKeyB64 = PubkeyResponseSchema.parse(raw).key;
    return this.publicKeyB64;
  }

  /**
   * Verifies a callback, refreshing the cached key exactly once if the first
   * attempt fails — that is the documented signal that the key has rotated.
   */
  async verifyCallback(
    rawBody: Buffer,
    signatureB64: string,
  ): Promise<boolean> {
    const key = await this.getPublicKey();
    if (verifyWebhookSignature(rawBody, signatureB64, key)) return true;

    this.logger.warn(
      'Acquiring callback failed verification; refreshing the public key once',
    );
    const refreshed = await this.getPublicKey(true);
    return verifyWebhookSignature(rawBody, signatureB64, refreshed);
  }

  private authConfig(): AxiosRequestConfig {
    const token = this.config.getEnvConfig().MONOBANK_MERCHANT_TOKEN;
    if (!token) {
      throw new Error(
        'MONOBANK_MERCHANT_TOKEN is not configured — acquiring is unavailable',
      );
    }
    return { headers: { 'X-Token': token } };
  }
}
```

- [ ] **Step 6: Write the module**

`src/connectors/monobank-acquiring/monobank-acquiring.module.ts`:

```ts
import { type DynamicModule, Module } from '@nestjs/common';
import { HttpClientConnectorModule } from '../http-client/http-client-connector.module';
import { MonobankAcquiringService } from './monobank-acquiring.service';

const DEFAULT_BASE_URL = 'https://api.monobank.ua';

/**
 * Provides {@link MonobankAcquiringService}. Shares `MONOBANK_API_URL` with the
 * Personal API client — acquiring lives on the same host under
 * `/api/merchant/*` — while the `X-Token` header is applied per request.
 */
@Module({})
export class MonobankAcquiringModule {
  static register(): DynamicModule {
    return {
      module: MonobankAcquiringModule,
      imports: [
        HttpClientConnectorModule.register(
          (config) =>
            config.getEnvConfig().MONOBANK_API_URL ?? DEFAULT_BASE_URL,
        ),
      ],
      providers: [MonobankAcquiringService],
      exports: [MonobankAcquiringService],
    };
  }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx jest src/connectors/monobank-acquiring/`
Expected: PASS — Task 1's 5 tests plus 4 service tests

- [ ] **Step 8: Lint and commit**

```bash
npx eslint --fix src/connectors/monobank-acquiring/ src/types/entities/env.ts
git add src/connectors/monobank-acquiring/ src/types/entities/env.ts .env.example
git commit -m "feat: add Monobank acquiring connector"
```

---

### Task 6: Database migration and entity columns

**Files:**
- Create: `src/migrations/1789800000000-TournamentAcquiringInvoice.ts`
- Modify: `src/tournaments/tournament-team-payment.entity.ts`, `src/tournaments/tournaments.entity.ts`, `src/tournaments/dto/create-tournament.dto.ts`

**Interfaces:**
- Produces: `TournamentTeamPayment.invoiceId: string | null`, `TournamentTeamPayment.paymentPageUrl: string | null`. Removes `Tournament.paymentJarUrl`.

- [ ] **Step 1: Add the entity columns**

In `src/tournaments/tournament-team-payment.entity.ts`, after the `transactionId` column:

```ts
  /**
   * Monobank acquiring invoice currently open for this payment, and the hosted
   * page it is paid on. Both are cleared when the invoice fails or expires, so
   * the next intent mints a fresh one; both are null for rows that predate
   * acquiring or have already been paid.
   */
  @Column({ type: 'varchar', nullable: true, unique: true })
  invoiceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentPageUrl: string | null;
```

Update the `reference` column's comment, which still says "prefilled into the Monobank jar comment":

```ts
  /** Unique code (e.g. CORE-7F3K9Q) sent as the invoice's merchantPaymInfo.reference. */
```

- [ ] **Step 2: Add the invoice lookup to the repository**

The callback's primary key is `invoiceId`; `reference` is the fallback. Add to
`src/tournaments/tournament-team-payment.repository.ts`:

```ts
  findByInvoiceId(invoiceId: string): Promise<TournamentTeamPayment | null> {
    return this.repo.findOne({ where: { invoiceId } });
  }
```

- [ ] **Step 3: Remove the jar column from the tournament entity and DTO**

Delete the `paymentJarUrl` column from `src/tournaments/tournaments.entity.ts` and its `@ApiPropertyOptional`/`@IsOptional`/`@IsString` field from `src/tournaments/dto/create-tournament.dto.ts` (the one described as "Monobank jar link captains are redirected to for the entry fee").

- [ ] **Step 4: Write the migration**

`src/migrations/1789800000000-TournamentAcquiringInvoice.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switches entry fees to Monobank acquiring invoices.
 *
 * `invoiceId` is the callback's lookup key and `paymentPageUrl` lets a repeat
 * click reuse a live invoice instead of minting one per click. Existing rows get
 * nulls: a payment already PAID needs neither, and a PENDING one gets a fresh
 * invoice on the captain's next visit.
 *
 * Dropping `paymentJarUrl` is irreversible in substance — `down()` restores the
 * column but not the links it held. That is accepted: the jar rail is retired,
 * not paused.
 */
export class TournamentAcquiringInvoice1789800000000
  implements MigrationInterface
{
  name = 'TournamentAcquiringInvoice1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" ADD "invoiceId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" ADD CONSTRAINT "UQ_tournament_team_payment_invoice" UNIQUE ("invoiceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" ADD "paymentPageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament" DROP COLUMN "paymentJarUrl"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament" ADD "paymentJarUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" DROP COLUMN "paymentPageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" DROP CONSTRAINT "UQ_tournament_team_payment_invoice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_team_payment" DROP COLUMN "invoiceId"`,
    );
  }
}
```

- [ ] **Step 5: Verify the build still type-checks**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors ONLY at the remaining `paymentJarUrl` readers in `tournament-payments.service.ts` (`buildJarUrl`, `toIntentDto`). Those are removed in Task 7 — note them and continue.

- [ ] **Step 6: Commit**

```bash
npx eslint --fix src/migrations/1789800000000-TournamentAcquiringInvoice.ts src/tournaments/
git add src/migrations/1789800000000-TournamentAcquiringInvoice.ts src/tournaments/tournament-team-payment.entity.ts src/tournaments/tournament-team-payment.repository.ts src/tournaments/tournaments.entity.ts src/tournaments/dto/create-tournament.dto.ts
git commit -m "feat: add acquiring invoice columns, drop the jar url"
```

---

### Task 7: Intent creation switches to invoices

**Files:**
- Modify: `src/tournaments/tournament-payments.service.ts`, `src/tournaments/dto/tournament-payment-intent.dto.ts`, `src/tournaments/tournaments.controller.ts`, `src/tournaments/tournaments.module.ts`, `src/app.module.ts`

**Interfaces:**
- Consumes: `MonobankAcquiringService.createInvoice` (Task 5); `invoiceValiditySeconds` (Task 3); `apiOriginFrom`, `spaOriginFrom` (Task 4).
- Produces: `TournamentPaymentIntentDto.pageUrl` replacing `jarUrl`; `createIntentForCaptain(tournamentId, playerId, headers)` and `getMyPayment(tournamentId, playerId)` returning the new DTO.

- [ ] **Step 1: Make ConfigConnectorModule available to v1**

`ConfigConnectorModule` is `@Global()` but must still be imported once in the graph, and v1's `AppModule` never imports it. Without this the acquiring connector fails to resolve `ConfigConnectorService` at boot. In `src/app.module.ts` add to `imports`, before `PlayersModule`:

```ts
    ConfigConnectorModule,
```

with `import { ConfigConnectorModule } from './connectors/config/config-connector.module';` at the top.

- [ ] **Step 2: Register the acquiring module in TournamentsModule**

In `src/tournaments/tournaments.module.ts`, add `MonobankAcquiringModule.register()` to `imports` and the import statement:

```ts
import { MonobankAcquiringModule } from '../connectors/monobank-acquiring/monobank-acquiring.module';
```

- [ ] **Step 3: Replace jarUrl with pageUrl on the intent DTO**

In `src/tournaments/dto/tournament-payment-intent.dto.ts`, replace the `jarUrl` property and update the class doc comment:

```ts
/**
 * A captain-scoped payment intent: the reference carried on the Monobank
 * invoice, the amount owed, and the hosted page to pay on. Returned by the
 * create-intent and status endpoints so the frontend can redirect and poll.
 */
```

```ts
  @ApiProperty({
    nullable: true,
    description:
      'Monobank payment page for the open invoice, or null when there is none to pay.',
  })
  pageUrl: string | null;
```

- [ ] **Step 4: Rewrite the intent creation**

In `src/tournaments/tournament-payments.service.ts`: delete `buildJarUrl` entirely, inject `MonobankAcquiringService`, and replace `createIntentForCaptain`'s tail and `toIntentDto`. Keep every existing guard above them untouched.

```ts
  async createIntentForCaptain(
    tournamentId: string,
    playerId: string,
    headers: TRequestHeaders,
  ): Promise<TournamentPaymentIntentDto> {
    // ... existing lookups and guards are unchanged up to here ...

    let payment = await this.paymentRepo.findByTournamentAndTeam(
      tournamentId,
      team.id,
    );
    if (!payment) {
      const reference = await this.paymentRepo.generateUniqueReference();
      payment = this.paymentRepo.create({
        tournamentId,
        teamId: team.id,
        reference,
        status: PaymentStatus.PENDING,
        amountPaid: 0,
      });
      payment = await this.paymentRepo.save(payment);
    }

    if (payment.status === PaymentStatus.PAID) {
      return this.toIntentDto(payment, entryFee);
    }

    // Reuse a live invoice so repeat clicks do not mint one each time.
    if (!payment.invoiceId || !payment.paymentPageUrl) {
      const invoice = await this.acquiring.createInvoice({
        amount: entryFee,
        reference: payment.reference,
        destination: `Вступний внесок — ${tournament.name}`,
        redirectUrl: this.redirectUrlFor(headers, tournamentId),
        webHookUrl: `${apiOriginFrom(headers)}/webhook/monobank/acquiring`,
        validitySec: invoiceValiditySeconds(
          new Date(),
          tournament.registrationEndsAt,
        ),
      });
      payment.invoiceId = invoice.invoiceId;
      payment.paymentPageUrl = invoice.pageUrl;
      payment = await this.paymentRepo.save(payment);
    }

    return this.toIntentDto(payment, entryFee);
  }

  /** Where Monobank returns the captain after paying: the tournament page. */
  private redirectUrlFor(
    headers: TRequestHeaders,
    tournamentId: string,
  ): string {
    const allowed = (this.config.getEnvConfig().CORS_ORIGINS ?? '').split(',');
    const spa = spaOriginFrom(headers, allowed);
    return spa
      ? `${spa}/tournaments/${tournamentId}`
      : `${apiOriginFrom(headers)}/tournaments/${tournamentId}`;
  }

  private toIntentDto(
    payment: TournamentTeamPayment,
    entryFee: number,
  ): TournamentPaymentIntentDto {
    return {
      reference: payment.reference,
      status: payment.status,
      amount: entryFee,
      amountPaid: payment.amountPaid,
      pageUrl: payment.paymentPageUrl,
    };
  }
```

Update `getMyPayment`'s `toIntentDto` call to drop its third argument. Add imports:

```ts
import { ConfigConnectorService } from '../connectors/config/config-connector.service';
import { MonobankAcquiringService } from '../connectors/monobank-acquiring/monobank-acquiring.service';
import { invoiceValiditySeconds } from './invoice-validity';
import { apiOriginFrom, spaOriginFrom, type TRequestHeaders } from './request-origin.util';
```

and the constructor parameters `private readonly acquiring: MonobankAcquiringService,` and
`private readonly config: ConfigConnectorService,`. `CORS_ORIGINS` is already on the
typed `EnvSchema`, so reading it through `ConfigConnectorService` keeps the service off
`process.env` like the rest of the codebase.

- [ ] **Step 5: Pass request headers from the controller**

In `src/tournaments/tournaments.controller.ts`, the create-intent handler gains `@Req() req: Request` and passes `req.headers` as the third argument. Add `Req` to the `@nestjs/common` import and `import type { Request } from 'express';`.

- [ ] **Step 6: Write the invoice-reuse test**

The spec requires that a second click reuse a live invoice instead of minting
one per click. Create `src/tournaments/tournament-payments.invoice-reuse.spec.ts`:

```ts
import { PaymentStatus } from './tournament-team-payment.model';
import { TournamentPaymentsService } from './tournament-payments.service';

/**
 * Exercises only the invoice branch: the guards above it are covered by the
 * tournament schedule/registration utilities and need a real DataSource.
 */
describe('createIntentForCaptain invoice reuse', () => {
  const tournament = {
    id: 't1',
    name: 'Core Cup',
    entryFee: 50000,
    tournamentStatus: 'REGISTRATION',
    registrationStartsAt: new Date(Date.now() - 3600_000),
    registrationEndsAt: new Date(Date.now() + 3600_000),
    registrationClosedAt: null,
  };

  const team = { id: 'team1' };
  const headers = { host: 'api.example', origin: 'https://spa.example' };

  const build = (payment: Record<string, unknown>) => {
    const acquiring = {
      createInvoice: jest.fn().mockResolvedValue({
        invoiceId: 'inv_new',
        pageUrl: 'https://pay.mbnk.biz/inv_new',
      }),
    };
    const paymentRepo = {
      findByTournamentAndTeam: jest.fn().mockResolvedValue(payment),
      save: jest.fn().mockImplementation((p: unknown) => Promise.resolve(p)),
      create: jest.fn(),
      generateUniqueReference: jest.fn(),
    };
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest
          .fn()
          .mockResolvedValueOnce(tournament)
          .mockResolvedValue(team),
      }),
    };
    const config = {
      getEnvConfig: () => ({ CORS_ORIGINS: 'https://spa.example' }),
    };
    const service = new TournamentPaymentsService(
      paymentRepo as never,
      dataSource as never,
      acquiring as never,
      config as never,
    );
    return { service, acquiring, paymentRepo };
  };

  it('reuses a live invoice instead of creating another', async () => {
    const { service, acquiring } = build({
      reference: 'CORE-AAA111',
      status: PaymentStatus.PENDING,
      amountPaid: 0,
      invoiceId: 'inv_live',
      paymentPageUrl: 'https://pay.mbnk.biz/inv_live',
    });

    const intent = await service.createIntentForCaptain('t1', 'p1', headers);

    expect(acquiring.createInvoice).not.toHaveBeenCalled();
    expect(intent.pageUrl).toBe('https://pay.mbnk.biz/inv_live');
  });

  it('creates a new invoice after a previous one was cleared', async () => {
    const { service, acquiring } = build({
      reference: 'CORE-AAA111',
      status: PaymentStatus.PENDING,
      amountPaid: 0,
      invoiceId: null,
      paymentPageUrl: null,
    });

    const intent = await service.createIntentForCaptain('t1', 'p1', headers);

    expect(acquiring.createInvoice).toHaveBeenCalledTimes(1);
    expect(intent.pageUrl).toBe('https://pay.mbnk.biz/inv_new');
    const [params] = acquiring.createInvoice.mock.calls[0];
    expect(params.redirectUrl).toBe('https://spa.example/tournaments/t1');
    expect(params.webHookUrl).toBe(
      'http://api.example/webhook/monobank/acquiring',
    );
  });

  it('creates no invoice for an already paid team', async () => {
    const { service, acquiring } = build({
      reference: 'CORE-AAA111',
      status: PaymentStatus.PAID,
      amountPaid: 50000,
      invoiceId: null,
      paymentPageUrl: null,
    });

    await service.createIntentForCaptain('t1', 'p1', headers);

    expect(acquiring.createInvoice).not.toHaveBeenCalled();
  });
});
```

If the constructor parameter order differs from the one above, fix the test to
match the real signature — do not reorder the constructor.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npx jest`
Expected: tsc clean, all tests pass including the three new reuse tests

- [ ] **Step 8: Lint and commit**

```bash
npx eslint --fix src/tournaments/ src/app.module.ts
git add src/tournaments/ src/app.module.ts
git commit -m "feat: create acquiring invoices for tournament entry fees"
```

---

### Task 8: The acquiring callback endpoint

**Files:**
- Create: `src/tournaments/tournament-payment-callback.controller.ts`
- Modify: `src/entry-points/http/api-v1/main.ts`, `src/tournaments/tournament-payments.service.ts`, `src/tournaments/tournaments.module.ts`

**Interfaces:**
- Consumes: `MonobankAcquiringService.verifyCallback` (Task 5); `nextPaymentState`, `TInvoiceCallback` (Task 2); `InvoiceCallbackSchema` (Task 5).
- Produces: `TournamentPaymentsService.applyInvoiceCallback(payload: TInvoiceCallbackPayload): Promise<void>`.

- [ ] **Step 1: Enable raw body capture on v1**

In `src/entry-points/http/api-v1/main.ts`, change the app creation. Without this the signature is verified over re-serialised JSON and fails every time, in a way that looks like a key problem:

```ts
  // rawBody is required by the Monobank acquiring callback: its signature is
  // taken over the exact bytes received, which the JSON parser otherwise discards.
  const app = await NestFactory.create(AppModule, { rawBody: true });
```

- [ ] **Step 2: Add the service method**

In `src/tournaments/tournament-payments.service.ts`:

```ts
  /**
   * Applies one acquiring callback. Idempotent and order-independent: Monobank
   * retries up to three times and does not guarantee ordering, and the decision
   * itself lives in `nextPaymentState`.
   */
  async applyInvoiceCallback(
    payload: TInvoiceCallbackPayload,
  ): Promise<void> {
    // invoiceId is the precise key; reference covers a push that predates the
    // row storing its invoice (e.g. a retry arriving after a failure cleared it).
    const payment =
      (await this.paymentRepo.findByInvoiceId(payload.invoiceId)) ??
      (payload.reference
        ? ((await this.paymentRepo.findByReferences([payload.reference]))[0] ??
          null)
        : null);
    if (!payment) {
      this.logger.warn(
        `Acquiring callback for unknown reference ${payload.reference ?? '(none)'} / invoice ${payload.invoiceId}`,
      );
      return;
    }

    const change = nextPaymentState(payment, payload, new Date());
    if (!change) return;

    payment.status = change.status;
    payment.amountPaid = change.amountPaid;
    payment.paidAt = change.paidAt;
    payment.invoiceId = change.invoiceId;
    payment.paymentPageUrl = change.paymentPageUrl;
    await this.paymentRepo.save(payment);

    this.logger.log(
      `Payment ${payment.reference}: invoice ${payload.invoiceId} -> ${payload.status} (${change.status})`,
    );
  }
```

Add a `private readonly logger = new Logger(TournamentPaymentsService.name);` field if the class has none, plus imports for `Logger`, `nextPaymentState` and `TInvoiceCallbackPayload`.

- [ ] **Step 3: Write the controller**

`src/tournaments/tournament-payment-callback.controller.ts`:

```ts
import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { MonobankAcquiringService } from '../connectors/monobank-acquiring/monobank-acquiring.service';
import { InvoiceCallbackSchema } from '../connectors/monobank-acquiring/monobank-acquiring.types';
import { TournamentPaymentsService } from './tournament-payments.service';

/**
 * Receiver for Monobank acquiring invoice callbacks.
 *
 * Served by v1 because v1 owns `tournament_team_payment`. Acquiring takes a
 * `webHookUrl` per invoice, so unlike the Personal API statement webhook there
 * is no registration step and no chance of pointing it at the wrong app.
 *
 * Answers 200 for anything it accepts — including a payload matching no known
 * payment — so Monobank stops its three retries. Only a failed signature is
 * rejected.
 */
@ApiExcludeController()
@Controller('webhook/monobank')
export class TournamentPaymentCallbackController {
  private readonly logger = new Logger(TournamentPaymentCallbackController.name);

  constructor(
    private readonly acquiring: MonobankAcquiringService,
    private readonly payments: TournamentPaymentsService,
  ) {}

  @Post('acquiring')
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-sign') signature?: string,
  ): Promise<{ status: string }> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error(
        'Acquiring callback arrived without a raw body — is rawBody enabled on the v1 bootstrap?',
      );
      throw new ForbiddenException('Invalid signature');
    }

    const verified = await this.acquiring.verifyCallback(
      rawBody,
      signature ?? '',
    );
    if (!verified) throw new ForbiddenException('Invalid signature');

    const parsed = InvoiceCallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      // Signed but unparseable: log and ack, since retrying cannot help.
      this.logger.error(
        `Acquiring callback failed schema validation: ${parsed.error.message}`,
      );
      return { status: 'ignored' };
    }

    await this.payments.applyInvoiceCallback(parsed.data);
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: Register the controller**

Add `TournamentPaymentCallbackController` to the `controllers` array in `src/tournaments/tournaments.module.ts`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npx jest`
Expected: tsc clean, all tests pass

- [ ] **Step 6: Lint and commit**

```bash
npx eslint --fix src/tournaments/ src/entry-points/
git add src/tournaments/ src/entry-points/http/api-v1/main.ts
git commit -m "feat: receive Monobank acquiring invoice callbacks"
```

---

### Task 9: Remove the jar rail

**Files:**
- Delete: `src/repos/tournament-payment.repository.ts`
- Modify: `src/repos/repos.module.ts`, `src/use-cases/ingestion/ingestion.service.ts`, `src/use-cases/sync/sync.service.ts`, `src/controllers/sync-controller/sync.dto.ts`, `src/types/entities/env.ts`, `.env.example`

**Interfaces:**
- Removes: `TournamentPaymentRepository`, `ReconcileTransaction`, `ReconcileResult`, `MONOBANK_JAR_URL`.

- [ ] **Step 1: Simplify the ingestion gate**

`IngestionService` currently stores an unwatched-account transaction only if it reconciled an entry fee. With no entry-fee reconciliation the gate is just the watched check. Remove the `tournamentPaymentRepo` constructor parameter, its import, the `reconcileTransactions` call, and replace the gate:

```ts
      const watched = isWatchedAccount(account, envConfig);
      if (!watched) {
        this.logger.debug(`Skipping unwatched account/jar ${account}`);
        return;
      }

      await this.transactionRepo.upsert(stored);
      await this.classificationService.classify(stored);
```

Also update the class doc comment, whose bullets describe reference matching and per-tournament jars — those behaviours no longer exist.

- [ ] **Step 2: Remove reconciliation from sync**

In `src/use-cases/sync/sync.service.ts` remove the `tournamentPaymentRepo` constructor parameter, its import, and both `reconcileTransactions` calls (around lines 75 and 94). Remove the "Entry-fee payments this run moved to PAID/UNDERPAID" field from the result type there and from `src/controllers/sync-controller/sync.dto.ts`.

- [ ] **Step 3: Delete the repository and unregister it**

```bash
rm src/repos/tournament-payment.repository.ts
```

Remove its import and its entry from the providers/exports arrays in `src/repos/repos.module.ts`.

- [ ] **Step 4: Remove the jar env var**

Delete the `MONOBANK_JAR_URL` block from `src/types/entities/env.ts` and the `MONOBANK_JAR_URL=` line from `.env.example`. Also update the `MONOBANK_ACCOUNT_IDS` comment above it, which explains that entry fees are matched by reference regardless of jar — no longer true.

- [ ] **Step 5: Verify nothing still references the jar**

Run:
```bash
grep -rn "paymentJarUrl\|MONOBANK_JAR_URL\|TournamentPaymentRepository\|reconcileTransactions\|buildJarUrl" src/ || echo "clean"
npx tsc --noEmit -p tsconfig.json && npx jest
```
Expected: `clean`, tsc clean, all tests pass

- [ ] **Step 6: Lint and commit**

```bash
npx eslint --fix src/
git add -A
git commit -m "refactor: remove the Monobank jar entry-fee rail"
```

---

### Task 10: Frontend cutover

**Files:**
- Modify: `src/views/tournaments/tournaments.d.ts`, `src/views/tournaments/components/TournamentJoinPanel.vue`, `src/views/tournaments/Tournament.vue`, `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue`, `src/api/types/schema.d.ts`

**Interfaces:**
- Consumes: the intent DTO from Task 7 — `{ reference, status, amount, amountPaid, pageUrl }`.

- [ ] **Step 1: Rename the field on the intent type**

In `src/views/tournaments/tournaments.d.ts`, within `TTournamentPaymentIntent`, replace `jarUrl: string | null` with `pageUrl: string | null`.

- [ ] **Step 2: Update the join panel**

In `src/views/tournaments/components/TournamentJoinPanel.vue`, rename the `paymentJarUrl` prop to `paymentPageUrl` and update the `:href` binding. Change the hint text at the bottom of the component:

```
'Натисніть «Оплатити внесок» — відкриється сторінка оплати monobank, а сторінка чекатиме підтвердження.'
```

Leave the `UNDERPAID` branch in place: rows created under the jar rail can still carry that status.

- [ ] **Step 3: Update the tournament page binding**

In `src/views/tournaments/Tournament.vue`, rename whatever computed feeds the panel's jar prop to match, sourcing it from `intent.pageUrl`.

- [ ] **Step 4: Remove the jar field from the drawer**

In `src/views/admin-panel/components/drawers/CreateTournamentDrawer.vue`, remove `jarUrlText`, its `el-form-item`, its line in `populateFromTournament`, its reset in `clearData`, and `paymentJarUrl` from `basePayload`. Leaving it in the payload would now 400 under `forbidNonWhitelisted`.

- [ ] **Step 5: Update the hand-maintained schema**

In `src/api/types/schema.d.ts`, remove `paymentJarUrl` from `CreateTournamentDto` and `UpdateTournamentDto` if present. Note in the commit message that `npm run api` is still owed once the backend deploys.

- [ ] **Step 6: Verify**

Run:
```bash
cd /Users/olleyo/projects/CoreFrontend
grep -rn "jarUrl\|paymentJarUrl" src/ || echo "clean"
npm run type-check
npx eslint --ignore-path .gitignore src/views/tournaments/ src/views/admin-panel/
```
Expected: `clean`, type-check exit 0, eslint exit 0

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: pay tournament entry fees on the Monobank acquiring page"
```

---

## Post-implementation verification

- [ ] Backend: `npx tsc --noEmit -p tsconfig.json`, `npx jest`, `npx eslint "{src,apps,libs,test}/**/*.ts"` — all clean.
- [ ] Frontend: `npm run type-check`, `npx eslint --ignore-path .gitignore src/` — clean apart from the two pre-existing trailing-whitespace errors in `PlayerTeamTag.vue` and `core/helpers.ts`.
- [ ] Run both pending migrations against a **copy** of production, then roll back, then re-apply. `TournamentAcquiringInvoice` drops a column; confirm the rollback path on real data before it runs anywhere that matters.
- [ ] With a sandbox merchant token: create an intent, pay on the sandbox page, confirm the callback verifies and the row reaches PAID. **This is the step blocked until a merchant token exists.**
- [ ] Deploy `dota-core-be` first, then run `npm run api` in `CoreFrontend` and commit the regenerated `schema.d.ts`, then deploy the frontend.
