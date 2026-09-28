import { createRouter, createWebHistory } from 'vue-router'
import { firstQueryValue, hasAdminRole } from '@/core/helpers'
import { routes, routeNames } from './route-names'
import { resolveAuthGuard } from './guards/auth.guard'
import { applyRouteSeo } from '@/composables/use-seo'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => { // Перед роутингом будет проверка есть ли юзер
  // Discord (or backend) may use redirect URI = site root; callback UI lives at /auth/callback.
  const oauthCode = firstQueryValue(to.query.code)
  const oauthState = firstQueryValue(to.query.state)
  if (oauthCode && oauthState && to.name !== routeNames.authCallback) {
    return next({
      path: '/auth/callback',
      query: { code: oauthCode, state: oauthState },
      replace: true
    })
  }

  // Після Steam OpenID бекенд редіректить з ?steam_linked або ?steam_error; UI обробляє це в /me (Player.vue).
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

  // Приватні маршрути за замовчуванням (див. guards/auth.guard.ts): без токена — LoginModal, view не монтується.
  const authRedirect = resolveAuthGuard(to, from)
  if (authRedirect === false) return next(false)
  if (authRedirect !== null) return next(authRedirect)

  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  if (to.name === routeNames.financeMonitor && !hasAdminRole(authStore.user?.roles)) {
    return next('/')
  }

  next()
})

// SEO: title/description/canonical/robots для маршруту; view з даними API перекриває через useSeo().
router.afterEach((to) => {
  applyRouteSeo(to)
})
