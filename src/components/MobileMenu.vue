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
      </nav>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import { useRouter } from 'vue-router'

const router = useRouter()
const togglerStore = useTogglerStore()

const menu = [
  { label: 'Головна', to: routeNames.rootPage },
  { label: 'Профіль', to: routeNames.profile },
  { label: 'Турніри', to: routeNames.tournaments },
  { label: 'Mix Cup', to: routeNames.mixTournaments },
  { label: 'Команди', to: routeNames.teams },
  { label: 'Гравці', to: routeNames.players },
  { label: 'Лідерборд', to: routeNames.mixLEaderboard },
  { label: 'FAQ', to: routeNames.rules }
]

function close () {
  togglerStore.showMobileMenu = false
}

function go (name: string) {
  router.push({ name })
  close()
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
