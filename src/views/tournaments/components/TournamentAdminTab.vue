<template>
  <div class="w-full mt-20">
    <el-tabs v-model="activeTab" tab-position="top" stretch class="w-full">
      <el-tab-pane v-for="tab in tabs" :key="tab.label" class="mt-20" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <div v-if="activeTab === 'status'" class="mt-20">
      <div
        class="bg-[#111827] rounded-md p-10
          md:p-20 flex flex-col md:flex-row items-center justify-between gap-8
          relative overflow-hidden"
      >
        <div class="flex items-center w-full gap-10 relative z-10">
          <div class="flex items-center w-full gap-10">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Поточний етап</span>
            <TournamentStatusTag :status="tournament?.tournamentStatus" class="min-w-100" />
          </div>
        </div>

        <!-- TODO: endpoint not in API yet (startTournament, openRegistration, endTournament) -->
        <div class="px-6 py-3 rounded-xl text-gray-500 text-sm bg-white/[0.02] font-mono">
          Управління турніром недоступне
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'participants'" class="mt-20">
      <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto">
        <el-table
          :data="teams"
          row-key="id"
          class="h-[350px] rounded-md overflow-auto"
          empty-text="Команди відсутні"
          border
        >
          <el-table-column label="ID команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Назва команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.name }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import type { TTournament as Tournament } from '@/api/types/api.types'

const props = defineProps<{
  tournament?: Tournament | null
}>()

const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'participants', label: 'Управління командами' }
]

const activeTab = ref('status')

const teams = computed(() => props.tournament?.teams || [])
</script>
