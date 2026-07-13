import apiClient from '@/api/client'
import type {
  TQualificationPhase,
  TQualificationMatch,
  TCreateTournamentDto as CreateTournamentDto,
  TUpdateTournamentDto as UpdateTournamentDto
} from '@/api/types/api.types'
import { validateImageFileForUpload } from '@/services/image-upload.service'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'

class TournamentsService {
  async fetchTournaments () {
    return await apiClient.get('/tournaments') as TTournament[]
  }

  async fetchTournament (id: string) {
    return await apiClient.get('/tournaments/{id}', {
      dynamicKeys: { id }
    })
  }

  /**
   * Після появи GET /tournaments/:id/qualification на бекенді — використовуємо його;
   * інакше 404 і повертаємо null.
   */
  async fetchQualification (tournamentId: string) {
    try {
      return await apiClient.get('/tournaments/{id}/qualification', {
        dynamicKeys: { id: tournamentId }
      }) as TQualificationPhase
    } catch (e: unknown) {
      const status =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { status?: number } }).response?.status
          : undefined
      if (status === 404) return null
      throw e
    }
  }

  async createTournament (data: CreateTournamentDto) {
    return await apiClient.post('/tournaments', data)
  }

  async joinTournament (tournamentId: string, teamId?: string) {
    await apiClient.post(
      '/tournaments/{id}/join',
      teamId ? { teamId } : {},
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /** POST /tournaments/:id/leave — зняти команду поточного капітана з турніру (під час кваліфікації). */
  async leaveTournament (tournamentId: string) {
    await apiClient.post('/tournaments/{id}/leave', {}, { dynamicKeys: { id: tournamentId } })
  }

  /**
   * GET /tournaments/:id/payments — статус оплати вступного внеску по кожній команді.
   * Ендпоінт ще відсутній у згенерованій схемі, тож викликаємо через нетипізований клієнт.
   */
  async fetchTournamentPayments (tournamentId: string): Promise<TTournamentPaymentSummary[]> {
    const rawGet = apiClient.get as unknown as (url: string) => Promise<unknown>
    return await rawGet(`/tournaments/${tournamentId}/payments`) as TTournamentPaymentSummary[]
  }

  /** POST /tournaments/:id/payments/:teamId/mark-paid — адмін позначає команду як таку, що сплатила внесок. */
  async adminMarkTeamPaid (
    tournamentId: string,
    teamId: string,
    note?: string
  ): Promise<TTournamentPaymentSummary> {
    const rawPost = apiClient.post as unknown as (url: string, data?: unknown) => Promise<unknown>
    return await rawPost(
      `/tournaments/${tournamentId}/payments/${teamId}/mark-paid`,
      note ? { note } : {}
    ) as TTournamentPaymentSummary
  }

  async submitQualificationMatch (
    tournamentId: string,
    dotaMatchId: string
  ): Promise<TQualificationMatch> {
    return await apiClient.post(
      '/tournaments/{id}/qualification/submit',
      { dotaMatchId },
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /**
   * GET /tournaments/:id/qualification/teams — команди, допущені до плей-оф
   * (мають хоча б один верифікований кваліфікаційний матч).
   */
  async fetchQualificationTeams (tournamentId: string) {
    return await apiClient.get('/tournaments/{id}/qualification/teams', {
      dynamicKeys: { id: tournamentId }
    })
  }

  /**
   * Плей-оф стартує автоматично планувальником бекенду о `tournamentStartsAt`
   * (див. TournamentPlayoffScheduler) з усіма допущеними командами, тож ручні
   * ендпоінти стейджингу/старту (`playoff/teams`, `playoff/start`) фронтенд більше не викликає.
   */

  /** GET /tournaments/:id/playoff/open-matches — відкриті матчі сітки (для адмін-дії «Технічна поразка»). */
  async fetchPlayoffOpenMatches (tournamentId: string) {
    return await apiClient.get('/tournaments/{id}/playoff/open-matches', {
      dynamicKeys: { id: tournamentId }
    })
  }

  /** POST /admin/matches/:matchId/result — технічна поразка у кваліфікації (може перезаписати наявний результат). */
  async adminTechLossQualificationMatch (
    matchId: string,
    winnerTeamId: string
  ) {
    return await apiClient.post(
      '/admin/matches/{matchId}/result',
      { winnerTeamId, winnerPoints: 100, loserPoints: 40 },
      { dynamicKeys: { matchId } }
    ) as { matchId: string; winnerId: string }
  }

  /** POST /tournaments/:id/playoff/tech-loss — техпораз у плей-оф, скасовує наступні матчі та перебудовує сітку за потреби. */
  async adminTechLossPlayoffMatch (
    tournamentId: string,
    winnerTeamId: string,
    loserTeamId: string
  ) {
    return await apiClient.post(
      '/tournaments/{id}/playoff/tech-loss',
      { winnerTeamId, loserTeamId },
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /** POST /tournaments/:id/playoff/disqualify — дискваліфікувати команду й перебудувати сітку. */
  async disqualifyPlayoffTeam (tournamentId: string, teamId: string) {
    return await apiClient.post(
      '/tournaments/{id}/playoff/disqualify',
      { teamId },
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /** POST /tournaments/:id/playoff/submit — подати ID матчу Dota 2 (будь-який залогінений користувач). */
  async submitPlayoffMatch (tournamentId: string, dotaMatchId: string) {
    return await apiClient.post(
      '/tournaments/{id}/playoff/submit',
      { dotaMatchId },
      { dynamicKeys: { id: tournamentId } }
    )
  }

  /**
   * GET /tournaments/:id/playoff — публічний перегляд сітки.
   * 404, якщо плей-оф ще не стартовано → повертаємо null.
   */
  async fetchPlayoff (tournamentId: string) {
    try {
      return await apiClient.get('/tournaments/{id}/playoff', {
        dynamicKeys: { id: tournamentId }
      })
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

  async updateTournament (id: string, data: UpdateTournamentDto) {
    return await apiClient.patch('/tournaments/{id}', data, {
      dynamicKeys: { id }
    })
  }

  async deleteTournament (id: string) {
    await apiClient.delete('/tournaments/{id}', {
      dynamicKeys: { id }
    })
  }

  /**
   * Перезавантажує дані турніру та оновлює список у сховищі.
   * Показує ElMessage.error при помилці.
   * Повертає TTournament або null при помилці.
   */
  async reloadTournament (tournamentId: string): Promise<TTournament | null> {
    try {
      return await this.fetchTournament(tournamentId)
    } catch (e: unknown) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити дані турніру'))
      return null
    }
  }

  /**
   * Записує команду на турнір і показує тост при успіху.
   * При помилці повертає повідомлення без відображення ElMessage
   * (відображення залишається на стороні виду для кастомної логіки).
   */
  async joinTournamentWithToast (tournamentId: string): Promise<{ success: boolean; errorMsg: string | null }> {
    try {
      await this.joinTournament(tournamentId)
      ElMessage.success('Команду успішно записано на турнір')
      return { success: true, errorMsg: null }
    } catch (e: unknown) {
      const errorMsg = getApiErrorMessage(e, 'Не вдалося приєднатися до турніру')
      return { success: false, errorMsg }
    }
  }

  /**
   * Знімає команду з турніру і показує тост при успіху чи помилці.
   * Повертає true при успіху, false при помилці.
   */
  async leaveTournamentWithToast (tournamentId: string): Promise<boolean> {
    try {
      await this.leaveTournament(tournamentId)
      ElMessage.success('Команда покинула турнір')
      return true
    } catch (e: unknown) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося покинути турнір'))
      return false
    }
  }
}

export const tournamentsService = new TournamentsService()
