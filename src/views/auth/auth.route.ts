export const authRouteNames = {
  authCallback: 'auth-callback'
} as const

export const authRoutes = [
  {
    path: 'auth/callback',
    name: authRouteNames.authCallback,
    meta: { public: true },
    component: () => import('@/views/auth/AuthCallback.vue')
  }
]
