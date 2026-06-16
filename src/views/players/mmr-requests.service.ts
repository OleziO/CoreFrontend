import { apiClientV2 } from '@/api/client-v2'

export type TMmrProof = {
  id: string
  name: string
  url: string
}

export type TMmrUpdateRequest = {
  id: string
  playerId: string
  oldMmr: number
  newMmr: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  player: {
    id: string
    discordName: string
    discordUsername: string
    avatarUrl: string | null
  }
  team: {
    id: string
    name: string
  } | null
  proofs: TMmrProof[]
}

class MmrRequestsService {
  async createRequest (newMmr: number, proofs: File[]): Promise<TMmrUpdateRequest> {
    const form = new FormData()
    form.append('newMmr', String(newMmr))
    proofs.forEach((file) => form.append('proofs', file))
    return apiClientV2.post<TMmrUpdateRequest>('/mmr-requests', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async getMyRequest (): Promise<TMmrUpdateRequest | null> {
    try {
      return await apiClientV2.get<TMmrUpdateRequest>('/mmr-requests/me')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return null
      throw err
    }
  }

  async listRequests (status?: 'pending' | 'approved' | 'rejected'): Promise<TMmrUpdateRequest[]> {
    return apiClientV2.get<TMmrUpdateRequest[]>('/mmr-requests', {
      params: status ? { status } : undefined
    })
  }

  async approveRequest (id: string): Promise<TMmrUpdateRequest> {
    return apiClientV2.post<TMmrUpdateRequest>(`/mmr-requests/${id}/approve`)
  }

  async rejectRequest (id: string): Promise<TMmrUpdateRequest> {
    return apiClientV2.post<TMmrUpdateRequest>(`/mmr-requests/${id}/reject`)
  }
}

export const mmrRequestsService = new MmrRequestsService()
