import { AxiosError } from 'axios'
import { queryCache } from '@/core/query-cache-client'
import type { TCreateTournamentDto, TUpdateTournamentDto } from '@/api/types/api.types'

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

  function invalidateTournamentsCache () {
    queryCache.invalidateQueries({ key: ['tournaments'] })
  }

  async function createTournament (data: TCreateTournamentDto): Promise<TTournament> {
    const created = await tournamentsService.createTournament(data) as TTournament
    patchTournamentInList(created)
    invalidateTournamentsCache()
    return created
  }

  async function updateTournament (id: string, data: TUpdateTournamentDto): Promise<TTournament> {
    const updated = await tournamentsService.updateTournament(id, data) as TTournament
    patchTournamentInList(updated)
    invalidateTournamentsCache()
    return updated
  }

  async function deleteTournament (id: string): Promise<void> {
    await tournamentsService.deleteTournament(id)
    removeTournamentFromList(id)
    invalidateTournamentsCache()
  }

  /**
   * Перечитує турнір з беку та оновлює і список, і поточну сутність деталки.
   * Повертає TTournament або null (помилку показує сервіс через ElMessage).
   */
  async function reloadTournament (id: string): Promise<TTournament | null> {
    const fresh = await tournamentsService.reloadTournament(id)
    if (fresh) patchTournamentInList(fresh)
    return fresh
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
    removeTournamentFromList,
    createTournament,
    updateTournament,
    deleteTournament,
    reloadTournament
  }
})
