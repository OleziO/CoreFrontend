import type { RouteRecordRaw } from 'vue-router'

export const financeMonitorRouteNames = {
  financeMonitor: 'finance'
}

/**
 * Фінансовий монітор тимчасово вимкнено: пункти меню приховані, а сам маршрут
 * веде на головну. Щоб увімкнути назад — поверни `component` замість `redirect`:
 * `component: () => import('@/views/finance-monitor/FinanceMonitor.vue')`.
 */
export const financeMonitorRoutes: RouteRecordRaw[] = [
  {
    path: 'finance',
    name: financeMonitorRouteNames.financeMonitor,
    redirect: '/'
  }
]
