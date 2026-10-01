import type { TUserRoleCatalog, TAdminPlayerRoleItem, TUpdatePlayerDto } from '@/api/types/api.types'

import { playersService } from '@/views/players/players.service'
import { entitySync } from '@/store/entity-sync'
import { collectTeamRosterPlayers, mergeDefined } from '@/core/utils/entity-sync.utils'

export const usePlayersStore = defineStore('players', () => {
  const players = ref<TPlayer[]>([])
  const loading = ref(false)
  /**
   * Чи завантажено повний список. Не покладаємось на `players.length`: після прямого
   * заходу на картку `patchPlayerInList` додає один запис, і порожній кеш перестає бути порожнім.
   */
  const listLoaded = ref(false)

  const userRolesCatalogRef = shallowRef<TUserRoleCatalog[] | null>(null)
  const userRolesCatalog = computed((): TUserRoleCatalog[] => userRolesCatalogRef.value ?? [])

  function setUserRolesCatalog (list: TUserRoleCatalog[]) {
    userRolesCatalogRef.value = list
  }

  /**
   * Оновити кеш гравця після мутації (верифікація, ролі тощо) і розіслати зміну в інші стори
   * (ростери команд і турнірів, поточний користувач).
   * Якщо гравця ще немає в списку — додає запис (наприклад після прямого заходу на картку).
   */
  function patchPlayerInList (updated: TPlayer) {
    const list = players.value
    const ix = list.findIndex(p => p.id === updated.id)
    if (ix !== -1) {
      list.splice(ix, 1, mergeDefined(list[ix], updated))
    } else {
      list.push(updated)
    }
    entitySync.playerChanged(updated)
  }

  function removePlayerFromList (id: string) {
    players.value = players.value.filter(p => p.id !== id)
    entitySync.playerRemoved(id)
  }

  // ─── Непропагуючі мутатори для entity-sync (не викликають хаб) ──────────────

  /** Оновлює лише наявний запис (без додавання) — дані з /auth/me або ростеру команди. */
  function applyPlayerData (updated: TPlayer) {
    const ix = players.value.findIndex(p => p.id === updated.id)
    if (ix === -1) return
    players.value.splice(ix, 1, mergeDefined(players.value[ix], updated))
  }

  /**
   * Після зміни команди: гравці ростеру отримують `teamId` команди та свіжі ембеднуті поля;
   * ті, хто ще вказує на цю команду, але зник з ростеру — `teamId = null`.
   */
  function applyTeamMembership (team: TTeam) {
    const roster = new Map(collectTeamRosterPlayers(team).map(p => [p.id, p]))
    players.value = players.value.map((p) => {
      const embedded = roster.get(p.id)
      if (embedded) {
        return { ...mergeDefined(p, embedded), teamId: team.id }
      }
      if (p.teamId != null && String(p.teamId) === String(team.id)) {
        return { ...p, teamId: null }
      }
      return p
    })
  }

  /** Після видалення/розпуску команди: усім з цим teamId ставимо null. */
  function clearTeamMembership (releasedTeamId: string) {
    const match = String(releasedTeamId)
    for (const p of players.value) {
      if (String(p.teamId ?? '') !== match) continue
      p.teamId = null
    }
  }

  // ─── Мутації через API ───────────────────────────────────────────────────────

  async function updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    const updated = await playersService.updatePlayer(id, data)
    patchPlayerInList(updated)
    return updated
  }

  async function deletePlayer (id: string): Promise<void> {
    const removedId = await playersService.deletePlayer(id)
    removePlayerFromList(removedId)
  }

  async function setPlayerRoles (
    playerId: string,
    roles: TAdminPlayerRoleItem[]
  ): Promise<TPlayer> {
    const updated = await playersService.setPlayerRolesByAdmin(playerId, roles)
    patchPlayerInList(updated)
    return updated
  }

  /** Адмін-верифікація гравця; тости показує сервіс. Повертає null при помилці. */
  async function setPlayerVerification (playerId: string, verified: boolean): Promise<TPlayer | null> {
    const updated = await playersService.setPlayerVerificationByAdmin(playerId, verified)
    if (updated) patchPlayerInList(updated)
    return updated
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
    if (!listLoaded.value) {
      await getPlayers()
    }

    if (!playerId) return null

    return players.value.find(player => player.id === playerId) || null
  }

  /** Один запит на всіх, хто одночасно просить список (сторінка + модалка + картка). */
  let listInFlight: Promise<TPlayer[]> | null = null

  async function getPlayers (opts?: { force?: boolean }) {
    if (!opts?.force && listLoaded.value) return players.value
    if (listInFlight) return listInFlight

    listInFlight = (async () => {
      loading.value = true
      try {
        players.value = await playersService.fetchPlayers()
        listLoaded.value = true
        entitySync.playersLoaded(players.value)
      } finally {
        loading.value = false
      }
      return players.value
    })().finally(() => { listInFlight = null })

    return listInFlight
  }

  /**
   * Cache-first для сторінки гравця: якщо гравець уже в сторі — жодного запиту,
   * інакше один GET /players/:id (без завантаження всього списку). Повертає null, якщо не знайдено.
   */
  async function ensurePlayer (playerId: string): Promise<TPlayer | null> {
    const cached = players.value.find(p => p.id === playerId)
    if (cached) return cached

    loading.value = true
    try {
      const fresh = await playersService.fetchPlayerItemById(playerId)
      if (fresh) patchPlayerInList(fresh)
      return fresh
    } finally {
      loading.value = false
    }
  }

  /**
   * Тихо перечитує гравця після зміни на беку (схвалення MMR, верифікація) і розсилає
   * свіжі дані в ростери та /me. `rank` рахує бекенд, тож локально `rating` не патчимо.
   */
  async function refreshPlayer (playerId: string): Promise<TPlayer | null> {
    const fresh = await playersService.fetchPlayerQuietly(playerId)
    if (fresh) patchPlayerInList(fresh)
    return fresh
  }

  return {
    players,
    loading,
    listLoaded,
    userRolesCatalog,
    setUserRolesCatalog,
    patchPlayerInList,
    removePlayerFromList,
    applyPlayerData,
    applyTeamMembership,
    clearTeamMembership,
    updatePlayer,
    deletePlayer,
    setPlayerRoles,
    setPlayerVerification,
    fetchUserRoles,
    findPlayer,
    ensurePlayer,
    refreshPlayer,
    // searchPlayer,
    getPlayers
  }
})
