import 'vue-router'

declare module 'vue-router' {
  // Ім'я інтерфейсу задає vue-router (module augmentation), префікс I тут неможливий.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface RouteMeta {
    /**
     * Маршрут доступний без авторизації. Усе, що не позначено `public: true`,
     * вважається приватним — див. `src/router/guards/auth.guard.ts`.
     */
    public?: boolean
  }
}
