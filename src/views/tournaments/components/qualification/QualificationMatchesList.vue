<template>
  <section class="qual-shell hud-panel rounded-2xl overflow-hidden" aria-label="Матриця кваліфікаційних матчів">
    <header class="qual-shell__head">
      <div class="flex min-w-0 flex-1 flex-col gap-8">
        <p class="sys-label sys-label--muted m-0">Перехресна таблиця</p>
        <h3 class="qual-shell__title">Матриця матчів</h3>
        <p class="qual-shell__hint">
          Рядок — ваша команда, стовпець — суперник. Результат показано з точки зору рядка;
          подається через «Додати результат».
        </p>

        <ul class="qual-legend" aria-label="Позначення в матриці">
          <li class="qual-legend__item">
            <span class="qual-legend__swatch qual-legend__swatch--win" aria-hidden="true">W</span>
            <span>перемога</span>
          </li>
          <li class="qual-legend__item">
            <span class="qual-legend__swatch qual-legend__swatch--loss" aria-hidden="true">L</span>
            <span>поразка</span>
          </li>
          <li class="qual-legend__item">
            <span class="qual-legend__swatch qual-legend__swatch--empty" aria-hidden="true" />
            <span>ще не зіграно</span>
          </li>
          <li class="qual-legend__item">
            <span class="qual-legend__swatch qual-legend__swatch--diag" aria-hidden="true" />
            <span>та сама команда</span>
          </li>
        </ul>
      </div>

      <div
        v-if="showAddResultButton || showTestMatchButton || showTechLossButton"
        class="qual-shell__actions"
      >
        <el-button
          v-if="showTestMatchButton"
          type="warning"
          @click="$emit('test-match')"
        >
          Test match creation
        </el-button>
        <el-button
          v-if="showTechLossButton"
          type="success"
          plain
          class="btn-cta"
          @click="$emit('tech-loss')"
        >
          Внести результати
        </el-button>
        <el-button
          v-if="showAddResultButton"
          type="primary"
          :class="addResultButtonClass"
          @click="$emit('add-result')"
        >
          <PhPlus :size="18" weight="bold" class="shrink-0" />
          <span class="whitespace-nowrap">Додати результат</span>
        </el-button>
      </div>
    </header>

    <div class="relative min-h-[160px]">
      <!-- Скелет замість «немає команд», поки перший GET ще в дорозі -->
      <div
        v-if="loading && !hasMatrix"
        class="qual-skeleton"
        aria-busy="true"
        aria-label="Завантаження матриці"
      >
        <div class="qual-skeleton__grid">
          <span
            v-for="i in SKELETON_CELLS"
            :key="i"
            class="qual-skeleton__cell"
            :style="{ '--i': i }"
          />
        </div>
      </div>

      <div v-else-if="!hasMatrix" class="qual-empty">
        <div class="qual-empty__icon hud-corners" aria-hidden="true">
          <PhTrophy :size="30" weight="duotone" />
        </div>
        <div class="flex max-w-md flex-col items-center">
          <p class="qual-empty__title">Поки немає команд для матриці</p>
          <p class="qual-empty__text">
            Після появи учасників тут з’явиться матриця пар і лідерборд. Щоб зафіксувати гру, натисніть
            «Додати результат» і введіть ID матчу Dota 2.
          </p>
          <el-button
            v-if="showAddResultButton"
            type="primary"
            :class="[addResultButtonClass, 'mt-22 max-w-[320px]']"
            @click="$emit('add-result')"
          >
            <PhPlus :size="18" weight="bold" class="shrink-0" />
            <span class="whitespace-nowrap">Додати результат</span>
          </el-button>
        </div>
      </div>

      <div
        v-else
        v-loading="loading"
        element-loading-background="rgba(7, 8, 15, 0.72)"
        class="qual-split p-14 sm:p-16 md:p-20 gap-16 lg:gap-20"
      >
        <div class="qual-matrix-card">
          <div class="qual-matrix-card__head">
            <span class="qual-matrix-card__label">
              <PhGridFour :size="13" weight="bold" aria-hidden="true" />
              Сітка пар
            </span>
            <span class="qual-matrix-card__count">
              {{ matrixTeams.length }} {{ pluralTeams(matrixTeams.length) }}
            </span>
          </div>
          <div class="px-10 py-12 sm:px-14 sm:py-14">
            <QualificationMatrix :matches="matches" :tournament-teams="tournamentTeams" />
          </div>
        </div>

        <QualificationLeaderboard
          class="qual-leaderboard-col w-full shrink-0 lg:w-[min(100%,320px)] xl:w-[340px]"
          :teams="matrixTeams"
          :player-points="playerPoints"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhGridFour, PhPlus, PhTrophy } from '@phosphor-icons/vue'
