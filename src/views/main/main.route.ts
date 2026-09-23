import type { RouteRecordRaw } from 'vue-router'

export const mainRouteNames = {
  rootPage: '/'
}

export const mainRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: mainRouteNames.rootPage,
    meta: { public: true },
    component: () => import('@/views/main/Main.vue')
  }
]
