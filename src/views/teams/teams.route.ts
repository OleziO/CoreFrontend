import type { RouteRecordRaw } from 'vue-router'

export const teamRouteNames = {
  teams: 'teams',
  team: 'team'
}

export const teamsRoutes: RouteRecordRaw[] = [{
  path: 'teams',
  name: teamRouteNames.teams,
  meta: {
    seo: {
      title: 'Команди Dota 2',
      description: 'Реєстр команд Core League: склади, рейтинг і участь у турнірах з Dota 2.'
    }
  },
  component: () => import('@/views/teams/Teams.vue')
},
{
  path: 'teams/:id',
  name: teamRouteNames.team,
  meta: { seo: { title: 'Команда' } },
  component: () => import('@/views/teams/Team.vue')
}]
