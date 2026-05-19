import apiClient from '@/api/client'
import type {
  TTournament as Tournament,
  TQualificationPhase,
  TQualificationMatch,
  TTeamResponse,
  TPlayoffResponse,
  TPlayoffMatch,
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

  async joinTournament (tournamentId: string, teamId?: string): Promise<void> {
    await apiClient.post(
      '/tournaments/{id}/join',
      teamId ? { teamId } : {},
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /** POST /tournaments/:id/leave — зняти команду поточного капітана з турніру (під час кваліфікації). */
  async leaveTournament (tournamentId: string): Promise<void> {
    await apiClient.post('/tournaments/{id}/leave', {}, { dynamicKeys: { id: tournamentId } })
  }

  async submitQualificationMatch (
    tournamentId: string,
    dotaMatchId: string
  ): Promise<TQualificationMatch> {
    const res = await apiClient.post(
      '/tournaments/{id}/qualification/submit',
      { dotaMatchId },
      { dynamicKeys: { id: tournamentId } }
    )
    return res as TQualificationMatch
  }

  /**
   * GET /tournaments/:id/qualification/teams — команди, допущені до плей-оф
   * (мають хоча б один верифікований кваліфікаційний матч).
   */
  async fetchQualificationTeams (tournamentId: string): Promise<TTeamResponse[]> {
    const res = await apiClient.get('/tournaments/{id}/qualification/teams', {
      dynamicKeys: { id: tournamentId }
    })
    return res as TTeamResponse[]
  }

  /** GET /tournaments/:id/playoff/teams — поточний (ще не стартований) склад плей-оф. */
  async getPlayoffTeams (tournamentId: string): Promise<TTeamResponse[]> {
    const res = await apiClient.get('/tournaments/{id}/playoff/teams', {
      dynamicKeys: { id: tournamentId }
    })
    return res as TTeamResponse[]
  }

  /** POST /tournaments/:id/playoff/teams — додати команди до складу плей-оф (ідемпотентно). */
  async addPlayoffTeams (tournamentId: string, teamIds: string[]): Promise<TTeamResponse[]> {
    const res = await apiClient.post(
      '/tournaments/{id}/playoff/teams',
      { teamIds },
      { dynamicKeys: { id: tournamentId } }
    )
    return res as TTeamResponse[]
  }

  /** DELETE /tournaments/:id/playoff/teams — прибрати команди зі складу плей-оф (ідемпотентно). */
  async removePlayoffTeams (tournamentId: string, teamIds: string[]): Promise<TTeamResponse[]> {
    const res = await apiClient.delete('/tournaments/{id}/playoff/teams', {
      dynamicKeys: { id: tournamentId },
      data: { teamIds }
    })
    return res as TTeamResponse[]
  }

  /** POST /tournaments/:id/playoff/start — одноразовий запуск плей-оф (409, якщо вже стартовано). */
  async startPlayoff (tournamentId: string, teamIds: string[]): Promise<TPlayoffResponse> {
    const res = await apiClient.post(
      '/tournaments/{id}/playoff/start',
      { teamIds },
      { dynamicKeys: { id: tournamentId } }
    )
    return res as TPlayoffResponse
  }

  /** POST /tournaments/:id/playoff/disqualify — дискваліфікувати команду й перебудувати сітку. */
  async disqualifyPlayoffTeam (tournamentId: string, teamId: string): Promise<TPlayoffResponse> {
    const res = await apiClient.post(
      '/tournaments/{id}/playoff/disqualify',
      { teamId },
      { dynamicKeys: { id: tournamentId } }
    )
    return res as TPlayoffResponse
  }

  /** POST /tournaments/:id/playoff/submit — подати ID матчу Dota 2 (будь-який залогінений користувач). */
  async submitPlayoffMatch (tournamentId: string, dotaMatchId: string): Promise<TPlayoffMatch> {
    const res = await apiClient.post(
      '/tournaments/{id}/playoff/submit',
      { dotaMatchId },
      { dynamicKeys: { id: tournamentId } }
    )
    return res as TPlayoffMatch
  }

  /**
   * GET /tournaments/:id/playoff — публічний перегляд сітки.
   * 404, якщо плей-оф ще не стартовано → повертаємо null.
   */
  async fetchPlayoff (tournamentId: string): Promise<TPlayoffResponse | null> {
    try {
      const res = await apiClient.get('/tournaments/{id}/playoff', {
        dynamicKeys: { id: tournamentId }
      })
      return res as TPlayoffResponse
    } catch (e: unknown) {
      const status =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { status?: number } }).response?.status
          : undefined
      if (status === 404) return null
      throw e
    }
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
