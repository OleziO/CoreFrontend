import { playersRouteNames, playersRoutes } from '@/views/players/players.route'
import PageLayout from '@/layouts/PageLayout.vue'
import { teamRouteNames, teamsRoutes } from '@/views/teams/teams.route'
import { tournamentRouteNames, tournamentRoutes } from '@/views/tournaments/tournaments.route'
import { profileRouteNames, profileRoutes } from '@/views/profile/profile.route'
import { adminPanelRouteNames, adminPanelRoutes } from '@/views/admin-panel/admin-panel.route'
import { authRouteNames, authRoutes } from '@/views/auth/auth.route'
import { inviteRouteNames, inviteRoutes } from '@/views/invites/invites.route'
import { mainRouteNames, mainRoutes } from '@/views/main/main.route'
import { loginSuccessRouteNames, loginSuccessRoutes } from '@/views/login-success/login-success.route'
import { financeMonitorRouteNames, financeMonitorRoutes } from '@/views/finance-monitor/finance-monitor.route'
import { analyticsRouteNames, analyticsRoutes } from '@/views/analytics/analytics.route'
import { leaderboardRouteNames, leaderboardRoutes } from '@/views/leaderboard/leaderboard.route'

export const routeNames = {
  ...playersRouteNames,
  ...teamRouteNames,
  ...tournamentRouteNames,
  ...profileRouteNames,
  ...adminPanelRouteNames,
  ...authRouteNames,
  ...inviteRouteNames,
  ...mainRouteNames,
  ...loginSuccessRouteNames,
  ...financeMonitorRouteNames,
  ...analyticsRouteNames,
  ...leaderboardRouteNames
}

export const routes = [
  {
    path: '/',
    component: PageLayout,
    children: [
      ...mainRoutes,
      ...loginSuccessRoutes,
      ...authRoutes,
      ...inviteRoutes,
      ...tournamentRoutes,
      ...teamsRoutes,
      ...playersRoutes,
      ...profileRoutes,
      ...adminPanelRoutes,
      ...financeMonitorRoutes,
      ...analyticsRoutes,
      ...leaderboardRoutes
    ]
  }
]
