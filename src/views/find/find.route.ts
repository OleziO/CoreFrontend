import type { RouteRecordRaw } from 'vue-router'

export const findRouteNames = {
  find: 'find'
}

/**
 * Пошук команди / гравця: вкладки «Команди» (оголошення команд, гравці подають заявки)
 * та «Гравці» (гравці шукають команду, капітани запрошують). Лише для авторизованих.
 */
export const findRoutes: RouteRecordRaw[] = [
  {
    path: 'find',
    name: findRouteNames.find,
    meta: {
      seo: {
        title: 'Пошук команди',
        description: 'Знайдіть команду або гравців у Core League: оголошення команд, заявки та запрошення.'
      }
    },
    component: () => import('@/views/find/Find.vue')
  }
]
