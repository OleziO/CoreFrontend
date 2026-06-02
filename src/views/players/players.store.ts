import type { TUserRoleCatalog } from '@/api/types/api.types'

import { useAuthStore } from '@/store/modules/auth'
import { playersService } from '@/views/players/players.service'

export const usePlayersStore = defineStore('players', () => {
  const players = ref<TPlayer[]>([])
  const loading = ref(false)

  const userRolesCatalogRef = shallowRef<TUserRoleCatalog[] | null>(null)
  const userRolesCatalog = computed((): TUserRoleCatalog[] => userRolesCatalogRef.value ?? [])

  function setUserRolesCatalog (list: TUserRoleCatalog[]) {
    userRolesCatalogRef.value = list
  }

  /**
   * Оновити кеш гравця після мутації (верифікація, ролі тощо).
   * Якщо гравця ще немає в списку — додає запис (наприклад після прямого заходу на картку).
   */
  function patchPlayerInList (updated: TPlayer) {
    const list = players.value
    const ix = list.findIndex(p => p.id === updated.id)
    if (ix !== -1) {
      list.splice(ix, 1, updated)
    } else {
      list.push(updated)
    }
  }

  async function fetchUserRoles (opts?: { force?: boolean }) {
    const force = opts?.force ?? false
    if (!force && userRolesCatalogRef.value?.length) {
      return [...userRolesCatalogRef.value]
    }
    const list = await playersService.fetchUserRoles()
    const copy = [...list]
    setUserRolesCatalog(copy)
    return copy
  }

  async function findPlayer (playerId?: string | null) {
    if (!players.value.length) {
      await getPlayers()
    }

    if (!playerId) return null

    return players.value.find(player => player.id === playerId) || null
  }

  /** Після видалення/розпуску команди: у локальному кеші всім з цим teamId ставимо null + оновлення /me якщо треба */
  function clearTeamMembershipClientside (releasedTeamId: string) {
    const match = String(releasedTeamId)
    for (const p of players.value) {
      if (String(p.teamId ?? '') !== match) continue
      p.teamId = null
    }

    const auth = useAuthStore()
    if (auth.user?.teamId != null && String(auth.user.teamId) === match) {
      auth.user.teamId = null
    }
  }

  function setPlayerTeamIdClientside (playerId: string, nextTeamId: string | null) {
    const p = players.value.find(pl => pl.id === playerId)
    if (p) p.teamId = nextTeamId

    const auth = useAuthStore()
    if (auth.user?.id === playerId) auth.user.teamId = nextTeamId
  }

  async function getPlayers (opts?: { force?: boolean }) {
    if (!opts?.force && players.value.length) return players.value

    loading.value = true

    try {
      players.value = await playersService.fetchPlayers()
    } finally {
      loading.value = false
    }

    return players.value
  }

  return {
    players,
    loading,
    userRolesCatalog,
    setUserRolesCatalog,
    patchPlayerInList,
    fetchUserRoles,
    findPlayer,
    clearTeamMembershipClientside,
    setPlayerTeamIdClientside,
    // searchPlayer,
    getPlayers
  }
})
