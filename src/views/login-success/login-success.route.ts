import type { RouteRecordRaw } from 'vue-router'

export const loginSuccessRouteNames = {
  loginSuccess: 'login-success'
}

export const loginSuccessRoutes: RouteRecordRaw[] = [
  {
    path: 'login-success',
    name: loginSuccessRouteNames.loginSuccess,
    meta: { public: true, seo: { title: 'Вхід виконано', noindex: true } },
    component: () => import('@/views/login-success/LoginSuccess.vue')
  }
]
