import { useQueryCache } from '@pinia/colada'
import { DUEL_BOTS_STATUS_QUERY_KEY, DUEL_STATUS_QUERY_KEY, useGetDuelStatus } from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import { useDuelSocket } from '@/views/duels/composables/use-duel-socket'
import { DUEL_ACCEPT_POLL_MS, DUEL_STATUS_POLL_MS } from '@/views/duels/duels.utils'
import type { TDuelStatus } from '@/api/types/api.types'

/**
 * Мій 1v1 статус. Основний канал — сокет `<API>/duels`: сервер сам шле свіжий
 * статус після кожної зміни, а живе з'єднання і є heartbeat черги. Полінг
 * `GET /duels/me` лишається запасним: працює лише поки сокет не підключений,
 * бо цей запит — теж heartbeat (без нього бекенд викидає з черги за 20 с).
 */
export const useDuelStatus = () => {
  const authStore = useAuthStore()
  const queryCache = useQueryCache()

  const isLoggedIn = computed(() => !!authStore.token)
  const query = useGetDuelStatus(() => isLoggedIn.value)

  const status = computed<TDuelStatus | null>(() => (isLoggedIn.value ? (query.data.value ?? null) : null))
  const isPending = computed(() => isLoggedIn.value && query.isPending.value)
  const isError = computed(() => isLoggedIn.value && !!query.error.value)

  function applyStatus (next: TDuelStatus) {
    queryCache.setQueryData([...DUEL_STATUS_QUERY_KEY], next)
    // Знімок містить і стан пулу ботів — смужка ботів оновлюється тим самим пушем.
    queryCache.setQueryData([...DUEL_BOTS_STATUS_QUERY_KEY], next.bots)
  }

  /** `realtime` — сокет підключений: статус приходить сам, полінг не потрібен. */
  const { connected: realtime } = useDuelSocket(applyStatus)

  const shouldPoll = computed(
    () =>
      isLoggedIn.value &&
      !realtime.value &&
      !!status.value &&
      (status.value.queue != null || status.value.activeDuel != null)
  )

  /** Поки матч чекає на «Прийняти», опитуємо частіше — дедлайн 30 с. */
  const pollMs = computed(() =>
    (status.value?.activeDuel?.state === 'ACCEPTING' ? DUEL_ACCEPT_POLL_MS : DUEL_STATUS_POLL_MS)
  )

  const { pause, resume } = useIntervalFn(
    () => {
      query.refetch().catch(() => { /* тихо — наступний тик спробує знову */ })
    },
    pollMs,
    { immediate: false }
  )

  watch(
    shouldPoll,
    (poll) => {
      if (poll) resume()
      else pause()
    },
    { immediate: true }
  )

  /** Після завершення дуелі історія/рейтинг/дошка застаріли — перечитуємо все з префіксом `duels`. */
  function invalidateDuelQueries () {
    queryCache.invalidateQueries({ key: ['duels'] }).catch(() => { /* тихо */ })
  }

  const joining = ref(false)
  const leaving = ref(false)
  const accepting = ref(false)
  const cancelling = ref(false)

  async function join (): Promise<boolean> {
    if (joining.value) return false
    joining.value = true
    try {
      applyStatus(await duelsService.joinQueue())
      return true
    } catch {
      return false
    } finally {
      joining.value = false
    }
  }

  async function leave (): Promise<boolean> {
    if (leaving.value) return false
    leaving.value = true
    try {
      applyStatus(await duelsService.leaveQueue())
      return true
    } catch {
      return false
    } finally {
      leaving.value = false
    }
  }

  /** Прийняти знайдений матч (стан ACCEPTING). */
  async function accept (): Promise<boolean> {
    const duel = status.value?.activeDuel
    if (!duel || accepting.value) return false
    accepting.value = true
    try {
      applyStatus(await duelsService.acceptDuel(duel.id))
      return true
    } catch {
      return false
    } finally {
      accepting.value = false
    }
  }

  /** Скасувати свою дуель (−10, суперник повертається в чергу). */
  async function cancel (): Promise<boolean> {
    const duel = status.value?.activeDuel
    if (!duel || cancelling.value) return false
    cancelling.value = true
    try {
      applyStatus(await duelsService.cancelDuel(duel.id))
      invalidateDuelQueries()
      return true
    } catch {
      return false
    } finally {
      cancelling.value = false
    }
  }

  /** Адмін скасовує свою ж дуель без штрафу — адмінським ендпоінтом, після чого перечитуємо статус. */
  async function adminCancel (): Promise<boolean> {
    const duel = status.value?.activeDuel
    if (!duel || cancelling.value) return false
    cancelling.value = true
    try {
      await duelsService.adminCancelDuel(duel.id)
      await query.refetch()
      invalidateDuelQueries()
      return true
    } catch {
      return false
    } finally {
      cancelling.value = false
    }
  }

  return {
    status,
    isPending,
    isError,
    isLoggedIn,
    realtime,
    joining,
    leaving,
    accepting,
    cancelling,
    join,
    leave,
    accept,
    cancel,
    adminCancel,
    refetch: () => query.refetch(),
    invalidateDuelQueries
  }
}
