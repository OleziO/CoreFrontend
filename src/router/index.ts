import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './route-names'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => { // Перед роутингом будет проверка есть ли юзер
  const authStore = useAuthStore()

  // Проверка при которой пользователь не сможет посещать страницы профиля и настроек профиля без токена
  if (!authStore.token && (to.fullPath === '/profile' || to.fullPath === '/profile-settings')) {
    return next('/')
  }

  if (!authStore.user) {
    await authStore.fetchUser()
    await authStore.getChats()
  }
  next()
})
