import type { TPlayer, TUserRoleCatalog } from '@/api/types/api.types'

import { playersService, userRolesCatalogRef } from '@/views/players/players.service'

export const usePlayersStore = defineStore('players', () => {
  const players = ref<TPlayer[]>([])
  const loading = ref(false)

  /** Останній GET `/user-roles` (живе з `players.service` → `userRolesCatalogRef`). */
  const userRolesCatalog = computed((): TUserRoleCatalog[] => userRolesCatalogRef.value ?? [])

  async function fetchUserRoles (opts?: { force?: boolean }) {
    return playersService.fetchUserRoles(opts)
  }

  async function findPlayer (playerId?: string | null) {
    if (!players.value.length) {
      await getPlayers()
    }

    if (!playerId) return null

    return players.value.find(player => player.id === playerId) || null
  }

  // function searchPlayer (player: TPlayer, search = '') {
  //   if (!search) return true
  //
  //   const q = search.toLowerCase()
  //
  //   return (
  //     player.discordName?.toLowerCase().includes(q) ||
  //     player.discordUsername?.toLowerCase().includes(q) ||
  //     player.steamId?.toLowerCase().includes(q)
  //   )
  // }

  async function getPlayers () {
    if (players.value.length) return players.value

    loading.value = true

    try {
      players.value = await playersService.fetchPlayers()
    } finally {
      loading.value = false
    }

    return players.value
  }

  // TODO: endpoint not in API yet
  // async function updatePlayerMMP (id: string, newMMP: number) { ... }

  // TODO: endpoint not in API yet
  // async function updateMyProfileData (newMMP: number, positions: number[]) { ... }

  // TODO: endpoint not in API yet
  // async function updatePlayerPoints (playerId: string, _points: number) { ... }

  // TODO: endpoint not in API yet
  // async function getAllPlayerRoles () { ... }

  // TODO: endpoint not in API yet
  // async function updatePlayerRoles (playerId: string, rolesIdArr: number[]) { ... }

  // TODO: endpoint not in API yet
  // async function changePlayerRespect (id: string, action: 'like' | 'dislike') { ... }

  // TODO: endpoint not in API yet
  // function isVerified (player: TPlayer) { ... }

  // TODO: endpoint not in API yet
  // async function verifyPlayer (playerId: string) { ... }

  // TODO: endpoint not in API yet
  // async function toggleDiscordNotification (isTrue: boolean) { ... }

  return {
    players,
    loading,
    userRolesCatalog,
    fetchUserRoles,
    findPlayer,
    // searchPlayer,
    getPlayers
  }
})
