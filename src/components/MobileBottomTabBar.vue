<template>
  <nav
    class="mobile-tabbar lg:hidden"
    aria-label="Основна навігація"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="mobile-tab no-underline"
      :class="{ 'mobile-tab--active': isTabActive(tab.name) }"
      :aria-current="isTabActive(tab.name) ? 'page' : undefined"
    >
      <component
        :is="tab.icon"
        :size="22"
        :weight="isTabActive(tab.name) ? 'fill' : 'regular'"
      />
      <span class="mobile-tab__label">{{ tab.label }}</span>
    </RouterLink>

    <button
      type="button"
      class="mobile-tab"
      :class="{ 'mobile-tab--active': togglerStore.showMobileMenu }"
      aria-haspopup="dialog"
      :aria-expanded="togglerStore.showMobileMenu"
      aria-label="Відкрити меню"
      @click="togglerStore.showMobileMenu = !togglerStore.showMobileMenu"
    >
      <PhList :size="22" :weight="togglerStore.showMobileMenu ? 'fill' : 'regular'" />
      <span class="mobile-tab__label">Меню</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import { PhHouse, PhTrophy, PhUsersThree, PhUser, PhList } from '@phosphor-icons/vue'

const route = useRoute()
const togglerStore = useTogglerStore()

const tabs: { name: string; label: string; icon: Component }[] = [
  { name: routeNames.rootPage, label: 'Головна', icon: PhHouse },
  { name: routeNames.tournaments, label: 'Турніри', icon: PhTrophy },
  { name: routeNames.teams, label: 'Команди', icon: PhUsersThree },
  { name: routeNames.players, label: 'Гравці', icon: PhUser }
]

const detailOf: Record<string, string> = {
  [routeNames.tournaments]: routeNames.tournament,
  [routeNames.teams]: routeNames.team,
  [routeNames.players]: routeNames.player
}

function isTabActive (name: string): boolean {
  if (route.name === name) return true
  return detailOf[name] !== undefined && route.name === detailOf[name]
}
</script>

<style scoped>
.mobile-tabbar {
  @apply fixed bottom-0 left-0 right-0 z-50
         grid grid-cols-5
         border-t border-white/10
         bg-surface/95 backdrop-blur-xl
         shadow-elevation-4;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-tab {
  @apply flex flex-col items-center justify-center gap-2
         min-h-[58px] px-4 py-6
         text-caption font-medium text-white/55
         bg-transparent border-0 cursor-pointer
         transition-colors duration-200;
}

.mobile-tab:hover {
  @apply text-white/80;
}

.mobile-tab--active {
  @apply text-primary;
}

.mobile-tab__label {
  @apply leading-none;
}
</style>
