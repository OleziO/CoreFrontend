import dayjs from 'dayjs'
import { apiClientV2 } from '@/api/client-v2'
import type {
  IVerificationRange,
  TCompleteRequestPayload,
  TCreateRequestPayload,
  TCreateSlotsPayload,
  TVerificationRequest,
  TVerificationSlot
} from './verification.types'

/**
 * Raw v2 calls for the verification flow (slots + booking requests).
 *
 * Singleton, auto-imported by name (`verificationService`) alongside the other
 * `src/services/*` instances. Network only — loading state and toasts live in the
 * consuming admin/captain components (mirrors `finance.service.ts`).
 *
 * The list endpoints filter by a `from`/`to` **UTC** calendar-day range (plain
 * `YYYY-MM-DD`, no time part). A local day can straddle two UTC days (and `to`
 * inclusivity is backend-defined), so `fetchSlotsForDay` over-fetches ±1 day and
 * filters to the picked local day by each slot's `startsAt` — the same local-day
 * convention the admin calendar uses for bucketing.
 */
class VerificationService {
  /** Free slots within an inclusive `YYYY-MM-DD` day range (captain + admin). */
  async fetchSlots (range: IVerificationRange): Promise<TVerificationSlot[]> {
    return apiClientV2.get<TVerificationSlot[]>('/verification/slots', {
      params: range
    })
  }

  /** Free slots for a single local `YYYY-MM-DD` day (captain booking modal). */
  async fetchSlotsForDay (date: string): Promise<TVerificationSlot[]> {
    const slots = await this.fetchSlots({
      from: dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'),
      to: dayjs(date).add(1, 'day').format('YYYY-MM-DD')
    })
    return slots.filter((s) => dayjs(s.startsAt).format('YYYY-MM-DD') === date)
  }

  /** Generate 30-min `free` slots for explicit start times (admin). */
  async createSlots (payload: TCreateSlotsPayload): Promise<TVerificationSlot[]> {
    return apiClientV2.post<TVerificationSlot[]>('/verification/slots', payload)
  }

  /** Delete a free slot, or cancel a booked slot + its request (admin); `204`. */
  async deleteSlot (id: string): Promise<void> {
    return apiClientV2.delete<void>(`/verification/slots/${id}`)
  }

  /** Bookings within an inclusive `YYYY-MM-DD` day range, each with its embedded slot (admin). */
  async fetchRequests (range: IVerificationRange): Promise<TVerificationRequest[]> {
    return apiClientV2.get<TVerificationRequest[]>('/verification/requests', {
      params: range
    })
  }

  /** Bookings for a single calendar day (admin). */
  async fetchRequestsForDay (date: string): Promise<TVerificationRequest[]> {
    return this.fetchRequests({ from: date, to: date })
  }

  /** The current player's verification requests, newest first (no UI consumer yet). */
  async fetchMyRequests (): Promise<TVerificationRequest[]> {
    return apiClientV2.get<TVerificationRequest[]>('/verification/me')
  }

  /** Captain books a free slot for the given players. */
  async createRequest (payload: TCreateRequestPayload): Promise<TVerificationRequest> {
    return apiClientV2.post<TVerificationRequest>('/verification/requests', payload)
  }

  /** `pending` → `processing` (admin). */
  async processRequest (id: string): Promise<TVerificationRequest> {
    return apiClientV2.post<TVerificationRequest>(`/verification/requests/${id}/process`)
  }

  /** Write per-player MMR and mark the request `completed` (admin). */
  async completeRequest (id: string, payload: TCompleteRequestPayload): Promise<TVerificationRequest> {
    return apiClientV2.post<TVerificationRequest>(`/verification/requests/${id}/complete`, payload)
  }

  /** Cancel a request and free its slot (admin). */
  async cancelRequest (id: string): Promise<TVerificationRequest> {
    return apiClientV2.post<TVerificationRequest>(`/verification/requests/${id}/cancel`)
  }
}

export const verificationService = new VerificationService()
