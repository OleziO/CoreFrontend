import apiClient from '@/api/client'
import { AxiosError } from 'axios'

class TournamensService {
  async fetchTournaments () {
    const res = await apiClient.get('/api/v1/tournaments/')

    return res as TTournamentWithParticipants[]
  }

  async fetchAllTournaments () {
    const res = await apiClient.get('/api/v1/tournaments/all' as any)

    return res as TTournamentWithParticipants[]
  }

  async fetchDivisions () {
    try {
      const res = await apiClient.get('/api/v1/constants/divisions')
      return res
    } catch (e) {
    }
  }

  async registerInTeamTournament (tournamentId: number) {
    try {
      const res = await apiClient.post('/api/v1/tournaments/{tournament_id}/register', undefined, {
        dynamicKeys: {
          tournament_id: tournamentId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response.data.detail)
      throw e
    }
  }

  async unregisterFromTeamTournament (tournamentId: number) {
    try {
      const res = await apiClient.delete('/api/v1/tournaments/{tournament_id}/unregister', {
        dynamicKeys: {
          tournament_id: tournamentId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async adminUnregisterTeamFromTournament (tournamentId: number, teamId: number) {
    try {
      const res = await apiClient.delete('/api/v1/tournaments/{tournament_id}/unregister/{team_id}', {
        dynamicKeys: {
          tournament_id: tournamentId,
          team_id: teamId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async registerInMixTournament (tournamentId: number) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/register', undefined, {
        dynamicKeys: {
          tournament_id: tournamentId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response.data.detail)
      throw e
    }
  }

  async startTournament (tournamentId: number) {
    try {
      const res = await
      apiClient.post('/api/v1/tournaments/{tournament_id}/start-bracket', undefined, {
        dynamicKeys: {
          tournament_id: tournamentId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response.data.detail)
      throw e
    }
  }

  async endTournament (tournamentId: number, winnerId: number, _points: number) {
    try {
      const res = await apiClient.post(
        '/api/v1/tournaments/{tournament_id}/reward-winners',
        undefined,
        {
          dynamicKeys: {
            tournament_id: tournamentId
          },
          params: {
            winner_team_id: winnerId,
            points: _points
          }
        }
      )
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async openRegistrationTournament (tournamentId: number) {
    try {
      const res = await
      apiClient.post('/api/v1/tournaments/{tournament_id}/open-registration', undefined, {
        dynamicKeys: {
          tournament_id: tournamentId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response.data.detail)
      throw e
    }
  }

  async createTournament (
    tournament: TCreateTournament & { type?: string | null; limit?: number | null },
    imgFile: File
  ) {
    const fd = new FormData()

    fd.append('title', tournament.title)

    if (tournament.description) {
      fd.append('description', tournament.description)
    }

    if (tournament.prizes) {
      fd.append('prizes', tournament.prizes)
    }

    if (tournament.division_id) {
      fd.append('division_id', String(tournament.division_id))
    }

    fd.append('start_time', tournament.start_time)
    fd.append('end_time', tournament.end_time)
    fd.append('start_registration', tournament.start_registration)
    fd.append('end_registration', tournament.end_registration)
    fd.append('status', tournament.status)

    if (tournament.limit) {
      fd.append('limit', String(tournament.limit))
    }

    if (tournament.type) {
      fd.append('type', tournament.type)
    }

    fd.append('img', imgFile)

    return await apiClient.post('/api/v1/tournaments/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async updateTournament (
    tournament: TUpdateTournament & { type?: string | null; limit?: number | null },
    imgFile?: File
  ) {
    const fd = new FormData()

    fd.append('title', tournament.title)

    if (tournament.description) {
      fd.append('description', tournament.description)
    }

    if (tournament.prizes) {
      fd.append('prizes', tournament.prizes)
    }

    if (tournament.division_id) {
      fd.append('division_id', String(tournament.division_id))
    }

    fd.append('start_time', tournament.start_time)
    fd.append('end_time', tournament.end_time)
    fd.append('start_registration', tournament.start_registration)
    fd.append('end_registration', tournament.end_registration)
    fd.append('status', tournament.status)

    if (tournament.limit) {
      fd.append('limit', String(tournament.limit))
    }

    if (tournament.type) {
      fd.append('type', tournament.type)
    }

    if (imgFile) {
      fd.append('img', imgFile)
    }

    return await apiClient.put('/api/v1/tournaments/{tournament_id}', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      dynamicKeys: {
        tournament_id: tournament.id
      }
    })
  }

  async getOpenMatches (tournamentId: number) {
    try {
      const res = await apiClient.get('/api/v1/tournaments/{tournament_id}/matches/open', {
        dynamicKeys: { tournament_id: tournamentId }
      })

      return res
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data.detail)
      } else {
        ElMessage.error('Не вдалося отримати відкриті матчі')
      }
    }
  }

  async updateMatchResult (
    tournamentId: number,
    matchId: number,
    result: { team_1_score: number; team_2_score: number }
  ): Promise<TTournamentOpenMatch[]> {
    try {
      const res = await apiClient.put(
        '/api/v1/tournaments/{tournament_id}/matches/{match_id}/result',
        result,
        {
          dynamicKeys: {
            tournament_id: tournamentId,
            match_id: matchId
          }
        }
      )
      return res as TTournamentOpenMatch[]
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }
}

export const tournamentsService = new TournamensService()
