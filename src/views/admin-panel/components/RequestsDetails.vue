<template>
  <div class="h-full flex flex-col gap-6 overflow-hidden pr-2">
    <div class="flex justify-between items-center shrink-0">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-white tracking-tight">
          Запити
        </h1>
      </div>
    </div>

    <!-- Таби -->
    <div class="flex items-center gap-8 border-b border-white/10 shrink-0 overflow-x-auto no-scrollbar relative">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="pb-4 pt-2 text-base font-medium transition-all duration-300 relative whitespace-nowrap outline-none"
        :class="activeTab === tab.value ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span
          class="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full
                 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]
                 transition-transform duration-300 ease-out origin-center"
          :class="activeTab === tab.value ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'"
        />
      </button>
    </div>

    <!-- Контент табів -->
    <div class="flex-1 min-h-0">
      <transition name="fade" mode="out-in">
        <MmrRequestsTab v-if="activeTab === 'mmr'" key="mmr" />
        <TeamVerificationTab v-else-if="activeTab === 'team-verification'" key="team-verification" />
        <PlayerVerificationTab v-else-if="activeTab === 'player-verification'" key="player-verification" />
        <BugsTab v-else-if="activeTab === 'bugs'" key="bugs" />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import MmrRequestsTab from './tabs/MmrRequestsTab.vue'
import TeamVerificationTab from './tabs/TeamVerificationTab.vue'
import PlayerVerificationTab from './tabs/PlayerVerificationTab.vue'
import BugsTab from './tabs/BugsTab.vue'

type TRequestTabType = 'mmr' | 'team-verification' | 'player-verification' | 'bugs'

const activeTab = ref<TRequestTabType>('mmr')

const tabs: { label: string; value: TRequestTabType }[] = [
  { label: 'MMR', value: 'mmr' },
  { label: 'Team Verification', value: 'team-verification' },
  { label: 'Player Verification', value: 'player-verification' },
  { label: 'Баги', value: 'bugs' }
]
</script>

<style scoped>
/* Transition для табів */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
