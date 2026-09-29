import apiClient from '@/api/client'

class LeaderboardService {
  /** Таблиця лідерів платформи: усі гравці з матчами чи трофеями, найкращий — перший. */
  async fetchLeaderboard () {
    return await apiClient.get('/leaderboard')
  }
}

export const leaderboardService = new LeaderboardService()
