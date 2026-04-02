import type { RouteRecordRaw } from 'vue-router'

export const profileRouteNames = {
  profile: 'me'
}

export const profileRoutes: RouteRecordRaw[] = [{
  path: 'me',
  name: profileRouteNames.profile,
  component: () => import('@/views/players/Player.vue')
}]
