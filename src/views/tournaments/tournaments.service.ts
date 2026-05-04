import apiClient from '@/api/client'
import type {
  TTournament as Tournament,
  TQualificationPhase,
  TQualificationMatch,
  TCreateTournamentDto as CreateTournamentDto,
  TUpdateTournamentDto as UpdateTournamentDto
} from '@/api/types/api.types'
import { validateImageFileForUpload } from '@/services/image-upload.service'

class TournamentsService {
  async fetchTournaments (): Promise<Tournament[]> {
    const res = await apiClient.get('/tournaments')
    return res as Tournament[]
  }

  async fetchTournament (id: string): Promise<Tournament> {
    const res = await apiClient.get('/tournaments/{id}', {
      dynamicKeys: { id }
    })
    return res as Tournament
  }

  /**
   * Після появи GET /tournaments/:id/qualification на бекенді — використовуємо його;
   * інакше 404 і повертаємо null.
   */
  async fetchQualification (tournamentId: string): Promise<TQualificationPhase | null> {
    try {
      const res = await apiClient.get('/tournaments/{id}/qualification', {
        dynamicKeys: { id: tournamentId }
      })
      return res as TQualificationPhase
    } catch (e: unknown) {
      const status =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { status?: number } }).response?.status
          : undefined
      if (status === 404) return null
      throw e
    }
  }

  async createTournament (data: CreateTournamentDto): Promise<Tournament> {
    const res = await apiClient.post('/tournaments', data)
    return res as Tournament
  }

  async joinTournament (tournamentId: string): Promise<void> {
    await apiClient.post(
      '/tournaments/{id}/join',
      {},
      { dynamicKeys: { id: tournamentId } }
    )
  }

  async submitQualificationMatch (
    tournamentId: string,
    qualMatchId: string,
    dotaMatchId: string
  ): Promise<TQualificationMatch> {
    const res = await apiClient.post(
      '/tournaments/{tournamentId}/qualification/matches/{qualMatchId}/submit',
      { dotaMatchId },
      { dynamicKeys: { tournamentId, qualMatchId } }
    )
    return res as TQualificationMatch
  }

  private async postMultipartTournamentBanner (
    path: '/tournaments/{id}/header-banner' | '/tournaments/{id}/list-banner' | '/tournaments/{id}/grid',
    tournamentId: string,
    file: File
  ): Promise<{ url?: string } | void> {
    const err = validateImageFileForUpload(file)
    if (err != null) throw new Error(err)
    const fd = new FormData()
    fd.append('file', file)
    return await apiClient.post(path, fd as never, {
      dynamicKeys: { id: tournamentId }
    }) as Promise<{ url?: string } | void>
  }

  uploadHeaderBanner (tournamentId: string, file: File) {
    return this.postMultipartTournamentBanner('/tournaments/{id}/header-banner', tournamentId, file)
  }

  uploadListBanner (tournamentId: string, file: File) {
    return this.postMultipartTournamentBanner('/tournaments/{id}/list-banner', tournamentId, file)
  }

  uploadGrid (tournamentId: string, file: File) {
    return this.postMultipartTournamentBanner('/tournaments/{id}/grid', tournamentId, file)
  }

  async updateTournament (id: string, data: UpdateTournamentDto): Promise<Tournament> {
    const res = await apiClient.patch('/tournaments/{id}', data, {
      dynamicKeys: { id }
    })
    return res as Tournament
  }

  async deleteTournament (id: string): Promise<void> {
    await apiClient.delete('/tournaments/{id}', {
      dynamicKeys: { id }
    })
  }
}

export const tournamentsService = new TournamentsService()
