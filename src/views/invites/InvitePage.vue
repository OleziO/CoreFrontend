<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] px-20">
    <!-- Loading -->
    <template v-if="loading">
      <div class="animate-spin rounded-full h-40 w-40 border-4 border-primary border-t-transparent mb-20" />
      <p class="text-gray-400">Завантаження запрошення...</p>
    </template>

    <!-- Error -->
    <template v-else-if="error">
      <PhWarningCircle :size="56" class="text-red-400 mb-16" />
      <h2 class="text-xl font-semibold text-red-400 mb-8">{{ error }}</h2>
      <el-button @click="router.push({ name: routeNames.rootPage })">
        На головну
      </el-button>
    </template>

    <!-- Invite card -->
    <template v-else-if="invite">
      <div
        class="bg-bg-secondary rounded-xl border border-white/10 p-40
          flex flex-col items-center gap-20 w-full max-w-sm text-center shadow-xl"
      >
        <!-- Team logo -->
        <el-avatar
          :size="80"
          :src="invite.logoUrl ?? undefined"
          shape="square"
          class="rounded-lg border border-white/10"
        >
          <PhShield :size="40" class="text-gray-400" />
        </el-avatar>

        <div class="flex flex-col gap-6">
          <h2 class="text-2xl font-bold text-white">{{ invite.teamName }}</h2>
          <p class="text-gray-400 text-sm">
            Вас запрошено до команди як
            <span class="text-white font-medium">{{ slotLabel }}</span>
          </p>
          <p class="text-gray-500 text-xs">
            Запрошення дійсне до {{ expiresAtFormatted }}
          </p>
        </div>

        <!-- Not logged in -->
        <template v-if="!authStore.isLoggedIn">
          <p class="text-gray-400 text-sm">
            Щоб прийняти запрошення, спочатку увійдіть через Discord
          </p>
          <el-button
            type="primary"
            size="large"
            :loading="authStore.loginLoading"
            class="w-full"
            @click="loginAndReturn"
          >
            <PhDiscordLogo :size="18" class="mr-8" />
            Увійти через Discord
          </el-button>
        </template>

        <!-- Logged in -->
        <template v-else>
          <el-button
            type="primary"
            size="large"
            :loading="accepting"
            class="w-full"
            @click="accept"
          >
            Приєднатися до команди
          </el-button>
          <el-button
            size="large"
            class="w-full"
            @click="router.push({ name: routeNames.rootPage })"
          >
            Відхилити
          </el-button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { PhWarningCircle, PhShield, PhDiscordLogo } from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/modules/auth'
import { routeNames } from '@/router/route-names'
import { invitesService, POST_LOGIN_REDIRECT_KEY, type TInviteInfo } from './invites.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => route.params.token as string)
const loading = ref(true)
const accepting = ref(false)
const error = ref<string | null>(null)
const invite = ref<TInviteInfo | null>(null)

const slotLabel = computed(() => {
  const map: Record<string, string> = {
    main: 'Основний гравець',
    reserved: 'Запасний гравець',
    coach: 'Тренер'
  }
  return invite.value ? (map[invite.value.slot] ?? invite.value.slot) : ''
})

const expiresAtFormatted = computed(() => {
  if (!invite.value) return ''
  return new Date(invite.value.expiresAt).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

onMounted(async () => {
  try {
    invite.value = await invitesService.getInviteInfo(token.value)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      error.value = 'Запрошення не знайдено або вже було використано'
    } else if (status === 410) {
      error.value = 'Термін дії запрошення закінчився'
    } else {
      error.value = 'Не вдалося завантажити запрошення'
    }
  } finally {
    loading.value = false
  }
})

function loginAndReturn () {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, route.fullPath)
  authStore.startDiscordLogin()
}

async function accept () {
  accepting.value = true
  try {
    await invitesService.acceptInvite(token.value)
    ElMessage.success('Ви успішно приєдналися до команди!')
    router.push({ name: routeNames.profile })
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? 'Помилка при прийнятті запрошення'
    ElMessage.error(msg)
  } finally {
    accepting.value = false
  }
}
</script>
