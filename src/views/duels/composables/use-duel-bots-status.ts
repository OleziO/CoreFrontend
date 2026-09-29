import { useGetDuelBotsStatus } from '@/views/duels/duels.queries'
import { DUEL_BOTS_POLL_MS } from '@/views/duels/duels.utils'
import type { TDuelBotsStatus } from '@/api/types/api.types'

/**
 * Публічний стан пулу ботів-хостів з полінгом кожні 10 с, поки компонент живий.
 * `isOffline` — жоден бот не онлайн: черга закрита, індикатор червоний.
 */
export const useDuelBotsStatus = () => {
  const query = useGetDuelBotsStatus()

  const bots = computed<TDuelBotsStatus | null>(() => query.data.value ?? null)
  const isPending = computed(() => query.isPending.value)
  const isError = computed(() => !!query.error.value)
  const isOffline = computed(() => !!bots.value && bots.value.online === 0)

  useIntervalFn(
    () => {
      query.refetch().catch(() => { /* тихо — наступний тик спробує знову */ })
    },
    DUEL_BOTS_POLL_MS,
    { immediate: true }
  )

  return { bots, isPending, isError, isOffline, refetch: () => query.refetch() }
}
