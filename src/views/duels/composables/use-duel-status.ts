import { useQueryCache } from '@pinia/colada'
import { DUEL_STATUS_QUERY_KEY, useGetDuelStatus } from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import { DUEL_STATUS_POLL_MS } from '@/views/duels/duels.utils'
import type { TDuelStatus } from '@/api/types/api.types'

/**
 * Мій 1v1 статус + полінг. `GET /duels/me` — це ще й heartbeat черги: бекенд
 * викидає з черги того, хто перестав опитувати (20 с), тож інтервал працює
 * рівно доти, доки гравець у черзі або в активній дуелі.
 */
export const useDuelStatus = () => {
  const authStore = useAuthStore()
  const queryCache = useQueryCache()

  const isLoggedIn = computed(() => !!authStore.token)
  const query = useGetDuelStatus(() => isLoggedIn.value)

  const status = computed<TDuelStatus | null>(() => (isLoggedIn.value ? (query.data.value ?? null) : null))
  const isPending = computed(() => isLoggedIn.value && query.isPending.value)
  const isError = computed(() => isLoggedIn.value && !!query.error.value)

  const shouldPoll = computed(
    () => isLoggedIn.value && !!status.value && (status.value.queue != null || status.value.activeDuel != null)
  )

  const { pause, resume } = useIntervalFn(
    () => {
      void query.refetch()
    },
    DUEL_STATUS_POLL_MS,
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

  function applyStatus (next: TDuelStatus) {
    queryCache.setQueryData([...DUEL_STATUS_QUERY_KEY], next)
  }

  const joining = ref(false)
  const leaving = ref(false)

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

  /** Після завершення дуелі історія/рейтинг/дошка застаріли — перечитуємо все з префіксом `duels`. */
  function invalidateDuelQueries () {
    void queryCache.invalidateQueries({ key: ['duels'] })
  }

  return {
    status,
    isPending,
    isError,
    isLoggedIn,
    joining,
    leaving,
    join,
    leave,
    refetch: () => query.refetch(),
    invalidateDuelQueries
  }
}
