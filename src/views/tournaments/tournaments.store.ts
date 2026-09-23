import { AxiosError } from 'axios'
import { queryCache } from '@/core/query-cache-client'
import type { TCreateTournamentDto, TUpdateTournamentDto } from '@/api/types/api.types'
import { entitySync } from '@/store/entity-sync'
import {
  mergeDefined,
  overlayTeamOntoTournamentTeam,
  patchPlayerInRosterHolder,
  removePlayerFromRosterHolder
} from '@/core/utils/entity-sync.utils'

export const useTournamentStore = defineStore('tournaments', () => {
  const tournamentsData = ref<TTournament[]>([])
  const loading = ref(false)
  /**
   * Чи завантажено повний список. Не покладаємось на `tournamentsData.length`: після прямого
   * заходу на сторінку `patchTournamentInList` додає один запис, і порожній кеш перестає бути порожнім.
   */
  const listLoaded = ref(false)

  /**
   * Оновити кеш турніру й розіслати зміну в інші стори (`team.tournaments[]` у командах).
   * Злиття зберігає клієнтські поля (`qualification`) та поля, яких немає в частковій відповіді.
   */
  function patchTournamentInList (next: TTournament) {
    const i = tournamentsData.value.findIndex(t => t.id === next.id)
    if (i >= 0) {
      tournamentsData.value[i] = mergeDefined(tournamentsData.value[i], next)
    } else {
      tournamentsData.value.unshift(next)
    }
    entitySync.tournamentChanged(next)
  }

  function removeTournamentFromList (id: string) {
    tournamentsData.value = tournamentsData.value.filter(t => t.id !== id)
    entitySync.tournamentRemoved(id)
  }

  // ─── Непропагуючі мутатори для entity-sync (не викликають хаб) ──────────────

  /** Замінює `tournament.teams[]` лише якщо хоча б одна команда змінилась. */
  function replaceTournamentTeamsWhereChanged (transform: (team: TTournamentTeam) => TTournamentTeam) {
    for (let i = 0; i < tournamentsData.value.length; i++) {
      const t = tournamentsData.value[i]
      if (!Array.isArray(t.teams)) continue
      let changed = false
      const teams = t.teams.map((team) => {
        const next = transform(team)
        if (next !== team) changed = true
        return next
      })
      if (changed) tournamentsData.value[i] = { ...t, teams }
    }
  }

  /** Гравець змінився — оновлюємо його копії в ростерах команд-учасниць. */
  function applyPlayerToRosters (updated: TPlayer) {
    replaceTournamentTeamsWhereChanged(team => patchPlayerInRosterHolder(team, updated))
  }

  function removePlayerFromRosters (playerId: string) {
    replaceTournamentTeamsWhereChanged(team => removePlayerFromRosterHolder(team, playerId))
  }

  /** Команда змінилась — накладаємо її поля на ембеднуту копію в турнірах, де вона бере участь. */
  function applyTeamToTournaments (team: TTeam) {
    replaceTournamentTeamsWhereChanged(embedded =>
      embedded.id === team.id ? overlayTeamOntoTournamentTeam(embedded, team) : embedded
    )
  }

  /** Команду розпущено — прибираємо з учасників усіх турнірів. */
  function removeTeamFromTournaments (teamId: string) {
    for (let i = 0; i < tournamentsData.value.length; i++) {
      const t = tournamentsData.value[i]
      if (!t.teams?.some(team => team.id === teamId)) continue
      tournamentsData.value[i] = { ...t, teams: t.teams.filter(team => team.id !== teamId) }
    }
  }

  // ─── Мутації через API ───────────────────────────────────────────────────────

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
   * Перечитує турнір з беку та оновлює список (деталка читає з нього через computed).
   * Повертає TTournament або null (помилку показує сервіс через ElMessage).
   */
  async function reloadTournament (id: string): Promise<TTournament | null> {
    const fresh = await tournamentsService.reloadTournament(id)
    if (fresh) patchTournamentInList(fresh)
    return fresh
  }

  // ─── Читання ─────────────────────────────────────────────────────────────────

  async function getTournaments (opts?: { force?: boolean }) {
    if (!opts?.force && listLoaded.value) return tournamentsData.value

    loading.value = true
    try {
      const data = await tournamentsService.fetchTournaments()
      tournamentsData.value = data || []
      listLoaded.value = true
      entitySync.tournamentsLoaded(tournamentsData.value)
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
    if (!listLoaded.value) {
      await getTournaments()
    }

    if (!tournamentId) return null

    return tournamentsData.value.find(t => t.id === tournamentId) || null
  }

  return {
    tournamentsData,
    loading,
    listLoaded,
    getTournaments,
    findTournament,
    patchTournamentInList,
    removeTournamentFromList,
    applyPlayerToRosters,
    removePlayerFromRosters,
    applyTeamToTournaments,
    removeTeamFromTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    reloadTournament
  }
})
