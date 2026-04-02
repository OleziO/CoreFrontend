import type { Plugin } from 'vue'
import { routeNames } from '@/router/route-names'
import { dialogDefaultConfig } from '@/utils/dialog.utils'

export const globalProperties = {
  $routeNames: routeNames,
  $dialogDefaultConfig: dialogDefaultConfig
}

export const VueGlobalPropertiesPlugin: Plugin = {
  install: (app) => {
    for (const i in globalProperties) {
      app.config.globalProperties[i] = globalProperties[i as keyof typeof globalProperties]
    }
  }
}
