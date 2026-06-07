import type { RouteRecordRaw } from 'vue-router'

export const financeMonitorRouteNames = {
  financeMonitor: 'finance'
}

export const financeMonitorRoutes: RouteRecordRaw[] = [
  {
    path: 'finance',
    name: financeMonitorRouteNames.financeMonitor,
    component: () => import('@/views/finance-monitor/FinanceMonitor.vue')
  }
]
