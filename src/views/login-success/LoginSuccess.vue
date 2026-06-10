<template>
  <div class="flex flex-col items-center justify-center h-screen text-center px-20">
    <div class="animate-spin rounded-full h-40 w-40 border-4 border-primary border-t-transparent mb-20" />
    <h2 class="font-display text-xl font-semibold text-white">Вхід виконується...</h2>
    <p class="text-gray-400 mt-10">Будь ласка, зачекайте — ми завершуємо авторизацію.</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth'
import { routeNames } from '@/router/route-names'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  const token = route.query.token as string | undefined

  if (token) {
    auth.login(token)
    router.replace({ name: routeNames.profile })
  } else {
    router.replace({ name: routeNames.rootPage })
  }
})
</script>
