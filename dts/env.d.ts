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
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}