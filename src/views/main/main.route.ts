import type { RouteRecordRaw } from 'vue-router'

export const mainRouteNames = {
  rootPage: '/'
}

export const mainRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: mainRouteNames.rootPage,
    meta: {
      public: true,
      seo: {
        title: 'Core League — турніри з Dota 2 у Львові та Україні',
        description:
          'Core League — українська кіберспортивна ліга з Dota 2. Онлайн та LAN-турніри 5×5 у Львові й по всій ' +
          'Україні, призові фонди, рейтинг гравців і live-трансляції. Збери команду та реєструйся на турнір.'
      }
    },
    component: () => import('@/views/main/Main.vue')
  }
]
