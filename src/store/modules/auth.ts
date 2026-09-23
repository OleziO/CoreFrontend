import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { TCurrentPlayer, TUserRole as UserRole } from '@/api/types/api.types'
import { authService } from '@/services/auth.service'
import { entitySync } from '@/store/entity-sync'
import { collectTeamRosterIds, mergeDefined } from '@/core/utils/entity-sync.utils'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token = ref<string | null>(localStorage.getItem('userToken'))
  const user = ref<TCurrentPlayer | null>(null)
  const loginLoading = ref(false)
  const loginError = ref<string | null>(null)

  const isAdmin = computed(() => {
    const roles: UserRole[] = (user.value as any)?.roles || []
    return {
      isAdmin: roles.some(r => r.isAdminRole),
      isModerator: roles.some(r => r.isAdminRole)
    }
  })

  const isLoggedIn = computed(() => !!token.value)

  const login = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('userToken', newToken)
    loginError.value = null
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('userToken')
    router.push('/')
  }

  async function startDiscordLogin () {
    loginLoading.value = true
    loginError.value = null
    try {
      const { url } = await authService.getDiscordAuthUrl()
      window.location.href = url
    } catch {
      loginError.value = 'Не вдалося отримати посилання для входу через Discord'
      loginLoading.value = false
    }
  }

  async function handleDiscordCallback (code: string, state: string) {
    loginLoading.value = true
    loginError.value = null
    try {
      const data = await authService.exchangeDiscordCode(code, state)
      login(data.access_token)
      await fetchUser()
      return true
    } catch {
      loginError.value = 'Помилка авторизації через Discord. Спробуйте ще раз.'
      return false
    } finally {
      loginLoading.value = false
    }
  }

  async function linkSteam () {
    const { url } = await authService.getSteamLinkUrl()
    window.location.href = url
  }

  function handleSteamCallback (query: Record<string, unknown>) {
    const steamLinked = query.steam_linked
    const steamError = query.steam_error
    if (steamLinked === 'true') {
      ElMessage.success("Steam акаунт успішно прив'язано!")
      return 'linked'
    } else if (steamError) {
      ElMessage.error(`Помилка прив'язки Steam: ${steamError}`)
      return 'error'
    }
    return null
  }

  async function fetchUser () {
    if (!token.value) {
      user.value = null
      return null
    }
    try {
      const data = await authService.getMe()
      user.value = data
      entitySync.currentUserChanged(data)
      return data
    } catch {
      user.value = null
      return null
    }
  }

  // ─── Непропагуючі мутатори для entity-sync (не викликають хаб) ──────────────

  /** Дані гравця з /players або з ростеру — це той самий користувач, накладаємо поля. */
  function applyPlayerToCurrentUser (p: TPlayer) {
    if (!user.value || user.value.id !== p.id) return
    user.value = mergeDefined(user.value, p as Partial<TCurrentPlayer>)
  }

  /** Після зміни складу команди: користувач у ростері → teamId команди, інакше знімаємо. */
  function applyTeamMembership (team: TTeam) {
    if (!user.value) return
    if (collectTeamRosterIds(team).has(user.value.id)) {
      if (user.value.teamId !== team.id) user.value.teamId = team.id
    } else if (user.value.teamId === team.id) {
      user.value.teamId = null
    }
  }

  function clearTeamMembership (teamId: string) {
    if (user.value?.teamId != null && String(user.value.teamId) === String(teamId)) {
      user.value.teamId = null
    }
  }

  return {
    token,
    user,
    isAdmin,
    isLoggedIn,
    loginLoading,
    loginError,
    login,
    logout,
    startDiscordLogin,
    handleDiscordCallback,
    linkSteam,
    fetchUser,
    handleSteamCallback,
    applyPlayerToCurrentUser,
    applyTeamMembership,
    clearTeamMembership
  }
})
