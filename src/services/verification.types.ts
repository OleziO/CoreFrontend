import type { components } from '@/api/types/schema-v2'

/**
 * Verification slots, requests and tags live on the v2 backend (`apiClientV2`).
 *
 * Response views and request bodies are derived from the generated `schema-v2.d.ts`
 * components so there is a single source of truth. Status / type unions are extracted as
 * named aliases for use in component logic and status-pill maps.
 *
 * View types use the `T` prefix (not `I`): they are indexed-access type aliases, not
 * `interface` declarations, so the ESLint `typeAlias` rule requires `T` — matching the
 * `finance.types.ts` convention (`TAssetView`, `TOperationGroupView`, …).
 */

/** A 30-min verification window. `cancelled` only appears on a request's embedded slot. */
export type TVerificationSlotStatus = components['schemas']['VerificationSlotViewDto']['status']

/** Booking lifecycle status. */
export type TVerificationRequestStatus = components['schemas']['VerificationRequestViewDto']['status']

/** Request kind, derived by the backend — the frontend never sends it. */
export type TVerificationType = components['schemas']['VerificationRequestViewDto']['type']

/** A free slot from `GET /verification/slots`, or a booked slot embedded in a request. */
export type TVerificationSlot = components['schemas']['VerificationSlotViewDto']

/** A booking from `GET /verification/requests`, with its slot and per-player MMR results. */
export type TVerificationRequest = components['schemas']['VerificationRequestViewDto']

/** A single player entry inside a verification request. */
export type TVerificationRequestPlayer = TVerificationRequest['players'][number]

/** `POST /verification/slots` body. */
export type TCreateSlotsPayload = components['schemas']['CreateSlotsDto']

/** `POST /verification/requests` body (captain booking). */
export type TCreateRequestPayload = components['schemas']['CreateRequestDto']

/** `POST /verification/requests/{id}/complete` body (per-player MMR results). */
export type TCompleteRequestPayload = components['schemas']['CompleteRequestDto']

/**
 * Aggregated per-day data for the admin verification calendar: a day's free slots
 * (`GET /verification/slots`) plus that day's bookings (`GET /verification/requests`).
 * Cached by `YYYY-MM-DD` in the calendar tab; booked slots are derived from each request.
 */
export interface IVerificationDayData {
  slots: TVerificationSlot[]
  requests: TVerificationRequest[]
}
