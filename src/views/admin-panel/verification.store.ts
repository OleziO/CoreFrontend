import dayjs from 'dayjs'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type { IVerificationDayData, TCompleteRequestPayload } from '@/services/verification.types'

export const useVerificationStore = defineStore('verification', () => {
  // Day data cached by `YYYY-MM-DD`. The list endpoints filter by an inclusive date-only
  // `from`/`to` range, so a whole month is one slots + one requests fetch, bucketed by day.
  const cache = reactive<Record<string, IVerificationDayData>>({})
  const loadingDates = reactive(new Set<string>())

  // Fetch the whole month containing `anchor` in one round trip. The backend range is in
  // UTC days while cells are local days, so the request is padded ±1 day and each result
  // is rebucketed by its local start day (out-of-month days drop via the `?.` push).
  // Every refresh (month switch, cell click, drawer mutation) reloads the month so the
  // calendar and drawer stay in sync.
  async function loadMonth (anchor: string | Date, opts?: { silent?: boolean }): Promise<void> {
    const start = dayjs(anchor).startOf('month')
    const days = Array.from({ length: start.daysInMonth() }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'))
    days.forEach((d) => loadingDates.add(d))
    try {
      const range = {
        from: start.subtract(1, 'day').format('YYYY-MM-DD'),
        to: start.endOf('month').add(1, 'day').format('YYYY-MM-DD')
      }
      const [slots, requests] = await Promise.all([
        verificationService.fetchSlots(range),
        verificationService.fetchRequests(range)
      ])
      const buckets: Record<string, IVerificationDayData> = {}
      days.forEach((d) => { buckets[d] = { slots: [], requests: [] } })
      for (const s of slots) {
        buckets[dayjs(s.startsAt).format('YYYY-MM-DD')]?.slots.push(s)
      }
      for (const r of requests) {
        // A request without a slot (shown as «слот не призначено») lands on its creation day.
        buckets[dayjs(r.slot?.startsAt ?? r.createdAt).format('YYYY-MM-DD')]?.requests.push(r)
      }
      Object.assign(cache, buckets)
    } catch (e) {
      if (!opts?.silent) ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити дані верифікації'))
      throw e
    } finally {
      days.forEach((d) => loadingDates.delete(d))
    }
  }

  async function refreshMonth (day: string): Promise<void> {
    await loadMonth(day)
  }

  async function processRequest (day: string, id: string): Promise<void> {
    await verificationService.processRequest(id)
    await refreshMonth(day)
  }

  async function completeRequest (day: string, id: string, payload: TCompleteRequestPayload): Promise<void> {
    await verificationService.completeRequest(id, payload)
    await refreshMonth(day)
  }

  async function cancelRequest (day: string, id: string): Promise<void> {
    await verificationService.cancelRequest(id)
    await refreshMonth(day)
  }

  async function createSlots (day: string, starts: string[]): Promise<number> {
    const created = await verificationService.createSlots({ starts })
    await refreshMonth(day)
    return created.length
  }

  async function deleteSlot (day: string, slotId: string): Promise<void> {
    await verificationService.deleteSlot(slotId)
    await refreshMonth(day)
  }

  return {
    cache,
    loadingDates,
    loadMonth,
    refreshMonth,
    processRequest,
    completeRequest,
    cancelRequest,
    createSlots,
    deleteSlot
  }
})
