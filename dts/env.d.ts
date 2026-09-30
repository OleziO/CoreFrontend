/// <reference types="vite/client" />
/// <reference path="../src/api/types/schema-helpers.d.ts" />
/// <reference path="../src/views/players/players.d.ts" />
/// <reference path="../src/views/teams/teams.types.d.ts" />
/// <reference path="../src/views/tournaments/tournaments.d.ts" />
/// <reference path="../src/views/analytics/analytics.d.ts" />
/// <reference path="../src/views/leaderboard/leaderboard.d.ts" />
/// <reference path="../src/views/duels/duels.d.ts" />
/// <reference path="../src/views/friends/friends.d.ts" />

declare module 'vue-virtual-scroller' {
  import { DefineComponent } from 'vue'
  const RecycleScroller: DefineComponent<any, any, any>
  const DynamicScroller: DefineComponent<any, any, any>
  const DynamicScrollerItem: DefineComponent<any, any, any>
  export { RecycleScroller, DynamicScroller, DynamicScrollerItem }
  export function install(app: any): void
}

/* UPDATE DEPENDING ON YOUR PROJRCT NEEDS */

interface ImportMetaEnv {
  readonly VITE_API_PUBLIC_URL: string
  readonly VITE_API_PUBLIC_URL_V2: string
  /** Публічний origin сайту для canonical/og:url (без слеша в кінці). Опційно. */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}