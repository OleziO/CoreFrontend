import type { RouteRecordRaw } from 'vue-router'

export const analyticsRouteNames = {
  analytics: 'analytics'
}

/**
 * Адмін-аналітика. Доступ лише для адмінів — перевірка в `router.beforeEach`
 * (той самий предикат `hasAdminRole`, що й у пунктах меню хедера).
 */
export const analyticsRoutes: RouteRecordRaw[] = [
  {
    path: 'analytics',
    name: analyticsRouteNames.analytics,
    meta: { seo: { title: 'Аналітика' } },
    component: () => import('@/views/analytics/Analytics.vue')
  }
]
