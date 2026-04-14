import apiClient from '@/api/client'
import type { TTournament as Tournament, TCreateTournamentDto as CreateTournamentDto, TUpdateTournamentDto as UpdateTournamentDto } from '@/api/types/api.types'

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

  async createTournament (data: CreateTournamentDto): Promise<Tournament> {
    const res = await apiClient.post('/tournaments', data)
    return res as Tournament
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

  // TODO: endpoint not in API yet
  // async fetchAllTournaments () { ... }

  // TODO: endpoint not in API yet
  // async fetchDivisions () { ... }

  // TODO: endpoint not in API yet
  // async registerInTeamTournament (tournamentId: number) { ... }

  // TODO: endpoint not in API yet
  // async unregisterFromTeamTournament (tournamentId: number) { ... }

  // TODO: endpoint not in API yet
  // async adminUnregisterTeamFromTournament (tournamentId: number, teamId: number) { ... }

  // TODO: endpoint not in API yet
  // async startTournament (tournamentId: number) { ... }

  // TODO: endpoint not in API yet
  // async endTournament (tournamentId: number, winnerId: number, _points: number) { ... }

  // TODO: endpoint not in API yet
  // async openRegistrationTournament (tournamentId: number) { ... }

  // TODO: endpoint not in API yet
  // async getOpenMatches (tournamentId: number) { ... }

  // TODO: endpoint not in API yet
  // async updateMatchResult (tournamentId: number, matchId: number, result: { team_1_score: number; team_2_score: number }) { ... }
}

export const tournamentsService = new TournamentsService()
