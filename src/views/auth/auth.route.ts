export const authRouteNames = {
  authCallback: 'auth-callback'
} as const

export const authRoutes = [
  {
    path: 'auth/callback',
    name: authRouteNames.authCallback,
    meta: { public: true, seo: { title: 'Вхід', noindex: true } },
    component: () => import('@/views/auth/AuthCallback.vue')
  }
]
