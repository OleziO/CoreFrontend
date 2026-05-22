import apiClient from '@/api/client'

class DevService {
  mockMatch (tournamentId: string, teamAId: string, teamBId: string, phase: 'qualification' | 'playoff') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (apiClient as any).post('/dev/mock-match', { tournamentId, teamAId, teamBId, phase })
  }
}

export const devService = new DevService()
