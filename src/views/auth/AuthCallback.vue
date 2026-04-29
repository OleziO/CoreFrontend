<template>
  <div class="flex flex-col items-center justify-center h-screen text-center px-20">
    <!-- До onMounted не було жодного v-if — лише білий екран -->
    <template v-if="bootstrapping || authStore.loginLoading">
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

    <!-- Страховка: після успішного редіректу finally міг би зняти bootstrapping до розмонтування → один кадр без контенту -->
    <template v-else>
      <div class="animate-spin rounded-full h-40 w-40 border-4 border-primary border-t-transparent mb-20" />
      <p class="text-gray-400 mt-10">Перенаправлення…</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { firstQueryValue } from '@/core/helpers'
import { useAuthStore } from '@/store/modules/auth'
import { routeNames } from '@/router/route-names'
import { PhWarningCircle } from '@phosphor-icons/vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

/** Поки не перевірили query / сесію Supabase (у URL уже може не бути code — токен у sb-*-auth-token). */
const bootstrapping = ref(true)

onMounted(async () => {
  authStore.loginError = null

  /** Не знімати bootstrapping після успішного редіректу — інакше кадр без спінера/помилки (білий екран). */
  let stayOnBootstrapUntilUnmount = false

  try {
    const code = firstQueryValue(route.query.code)

    if (code) {
      const success = await authStore.handleDiscordCallback(code)
      if (success) {
        stayOnBootstrapUntilUnmount = true
        await router.replace({ name: routeNames.profile })
        return
      }
      return
    }

    /** Дати час detectSessionInUrl / внутрішній стан Supabase оновитися перед перевіркою сесії без code у query. */
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    await authStore.hydrateSession()
    if (authStore.token) {
      stayOnBootstrapUntilUnmount = true
      await router.replace({ name: routeNames.profile })
      return
    }

    authStore.loginError = 'Відсутні параметри авторизації (code або state), або сесія недійсна.'
    setTimeout(() => router.replace({ name: routeNames.rootPage }), 3000)
  } finally {
    if (!stayOnBootstrapUntilUnmount) {
      bootstrapping.value = false
    }
  }
})

function retryLogin () {
  authStore.startDiscordLogin()
}
</script>
