import type { RouteRecordRaw } from 'vue-router'

export const duelsRouteNames = {
  duels: 'duels'
}

/** 1v1 ліга: черга на дуель Solo Mid, активна дуель, історія та топ-10 рейтингу. */
export const duelsRoutes: RouteRecordRaw[] = [
  {
    path: '1v1',
    name: duelsRouteNames.duels,
    meta: {
      public: true,
      seo: {
        title: '1v1 Ліга',
        description:
          'Рейтингові дуелі 1v1 Solo Mid у Core League: стань у чергу, зіграй проти суперника свого рівня та піднімайся в таблиці.'
      }
    },
    component: () => import('@/views/duels/Duels.vue')
  }
]
