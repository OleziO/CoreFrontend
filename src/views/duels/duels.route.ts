import type { RouteRecordRaw } from 'vue-router'

export const duelsRouteNames = {
  duels: 'duels',
  duelTournament: 'duelTournament'
}

/** Дуелі: черга на дуель Solo Mid з випадковими героями, активна дуель, історія та топ-10 рейтингу. */
export const duelsRoutes: RouteRecordRaw[] = [
  {
    path: 'duels',
    name: duelsRouteNames.duels,
    meta: {
      public: true,
      seo: {
        title: 'Дуелі',
        description:
          'Рейтингові дуелі Solo Mid із випадковими героями у Core League: стань у чергу, ' +
          'зіграй проти суперника свого рівня та піднімайся в таблиці.'
      }
    },
    component: () => import('@/views/duels/Duels.vue')
  },
  /** Турнір дуелей з паролем: таблиця турніру (публічна), вхід за паролем, керування для організатора. */
  {
    path: 'duels/tournaments/:id',
    name: duelsRouteNames.duelTournament,
    meta: {
      public: true,
      seo: {
        title: 'Турнір дуелей',
        description: 'Турнір дуелей Solo Mid у Core League: власна таблиця учасників і рейтинг турніру.'
      }
    },
    component: () => import('@/views/duels/DuelTournament.vue')
  },
  // Стара адреса ліги — щоб не ламати збережені посилання.
  { path: '1v1', redirect: { name: duelsRouteNames.duels } }
]
