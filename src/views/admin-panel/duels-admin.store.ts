import type { TDuel, TDuelState, THostBot, TCreateHostBotDto } from '@/api/types/api.types'

/** Адмінка 1v1: список дуелей (з фільтром за станом) і пул ботів-хостів. */
export const useDuelsAdminStore = defineStore('duelsAdmin', () => {
  const duels = ref<TDuel[]>([])
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

  function patchDuel (updated: TDuel): void {
    const ix = duels.value.findIndex((d) => d.id === updated.id)
    if (ix === -1) duels.value.unshift(updated)
    else duels.value.splice(ix, 1, updated)
  }

  async function cancelDuel (id: string): Promise<void> {
    patchDuel(await duelsService.adminCancelDuel(id))
  }

  async function resolveDuel (id: string, winnerId: string | null): Promise<void> {
    patchDuel(await duelsService.adminResolveDuel(id, winnerId))
  }

  async function addBot (dto: TCreateHostBotDto): Promise<void> {
    const created = await duelsService.adminCreateBot(dto)
    bots.value = [...bots.value, created]
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
    addBot,
    setBotEnabled,
    removeBot
  }
})
