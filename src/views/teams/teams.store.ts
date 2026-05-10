import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { TTeamResponse } from '@/api/types/api.types'

import { teamsService, type TCreateTeamPayload, type TUpdateTeamPayload } from '@/views/teams/teams.service'

export const useTeamsStore = defineStore('teams', () => {
  const router = useRouter()

  const teams = ref<TTeamResponse[]>([])
  const loading = ref(false)

  /**
   * Оновити кеш команди після мутації ростера (POST/DELETE players, GET тощо).
   * Якщо команди ще немає в списку — додає запис (наприклад після прямого заходу на картку).
   */
  function patchTeamInList (next: TTeamResponse) {
    const i = teams.value.findIndex(t => t.id === next.id)
    if (i >= 0) {
      teams.value[i] = next
    } else {
      teams.value.push(next)
    }
  }

  async function findTeam (teamId?: string | null) {
    if (!teams.value.length) {
      await getTeams()
    }

    if (!teamId) return null

    return teams.value.find(team => team.id === teamId) || null
  }

  async function getTeams (opts?: { force?: boolean }) {
    if (!opts?.force && teams.value.length) return

    loading.value = true
    try {
      teams.value = await teamsService.fetchAllTeams()
      return teams.value
    } catch (e) {
      if (e instanceof Error) { ElMessage.error(e.message) }
    } finally {
      loading.value = false
    }
  }

  async function createTeam (data: TCreateTeamPayload) {
    loading.value = true
    try {
      const newTeam = await teamsService.createTeam(data)
      teams.value.unshift(newTeam)
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
      const currTeam = await findTeam(id)
      if (currTeam) {
        Object.assign(currTeam, updatedTeam)
      }
      return updatedTeam
    } finally {
      loading.value = false
    }
  }

  // async function getTeam (id: string) {
  //   loading.value = true
  //   try {
  //     return await teamsService.fetchTeam(id)
  //   } finally {
  //     loading.value = false
  //   }
  // }

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
    usePlayersStore().clearTeamMembershipClientside(id)
    router.replace('/teams')
  }

  // TODO: endpoint not in API yet
  // async function joinToTeam (playerId: string, teamId: string, isMain: boolean) { ... }

  // TODO: endpoint not in API yet
  // Після виключення: usePlayersStore().setPlayerTeamIdClientside(playerId, null)
  // async function removePlayerFromTeam (teamId: string, playerId: string) { ... }

  // TODO: endpoint not in API yet
  // async function updateTeamCapitan (teamId: string, newCaptainId: string) { ... }

  // TODO: endpoint not in API yet
  // async function acceptTeamInvite (inviteId: string) { ... }

  // TODO: endpoint not in API yet
  // async function rejectTeamInvite (inviteId: string) { ... }

  // TODO: endpoint not in API yet
  // Після успішного leave: usePlayersStore().setPlayerTeamIdClientside(playerId, null)
  // async function leaveFromTeam () { ... }

  return {
    teams,
    loading,
    getTeams,
    findTeam,
    patchTeamInList,
    createTeam,
    updateTeam,
    deleteTeam
  }
})
