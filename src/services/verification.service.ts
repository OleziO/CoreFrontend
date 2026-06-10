import { apiClientV2 } from '@/api/client-v2'
import type {
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
 * The `date` query is a `YYYY-MM-DD` calendar day in UTC terms; callers convert
 * to/from the admin's local timezone at the boundary with `dayjs`.
 */
class VerificationService {
  /** Free slots for a UTC day (captain + admin). */
  async fetchSlots (date: string): Promise<TVerificationSlot[]> {
    return apiClientV2.get<TVerificationSlot[]>('/verification/slots', {
      params: { date }
    })
  }

  /** Generate 30-min `free` slots from a same-day working-hours range (admin). */
  async createSlots (payload: TCreateSlotsPayload): Promise<TVerificationSlot[]> {
    return apiClientV2.post<TVerificationSlot[]>('/verification/slots', payload)
  }

  /** Delete a free slot, or cancel a booked slot + its request (admin); `204`. */
  async deleteSlot (id: string): Promise<void> {
    return apiClientV2.delete<void>(`/verification/slots/${id}`)
  }

  /** A day's bookings, each with its embedded slot (admin). */
  async fetchRequests (date: string): Promise<TVerificationRequest[]> {
    return apiClientV2.get<TVerificationRequest[]>('/verification/requests', {
      params: { date }
    })
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
