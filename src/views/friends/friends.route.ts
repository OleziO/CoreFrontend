import type { RouteRecordRaw } from 'vue-router'

export const friendsRouteNames = {
  friends: 'friends'
}

/** Друзі: список друзів, вхідні та надіслані запити, пошук гравців. Лише для авторизованих. */
export const friendsRoutes: RouteRecordRaw[] = [
  {
    path: 'friends',
    name: friendsRouteNames.friends,
    meta: {
      seo: {
        title: 'Друзі',
        description: 'Ваші друзі у Core League: запити в друзі, дружні дуелі Solo Mid та профілі гравців.'
      }
    },
    component: () => import('@/views/friends/Friends.vue')
  }
]
