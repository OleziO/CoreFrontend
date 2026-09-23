import { defineStore } from 'pinia'

import { teamsService, type TCreateTeamPayload, type TUpdateTeamPayload } from '@/views/teams/teams.service'
import type { TAddTeamPlayerDto } from '@/api/types/api.types'
import type { ERemovePlayerPenalty } from '@/views/teams/teams.enums'
import { entitySync } from '@/store/entity-sync'
import {
  applyTournamentMembershipToTeam,
  mergeDefined,
  patchPlayerInRosterHolder,
  removePlayerFromRosterHolder,
  removeTournamentFromTeam
} from '@/core/utils/entity-sync.utils'

export const useTeamsStore = defineStore('teams', () => {
  const router = useRouter()

  const teams = ref<TTeam[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  /**
   * Чи завантажено повний список. Не покладаємось на `teams.length`: після прямого
   * заходу на картку `patchTeamInList` додає один запис, і порожній кеш перестає бути порожнім.
   */
  const listLoaded = ref(false)

  /**
   * Оновити кеш команди після мутації (ростер, профіль, верифікація тощо) і розіслати зміну
   * в інші стори (teamId гравців і /me, ембеднуті команди в турнірах).
   * Якщо команди ще немає в списку — додає запис (наприклад після прямого заходу на картку).
   */
  function patchTeamInList (next: TTeam) {
    const i = teams.value.findIndex(t => t.id === next.id)
    if (i >= 0) {
      teams.value[i] = mergeDefined(teams.value[i], next)
    } else {
      teams.value.push(next)
    }
    entitySync.teamChanged(next)
  }

  // ─── Непропагуючі мутатори для entity-sync (не викликають хаб) ──────────────

  /** Замінює одну команду в списку лише якщо хелпер повернув новий обʼєкт. */
  function replaceTeamsWhereChanged (transform: (team: TTeam) => TTeam) {
    for (let i = 0; i < teams.value.length; i++) {
      const next = transform(teams.value[i])
      if (next !== teams.value[i]) teams.value[i] = next
    }
  }

  /** Гравець змінився (PATCH, ролі, верифікація) — оновлюємо його копії в ростерах. */
  function applyPlayerToRosters (updated: TPlayer) {
    replaceTeamsWhereChanged(team => patchPlayerInRosterHolder(team, updated))
  }

  function removePlayerFromRosters (playerId: string) {
    replaceTeamsWhereChanged(team => removePlayerFromRosterHolder(team, playerId))
  }

  /** Турнір змінився — синхронізуємо `team.tournaments[]` (upsert учасникам, видалення решті). */
  function applyTournamentToTeams (tournament: TTournament) {
    replaceTeamsWhereChanged(team => applyTournamentMembershipToTeam(team, tournament))
  }

  function removeTournamentFromTeams (tournamentId: string) {
    replaceTeamsWhereChanged(team => removeTournamentFromTeam(team, tournamentId))
  }

  // ─── Читання ─────────────────────────────────────────────────────────────────

  async function findTeam (teamId?: string | null) {
    if (!listLoaded.value) {
      await getTeams()
    }

    if (!teamId) return null

    return teams.value.find(team => team.id === teamId) || null
  }

  async function getTeams (opts?: { force?: boolean }) {
    if (!opts?.force && listLoaded.value) return teams.value

    loading.value = true
    try {
      teams.value = await teamsService.fetchAllTeams()
      listLoaded.value = true
      entitySync.teamsLoaded(teams.value)
      return teams.value
    } catch (e) {
      if (e instanceof Error) { ElMessage.error(e.message) }
    } finally {
      loading.value = false
    }
  }

  /** Тихий GET /teams/:id з оновленням кешу (і всіх залежних сторів). Повертає null при помилці. */
  async function refreshTeam (teamId: string): Promise<TTeam | null> {
    const fresh = await teamsService.loadTeam(teamId)
    if (fresh) patchTeamInList(fresh)
    return fresh
  }

  // ─── Мутації через API ───────────────────────────────────────────────────────

  async function createTeam (data: TCreateTeamPayload) {
    loading.value = true
    try {
      const newTeam = await teamsService.createTeam(data)
      patchTeamInList(newTeam)
      ElMessage.success('Команду успішно створено')
      return newTeam
    } catch (e: unknown) {
      const detail =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      ElMessage.error(typeof detail === 'string' && detail ? detail : 'Не вдалося створити команду')
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateTeam (id: string, data: TUpdateTeamPayload) {
    loading.value = true
    try {
      const updatedTeam = await teamsService.updateTeam(id, data)
      patchTeamInList(updatedTeam)
      return updatedTeam
    } finally {
      loading.value = false
    }
  }

  async function updateTeamProfile (id: string, data: TUpdateTeamPayload): Promise<TTeam | null> {
    const updated = await teamsService.updateTeamProfile(id, data)
    if (updated) patchTeamInList(updated)
    return updated
  }

  // async function getTeam (id: string) {
  //   loading.value = true
  //   try {
  //     return await teamsService.fetchTeam(id)
  //   } finally {
  //     loading.value = false
  //   }
  // }

  /** Членство гравця (teamId у players та /me) синхронізує `patchTeamInList` за ростером відповіді. */
  async function addPlayerToTeam (teamId: string, body: TAddTeamPlayerDto): Promise<TTeam | null> {
    const updated = await teamsService.addPlayerToTeam(teamId, body)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function removePlayerFromTeam (
    teamId: string,
    playerId: string,
    penalty?: ERemovePlayerPenalty
  ): Promise<TTeam | null> {
    const updated = await teamsService.removePlayerFromTeam(teamId, playerId, penalty)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function removeCoach (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.removeCoach(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function verifyTeam (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.verifyTeam(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function unverifyTeam (teamId: string): Promise<TTeam | null> {
    const updated = await teamsService.unverifyTeam(teamId)
    if (updated) patchTeamInList(updated)
    return updated
  }

  async function transferCaptaincy (teamId: string, newCaptainPlayerId: string): Promise<TTeam> {
    const updated = await teamsService.transferCaptaincy(teamId, newCaptainPlayerId)
    patchTeamInList(updated)
    return updated
  }

  async function deleteTeam (id: string) {
    loading.value = true
    try {
      await teamsService.dissolveTeam(id)
    } catch {
      return
    } finally {
      loading.value = false
    }

    teams.value = teams.value.filter(t => t.id !== id)
    entitySync.teamRemoved(id)
    router.replace('/teams')
  }

  // TODO: endpoint not in API yet
  // async function joinToTeam (playerId: string, teamId: string, isMain: boolean) { ... }

  // TODO: endpoint not in API yet
  // async function updateTeamCapitan (teamId: string, newCaptainId: string) { ... }

  // TODO: endpoint not in API yet
  // async function acceptTeamInvite (inviteId: string) { ... }

  // TODO: endpoint not in API yet
  // async function rejectTeamInvite (inviteId: string) { ... }

  // TODO: endpoint not in API yet
  // async function leaveFromTeam () { ... }

  return {
    teams,
    loading,
    error,
    listLoaded,
    getTeams,
    findTeam,
    refreshTeam,
    patchTeamInList,
    applyPlayerToRosters,
    removePlayerFromRosters,
    applyTournamentToTeams,
    removeTournamentFromTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    removeCoach,
    verifyTeam,
    unverifyTeam,
    transferCaptaincy,
    updateTeamProfile
  }
})
