<template>
  <div class="bg-[#1e2330] flex flex-col gap-10 md:p-20 p-10 rounded-md border border-white/5">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-white">Відкриті матчі</h3>
      <el-tooltip placement="top" content="Оновити матчі">
        <el-button
          type="primary"
          class="rounded-sm px-10"
          @click="updateMatches()"
        >
          <PhArrowsClockwise :size="20" />
        </el-button>
      </el-tooltip>
    </div>

    <el-table
      v-loading="loading"
      :data="matches"
      row-key="id"
      class="h-[350px] overflow-auto border rounded-md"
      empty-text="Немає активних матчів"
    >
      <!-- Команда 1 -->
      <el-table-column label="Команда 1" min-width="200">
        <template #header>
          <div class="flex items-center gap-20 py-10 pl-20">Команда 1</div>
        </template>
        <template #default="{ row }">
          <div class="flex items-center gap-20 py-10">
            <el-avatar
              :src="row.team1?.avatar_url ? `${apiPublicUrl}${row.team1.avatar_url}` : ''"
              class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
            >
              <template #default>
                <PhUsers size="28" weight="bold" class="text-blue-400/70" />
              </template>
            </el-avatar>
            <span class="text-sm font-bold text-blue-400">
              {{ row.team1?.team_name || `Team #${row.team1_id}` }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column>
        vs
      </el-table-column>

      <!-- Команда 2 -->
      <el-table-column label="Команда 2" min-width="200">
        <template #header>
          <div class="flex items-center gap-20 py-10 pl-20">Команда 2</div>
        </template>
        <template #default="{ row }">
          <div class="flex items-center gap-20 py-10">
            <el-avatar
              :src="row.team2?.avatar_url ? `${apiPublicUrl}${row.team2.avatar_url}` : ''"
              class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
            >
              <template #default>
                <PhUsers size="28" weight="bold" class="text-red-400/70" />
              </template>
            </el-avatar>
            <span class="text-sm font-bold text-red-400">
              {{ row.team2?.team_name || `Team #${row.team2_id}` }}
            </span>
          </div>
        </template>
      </el-table-column>

      <!-- Раунд -->
      <el-table-column label="Раунд" prop="round" width="100" align="center">
        <template #header>
          <div class="text-center py-10">Раунд</div>
        </template>
        <template #default="{ row }">
          <div class="text-center text-gray-200 font-medium">{{ row.round_num }}</div>
        </template>
      </el-table-column>

      <el-table-column label="" align="right" width="220">
        <template #header>
          <div class="text-center py-10">Дії</div>
        </template>
        <template #default="{ row }">
          <div class="flex justify-end px-20 gap-10">
            <el-button
              type="primary"
              @click="openResultModal(row)"
            >
              Вказати результат
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <MatchResultModal
      v-model="isResultModalOpen"
      :tournament-id="props.tournamentId"
      :match="selectedMatch"
      @success="handleResultSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { PhArrowsClockwise, PhUsers } from '@phosphor-icons/vue'
import MatchResultModal from '../modals/MatchResultModal.vue'
import type { TMatch as Match } from '@/api/types/api.types'

const props = defineProps<{tournamentId: string}>()

const matches = defineModel<Match[]>('matches', { default: [] })
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const loading = ref(false)

const isResultModalOpen = ref(false)
const selectedMatch = ref<Match | null>(null)

function openResultModal (match: Match) {
  selectedMatch.value = match
  isResultModalOpen.value = true
}

async function handleResultSuccess (updatedMatches: Match[]) {
  matches.value = updatedMatches
}

async function updateMatches () {
  // TODO: endpoint not in API yet (getOpenMatches)
  loading.value = false
}
</script>
