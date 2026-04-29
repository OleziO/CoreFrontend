import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { router } from '@/router'
import { supabase } from '@/api/client'
import type { TCurrentPlayer, TUserRole as UserRole } from '@/api/types/api.types'
import { authService } from '@/services/auth.service'

/** Сесія зберігається Supabase у `sb-<project-ref>-auth-token`; userToken більше не використовується. */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<TCurrentPlayer | null>(null)
  const loginLoading = ref(false)
  const loginError = ref<string | null>(null)

  async function hydrateSession () {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.warn('[auth] getSession:', error.message)
        token.value = null
        return
      }
      token.value = data?.session?.access_token ?? null
    } catch (e) {
      console.error('[auth] hydrateSession', e)
      token.value = null
    }
  }

  /** При ініціалізації стору та будь-якій зміні сесії (включно з refresh). */
  hydrateSession().catch(() => {})
  try {
    localStorage.removeItem('userToken')
  } catch { /* ignore */ }

  supabase.auth.onAuthStateChange((_event, session) => {
    token.value = session?.access_token ?? null
  })

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
    loginError.value = null
  }

  const logout = async () => {
    await supabase.auth.signOut()
    token.value = null
    user.value = null
    try {
      localStorage.removeItem('userToken')
    } catch { /* ignore */ }
    router.push('/')
  }

  async function startDiscordLogin () {
    loginLoading.value = true
    loginError.value = null
    try {
      const data = await authService.signInWithDiscord()
      if (!data.url) {
        loginError.value = 'Не вдалося отримати посилання для входу через Discord'
        loginLoading.value = false
        return
      }
      window.location.href = data.url
    } catch {
      loginError.value = 'Не вдалося отримати посилання для входу через Discord'
      loginLoading.value = false
    }
  }

  async function handleDiscordCallback (code: string) {
    loginLoading.value = true
    loginError.value = null
    try {
      const data = await authService.exchangeDiscordCode(code)
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

  async function fetchUser () {
    await hydrateSession()
    if (!token.value) {
      user.value = null
      return null
    }
    try {
      const data = await authService.getMe()
      user.value = data
      return data
    } catch {
      user.value = null
      return null
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
    hydrateSession
  }
})
