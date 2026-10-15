import type { RouteRecordRaw } from 'vue-router'

export const mediaRouteNames = {
  media: 'media',
  mediaDuels: 'mediaDuels',
  mediaTeams: 'mediaTeams',
  mediaBracket: 'mediaBracket'
}

/** Вкладка хабу медіа-турнірів — з роуту, щоб посилання на «5v5» відкривало саме її. */
export type TMediaTab = '1v1' | '5v5'

/**
 * Медіа-турніри: турніри стрімерів ліги. «1v1» — сітки на вибування, де кожен матч
 * хостить бот ліги; «5v5» — командні турніри ліги, що йдуть на нашому Twitch.
 */
export const mediaRoutes: RouteRecordRaw[] = [
  { path: 'media', name: mediaRouteNames.media, redirect: { name: mediaRouteNames.mediaDuels } },
  {
    path: 'media/1v1',
    name: mediaRouteNames.mediaDuels,
    meta: {
      public: true,
      mediaTab: '1v1',
      seo: {
        title: 'Медіа-турніри 1v1',
        description:
          'Турніри стрімерів Core League 1 на 1: сітка на вибування, лобі створюють боти ліги, ' +
          'випадкові герої та призи. Реєструйся й грай на стрімі.'
      }
    },
    component: () => import('@/views/media/Media.vue')
  },
  {
    path: 'media/5v5',
    name: mediaRouteNames.mediaTeams,
    meta: {
      public: true,
      mediaTab: '5v5',
      seo: {
        title: 'Медіа-турніри 5v5',
        description: 'Командні турніри Core League з трансляцією на Twitch: що йде зараз, що скоро, що вже зіграно.'
      }
    },
    component: () => import('@/views/media/Media.vue')
  },
  /** Сторінка турніру 1v1: стрімер, призи, учасники, сітка й матчі з лобі. */
  {
    path: 'media/1v1/:id',
    name: mediaRouteNames.mediaBracket,
    meta: {
      public: true,
      seo: {
        title: 'Турнір 1v1',
        description: 'Медіа-турнір 1v1 у Core League: сітка на вибування, матчі з лобі від ботів ліги та призи.'
      }
    },
    component: () => import('@/views/media/MediaBracket.vue')
  }
]
