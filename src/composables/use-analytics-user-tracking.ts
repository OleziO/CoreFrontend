import { set } from 'vue-gtag'

export function useAnalyticsUserTracking () {
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) return

  const authStore = useAuthStore()

  watch(
    () => authStore.user,
    (user) => {
      if (user) {
        set({ user_id: user.id })
        set('user_properties', { user_type: 'registered' })
      } else {
        set({ user_id: null })
        set('user_properties', { user_type: 'anonymous' })
      }
    },
    { immediate: true }
  )
}
