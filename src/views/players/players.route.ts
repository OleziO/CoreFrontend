import type { RouteRecordRaw } from 'vue-router'

export const playersRouteNames = {
  players: 'players',
  player: 'player'
}

export const playersRoutes: RouteRecordRaw[] = [{
  path: 'players',
  name: playersRouteNames.players,
  component: () => import('@/views/players/Players.vue')
},
{
  path: 'players/:id',
  name: playersRouteNames.player,
  component: () => import('@/views/players/Player.vue')
}]
