import type { RouteRecordRaw } from 'vue-router'

export const inviteRouteNames = {
  invite: 'invite'
}

export const inviteRoutes: RouteRecordRaw[] = [
  {
    path: 'invites/:token',
    name: inviteRouteNames.invite,
    component: () => import('@/views/invites/InvitePage.vue')
  }
]
