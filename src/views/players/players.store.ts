import { ERole } from '@/types/general.types'
import { AxiosError } from 'axios'

export const usePlayersStore = defineStore('players', () => {
  const authStore = useAuthStore()
  const teamStore = useTeamsStore()

  const players = ref<TPlayer[]>([])
  const loading = ref(false)
  const allPlayerRoles = ref<TRole[]>([])

  async function findPlayer (playerId?: number | null) {
    if (!players.value.length) {
      await getPlayers()
    }

    if (!playerId) return null

    return players.value.find(player => player.id === playerId) || null
  }

  function searchPlayer (player: TPlayer, search = '') {
    if (!search) return true

    const q = search.toLowerCase()

    return (
      player.user_name?.toLowerCase().includes(q) ||
      player.steam_name?.toLowerCase().includes(q)
    )
  }

  async function getPlayers () {
    if (players.value.length) return players.value

    loading.value = true

    try {
      const fetchPlayers = await playersService.fetchPlayers()
      players.value = fetchPlayers.data
    } finally {
      loading.value = false
    }

    return players.value
  }

  async function updatePlayerMMP (id: number, newMMP: number) {
    loading.value = true

    try {
      const res = await playersService.updatePlayerMmrByAdmin(id, newMMP)
      const player = await findPlayer(id)

      if (!player) {
        ElMessage.error('Гравця не знайдено')
        return
      }

      Object.assign(player, res)

      if (player.team_id) {
        const playerTeam = await teamStore.findTeam(player.team_id)
        const playerInTeam = playerTeam?.players.find(p => p.id === player.id)

        if (playerInTeam) {
          Object.assign(playerInTeam, res)
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function updateMyProfileData (newMMP: number, positions: number[]) {
    loading.value = true

    try {
      const res = await playersService.updateMyMMPAndPositions(newMMP, positions)

      if (!authStore.user?.id) {
        ElMessage.error('Гравця не знайдено')
        return
      }

      Object.assign(authStore.user, res)
    } finally {
      loading.value = false
    }
  }

  async function updatePlayerPoints (playerId: number, _points: number) {
    loading.value = true

    try {
      const res = await playersService.updatePlayerPoints(playerId, _points)

      if (!authStore.user?.id) {
        ElMessage.error('Гравця не знайдено')
        return
      }

      Object.assign(authStore.user, res)
    } finally {
      loading.value = false
    }
  }

  async function getAllPlayerRoles () {
    if (allPlayerRoles.value.length) return allPlayerRoles.value

    loading.value = true
    try {
      allPlayerRoles.value = await playersService.getPlayerRoles()
      return allPlayerRoles.value
    } finally {
      loading.value = false
    }
  }

  async function updatePlayerRoles (playerId: number, rolesIdArr: number[]) {
    loading.value = true

    try {
      const currPlayer = await findPlayer(playerId)

      if (!currPlayer) {
        throw new Error('Гравця не знайдено')
      }

      const updated = await playersService.updatePlayerRoles(playerId, rolesIdArr)
      currPlayer.roles = updated.roles

      console.log(playerId, authStore.user)

      if (playerId === authStore.user?.id) {
        authStore.user.roles = updated.roles
      }

      return currPlayer
    } catch (e) {
      if (e instanceof Error) {
        ElMessage.error(e.message)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function changePlayerRespect (id: number, action: 'like' | 'dislike') {
    loading.value = true

    try {
      const player = await findPlayer(id)
      if (!player) return null

      const updated = await playersService.changePlayerRespect(id, action)
      Object.assign(player, updated)

      return player
    } finally {
      loading.value = false
    }
  }

  function isVerified (player: TPlayer) {
    return !player.roles?.some(role => role.type_name === ERole.GUEST)
  }

  async function verifyPlayer (playerId: number) {
    loading.value = true

    try {
      const player = await findPlayer(playerId)
      if (!player) return null

      const updated = await playersService.verifyPlayer(player.id)
      Object.assign(player, updated)

      if (player.team_id) {
        const playerTeam = await teamStore.findTeam(player.team_id)

        console.log('playerTeam', playerTeam)
        const playerInTeam = playerTeam?.players.find(p => p.id === player.id)

        if (playerInTeam) {
          Object.assign(playerInTeam, updated)
        }
      }

      return player
    } finally {
      loading.value = false
    }
  }

  async function toggleDiscordNotification (isTrue: boolean) {
    loading.value = true
    try {
      const res = await playersService.toggleDiscordNotification(isTrue)

      const authStore = useAuthStore()

      if (authStore.user && res) {
        Object.assign(authStore.user, res)
      }

      ElMessage.success('Оповіщення у діскорді успішно оновлено')
    } catch (e) {
      if (e instanceof AxiosError) {
        ElMessage.error(e)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    players,
    loading,
    allPlayerRoles,
    findPlayer,
    searchPlayer,
    getPlayers,
    isVerified,
    updatePlayerMMP,
    updateMyProfileData,
    getAllPlayerRoles,
    updatePlayerRoles,
    changePlayerRespect,
    verifyPlayer,
    updatePlayerPoints,
    toggleDiscordNotification
  }
})
