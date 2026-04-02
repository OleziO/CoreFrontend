import type { RouteRecordRaw } from 'vue-router'
export const tournamentRouteNames = {
  tournaments: 'tournaments',
  teamTournament: 'tournament'
}

export const tournamentRoutes: RouteRecordRaw[] = [
  {
    path: 'tournaments',
    name: tournamentRouteNames.tournaments,
    component: () => import('@/views/tournaments/Tournaments.vue')
  },
  {
    path: 'tournaments/:id',
    name: tournamentRouteNames.teamTournament,
    component: () => import('@/views/tournaments/Tournament.vue')
  }
]
