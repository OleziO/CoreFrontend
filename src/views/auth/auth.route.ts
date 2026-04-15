export const authRouteNames = {
  authCallback: 'auth-callback'
} as const

export const authRoutes = [
  {
    path: 'auth/callback',
    name: authRouteNames.authCallback,
    component: () => import('@/views/auth/AuthCallback.vue')
  }
]
