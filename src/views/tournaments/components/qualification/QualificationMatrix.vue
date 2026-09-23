<template>
  <div class="qual-matrix-scroll overflow-x-auto w-full flex min-w-[320px] pb-12">
    <table
      class="qual-matrix-table w-max min-w-[320px]"
      role="grid"
      :aria-label="'Матриця кваліфікаційних матчів: ' + teams.length + ' команд'"
      @mouseleave="hoveredColId = null"
    >
      <thead>
        <tr>
          <th
            scope="col"
            class="qual-matrix-corner sticky left-0 top-0 z-30 w-[3rem] sm:w-[3.5rem] md:w-16
              min-w-[3rem] sm:min-w-[3.5rem] md:min-w-[4rem] bg-surface p-6 sm:p-8"
          >
            <span class="qual-matrix-corner__mark" aria-hidden="true">
              <span>vs</span>
            </span>
          </th>
          <th
            v-for="col in teams"
            :key="'c-' + col.id"
            scope="col"
            class="qual-matrix-head-cell sticky top-0 z-20 bg-elevated-surface p-6 sm:p-8 align-middle"
            :class="{ 'is-col-hover': hoveredColId === col.id }"
          >
            <div class="flex min-h-[3rem] sm:min-h-[3.5rem] md:min-h-16 items-center justify-center">
              <QualificationMatrixTeamThumb :team="col" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in teams" :key="'r-' + row.id" class="qual-matrix-row">
          <th
            scope="row"
            class="qual-matrix-row-head sticky left-0 z-10 bg-elevated-surface p-6 sm:p-8 align-middle"
          >
            <div class="flex min-h-[3rem] sm:min-h-[3.5rem] md:min-h-16 items-center justify-center">
              <QualificationMatrixTeamThumb :team="row" />
            </div>
          </th>
          <template v-for="col in teams" :key="row.id + '-' + col.id">
            <template
              v-for="(cell, cellIdx) in [cellPresentation(row.id, col.id)]"
              :key="cellIdx + '-' + row.id + '-' + col.id"
            >
              <td
                :class="[cell.className, { 'is-col-hover': hoveredColId === col.id }]"
                class="qual-matrix-cell text-center align-middle"
                @mouseenter="hoveredColId = col.id"
              >
                <el-tooltip
                  :content="cell.tooltip"
                  placement="top"
                  :disabled="!cell.tooltip"
                  :show-after="200"
                  effect="dark"
                >
                  <span
                    class="qual-matrix-cell__label inline-flex w-full h-full items-center justify-center
                      cursor-default"
                    :aria-label="cell.ariaLabel || undefined"
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

/**
 * «Приціл»: рядок підсвічує CSS через `tr:hover`, стовпець — цей ref
 * (у таблиці стовпець не має спільного предка, тож без стану не обійтись).
 */
const hoveredColId = ref<string | null>(null)

interface ICellPresentation {
  label: string
  className: string
  tooltip: string
  ariaLabel: string
}

function cellPresentation (rowId: string, colId: string): ICellPresentation {
  const kind = resolveQualificationMatrixCell(rowId, colId, pairMap.value)
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
      className = 'qual-matrix-cell--diag'
      break
    case 'win':
      className = 'qual-matrix-cell--win qual-matrix-cell--data'
      break
    case 'loss':
      className = 'qual-matrix-cell--loss qual-matrix-cell--data'
      break
    default:
      className = 'qual-matrix-cell--empty'
  }

  // Діагональ малюється штрихуванням замість «X» — буква лишається для читачів екрана.
  const label = kind === 'diagonal' ? '' : qualificationMatrixCellLabel(kind)
  const ariaLabel = kind === 'diagonal' ? 'Та сама команда' : ''

  return { label, className, tooltip, ariaLabel }
}
</script>

<style scoped lang="scss">
/*
 * Center the matrix when it fits, but fall back to start-alignment when it
 * overflows. Plain `justify-content: center` makes the left columns unreachable
 * by scrolling once the table is wider than the container (overflow is pushed
 * to both sides). `safe` keeps the start edge scrollable.
 */
.qual-matrix-scroll {
  justify-content: safe center;
  align-items: center;
}

// Плитки замість суцільної сітки: роздільні рамки з проміжком, кожна клітинка
// зі скругленням (у `border-collapse` радіуси не працюють). Лінії — ціанові
// волосини системи, а не білі.
.qual-matrix-table {
  border-collapse: separate;
  border-spacing: 3px;
}

.qual-matrix-table th,
.qual-matrix-table td {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  border-radius: 6px;
}

// Кут лишається непрозорим (він прикриває клітинки під час горизонтального скролу), але без рамки.
.qual-matrix-corner {
  border-color: transparent;
}

.qual-matrix-corner__mark {
  @apply flex h-full w-full items-center justify-center;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(var(--ds-primary-rgb), 0.45);
}

.qual-matrix-cell {
  width: 3rem;
  min-width: 3rem;
  height: 3rem;
  padding: 0.2rem;
  // Тільки колір фону: у матриці на 16 команд hover трапляється сотні разів, тож коротко.
  transition: background-color 120ms ease, box-shadow 120ms ease;
}

.qual-matrix-cell__label {
  font-family: var(--ds-font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
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

  .qual-matrix-cell__label {
    font-size: 1.05rem;
  }
}

// ─── Стани клітинок ─────────────────────────────────────────────────────────
// Тонована лунка + внутрішня волосина того ж тону (рецепт StatusBadge), літера
// з легким сяйвом. Колір дублюється буквою, тож читається й без кольору.
.qual-matrix-cell--empty {
  background-color: rgba(255, 255, 255, 0.02);
}

.qual-matrix-cell--win {
  color: #4ade80;
  background-color: rgba(34, 197, 94, 0.16);
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.3);
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.55);
}

.qual-matrix-cell--loss {
  color: #f87171;
  background-color: rgba(239, 68, 68, 0.14);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.28);
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.45);
}

.qual-matrix-cell--diag {
  background:
    repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.07) 0 3px,
      transparent 3px 8px
    ),
    rgba(255, 255, 255, 0.02);
}

// ─── Приціл (лише для вказівника: на тачі hover «залипає») ──────────────────
@media (hover: hover) and (pointer: fine) {
  .qual-matrix-row:hover .qual-matrix-cell--empty,
  .qual-matrix-cell--empty.is-col-hover {
    background-color: rgba(var(--ds-primary-rgb), 0.06);
  }

  .qual-matrix-row:hover .qual-matrix-cell--diag,
  .qual-matrix-cell--diag.is-col-hover {
    background-color: rgba(var(--ds-primary-rgb), 0.06);
  }

  .qual-matrix-row:hover .qual-matrix-cell--win,
  .qual-matrix-cell--win.is-col-hover {
    background-color: rgba(34, 197, 94, 0.24);
  }

  .qual-matrix-row:hover .qual-matrix-cell--loss,
  .qual-matrix-cell--loss.is-col-hover {
    background-color: rgba(239, 68, 68, 0.22);
  }

  // Заголовки на перетині: ціанова підкладка + світла рамка мініатюри команди.
  .qual-matrix-row:hover .qual-matrix-row-head,
  .qual-matrix-head-cell.is-col-hover {
    --qual-thumb-border: rgba(var(--ds-primary-rgb), 0.6);
    --qual-thumb-glow: 0 0 10px rgba(var(--ds-primary-rgb), 0.25);
    background-color: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.qual-matrix-row-head,
.qual-matrix-head-cell {
  transition: background-color 120ms ease;
}
</style>
