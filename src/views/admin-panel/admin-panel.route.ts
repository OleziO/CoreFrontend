import type { RouteRecordRaw } from 'vue-router'

export const adminPanelRouteNames = {
  adminPanel: 'admin'
}

export const adminPanelRoutes: RouteRecordRaw[] = [
  {
    path: 'admin',
    name: adminPanelRouteNames.adminPanel,
    meta: { seo: { title: 'Адмін-панель' } },
    component: () => import('@/views/admin-panel/AdminPanel.vue')
  }
]
