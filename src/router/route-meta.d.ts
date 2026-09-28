import 'vue-router'
import type { TSeoOptions } from '@/composables/use-seo'

declare module 'vue-router' {
  // Ім'я інтерфейсу задає vue-router (module augmentation), префікс I тут неможливий.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface RouteMeta {
    /**
     * Маршрут доступний без авторизації. Усе, що не позначено `public: true`,
     * вважається приватним — див. `src/router/guards/auth.guard.ts`.
     */
    public?: boolean
    /**
     * Статичний SEO сторінки (title/description/canonical). Застосовується в
     * `router.afterEach` через `applyRouteSeo`; view може перекрити через `useSeo()`.
     * Приватні маршрути без `seo.noindex` отримують `noindex` автоматично.
     */
    seo?: TSeoOptions
  }
}
