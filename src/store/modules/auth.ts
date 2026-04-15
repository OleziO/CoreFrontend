import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { TPlayer as Player, TUserRole as UserRole } from '@/api/types/api.types'
import { authService } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token = ref<string | null>(localStorage.getItem('userToken'))
  const user = ref<Player | null>(null)
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
      return true
    } catch {
      loginError.value = 'Помилка авторизації через Discord. Спробуйте ще раз.'
      return false
    } finally {
      loginLoading.value = false
    }
  }

  async function fetchUser () {
    try {
      const data = await authService.getMe()
      return data
    } catch {
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
    fetchUser
  }
})
