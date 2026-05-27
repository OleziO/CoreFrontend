import { AxiosError } from 'axios'

export const useTournamentStore = defineStore('tournaments', () => {
  const tournamentsData = ref<TTournament[]>([])
  const loading = ref(false)

  function patchTournamentInList (next: TTournament) {
    const i = tournamentsData.value.findIndex(t => t.id === next.id)
    if (i >= 0) {
      tournamentsData.value[i] = next
    } else {
      tournamentsData.value.unshift(next)
    }
  }

  function removeTournamentFromList (id: string) {
    tournamentsData.value = tournamentsData.value.filter(t => t.id !== id)
  }

  async function getTournaments (opts?: { force?: boolean }) {
    if (!opts?.force && tournamentsData.value.length) return

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

  return {
    tournamentsData,
    loading,
    getTournaments,
    findTournament,
    patchTournamentInList,
    removeTournamentFromList
  }
})
