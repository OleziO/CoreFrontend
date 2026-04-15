<template>
  <div class="flex flex-col items-center justify-center h-screen text-center px-20">
    <template v-if="authStore.loginLoading">
      <div class="animate-spin rounded-full h-40 w-40 border-4 border-primary border-t-transparent mb-20" />
      <h2 class="text-xl font-semibold text-white">Вхід виконується...</h2>
      <p class="text-gray-400 mt-10">Зачекайте, ми обробляємо вашу авторизацію через Discord.</p>
    </template>

    <template v-else-if="authStore.loginError">
      <PhWarningCircle :size="48" class="text-red-400 mb-16" />
      <h2 class="text-xl font-semibold text-red-400">Помилка авторизації</h2>
      <p class="text-gray-400 mt-10 max-w-md">{{ authStore.loginError }}</p>
      <el-button
        type="primary"
        class="mt-20"
        @click="retryLogin"
      >
        Спробувати ще раз
      </el-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { routeNames } from '@/router/route-names'
import { PhWarningCircle } from '@phosphor-icons/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const code = route.query.code as string | undefined
  const state = route.query.state as string | undefined

  if (!code || !state) {
    authStore.loginError = 'Відсутні параметри авторизації (code або state).'
    setTimeout(() => router.replace({ name: routeNames.rootPage }), 3000)
    return
  }

  const success = await authStore.handleDiscordCallback(code, state)

  if (success) {
    router.replace({ name: routeNames.rootPage })
  }
})

function retryLogin () {
  authStore.startDiscordLogin()
}
</script>
