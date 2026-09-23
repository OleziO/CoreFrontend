import { START_LOCATION, type RouteLocationNormalized, type RouteLocationRaw } from 'vue-router'
import { appModals } from '@/composables/use-app-modals'
import { routeNames } from '@/router/route-names'

/**
 * Приватні маршрути за замовчуванням: пускаємо далі лише якщо є токен або
 * маршрут позначено `meta.public`. Без токена view не монтується (жодних
 * запитів до API), відкриваємо LoginModal і:
 *  - при переході всередині застосунку — лишаємось на поточній сторінці;
 *  - при прямому заході за посиланням — ведемо на головну.
 *
 * Повертає `null`, якщо навігацію можна продовжувати.
 */
export function resolveAuthGuard (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): RouteLocationRaw | false | null {
  if (to.meta.public) return null

  const authStore = useAuthStore()
  if (authStore.token) return null

  appModals.open('LoginModal', { redirectTo: to.fullPath })

  const isInitialNavigation = from === START_LOCATION
  return isInitialNavigation ? { name: routeNames.rootPage, replace: true } : false
}
