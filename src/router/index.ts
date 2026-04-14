import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './route-names'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => { // Перед роутингом будет проверка есть ли юзер
  const authStore = useAuthStore()

  if (!authStore.token && to.name === 'me') {
    return next('/')
  }

  if (!authStore.user) {
    // TODO: endpoint not in API yet (fetchUser, getChats)
    // await authStore.fetchUser()
    // await authStore.getChats()
  }
  next()
})
