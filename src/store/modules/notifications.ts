import { notificationsService } from '@/services/notifications.service'
import { notificationsSocketService } from '@/services/notifications-socket.service'
import type { TNotification, TNotificationsSnapshot } from '@/api/types/api.types'

const EMPTY_SNAPSHOT: TNotificationsSnapshot = { items: [], unreadCount: 0 }
/** Запасний полінг, коли сокет не підключений. */
const NOTIFICATIONS_POLL_MS = 30_000

/**
 * Центр сповіщень: знімок інбоксу (останні 30 + непрочитані) для дзвіночка в хедері.
 * Основний канал — сокет `<API>/notifications`; поки він не підключений, полимо REST.
 * `start()` викликає хедер один раз — стор сам стежить за токеном і перепідключається.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()

  const snapshot = ref<TNotificationsSnapshot>(EMPTY_SNAPSHOT)
  const loaded = ref(false)
  const realtime = ref(false)
  const busyIds = ref(new Set<string>())

  const items = computed<TNotification[]>(() => snapshot.value.items)
  const unreadCount = computed(() => snapshot.value.unreadCount)
  /** Сповіщення, на які ще можна відповісти (кнопки прийняти / відхилити). */
  const actionable = computed(() => items.value.filter(n => n.status === 'pending'))

  function applySnapshot (next: TNotificationsSnapshot) {
    snapshot.value = next
    loaded.value = true
  }

  async function refetch (): Promise<void> {
    if (!authStore.token) return
    try {
      applySnapshot(await notificationsService.fetchSnapshot())
    } catch {
      // тихо — наступний пуш сокета або тик полінгу принесе знімок
    }
  }

  async function markAllRead (): Promise<void> {
    if (!unreadCount.value) return
    try {
      applySnapshot(await notificationsService.markRead())
    } catch {
      // тихо
    }
  }

  async function markRead (ids: string[]): Promise<void> {
    const unread = ids.filter(id => items.value.some(n => n.id === id && !n.readAt))
    if (!unread.length) return
    try {
      applySnapshot(await notificationsService.markRead(unread))
    } catch {
      // тихо
    }
  }

  function isBusy (id: string): boolean {
    return busyIds.value.has(id)
  }

  /** Дія над сповіщенням (прийняти / відхилити): спінер лише на цьому рядку, результат прийде пушем. */
  async function runAction (id: string, action: () => Promise<unknown>): Promise<boolean> {
    if (busyIds.value.has(id)) return false
    busyIds.value.add(id)
    try {
      await action()
      return true
    } catch {
      return false
    } finally {
      busyIds.value.delete(id)
    }
  }

  // ─── життєвий цикл сокета: один на застосунок ──────────────────────────────
  let started = false

  function start () {
    if (started) return
    started = true

    notificationsSocketService.onSnapshot(applySnapshot)
    notificationsSocketService.onConnection((connected) => {
      realtime.value = connected
    })

    const { pause, resume } = useIntervalFn(refetch, NOTIFICATIONS_POLL_MS, { immediate: false })

    watch(
      () => authStore.token,
      (token) => {
        if (token) {
          notificationsSocketService.connect(token)
          refetch()
        } else {
          notificationsSocketService.disconnect()
          snapshot.value = EMPTY_SNAPSHOT
          loaded.value = false
        }
      },
      { immediate: true }
    )

    watch(
      () => !!authStore.token && !realtime.value,
      (poll) => {
        if (poll) resume()
        else pause()
      },
      { immediate: true }
    )
  }

  return {
    snapshot,
    items,
    unreadCount,
    actionable,
    loaded,
    realtime,
    start,
    refetch,
    markAllRead,
    markRead,
    isBusy,
    runAction
  }
})
