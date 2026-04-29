/// <reference types="vite/client" />

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
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Повний origin фронтенду для OAuth redirect (напр. https://app.example.com); без слеша в кінці. */
  readonly VITE_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}