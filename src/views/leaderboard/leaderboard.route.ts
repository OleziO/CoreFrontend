import type { RouteRecordRaw } from 'vue-router'

export const leaderboardRouteNames = {
  leaderboard: 'leaderboard'
}

/** Публічна таблиця лідерів — рейтинг гравців за статистикою та досягненнями платформи. */
export const leaderboardRoutes: RouteRecordRaw[] = [
  {
    path: 'leaderboard',
    name: leaderboardRouteNames.leaderboard,
    meta: {
      public: true,
      seo: {
        title: 'Таблиця лідерів',
        description:
          'Рейтинг гравців Core League: перемоги, п’єдестали, досягнення та турнірні очки в одній таблиці лідерів.'
      }
    },
    component: () => import('@/views/leaderboard/Leaderboard.vue')
  }
]
