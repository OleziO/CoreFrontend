import { createApp } from 'vue'
import App from '@/App.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import { router } from '@/router'
import { store } from '@/store/create-store'

import '@/assets/styles/main.scss'

import VueVirtualScroller from 'vue-virtual-scroller'
import PhosphorIcons from '@phosphor-icons/vue'

const app = createApp(App)

app
  .use(store)
  .use(router)
  .use(VueVirtualScroller)
  .use(PhosphorIcons)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

export {
  app
}
