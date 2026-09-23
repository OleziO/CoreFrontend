import type { RouteRecordRaw } from 'vue-router'

export const inviteRouteNames = {
  invite: 'invite'
}

export const inviteRoutes: RouteRecordRaw[] = [
  {
    path: 'invites/:token',
    name: inviteRouteNames.invite,
    // Публічний: сторінка сама показує запрошення і пропонує увійти з поверненням назад.
    meta: { public: true },
    component: () => import('@/views/invites/InvitePage.vue')
  }
]
