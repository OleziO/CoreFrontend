<template>
  <div class="h-full text-white w-full overflow-hidden flex flex-col admin-panel-root">
    <div class="w-full max-w-7xl mx-auto flex flex-col h-full px-16 lg:px-24">
      <nav
        class="flex gap-8 pt-20 pb-12 shrink-0 overflow-x-auto no-scrollbar"
        aria-label="Розділи адмінки"
      >
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="inline-flex items-center gap-8 rounded-xl px-16 py-10 text-sm font-semibold whitespace-nowrap
                 border transition-colors duration-200 cursor-pointer outline-none
                 focus-visible:ring-2 focus-visible:ring-primary/40"
          :class="activeTab === tab.value
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20'"
          :aria-current="activeTab === tab.value ? 'page' : undefined"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" :size="18" weight="bold" />
          {{ tab.label }}
          <span
            v-if="tab.count"
            class="ml-2 inline-flex min-w-[20px] justify-center rounded-full bg-error px-6 py-1
                   text-[11px] font-bold leading-none text-white"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>

      <div class="flex-1 min-h-0 py-6 overflow-hidden">
        <component :is="tabsObject[activeTab].component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createHashedObject } from '@/core/helpers'
import { PhTrophy, PhClipboardText, PhBug } from '@phosphor-icons/vue'
import TournamentsDetails from './components/TournamentsDetails.vue'
import RequestsDetails from './components/RequestsDetails.vue'
import BugsTab from './components/tabs/BugsTab.vue'

type TAdminTabType = 'tournaments' | 'requests' | 'bugs'

const tabs: {
  value: TAdminTabType
  label: string
  icon: Component
  count?: number
  component: Component
}[] = [
  {
    value: 'tournaments',
    label: 'Турніри',
    icon: PhTrophy,
    component: TournamentsDetails
  },
  {
    value: 'requests',
    label: 'Запити',
    icon: PhClipboardText,
    component: RequestsDetails
  },
  {
    value: 'bugs',
    label: 'Баги',
    icon: PhBug,
    component: BugsTab
  }
]

const tabsObject = createHashedObject(tabs, 'value')
const activeTab = ref<TAdminTabType>('tournaments')

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.admin-panel-root {
  overflow: hidden !important;
}
</style>
