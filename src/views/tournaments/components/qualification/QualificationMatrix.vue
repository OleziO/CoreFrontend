<template>
  <div class="qual-matrix-scroll overflow-x-auto w-full flex justify-center items-center min-w-[320px] pb-12">
    <table
      class="qual-matrix-table border-collapse text-sm sm:text-base w-max min-w-[320px]"
      role="grid"
      :aria-label="'Матриця кваліфікаційних матчів: ' + teams.length + ' команд'"
    >
      <thead>
        <tr>
          <th
            scope="col"
            class="qual-matrix-corner sticky left-0 top-0 z-30 w-[3rem] sm:w-[3.5rem] md:w-16
              min-w-[3rem] sm:min-w-[3.5rem] md:min-w-[4rem]
              border border-white/12 bg-[#0f1524] p-6 sm:p-8"
          />
          <th
            v-for="col in teams"
            :key="'c-' + col.id"
            scope="col"
            class="qual-matrix-head-cell sticky top-0 z-20 border border-white/12 bg-[#131a2a]
              p-6 sm:p-8 align-middle"
          >
            <div class="flex min-h-[3rem] sm:min-h-[3.5rem] md:min-h-16 items-center justify-center">
              <QualificationMatrixTeamThumb :team="col" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in teams" :key="'r-' + row.id">
          <th
            scope="row"
            class="qual-matrix-row-head sticky left-0 z-10 border border-white/12 bg-[#131a2a]
              p-6 sm:p-8 align-middle"
          >
            <div class="flex min-h-[3rem] sm:min-h-[3.5rem] md:min-h-16 items-center justify-center">
              <QualificationMatrixTeamThumb :team="row" />
            </div>
          </th>
          <template v-for="col in teams" :key="row.id + '-' + col.id">
            <template
              v-for="cell in [cellPresentation(row.id, col.id)]"
              :key="'p-' + row.id + '-' + col.id"
            >
              <td
                :class="cell.className"
                class="qual-matrix-cell border border-white/12 text-center font-extrabold align-middle
                  transition-colors duration-150 tracking-tight"
              >
                <el-tooltip
                  :content="cell.tooltip"
                  placement="top"
                  :disabled="!cell.tooltip"
                  :show-after="200"
                  effect="dark"
                >
                  <span
                    class="inline-flex min-w-[1.25rem] justify-center tabular-nums cursor-default
                      w-full h-full items-center"
                  >
                    {{ cell.label }}
                  </span>
                </el-tooltip>
              </td>
            </template>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import QualificationMatrixTeamThumb from './QualificationMatrixTeamThumb.vue'
import type { TQualificationMatch } from '@/api/types/api.types'
import {
  buildQualificationMatrixTeams,
  buildQualificationPairMap,
  qualificationMatrixCellLabel,
  qualificationPairKey,
  resolveQualificationMatrixCell
} from './qualification-matrix.utils'

const props = defineProps<{
  matches: TQualificationMatch[]
  tournamentTeams?: TTeam[] | null
}>()

const teams = computed(() => buildQualificationMatrixTeams(props.tournamentTeams, props.matches))

const pairMap = computed(() => buildQualificationPairMap(props.matches))

function cellPresentation (rowId: string, colId: string): { label: string; className: string; tooltip: string } {
  const kind = resolveQualificationMatrixCell(rowId, colId, pairMap.value)
  const label = qualificationMatrixCellLabel(kind)
  const match = rowId === colId ? undefined : pairMap.value.get(qualificationPairKey(rowId, colId))

  let tooltip = ''
  if ((kind === 'win' || kind === 'loss') && match) {
    const opponentName = teams.value.find((t) => t.id === colId)?.name ?? ''
    tooltip =
      kind === 'win'
        ? `Перемога над «${opponentName}»`
        : `Поразка від «${opponentName}»`
    if (match.dotaMatchId) {
      tooltip += ` · Dota ${match.dotaMatchId}`
    }
  }

  let className: string
  switch (kind) {
    case 'diagonal':
      className = 'bg-amber-400/85 text-amber-950 qual-matrix-cell--diag'
      break
    case 'win':
      className = 'bg-green-600/45 text-green-400/90 qual-matrix-cell--data'
      break
    case 'loss':
      className = 'bg-red-600/45 text-red-50 qual-matrix-cell--data'
      break
    default:
      className = 'bg-white/[0.03] text-gray-200 qual-matrix-cell--empty'
  }
  return { label, className, tooltip }
}
</script>

<style scoped>
.qual-matrix-cell {
  width: 3rem;
  min-width: 3rem;
  height: 3rem;
  padding: 0.2rem;
}

@media (min-width: 640px) {
  .qual-matrix-cell {
    width: 3.35rem;
    min-width: 3.35rem;
    height: 3.35rem;
  }
}

@media (min-width: 768px) {
  .qual-matrix-cell {
    width: 3.75rem;
    min-width: 3.75rem;
    height: 3.75rem;
  }
}

.qual-matrix-cell--empty:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.qual-matrix-cell--data:hover,
.qual-matrix-cell--diag:hover {
  filter: brightness(1.08);
}
</style>
