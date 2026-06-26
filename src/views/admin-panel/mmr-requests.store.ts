import type { TMmrUpdateRequest } from '@/views/players/mmr-requests.service'

export const useMmrRequestsStore = defineStore('mmrRequests', () => {
  const requests = ref<TMmrUpdateRequest[]>([])

  async function fetchRequests (status?: 'pending' | 'approved' | 'rejected'): Promise<void> {
    requests.value = await mmrRequestsService.listRequests(status)
  }

  async function approve (id: string): Promise<void> {
    await mmrRequestsService.approveRequest(id)
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  async function reject (id: string): Promise<void> {
    await mmrRequestsService.rejectRequest(id)
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  return { requests, fetchRequests, approve, reject }
})
