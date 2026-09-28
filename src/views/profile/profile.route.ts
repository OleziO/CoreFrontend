import type { RouteRecordRaw } from 'vue-router'

export const profileRouteNames = {
  profile: 'me'
}

export const profileRoutes: RouteRecordRaw[] = [{
  path: 'me',
  name: profileRouteNames.profile,
  meta: { seo: { title: 'Мій профіль' } },
  component: () => import('@/views/players/Player.vue')
}]
