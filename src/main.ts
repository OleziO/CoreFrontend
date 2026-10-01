import App from '@/App.vue'
import { createGtag } from 'vue-gtag'

import { router } from '@/router'
import { store } from '@/store/create-store'

import '@/assets/styles/main.scss'

import { installTimeSpinnerDiscreteWheel } from '@/core/time-spinner-discrete-wheel'

installTimeSpinnerDiscreteWheel()

const app = createApp(App)

// Іконки (@phosphor-icons/vue, @element-plus/icons-vue) імпортуються явно в кожному
// компоненті: глобальна реєстрація всіх наборів тягнула ~7 МБ у головний чанк.
app
  .use(store)
  .use(router)

if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  app.use(createGtag({ tagId: import.meta.env.VITE_GA_MEASUREMENT_ID, pageTracker: { router } }))
}

app.mount('#app')

export {
  app
}
