// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import checkRoles from '@/core/helpers'
import { ERole } from '@/types/general.types'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const loading = ref(false)

  const token = ref<string | null>(localStorage.getItem('userToken'))
  const user = ref<TPlayerMe | null>(null)

  const chats = ref<TChats>([])

  const isAdmin = computed(() => {
    return {
      isAdmin: checkRoles(user.value?.roles || [], ERole.ADMIN),
      isModerator: checkRoles(user.value?.roles || [], ERole.MODERATOR)
    }
  })

  async function fetchUser () {
    if (!token.value?.length) return

    try {
      const data = await apiClient.get('/api/v1/players/me')
      user.value = data
    } catch (error) {
      logout()
    }
  }

  async function getChats () {
    if (chats.value.length) return

    loading.value = true

    try {
      const data = await playersService.getChats()

      chats.value = data?.filter(chat =>
        chat.roles?.some(role =>
          user.value?.roles?.some(userRole => userRole.type_name === role.type_name)
        )
      ) || []
    } finally {
      loading.value = false
    }
  }

  const login = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('userToken', newToken)
    fetchUser()
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
    chats,
    isAdmin,
    login,
    logout,
    fetchUser,
    getChats
  }
})
