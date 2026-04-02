import { defineStore } from 'pinia'

export const useTeamsStore = defineStore('teams', () => {
  const playersStore = usePlayersStore()
  const authStore = useAuthStore()
  const router = useRouter()

  const teams = ref<TTeam[]>([])
  const loading = ref(false)

  async function findTeam (teamId?: number | null) {
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
      if (e instanceof Error) { ElMessage.error(e) }
    } finally {
      loading.value = false
    }
  }

  async function createTeam (team: ICreateTeamForm) {
    loading.value = true
    try {
      const newTeam = await playersService.createTeam(team)

      teams.value.unshift(newTeam)

      const player = await playersStore.findPlayer(authStore.user?.id)

      if (player) {
        player.team_id = newTeam.id
        player.team = newTeam
      }

      if (authStore.user) {
        authStore.user.team_id = newTeam.id
        authStore.user.team = newTeam
      }

      ElMessage.success('Команду успішно створено')
    } catch (e: any) {
      console.log(e)
      ElMessage.error(e.response.data.detail)
    } finally {
      loading.value = false
    }
  }

  async function updateTeam (teamId: number, payload: ICreateTeamForm) {
    loading.value = true

    try {
      const updatedTeam = await teamsService.updateTeam(teamId, payload)

      const currTeam = await findTeam(teamId)

      if (currTeam) {
        currTeam.team_name = updatedTeam.team_name
        currTeam.dota_team_id = updatedTeam.dota_team_id
        currTeam.avatar_url = updatedTeam.avatar_url ?? null
      }

      const player = await playersStore.findPlayer(authStore.user?.id)

      if (player) {
        player.team = currTeam
      }

      if (authStore.user) {
        authStore.user.team = currTeam
      }
    } finally {
      loading.value = false
    }
  }

  async function getTeam (id: number) {
    loading.value = true
    try {
      return await teamsService.fetchTeam(id)
    } finally {
      loading.value = false
    }
  }

  async function joinToTeam (
    playerId: number,
    teamId: number,
    isMain: boolean
  ) {
    loading.value = true

    try {
      const res = await teamsService.joinToTeam(
        playerId,
        teamId,
        isMain
      )

      const currTeam = await findTeam(res?.team_id)

      if (res && currTeam) {
        currTeam.players.push(res)
      } else {
        throw new Error('Команду не знайдено')
      }

      return res
    } catch (e) {
      if (e instanceof Error) { ElMessage.error(e) }
    } finally {
      loading.value = false
    }
  }

  async function removePlayerFromTeam (teamId: number, playerId: number) {
    loading.value = true
    try {
      await teamsService.removePlayerFromTeam(teamId, playerId)

      const currTeam = await findTeam(teamId)

      if (!currTeam) throw new Error('Команду не знайдено')

      currTeam.players = currTeam?.players.filter(player => player.id !== playerId) || []

      const currPlayer = await playersStore.findPlayer(playerId)

      if (currPlayer) {
        currPlayer.team = null
        currPlayer.team_id = null
      }

      if (authStore.user && authStore.user.id === playerId) {
        authStore.user.team_id = null
      }
    } finally {
      loading.value = false
    }
  }

  async function deleteTeam (teamID: number) {
    loading.value = true

    try {
      const currTeam = await findTeam(teamID)

      if (!currTeam?.id) {
        throw new Error('Команду не знайдено')
      }

      await teamsService.dissolveTeam(currTeam.id)

      teams.value = teams.value?.filter(t => t.id !== currTeam.id)

      const currTeamPlayerIds = new Set(currTeam.players.map(p => p.id))

      playersStore.players = playersStore.players.map(player => {
        return currTeamPlayerIds.has(player.id)
          ? { ...player, team_id: null, team: null }
          : player
      })

      if (authStore.user && authStore.user?.team_id === currTeam.id) {
        authStore.user.team_id = null
        authStore.user.team = null
      }

      router.replace('/teams')
    } catch (e) {
      if (e instanceof Error) { ElMessage.error(e) }
    } finally {
      loading.value = false
    }
  }

  async function updateTeamCapitan (
    teamId: number,
    newCaptainId: number
  ) {
    loading.value = true

    try {
      const currTeam = await findTeam(teamId)

      const oldCapId = currTeam?.players.find(player => player.is_cap)?.id || null

      const newTeam = await teamsService.transferCaptaincy(teamId, newCaptainId) || null

      currTeam!.players = newTeam?.players || []

      if (!currTeam) {
        throw new Error('Команду не знайдено')
      }

      if (!newCaptainId) {
        throw new Error('Гравця не знайдено')
      }

      if (authStore.user && authStore.user.id === newCaptainId) {
        authStore.user.is_cap = true
      } else if (authStore.user && authStore.user.id !== newCaptainId) {
        authStore.user.is_cap = false
      }

      const oldCap = await playersStore.findPlayer(oldCapId)
      const newCap = await playersStore.findPlayer(oldCapId)

      oldCap!.is_cap = false
      newCap!.is_cap = true
    } catch (e) {
      if (e instanceof Error) {
        ElMessage.error(e.message)
      }
    } finally {
      loading.value = false
    }
  }

  async function acceptTeamInvite (inviteId: number) {
    loading.value = true

    try {
      return await teamsService.acceptTeamInvite(inviteId)
    } finally {
      loading.value = false
    }
  }

  async function rejectTeamInvite (inviteId: number) {
    loading.value = true

    try {
      return await teamsService.rejectTeamInvite(inviteId)
    } finally {
      loading.value = false
    }
  }

  async function leaveFromTeam () {
    loading.value = true
    const teamId = authStore.user?.team_id

    try {
      const res = await teamsService.leaveFromTeam()

      if (res) {
        authStore.user = res
        const currPlayer = await playersStore.findPlayer(authStore.user?.id)

        if (currPlayer) Object.assign(currPlayer, res)

        const currTeam = await findTeam(teamId)

        currTeam!.players = currTeam?.players.filter(player => player.id !== authStore.user?.id) || []
      }
    } finally {
      loading.value = false
    }
  }

  return {
    teams,
    loading,
    getTeams,
    getTeam,
    findTeam,
    joinToTeam,
    removePlayerFromTeam,
    updateTeamCapitan,
    createTeam,
    leaveFromTeam,
    deleteTeam,
    acceptTeamInvite,
    rejectTeamInvite,
    updateTeam
  }
})
