import { AxiosError } from 'axios'
import type { TTournament as Tournament } from '@/api/types/api.types'

export const useTournamentStore = defineStore('tournaments', () => {
  const tournamentsData = ref<Tournament[]>([])
  const loading = ref(false)

  async function getTournaments () {
    if (tournamentsData.value.length) return

    loading.value = true
    try {
      const data = await tournamentsService.fetchTournaments()
      tournamentsData.value = data || []
      return data
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e.response?.data?.detail || 'Помилка при завантаженні турнірів')
      }
    } finally {
      loading.value = false
    }
  }

  async function findTournament (tournamentId: string | null) {
    if (!tournamentsData.value.length) {
      await getTournaments()
    }

    if (!tournamentId) return null

    return tournamentsData.value.find(t => t.id === tournamentId) || null
  }

  // TODO: endpoint not in API yet
  // async function getDivisions () { ... }

  // TODO: endpoint not in API yet
  // async function registerInTeamTournament (tournamentId: string) { ... }

  // TODO: endpoint not in API yet
  // async function unRegisterInTeamTournament (tournamentId: string) { ... }

  // TODO: endpoint not in API yet
  // const startTournament = async (tournamentId: string) => { ... }

  // TODO: endpoint not in API yet
  // const openRegistrationTournament = async (tournamentId: string) => { ... }

  // TODO: endpoint not in API yet
  // const endTournament = async (tournamentId: string, winnerId: string, _points: number) => { ... }

  // TODO: endpoint not in API yet
  // async function getOpenMatches (tournamentId: string) { ... }

  // TODO: endpoint not in API yet
  // const adminUnregisterTeamFromTournament = async (tournamentId: string, teamId: string) => { ... }

  return {
    tournamentsData,
    loading,
    getTournaments,
    findTournament
  }
})
