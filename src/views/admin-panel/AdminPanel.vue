<template>
  <div class="h-full text-white w-full overflow-hidden flex flex-col admin-panel-root">
    <div class="w-[80%] mx-auto flex flex-col h-full">
      <div class="flex gap-30 px-20 pt-20 border-b border-gray-800 shrink-0">
        <template v-for="tab in tabs" :key="tab.value">
          <button
            class="pb-10 text-base font-medium transition-all duration-300
            cursor-pointer outline-none focus:outline-none border-b-2 border-transparent"
            :class="activeTab === tab.value ? 'text-primary border-primary' : 'text-gray-400 hover:text-gray-300'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </template>
      </div>

      <div class="flex-1 min-h-0 px-0 py-6 overflow-hidden">
        <component :is="tabsObject[activeTab].component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createHashedObject } from '@/core/helpers'
import TournamentsDetails from './components/TournamentsDetails.vue'
import RequestsDetails from './components/RequestsDetails.vue'
import BugsTab from './components/tabs/BugsTab.vue'

type TAdminTabType = 'tournaments' | 'requests' | 'bugs'

const tabs: {
  value: TAdminTabType
  label: string
  component: Component
}[] = [
  {
    value: 'tournaments',
    label: 'Турніри',
    component: TournamentsDetails
  },
  {
    value: 'requests',
    label: 'Запити',
    component: RequestsDetails
  },
  {
    value: 'bugs',
    label: 'Баги',
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
