<template>
  <div
    class="qual-shell rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#121a2c] via-[#0f1524] to-[#0c101c]
      shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden"
  >
    <div
      class="relative flex flex-col gap-14 lg:flex-row lg:items-stretch lg:justify-between px-16 py-16 md:px-22
        md:py-18 border-b border-white/[0.06] bg-[#0a0f18]/40"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(ellipse_80%_60%_at_20%_-20%,rgba(6,182,212,0.12),transparent_55%)]"
      />
      <div class="relative min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/80 mb-6">
          Кваліфікація
        </p>
        <h3 class="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
          Матриця матчів
        </h3>
        <p class="text-xs text-gray-500 mt-8 max-w-xl leading-relaxed">
          Рядок — ваша команда, стовпець — суперник.
          <span class="text-emerald-400/90 font-semibold">W</span> /
          <span class="text-red-400/90 font-semibold">L</span> з точки зору рядка;
          <span class="text-amber-300 font-semibold">X</span> — та сама команда.
          Результат подається через «Додати результат».
        </p>
      </div>
      <div v-if="showAddResultButton" class="relative shrink-0 w-full sm:w-auto sm:self-start lg:self-center">
        <el-button
          type="primary"
          :class="addResultButtonClass"
          @click="$emit('add-result')"
        >
          <el-icon class="mr-8 shrink-0" :size="18"><Plus /></el-icon>
          <span class="whitespace-nowrap">Додати результат</span>
        </el-button>
      </div>
    </div>

    <div
      v-loading="loading"
      element-loading-background="rgba(12,17,28,0.72)"
      class="relative min-h-[140px]"
    >
      <div
        v-if="!hasMatrix"
        class="py-40 px-18 flex flex-col items-center gap-16 text-center"
      >
        <div
          class="w-56 h-56 rounded-2xl border border-dashed border-white/12 flex items-center justify-center
            bg-white/[0.02]"
        >
          <el-icon :size="32" class="text-gray-600 opacity-70"><Trophy /></el-icon>
        </div>
        <div class="max-w-md flex flex-col items-center">
          <p class="text-white font-semibold text-sm">Поки немає команд для матриці</p>
          <p class="text-gray-500 text-sm mt-8 leading-relaxed">
            Після появи учасників тут з’явиться матриця пар і лідерборд. Щоб зафіксувати гру, натисніть
            «Додати результат» і введіть ID матчу Dota 2.
          </p>
          <el-button
            v-if="showAddResultButton"
            type="primary"
            :class="[addResultButtonClass, '!mt-22 !max-w-[320px]']"
            @click="$emit('add-result')"
          >
            <el-icon class="mr-8 shrink-0" :size="18"><Plus /></el-icon>
            <span class="whitespace-nowrap">Додати результат</span>
          </el-button>
        </div>
      </div>

      <div v-else class="qual-split p-14 sm:p-16 md:p-20 gap-16 lg:gap-20">
        <div
          class="qual-matrix-card min-w-0 rounded-xl border border-white/[0.07] bg-[#0b101c]/90
            shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden"
        >
          <div
            class="flex items-center justify-between gap-10 px-14 py-10 sm:px-16 border-b border-white/[0.06]
              bg-black/20"
          >
            <span class="text-[11px] font-semibold text-gray-400 tracking-wide">
              Перехресна таблиця
            </span>
            <span class="text-[10px] text-gray-600 tabular-nums">
              {{ matrixTeams.length }} {{ pluralTeams(matrixTeams.length) }}
            </span>
          </div>
          <div class="px-10 py-12 sm:px-14 sm:py-14">
            <QualificationMatrix :matches="matches" :tournament-teams="tournamentTeams" />
          </div>
          <p
            class="px-14 py-10 sm:px-16 text-[11px] text-gray-500 leading-relaxed border-t border-white/[0.05]
              bg-black/15"
          >
            Порожня клітинка — немає зіграного матчу або ще не визначено переможця.
          </p>
        </div>

        <QualificationLeaderboard
          class="qual-leaderboard-col w-full shrink-0 lg:w-[min(100%,320px)] xl:w-[340px]"
          :teams="matrixTeams"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trophy } from '@element-plus/icons-vue'
import type { TQualificationMatch as QualificationMatch, TTeam } from '@/api/types/api.types'
import QualificationMatrix from './QualificationMatrix.vue'
import QualificationLeaderboard from './QualificationLeaderboard.vue'
import { buildQualificationMatrixTeams } from './qualification-matrix.utils'

const props = defineProps<{
  matches: QualificationMatch[]
  tournamentTeams?: TTeam[] | null
  loading: boolean
  showAddResultButton: boolean
}>()

defineEmits<{
  'add-result': []
}>()

/** Єдині розміри для всіх кнопок «Додати результат» (шапка + порожній стан). */
const addResultButtonClass =
  '!rounded-xl !box-border !inline-flex !items-center !justify-center !gap-0 ' +
  '!h-12 !min-h-[48px] !min-w-[200px] sm:!min-w-[220px] !px-22 sm:!px-28 !text-sm !font-semibold !leading-none ' +
  '!border !border-cyan-500/40 !shadow-md !shadow-cyan-950/30 ' +
  'w-full sm:!w-auto'

const matrixTeams = computed(() => buildQualificationMatrixTeams(props.tournamentTeams, props.matches))

const hasMatrix = computed(() => matrixTeams.value.length > 0)

function pluralTeams (n: number): string {
  if (n === 1) return 'команда'
  if (n >= 2 && n <= 4) return 'команди'
  return 'команд'
}
</script>

<style scoped>
.qual-split {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

@media (min-width: 1024px) {
  .qual-split {
    flex-direction: row;
    align-items: flex-start;
  }

  .qual-matrix-card {
    flex: 1;
    min-width: 0;
  }

  .qual-leaderboard-col {
    position: sticky;
    top: 1rem;
  }
}
</style>
