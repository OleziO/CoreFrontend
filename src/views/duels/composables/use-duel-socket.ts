import { duelsSocketService } from '@/views/duels/duels-socket.service'
import type { TDuelStatus } from '@/api/types/api.types'

/**
 * Тримає сокет `<API>/duels` відкритим, поки гравець залогінений і сторінка жива.
 * Кожен `duel:status` віддає в `onStatus`; `connected` каже, чи можна не полити REST.
 * Сокет один на застосунок (сервіс) — composable лише підписує/відписує цей scope.
 */
export const useDuelSocket = (onStatus: (status: TDuelStatus) => void) => {
  const authStore = useAuthStore()
  const connected = ref(duelsSocketService.isConnected)

  const stopStatus = duelsSocketService.onStatus(onStatus)
  const stopConnection = duelsSocketService.onConnection((value) => {
    connected.value = value
  })

  watch(
    () => authStore.token,
    (token) => {
      if (token) duelsSocketService.connect(token)
      else duelsSocketService.disconnect()
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    stopStatus()
    stopConnection()
    duelsSocketService.disconnect()
  })

  return { connected }
}
