import type { RouteRecordRaw } from 'vue-router'

/** Імена маршрутів (узгоджено з teams/players: список — множина, картка — однина). */
export const tournamentRouteNames = {
  tournaments: 'tournaments',
  tournament: 'tournament'
} as const

export const tournamentRoutes: RouteRecordRaw[] = [
  {
    path: 'tournaments',
    name: tournamentRouteNames.tournaments,
    meta: { public: true },
    component: () => import('@/views/tournaments/Tournaments.vue')
  },
  {
    path: 'tournaments/:id',
    name: tournamentRouteNames.tournament,
    component: () => import('@/views/tournaments/Tournament.vue')
  }
]
