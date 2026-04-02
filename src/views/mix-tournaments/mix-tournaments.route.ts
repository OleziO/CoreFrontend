import type { RouteRecordRaw } from 'vue-router'

export const mixTournamentRouteNames = {
  mixTournaments: 'mix-tournaments',
  mixTournament: 'mix-tournament'
}

export const mixTournamentRoutes: RouteRecordRaw[] = [
  {
    path: 'mix-tournaments',
    name: mixTournamentRouteNames.mixTournaments,
    component: () => import('@/views/mix-tournaments/MixTournaments.vue')
  },
  {
    path: 'mix-tournaments/:id',
    name: mixTournamentRouteNames.mixTournament,
    component: () => import('@/views/mix-tournaments/MixTournament.vue')
  }
]
