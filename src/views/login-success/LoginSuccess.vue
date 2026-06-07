<template>
  <div class="flex flex-col items-center justify-center h-screen text-center">
    <h2 class="text-xl font-semibold text-white">Вхід виконується...</h2>
    <p class="text-gray-400 mt-4">Будь ласка, зачекайте.</p>
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
