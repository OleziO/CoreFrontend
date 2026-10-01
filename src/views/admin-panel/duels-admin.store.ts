import { queryCache } from '@/core/query-cache-client'
import type { TAdminDuel, TDuel, TDuelState, THostBot, TCreateHostBotDto } from '@/api/types/api.types'

/** Адмінка дуелей: список дуелей (з фільтром за станом) і пул ботів-хостів. */
export const useDuelsAdminStore = defineStore('duelsAdmin', () => {
  const duels = ref<TAdminDuel[]>([])
  const bots = ref<THostBot[]>([])
  const duelsLoading = ref(false)
  const botsLoading = ref(false)

  async function fetchDuels (state?: TDuelState, limit = 100): Promise<void> {
    duelsLoading.value = true
    try {
      duels.value = await duelsService.adminListDuels(state, limit)
    } finally {
      duelsLoading.value = false
    }
  }

  async function fetchBots (): Promise<void> {
    botsLoading.value = true
    try {
      bots.value = await duelsService.adminListBots()
    } finally {
      botsLoading.value = false
    }
  }

  /**
   * Мутації (cancel / recover / resolve) повертають публічний `DuelDto` без службових полів —
   * зливаємо його поверх наявного рядка, щоб не втратити hostBotId / error / serverSteamId.
   */
  function patchDuel (updated: TDuel): void {
    const ix = duels.value.findIndex((d) => d.id === updated.id)
    if (ix === -1) return
    duels.value.splice(ix, 1, { ...duels.value[ix], ...updated })
  }

  /**
   * Адмін-дії змінюють статус, лідерборд і профілі дуелянтів — позначаємо всі `['duels', …]`
   * запити застарілими, щоб відкриті сторінки дуелей перечитались без перезавантаження.
   */
  function invalidateDuelQueries (): void {
    queryCache.invalidateQueries({ key: ['duels'] }).catch(() => { /* тихо */ })
  }

  async function cancelDuel (id: string): Promise<void> {
    patchDuel(await duelsService.adminCancelDuel(id))
    invalidateDuelQueries()
  }

  async function recoverDuel (id: string): Promise<void> {
    patchDuel(await duelsService.adminRecoverDuel(id))
    invalidateDuelQueries()
  }

  async function resolveDuel (id: string, winnerId: string | null): Promise<void> {
    patchDuel(await duelsService.adminResolveDuel(id, winnerId))
    invalidateDuelQueries()
  }

  async function removeDuel (id: string): Promise<void> {
    await duelsService.adminDeleteDuel(id)
    duels.value = duels.value.filter((d) => d.id !== id)
  }

  async function deleteDuel (id: string): Promise<void> {
    await removeDuel(id)
    invalidateDuelQueries()
  }

  /**
   * Вибіркове видалення: по одній, послідовно — ендпоінт лише поштучний. Зупиняємось на першій
   * помилці (тост показав сервіс); уже видалені зникають зі списку. Повертає кількість видалених.
   */
  async function deleteDuels (ids: readonly string[]): Promise<number> {
    let deleted = 0
    try {
      for (const id of ids) {
        await removeDuel(id)
        deleted += 1
      }
    } finally {
      if (deleted) invalidateDuelQueries()
    }
    return deleted
  }

  async function addBot (dto: TCreateHostBotDto): Promise<void> {
    const created = await duelsService.adminCreateBot(dto)
    bots.value = [...bots.value, created]
  }

  /** Перезапуск одного бота або всіх (id не передано); список перечитуємо, щоб побачити скинутий lastError. */
  async function reloadBots (id?: number): Promise<number> {
    const count = id == null
      ? await duelsService.adminReloadBots()
      : await duelsService.adminReloadBot(id)
    await fetchBots()
    return count
  }

  async function setBotEnabled (id: number, enabled: boolean): Promise<void> {
    const updated = await duelsService.adminUpdateBot(id, { enabled })
    bots.value = bots.value.map((b) => (b.id === id ? updated : b))
  }

  async function removeBot (id: number): Promise<void> {
    await duelsService.adminRemoveBot(id)
    bots.value = bots.value.filter((b) => b.id !== id)
  }

  return {
    duels,
    bots,
    duelsLoading,
    botsLoading,
    fetchDuels,
    fetchBots,
    cancelDuel,
    resolveDuel,
    recoverDuel,
    deleteDuel,
    deleteDuels,
    addBot,
    setBotEnabled,
    reloadBots,
    removeBot
  }
})
