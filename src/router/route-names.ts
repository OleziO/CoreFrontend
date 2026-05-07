import { playersRouteNames, playersRoutes } from '@/views/players/players.route'

import PageLayout from '@/layouts/PageLayout.vue'
import { teamRouteNames, teamsRoutes } from '@/views/teams/teams.route'
import { tournamentRouteNames, tournamentRoutes } from '@/views/tournaments/tournaments.route'
import { profileRouteNames, profileRoutes } from '@/views/profile/profile.route'
import { adminPanelRouteNames, adminPanelRoutes } from '@/views/admin-panel/admin-panel.route'
import { authRouteNames, authRoutes } from '@/views/auth/auth.route'
import { inviteRouteNames, inviteRoutes } from '@/views/invites/invites.route'

export const routeNames = {
  ...playersRouteNames,
  ...teamRouteNames,
  ...tournamentRouteNames,
  ...profileRouteNames,
  ...adminPanelRouteNames,
  ...authRouteNames,
  ...inviteRouteNames,
  rootPage: '/',
  loginSuccess: 'login-success'
}

export const routes = [
  {
    path: '/',
    component: PageLayout,
    children: [
      {
        path: '',
        name: routeNames.rootPage,
        component: () => import('@/views/main/Main.vue')
      },
      {
        path: 'login-success',
        name: routeNames.loginSuccess,
        component: () => import('@/views/login-success/LoginSuccess.vue')
      },
      ...authRoutes,
      ...inviteRoutes,
      ...tournamentRoutes,
      ...teamsRoutes,
      ...playersRoutes,
      ...profileRoutes,
      ...adminPanelRoutes
    ]
  }
]
