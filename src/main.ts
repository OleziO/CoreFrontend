import { createApp } from 'vue'
import App from '@/App.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createGtag } from 'vue-gtag'

import { router } from '@/router'
import { store } from '@/store/create-store'

import '@/assets/styles/main.scss'

import { installTimeSpinnerDiscreteWheel } from '@/core/time-spinner-discrete-wheel'

import VueVirtualScroller from 'vue-virtual-scroller'
import PhosphorIcons from '@phosphor-icons/vue'

installTimeSpinnerDiscreteWheel()

const app = createApp(App)

app
  .use(store)
  .use(router)
  .use(VueVirtualScroller)
  .use(PhosphorIcons)

if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  app.use(createGtag({ tagId: import.meta.env.VITE_GA_MEASUREMENT_ID, pageTracker: { router } }))
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

export {
  app
}
