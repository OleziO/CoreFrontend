import { playersRouteNames, playersRoutes } from '@/views/players/players.route'

import PageLayout from '@/layouts/PageLayout.vue'
import { teamRouteNames, teamsRoutes } from '@/views/teams/teams.route'
import { tournamentRouteNames, tournamentRoutes } from '@/views/tournaments/tournaments.route'
import { profileRouteNames, profileRoutes } from '@/views/profile/profile.route'
import { mixTournamentRouteNames, mixTournamentRoutes } from '@/views/mix-tournaments/mix-tournaments.route'
import { adminPanelRouteNames, adminPanelRoutes } from '@/views/admin-panel/admin-panel.route'

export const routeNames = {
  ...playersRouteNames,
  ...teamRouteNames,
  ...tournamentRouteNames,
  ...profileRouteNames,
  ...mixTournamentRouteNames,
  ...adminPanelRouteNames,
  rootPage: '/',
  loginSuccess: 'login-success',
  mixLEaderboard: 'mix-cup-leaderboard',
  rules: '/rules',
  roulette: 'roulette'
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
        path: 'mix-cup-leaderboard',
        name: routeNames.mixLEaderboard,
        component: () => import('@/views/MixCupLeaderboard.vue')
      },
      {
        path: 'login-success',
        name: routeNames.loginSuccess,
        component: () => import('@/views/login-success/LoginSuccess.vue')
      },
      {
        path: '/rules',
        name: routeNames.rules,
        component: () => import('@/views/rules/Rules.vue')
      },
      {
        path: '/r',
        name: routeNames.roulette,
        component: () => import('@/views/roulette/Roulette.vue')
      },
      ...tournamentRoutes,
      ...teamsRoutes,
      ...playersRoutes,
      ...profileRoutes,
      ...mixTournamentRoutes,
      ...adminPanelRoutes
    ]
  }
]