import type { TQualificationMatch as QualificationMatch, TPlayerPointsEntry } from '@/api/types/api.types'
import QualificationMatrix from './QualificationMatrix.vue'
import QualificationLeaderboard from './QualificationLeaderboard.vue'
import { buildQualificationMatrixTeams } from './qualification-matrix.utils'

const props = defineProps<{
  matches: QualificationMatch[]
  tournamentTeams?: TTeam[] | null
  playerPoints?: TPlayerPointsEntry[] | null
  loading: boolean
  showAddResultButton: boolean
  showTestMatchButton?: boolean
  showTechLossButton?: boolean
}>()

defineEmits<{
  'add-result': []
  'test-match': []
  'tech-loss': []
}>()

/** Єдині розміри для всіх кнопок «Додати результат» (шапка + порожній стан). */
const addResultButtonClass = 'btn-cta w-full sm:w-auto sm:min-w-[220px]'

/** 5×5 плиток скелета — приблизно стільки видно в матриці на першому екрані. */
const SKELETON_CELLS = 25

const matrixTeams = computed(() => buildQualificationMatrixTeams(props.tournamentTeams, props.matches))

const hasMatrix = computed(() => matrixTeams.value.length > 0)

function pluralTeams (n: number): string {
  if (n === 1) return 'команда'
  if (n >= 2 && n <= 4) return 'команди'
  return 'команд'
}
</script>

<style scoped lang="scss">
// ─── Шапка ──────────────────────────────────────────────────────────────────
.qual-shell__head {
  @apply relative flex flex-col gap-14 px-16 py-16 md:px-22 md:py-18 lg:flex-row lg:items-start lg:justify-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(ellipse 60% 80% at 0% 0%, rgba(var(--ds-primary-rgb), 0.08), transparent 60%),
    rgba(0, 0, 0, 0.18);
}

.qual-shell__title {
  @apply m-0 font-display uppercase text-white;
  font-size: 1.125rem;
  line-height: 1.15;
  letter-spacing: 0.04em;

  @screen md {
    font-size: 1.25rem;
  }
}

.qual-shell__hint {
  @apply m-0 max-w-xl;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

.qual-shell__actions {
  @apply flex w-full shrink-0 flex-wrap gap-10 sm:w-auto lg:pt-4;
}

// ─── Легенда ────────────────────────────────────────────────────────────────
// Ті самі лунки, що й клітинки матриці, у мініатюрі — легенда показує, а не описує.
.qual-legend {
  @apply m-0 flex list-none flex-wrap items-center gap-x-14 gap-y-6 p-0 pt-2;
}

.qual-legend__item {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.qual-legend__swatch {
  @apply inline-flex size-18 items-center justify-center rounded;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(255, 255, 255, 0.03);

  &--win {
    color: #4ade80;
    background: rgba(34, 197, 94, 0.16);
    border-color: rgba(34, 197, 94, 0.4);
  }

  &--loss {
    color: #f87171;
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.4);
  }

  &--diag {
    background:
      repeating-linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.12) 0 2px,
        transparent 2px 5px
      ),
      rgba(255, 255, 255, 0.03);
  }
}

// ─── Скелет ─────────────────────────────────────────────────────────────────
.qual-skeleton {
  @apply flex justify-center p-16 sm:p-20;
}

.qual-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(5, 3rem);
  gap: 4px;

  @screen sm {
    grid-template-columns: repeat(5, 3.35rem);
  }
}

@keyframes qual-skeleton-pulse {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}

.qual-skeleton__cell {
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  background: rgba(255, 255, 255, 0.04);
  animation: qual-skeleton-pulse 1.4s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 40ms);
}

// ─── Порожній стан ──────────────────────────────────────────────────────────
.qual-empty {
  @apply flex flex-col items-center gap-16 px-18 py-40 text-center;
}

.qual-empty__icon {
  @apply flex size-64 items-center justify-center rounded-xl;
  --hud-corner-size: 10px;
  --hud-corner-inset: -5px;
  --hud-corner-radius: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.45);
  color: rgba(var(--ds-primary-rgb), 0.55);
  border: 1px dashed rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(var(--ds-primary-rgb), 0.04);
}

.qual-empty__title {
  @apply m-0 font-display uppercase text-white;
  font-size: 14px;
  letter-spacing: 0.06em;
}

.qual-empty__text {
  @apply m-0 mt-8;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

// ─── Матриця + лідерборд ────────────────────────────────────────────────────
.qual-split {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.qual-matrix-card {
  @apply min-w-0 overflow-hidden rounded-xl border;
  border-color: rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(7, 8, 15, 0.55);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.qual-matrix-card__head {
  @apply flex items-center justify-between gap-10 px-14 py-10 sm:px-16;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.qual-matrix-card__label {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    flex: none;
    color: rgba(var(--ds-primary-rgb), 0.75);
  }
}

.qual-matrix-card__count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
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
