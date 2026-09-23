<template>
  <div class="bg-dark-card flex flex-col gap-10 md:p-20 p-10 rounded-md border border-white/5">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-white">Відкриті матчі</h3>
      <el-tooltip placement="top" content="Оновити матчі">
        <el-button
          type="primary"
          class="btn-icon"
          aria-label="Оновити матчі"
          @click="updateMatches()"
        >
          <PhArrowsClockwise :size="20" />
        </el-button>
      </el-tooltip>
    </div>

    <div v-loading="loading" class="flex flex-col gap-10 max-h-[420px] overflow-auto pr-2">
      <div
        v-if="!matches.length"
        class="flex flex-col items-center justify-center gap-8 py-40 text-center
               rounded-xl border border-dashed border-white/10 bg-white/[0.02]"
      >
        <PhUsers :size="36" class="text-white/25" />
        <p class="text-sm text-white/45">Немає активних матчів</p>
      </div>

      <!-- Match room cards — team-vs-team matchup -->
      <div
        v-for="row in matches"
        :key="row.id"
        class="rounded-xl border border-white/10 bg-surface/40 p-14 shadow-elevation-1
               transition-colors duration-200 hover:border-primary/30"
      >
        <div class="flex items-center justify-between mb-12">
          <span class="text-caption uppercase tracking-wide text-white/40">Матч</span>
          <StatusBadge
            :preset="row.winner ? 'completed' : 'upcoming'"
            :label="row.winner ? 'Завершено' : 'Очікує результату'"
            size="sm"
          />
        </div>

        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-10">
          <div class="flex min-w-0 items-center justify-end gap-10">
            <span
              class="truncate text-right text-sm font-semibold"
              :class="row.winner?.id === row.teamA?.id ? 'text-success' : 'text-white'"
            >
              {{ row.teamA?.name || 'Команда A' }}
            </span>
            <el-avatar
              :src="resolvePublicOrApiUrl(row.teamA?.logoUrl)"
              class="shrink-0 ring-2 ring-primary/30"
            >
              <template #default>
                <PhUsers size="24" weight="bold" class="text-white/60" />
              </template>
            </el-avatar>
          </div>

          <span class="px-4 font-display text-sm font-bold text-white/40">VS</span>

          <div class="flex min-w-0 items-center gap-10">
            <el-avatar
              :src="resolvePublicOrApiUrl(row.teamB?.logoUrl)"
              class="shrink-0 ring-2 ring-error/30"
            >
              <template #default>
                <PhUsers size="24" weight="bold" class="text-white/60" />
              </template>
            </el-avatar>
            <span
              class="truncate text-sm font-semibold"
              :class="row.winner?.id === row.teamB?.id ? 'text-success' : 'text-white'"
            >
              {{ row.teamB?.name || 'Команда B' }}
            </span>
          </div>
        </div>

        <el-button
          type="primary"
          class="mt-14 w-full"
          @click="openResultModal(row)"
        >
          Вказати результат
        </el-button>
      </div>
    </div>

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
import { resolvePublicOrApiUrl } from '@/core/helpers'
import type { TMatch as Match } from '@/api/types/api.types'

const props = defineProps<{tournamentId: string}>()

const matches = defineModel<Match[]>('matches', { default: [] })

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
