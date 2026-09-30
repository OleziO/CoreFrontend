<template>
  <nav
    class="mobile-tabbar"
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
import { PhHouse, PhTrophy, PhUsersThree, PhUser, PhRanking, PhSword, PhList } from '@phosphor-icons/vue'

const route = useRoute()
const togglerStore = useTogglerStore()

const tabs: { name: string; label: string; icon: Component }[] = [
  { name: routeNames.rootPage, label: 'Головна', icon: PhHouse },
  { name: routeNames.tournaments, label: 'Турніри', icon: PhTrophy },
  { name: routeNames.teams, label: 'Команди', icon: PhUsersThree },
  { name: routeNames.players, label: 'Гравці', icon: PhUser },
  { name: routeNames.leaderboard, label: 'Лідери', icon: PhRanking },
  { name: routeNames.duels, label: 'Дуелі', icon: PhSword }
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
         grid grid-cols-7
         bg-surface/95 backdrop-blur-xl
         shadow-elevation-4;
  border-top: 1px solid var(--ds-border);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Neon hairline across the top edge. */
.mobile-tabbar::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, rgba(46, 229, 255, 0.55) 50%, transparent 100%);
}

/* Ховаємо таббар на десктопі саме тут, а не класом `lg:hidden` у шаблоні:
   scoped-селектор (.mobile-tabbar[data-v-…]) специфічніший за утиліту .lg\:hidden,
   тож клас програвав, а зафіксований таббар перекривав футер. */
@screen lg {
  .mobile-tabbar {
    display: none;
  }
}

.mobile-tab {
  @apply relative flex flex-col items-center justify-center gap-2
         min-h-[58px] px-4 py-6
         text-caption font-medium text-white/55
         bg-transparent border-0 cursor-pointer
         transition-colors duration-200;
}

/* Active indicator: a short neon bar on the top edge of the tab. */
.mobile-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 28px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 10px rgba(46, 229, 255, 0.8);
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.mobile-tab:hover {
  @apply text-white/80;
}

.mobile-tab--active {
  @apply text-primary;
  text-shadow: var(--ds-neon-text-subtle);
}

.mobile-tab--active::before {
  transform: translateX(-50%) scaleX(1);
}

.mobile-tab__label {
  @apply leading-none;
}
</style>
