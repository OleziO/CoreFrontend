import { defineStore } from 'pinia'
import { vipService, type TAdminVipGrant, type TAdminVipResult, type TVipStatus } from '@/services/vip.service'
import { useAuthStore } from '@/store/modules/auth'
import { usePlayersStore } from '@/views/players/players.store'

/** Скільки чекати вебхук Monobank після повернення зі сторінки оплати. */
const RETURN_POLL_ATTEMPTS = 10
const RETURN_POLL_INTERVAL_MS = 3000

type TVipFields = Pick<TPlayer, 'isVip' | 'vipUntil' | 'vipFrameColor'>

/**
 * VIP поточного користувача (`/vip/me`) + ручна видача адміном. VIP-поля гравця
 * (`isVip`, `vipUntil`, `vipFrameColor`) після кожної мутації розходяться по
 * `/me` і списку гравців, щоб бейдж і рамка оновились без перезавантаження.
 */
export const useVipStore = defineStore('vip', () => {
  const authStore = useAuthStore()

  const status = ref<TVipStatus | null>(null)
  const loading = ref(false)
  const checkoutLoading = ref(false)
  const mutating = ref(false)
  /** Гравець, над яким адмін зараз видає / знімає VIP. */
  const adminBusyId = ref<string | null>(null)

  const isVip = computed(() => !!(status.value?.isVip ?? authStore.user?.isVip))

  function applyToPlayer (playerId: string, fields: TVipFields) {
    const playersStore = usePlayersStore()
    const listed = playersStore.players.find(p => p.id === playerId)
    // patchPlayerInList сам доносить зміну до /me через entitySync.
    if (listed) playersStore.patchPlayerInList({ ...listed, ...fields })
    else if (authStore.user?.id === playerId) Object.assign(authStore.user, fields)
  }

  function applyStatus (next: TVipStatus | null) {
    if (!next) return
    status.value = next
    const id = authStore.user?.id
    if (id) applyToPlayer(id, { isVip: next.isVip, vipUntil: next.vipUntil, vipFrameColor: next.vipFrameColor })
  }

  async function fetchStatus () {
    if (!authStore.token) return null
    loading.value = true
    try {
      const next = await vipService.fetchStatus()
      applyStatus(next)
      return next
    } finally {
      loading.value = false
    }
  }

  /** Перехід на сторінку оплати Monobank; назад повертає `/me?vip=return`. */
  async function checkout () {
    checkoutLoading.value = true
    try {
      const res = await vipService.checkout()
      if (res?.pageUrl) window.location.href = res.pageUrl
      else checkoutLoading.value = false
    } catch {
      checkoutLoading.value = false
    }
  }

  async function runMutation (fn: () => Promise<TVipStatus | null>) {
    mutating.value = true
    try {
      applyStatus(await fn())
    } finally {
      mutating.value = false
    }
  }

  const cancelAutoRenew = () => runMutation(() => vipService.cancelAutoRenew())
  const resumeAutoRenew = () => runMutation(() => vipService.resumeAutoRenew())
  const setFrameColor = (color: string | null) =>
    runMutation(() => vipService.setFrameColor(color as Parameters<typeof vipService.setFrameColor>[0]))

  /**
   * Після оплати вебхук може прийти на кілька секунд пізніше за редірект,
   * тож опитуємо `/vip/me`, доки статус не стане VIP (або не вичерпаємо спроби).
   */
  async function awaitPaymentResult (): Promise<boolean> {
    for (let attempt = 0; attempt < RETURN_POLL_ATTEMPTS; attempt += 1) {
      const next = await fetchStatus()
      if (next?.isVip && !next.paymentPending) return true
      await new Promise(resolve => setTimeout(resolve, RETURN_POLL_INTERVAL_MS))
    }
    return !!status.value?.isVip
  }

  async function runAdmin (playerId: string, fn: () => Promise<TAdminVipResult | null>) {
    adminBusyId.value = playerId
    try {
      const res = await fn()
      if (res) {
        applyToPlayer(res.playerId, { isVip: res.isVip, vipUntil: res.vipUntil, vipFrameColor: res.vipFrameColor })
        if (res.playerId === authStore.user?.id) await fetchStatus()
      }
      return res
    } finally {
      adminBusyId.value = null
    }
  }

  const grantByAdmin = (playerId: string, grant: TAdminVipGrant) =>
    runAdmin(playerId, () => vipService.grantByAdmin(playerId, grant))
  const revokeByAdmin = (playerId: string) =>
    runAdmin(playerId, () => vipService.revokeByAdmin(playerId))

  /** Вихід з акаунта — статус належав попередньому користувачу. */
  watch(() => authStore.token, (token) => {
    if (!token) status.value = null
  })

  return {
    status,
    loading,
    checkoutLoading,
    mutating,
    adminBusyId,
    isVip,
    fetchStatus,
    checkout,
    cancelAutoRenew,
    resumeAutoRenew,
    setFrameColor,
    awaitPaymentResult,
    grantByAdmin,
    revokeByAdmin
  }
})
