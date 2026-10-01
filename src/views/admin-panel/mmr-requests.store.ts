import { usePlayersStore } from '@/views/players/players.store'
import type { TMmrUpdateRequest } from '@/views/players/mmr-requests.service'

export const useMmrRequestsStore = defineStore('mmrRequests', () => {
  const requests = ref<TMmrUpdateRequest[]>([])

  /** Кількість запитів у черзі — бейдж на вкладці адмінки. `null` — ще не завантажено. */
  const pendingCount = ref<number | null>(null)

  async function fetchRequests (status?: 'pending' | 'approved' | 'rejected'): Promise<void> {
    requests.value = await mmrRequestsService.listRequests(status)
    if (status === 'pending') pendingCount.value = requests.value.length
  }

  async function fetchPendingCount (): Promise<void> {
    const pending = await mmrRequestsService.listRequests('pending')
    pendingCount.value = pending.length
  }

  function removeFromList (id: string): void {
    const removed = requests.value.find((r) => r.id === id)
    requests.value = requests.value.filter((r) => r.id !== id)
    if (removed?.status === 'pending' && pendingCount.value) pendingCount.value -= 1
  }

  async function approve (id: string): Promise<void> {
    const approved = await mmrRequestsService.approveRequest(id)
    const playerId = approved?.playerId ?? requests.value.find((r) => r.id === id)?.playerId
    removeFromList(id)
    // Новий MMR (і перерахований бекендом rank) — у список гравців, ростери та /me без перезавантаження.
    if (playerId) usePlayersStore().refreshPlayer(playerId).catch(() => {})
  }

  async function reject (id: string): Promise<void> {
    await mmrRequestsService.rejectRequest(id)
    removeFromList(id)
  }

  return { requests, pendingCount, fetchRequests, fetchPendingCount, approve, reject }
})
