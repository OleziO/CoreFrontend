<template>
  <transition name="mobile-menu">
    <div
      v-if="togglerStore.showMobileMenu"
      class="mobile-menu-overlay"
      @click.self="close"
    >
      <nav class="mobile-menu-panel">
        <button
          v-for="item in menu"
          :key="item.to"
          class="mobile-menu-link"
          @click="go(item.to)"
        >
          {{ item.label }}
        </button>
        <RoleGuard :roles="['admin', 'moderator']">
          <button
            class="mobile-menu-link"
            @click="go(routeNames.adminPanel)"
          >
            Адмінка
          </button>
        </RoleGuard>

        <template v-if="!authStore.token">
          <el-button
            type="primary"
            class="w-full mt-10"
            :loading="authStore.loginLoading"
            @click="handleDiscordLogin"
          >
            <PhDiscordLogo size="20" weight="bold" class="mr-8" />
            Увійти через Discord
          </el-button>
        </template>
        <template v-else>
          <button
            class="mobile-menu-link !text-red-400"
            @click="handleLogout"
          >
            Вийти з аккаунту
          </button>
        </template>
      </nav>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import { useRouter } from 'vue-router'
import RoleGuard from '@/guards/RoleGuard.vue'
import { PhDiscordLogo } from '@phosphor-icons/vue'

const router = useRouter()
const togglerStore = useTogglerStore()
const authStore = useAuthStore()

const menu = computed(() => {
  const items: { label: string; to: string }[] = [
    { label: 'Головна', to: routeNames.rootPage },
    { label: 'Турніри', to: routeNames.tournaments },
    { label: 'Команди', to: routeNames.teams },
    { label: 'Гравці', to: routeNames.players }
  ]
  if (authStore.token) {
    items.push({ label: 'Профіль', to: routeNames.profile })
  }
  return items
})

function close () {
  togglerStore.showMobileMenu = false
}

function go (name: string) {
  router.push({ name })
  close()
}

function handleDiscordLogin () {
  close()
  authStore.startDiscordLogin()
}

function handleLogout () {
  close()
  authStore.logout()
}
</script>

<style scoped>
/* ================= OVERLAY ================= */
.mobile-menu-overlay {
  @apply
    fixed inset-0 z-40
    bg-black/50
    backdrop-blur-xl
    flex items-center justify-center;
}

/* ================= PANEL ================= */
.mobile-menu-panel {
  @apply
    w-full max-w-[320px]
    mx-20
    rounded-3xl
    border border-white/15
    bg-white/5
    backdrop-blur-2xl
    shadow-[0_20px_60px_rgba(0,0,0,0.5)]
    flex flex-col items-center gap-24
    py-40 px-30;
}

/* ================= LINKS ================= */
.mobile-menu-link {
  @apply
    border-0 cursor-pointer
    text-xl font-medium text-white
    transition-all duration-200 ease-out
    hover:text-primary
    hover:scale-105;
}

/* ================= ANIMATION ================= */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}
</style>
