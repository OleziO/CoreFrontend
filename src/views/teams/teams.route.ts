import type { RouteRecordRaw } from 'vue-router'

export const teamRouteNames = {
  teams: 'teams',
  team: 'team'
}

export const teamsRoutes: RouteRecordRaw[] = [{
  path: 'teams',
  name: teamRouteNames.teams,
  component: () => import('@/views/teams/Teams.vue')
},
{
  path: 'teams/:id',
  name: teamRouteNames.team,
  component: () => import('@/views/teams/Team.vue')
}]
