import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { TTeam as Team, TUpdateTeamDto as UpdateTeamDto } from '@/api/types/api.types'

export const useTeamsStore = defineStore('teams', () => {
  const router = useRouter()

  const teams = ref<Team[]>([])
  const loading = ref(false)

  async function findTeam (teamId?: string | null) {
    if (!teams.value.length) {
      await getTeams()
    }

    if (!teamId) return null

    return teams.value.find(team => team.id === teamId) || null
  }

  async function getTeams () {
    if (teams.value.length) return

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

  // async function createTeam (data: CreateTeamDto) {
  //   loading.value = true
  //   try {
  //     const newTeam = await teamsService.createTeam(data)
  //     teams.value.unshift(newTeam)
  //     ElMessage.success('Команду успішно створено')
  //     return newTeam
  //   } catch (e: any) {
  //     ElMessage.error(e.response?.data?.detail || 'Помилка при створенні команди')
  //   } finally {
  //     loading.value = false
  //   }
  // }

  async function updateTeam (id: string, data: UpdateTeamDto) {
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
      teams.value = teams.value.filter(t => t.id !== id)
      router.replace('/teams')
    } catch (e) {
      if (e instanceof Error) { ElMessage.error(e.message) }
    } finally {
      loading.value = false
    }
  }

  // TODO: endpoint not in API yet
  // async function joinToTeam (playerId: string, teamId: string, isMain: boolean) { ... }

  // TODO: endpoint not in API yet
  // async function removePlayerFromTeam (teamId: string, playerId: string) { ... }

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
    getTeams,
    // getTeam,
    findTeam,
    // createTeam,
    updateTeam,
    deleteTeam
  }
})
