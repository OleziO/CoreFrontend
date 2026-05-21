import { set, event } from 'vue-gtag'

export function useAnalyticsUserTracking () {
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) return

  const authStore = useAuthStore()

  watch(
    () => authStore.user,
    (user, prevUser) => {
      if (user) {
        set({ user_id: user.id })
        set('user_properties', { user_type: 'registered' })
        // Fire login only on transition, not on initial hydration when already logged in
        if (prevUser === null) {
          event('login', { method: 'Discord' })
        }
      } else {
        set({ user_id: null })
        set('user_properties', { user_type: 'anonymous' })
      }
    },
    { immediate: true }
  )
}
