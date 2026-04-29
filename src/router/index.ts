import { createRouter, createWebHistory } from 'vue-router'
import { firstQueryValue } from '@/core/helpers'
import { routes, routeNames } from './route-names'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  try {
    const oauthCode = firstQueryValue(to.query.code)
    if (oauthCode && to.name !== routeNames.authCallback) {
      return next({
        path: '/auth/callback',
        query: to.query,
        replace: true
      })
    }

    const steamLinked = firstQueryValue(to.query.steam_linked)
    const steamError = firstQueryValue(to.query.steam_error)
    if (steamLinked !== undefined || steamError !== undefined) {
      if (to.name !== routeNames.profile) {
        const q: Record<string, string> = {}
        if (steamLinked !== undefined) q.steam_linked = steamLinked
        if (steamError !== undefined) q.steam_error = steamError
        return next({ name: routeNames.profile, query: q, replace: true })
      }
    }

    const authStore = useAuthStore()
    await authStore.hydrateSession()

    if (!authStore.token && to.name === 'me') {
      return next('/')
    }

    if (authStore.token && !authStore.user) {
      await authStore.fetchUser()
    }
    next()
  } catch (e) {
    console.error('[router]', e)
    next({ path: '/', replace: true })
  }
})
