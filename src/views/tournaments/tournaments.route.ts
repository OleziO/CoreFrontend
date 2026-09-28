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
    meta: {
      public: true,
      seo: {
        title: 'Турніри з Dota 2 — розклад, реєстрація, призові',
        description:
          'Актуальні турніри з Dota 2 від Core League: відкриті реєстрації, кваліфікації, сітки плей-оф і призові ' +
          'фонди. Онлайн та LAN-турніри у Львові та по всій Україні для команд 5×5.'
      }
    },
    component: () => import('@/views/tournaments/Tournaments.vue')
  },
  {
    path: 'tournaments/:id',
    name: tournamentRouteNames.tournament,
    meta: { seo: { title: 'Турнір з Dota 2' } },
    component: () => import('@/views/tournaments/Tournament.vue')
  }
]
