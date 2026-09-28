import type { RouteRecordRaw } from 'vue-router'

export const playersRouteNames = {
  players: 'players',
  player: 'player'
}

export const playersRoutes: RouteRecordRaw[] = [{
  path: 'players',
  name: playersRouteNames.players,
  meta: {
    seo: {
      title: 'Гравці Dota 2',
      description: 'Реєстр гравців Core League: рейтинг, позиції та досягнення в турнірах з Dota 2.'
    }
  },
  component: () => import('@/views/players/Players.vue')
},
{
  path: 'players/:id',
  name: playersRouteNames.player,
  meta: { seo: { title: 'Гравець' } },
  component: () => import('@/views/players/Player.vue')
}]
