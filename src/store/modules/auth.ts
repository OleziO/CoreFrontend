import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { TPlayer as Player, TUserRole as UserRole } from '@/api/types/api.types'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // const loading = ref(false)

  const token = ref<string | null>(localStorage.getItem('userToken'))
  const user = ref<Player | null>(null)

  const isAdmin = computed(() => {
    const roles: UserRole[] = (user.value as any)?.roles || []
    return {
      isAdmin: roles.some(r => r.isAdminRole),
      isModerator: roles.some(r => r.isAdminRole)
    }
  })

  // TODO: endpoint not in API yet (/players/me)
  // async function fetchUser () { ... }

  // TODO: endpoint not in API yet (/constants/chats)
  // async function getChats () { ... }

  const login = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('userToken', newToken)
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('userToken')
    router.push('/')
  }

  return {
    token,
    user,
    // loading,
    isAdmin,
    login,
    logout
  }
})
