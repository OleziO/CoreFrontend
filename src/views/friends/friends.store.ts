import { friendsService } from '@/views/friends/friends.service'
import type { TFriend, TFriendRequest, TFriendsOverview } from '@/api/types/api.types'

const EMPTY_OVERVIEW: TFriendsOverview = { friends: [], incoming: [], outgoing: [] }

/**
 * Друзі поточного користувача: один огляд (друзі + вхідні + надіслані запити),
 * який потрібен сторінці /friends, картці гравця (кнопка «Додати в друзі»),
 * модалці виклику на дуель і центру сповіщень. Мутації замінюють огляд відповіддю бекенду.
 */
export const useFriendsStore = defineStore('friends', () => {
  const authStore = useAuthStore()
  const overview = ref<TFriendsOverview>(EMPTY_OVERVIEW)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref(false)
  /** Мутація в польоті по гравцю / запиту — щоб кнопки показували спінер лише на своєму рядку. */
  const busyIds = ref(new Set<string>())

  const friends = computed<TFriend[]>(() => overview.value.friends)
  const incoming = computed<TFriendRequest[]>(() => overview.value.incoming)
  const outgoing = computed<TFriendRequest[]>(() => overview.value.outgoing)
  const friendIds = computed(() => new Set(friends.value.map(f => f.player.id)))

  function isBusy (id: string): boolean {
    return busyIds.value.has(id)
  }

  /** Як я пов'язаний із гравцем — без запиту, з уже завантаженого огляду. */
  function relationWith (playerId: string | null | undefined): TFriendRelationState {
    if (!playerId) return { relation: 'none', requestId: null }
    if (friendIds.value.has(playerId)) return { relation: 'friends', requestId: null }
    const inc = incoming.value.find(r => r.requester.id === playerId)
    if (inc) return { relation: 'incoming', requestId: inc.id }
    const out = outgoing.value.find(r => r.addressee.id === playerId)
    if (out) return { relation: 'outgoing', requestId: out.id }
    return { relation: 'none', requestId: null }
  }

  function isFriend (playerId: string | null | undefined): boolean {
    return !!playerId && friendIds.value.has(playerId)
  }

  function reset () {
    overview.value = EMPTY_OVERVIEW
    loaded.value = false
    error.value = false
  }

  /** Один запит на всіх, хто одночасно просить огляд (сторінка + картка + дзвіночок). */
  let inFlight: Promise<TFriendsOverview> | null = null

  async function fetchOverview (opts?: { force?: boolean }): Promise<TFriendsOverview> {
    if (!opts?.force && loaded.value) return overview.value
    if (inFlight) return inFlight
    inFlight = (async () => {
      loading.value = true
      error.value = false
      try {
        overview.value = await friendsService.fetchOverview()
        loaded.value = true
      } catch (e) {
        error.value = true
        throw e
      } finally {
        loading.value = false
      }
      return overview.value
    })().finally(() => { inFlight = null })
    return inFlight
  }

  async function runMutation (busyKey: string, action: () => Promise<TFriendsOverview>): Promise<boolean> {
    if (busyIds.value.has(busyKey)) return false
    busyIds.value.add(busyKey)
    try {
      overview.value = await action()
      loaded.value = true
      return true
    } catch {
      return false
    } finally {
      busyIds.value.delete(busyKey)
    }
  }

  // Інший користувач (або вихід) — огляд друзів більше не наш.
  watch(() => authStore.token, (token, previous) => {
    if (token !== previous) reset()
  })

  const sendRequest = (playerId: string) => runMutation(playerId, () => friendsService.sendRequest(playerId))
  const acceptRequest = (id: string) => runMutation(id, () => friendsService.acceptRequest(id))
  const declineRequest = (id: string) => runMutation(id, () => friendsService.declineRequest(id))
  const cancelRequest = (id: string) => runMutation(id, () => friendsService.cancelRequest(id))
  const removeFriend = (playerId: string) => runMutation(playerId, () => friendsService.removeFriend(playerId))

  return {
    overview,
    loaded,
    loading,
    error,
    friends,
    incoming,
    outgoing,
    friendIds,
    isBusy,
    isFriend,
    relationWith,
    reset,
    fetchOverview,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend
  }
})
