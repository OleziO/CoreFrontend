import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import { routes } from './route-names'

function firstQueryValue (value: RouteLocationNormalized['query'][string]): string | undefined {
  if (value == null) return undefined
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? undefined
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => { // Перед роутингом будет проверка есть ли юзер
  // Discord (or backend) may use redirect URI = site root; callback UI lives at /auth/callback.
  const oauthCode = firstQueryValue(to.query.code)
  const oauthState = firstQueryValue(to.query.state)
  if (oauthCode && oauthState && to.path !== '/auth/callback') {
    return next({
      path: '/auth/callback',
      query: { code: oauthCode, state: oauthState },
      replace: true
    })
  }

  const authStore = useAuthStore()

  if (!authStore.token && to.name === 'me') {
    return next('/')
  }

  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }
  next()
})
