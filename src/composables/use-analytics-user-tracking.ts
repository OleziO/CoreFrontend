import { useGtag } from 'vue-gtag'

export function useAnalyticsUserTracking () {
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) return

  const authStore = useAuthStore()
  const { gtag } = useGtag()

  watch(
    () => authStore.user,
    (user) => {
      if (user) {
        gtag('set', { user_id: user.id })
        gtag('set', 'user_properties', { user_type: 'registered' })
      } else {
        gtag('set', { user_id: null })
        gtag('set', 'user_properties', { user_type: 'anonymous' })
      }
    },
    { immediate: true }
  )
}
