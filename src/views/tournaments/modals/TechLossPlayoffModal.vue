<template>
  <el-dialog
    v-model="modelValue"
    align-center
    width="560"
    class="tech-loss-dialog"
    destroy-on-close
    :show-close="false"
  >
    <!-- Шапка: системний ярлик, заголовок, закриття -->
    <template #header>
      <div class="tech-loss-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label sys-label--pink">// Адмін · Плей-оф</span>
          <h2 class="tech-loss-dialog__title">Ввести результат вручну</h2>
        </div>
        <button type="button" class="tech-loss-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="tech-loss">
      <p class="tech-loss__lead">
        Оберіть незавершену серію і команду-переможця. Сітка Challonge оновиться автоматично.
      </p>

      <!-- Крок 01 — серія -->
      <section class="tech-loss__step">
        <header class="tech-loss__step-head">
          <span class="tech-loss__step-index">01</span>
          <span class="tech-loss__step-label">Матч</span>
          <span v-if="!fetchingMatches && openMatches.length" class="tech-loss__step-meta">
            {{ openMatches.length }} відкритих
          </span>
        </header>

        <!-- Завантаження: три ряди-скелети замість спінера, щоб діалог не стрибав -->
        <div v-if="fetchingMatches" class="tech-loss__skeleton" aria-busy="true" aria-label="Завантаження матчів">
          <span v-for="i in 3" :key="i" class="tech-loss__skeleton-row" :style="{ '--i': i - 1 }" />
        </div>

        <!-- Помилка запиту — з повтором -->
        <div v-else-if="fetchError" class="tech-loss__empty is-error" role="alert">
          <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
          <span class="flex-1">{{ fetchError }}</span>
          <button type="button" class="tech-loss__retry" @click="loadMatches">
            <PhArrowClockwise :size="12" weight="bold" aria-hidden="true" />
            Повторити
          </button>
        </div>

        <div v-else-if="openMatches.length === 0" class="tech-loss__empty" role="status">
          <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
          <span>Немає відкритих серій — усі матчі сітки вже вирішено.</span>
        </div>

        <el-select
          v-else
          v-model="selectedSeriesId"
          placeholder="Оберіть матч"
          class="w-full"
          popper-class="tech-loss-select-popper"
          filterable
          :disabled="loading"
          @change="winnerTeamId = ''"
        >
          <el-option
            v-for="m in openMatches"
            :key="m.seriesId"
            :label="matchLabel(m)"
            :value="m.seriesId"
          >
            <span class="tech-loss-option">
              <span class="tech-loss-option__teams">
                <span>{{ m.teamA.name }}</span>
                <span class="tech-loss-option__vs" aria-hidden="true">vs</span>
                <span>{{ m.teamB.name }}</span>
              </span>
              <span class="tech-loss-option__meta">
                <span class="tech-loss-option__chip">{{ roundLabel(m) }}</span>
                <span v-if="m.format === 'bo3'" class="tech-loss-option__chip is-bo3">
                  BO3 · {{ m.winsTeamA }}:{{ m.winsTeamB }}
                </span>
              </span>
            </span>
          </el-option>
        </el-select>

        <!-- Метадані обраної серії -->
        <Transition name="fade-slide">
          <p v-if="selectedMatch" class="tech-loss__series">
            <span class="tech-loss__series-chip">{{ roundLabel(selectedMatch) }}</span>
            <span v-if="selectedMatch.format === 'bo3'" class="tech-loss__series-chip is-bo3">
              BO3 · рахунок {{ selectedMatch.winsTeamA }}:{{ selectedMatch.winsTeamB }}
            </span>
            <span class="tech-loss__series-id">#{{ selectedMatch.challongeMatchId }}</span>
          </p>
        </Transition>
      </section>

      <!-- Крок 02 — переможець -->
      <section class="tech-loss__step" :class="{ 'is-locked': !selectedMatch }">
        <header class="tech-loss__step-head">
          <span class="tech-loss__step-index">02</span>
          <span class="tech-loss__step-label">Переможець</span>
          <span v-if="winnerTeamId" class="tech-loss__step-meta is-done">Обрано</span>
        </header>

        <Transition name="fade-slide" mode="out-in">
          <div v-if="!selectedMatch" key="placeholder" class="tech-loss__placeholder" aria-hidden="true">
            <PhCursorClick :size="18" weight="duotone" />
            <span>Спочатку оберіть матч</span>
          </div>

          <div v-else key="cards" class="tech-loss__teams">
            <MatchTeamSelectCard
              :team="selectedMatch.teamA"
              :state="cardState(selectedMatch.teamA.id)"
              @click="toggleWinner(selectedMatch.teamA.id)"
            />
            <span class="tech-loss__vs" aria-hidden="true">vs</span>
            <MatchTeamSelectCard
              :team="selectedMatch.teamB"
              :state="cardState(selectedMatch.teamB.id)"
              @click="toggleWinner(selectedMatch.teamB.id)"
            />
          </div>
        </Transition>
      </section>

      <!-- Попередження: рішення закриває серію і рухає сітку -->
      <p class="tech-loss__warning" role="note">
        <PhShieldWarning :size="16" weight="fill" aria-hidden="true" />
        <span>
          Результат вноситься вручну, без ID матчу Dota 2: серія закривається цілком і сітка
          одразу просувається. Переконайтеся, що рішення погоджене з обома капітанами.
        </span>
      </p>
    </div>

    <template #footer>
      <div class="tech-loss-dialog__foot">
        <span class="tech-loss-dialog__foot-hint" :class="{ 'is-ready': canSubmit }">
          {{ footHint }}
        </span>
        <div class="flex shrink-0 items-center gap-10">
          <el-button :disabled="loading" @click="close">
            Скасувати
          </el-button>
          <el-button
            type="success"
            :loading="loading"
            :disabled="!canSubmit"
            @click="submit"
          >
            <PhCheck v-if="!loading" :size="16" weight="bold" class="mr-8 shrink-0" />
            Ввести результат
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  PhArrowClockwise,
  PhCheck,
  PhCursorClick,
  PhShieldWarning,
  PhWarningCircle,
  PhX
} from '@phosphor-icons/vue'
import type { TOpenPlayoffMatch } from '@/api/types/api.types'
import MatchTeamSelectCard from '@/components/MatchTeamSelectCard.vue'
import { friendlyPlayoffError } from '../utils/playoff-errors.utils'

const props = defineProps<{
  tournamentId: string
  onSubmitted?: (response: TPlayoff) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const openMatches = ref<TOpenPlayoffMatch[]>([])
const fetchingMatches = ref(false)
const fetchError = ref('')
const selectedSeriesId = ref<string>('')
const winnerTeamId = ref<string>('')
const loading = ref(false)

const selectedMatch = computed(() =>
  openMatches.value.find((m) => m.seriesId === selectedSeriesId.value) ?? null
)

const canSubmit = computed(() =>
  !!selectedMatch.value && !!winnerTeamId.value && !fetchingMatches.value
)

const winnerName = computed(() => {
  const m = selectedMatch.value
  if (!m || !winnerTeamId.value) return ''
  return m.teamA.id === winnerTeamId.value ? m.teamA.name : m.teamB.name
})

// Підказка у футері — пояснює, чому кнопка вимкнена, і підтверджує вибір.
const footHint = computed(() => {
  if (fetchingMatches.value) return 'Завантаження матчів…'
  if (fetchError.value) return 'Не вдалося завантажити матчі'
  if (openMatches.value.length === 0) return 'Немає відкритих серій'
  if (!selectedMatch.value) return 'Оберіть матч'
  if (!winnerTeamId.value) return 'Вкажіть переможця'
  return `Перемога: ${winnerName.value}`
})

/**
 * Бекенд віддає всі серії поточної сітки, включно з уже вирішеними (`state: complete`
 * або `seriesResolved`). Технічну поразку можна зарахувати лише у відкритій серії —
 * інакше запит падає або перезаписує реальний результат. Тому фільтруємо тут.
 */
function isOpenSeries (m: TOpenPlayoffMatch): boolean {
  return !m.seriesResolved && m.state !== 'complete' && !m.seriesWinnerTeamId
}

function matchLabel (m: TOpenPlayoffMatch): string {
  return `${m.teamA.name} vs ${m.teamB.name}`
}

const FINAL_LABELS: Record<NonNullable<TOpenPlayoffMatch['finalSeriesType']>, string> = {
  upper_bracket_final: 'Фінал верхньої сітки',
  lower_bracket_final: 'Фінал нижньої сітки',
  grand_final: 'Гранд-фінал'
}

// Challonge нумерує раунди нижньої сітки від'ємними числами.
function roundLabel (m: TOpenPlayoffMatch): string {
  if (m.finalSeriesType) return FINAL_LABELS[m.finalSeriesType]
  if (m.round < 0) return `Нижня сітка · раунд ${Math.abs(m.round)}`
  return `Раунд ${m.round}`
}

function cardState (teamId: string): 'neutral' | 'winner' | 'loser' {
  if (!winnerTeamId.value) return 'neutral'
  return winnerTeamId.value === teamId ? 'winner' : 'loser'
}

function toggleWinner (teamId: string) {
  winnerTeamId.value = winnerTeamId.value === teamId ? '' : teamId
}

async function loadMatches () {
  if (fetchingMatches.value) return
  fetchingMatches.value = true
  fetchError.value = ''
  try {
    const all = await tournamentsService.fetchPlayoffOpenMatches(props.tournamentId)
    openMatches.value = all.filter(isOpenSeries)
  } catch (e: unknown) {
    openMatches.value = []
    fetchError.value = friendlyPlayoffError(e, 'Не вдалося завантажити матчі сітки')
  } finally {
    fetchingMatches.value = false
  }
}

function resetForm () {
  selectedSeriesId.value = ''
  winnerTeamId.value = ''
  loading.value = false
}

/**
 * Завантажуємо серії за фактом відкриття, а не через `@open`: реєстр модалок монтує
 * компонент уже з `modelValue = true`, і подія `open` не гарантована на першому рендері.
 */
watch(modelValue, (open) => {
  if (!open) return
  resetForm()
  loadMatches()
}, { immediate: true })

function close () {
  modelValue.value = false
}

async function submit () {
  const match = selectedMatch.value
  if (!match || !winnerTeamId.value || loading.value) return

  const loserTeamId = winnerTeamId.value === match.teamA.id ? match.teamB.id : match.teamA.id

  loading.value = true
  try {
    const res = await tournamentsService.adminTechLossPlayoffMatch(
      props.tournamentId,
      winnerTeamId.value,
      loserTeamId
    )
    ElMessage.success('Результат збережено, сітку оновлено')
    props.onSubmitted?.(res)
    close()
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося зберегти результат'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.tech-loss {
  @apply flex flex-col gap-18;
}

.tech-loss__lead {
  @apply m-0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

// ─── Кроки ──────────────────────────────────────────────────────────────────
.tech-loss__step {
  @apply flex flex-col gap-8;

  &.is-locked .tech-loss__step-head {
    opacity: 0.55;
  }
}

.tech-loss__step-head {
  @apply flex items-baseline gap-8;
  line-height: 1.25;
  transition: opacity var(--ds-duration-base) ease;
}

.tech-loss__step-index {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.tech-loss__step-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.tech-loss__step-meta {
  @apply ml-auto;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);

  &.is-done {
    color: var(--ds-success);
  }
}

// Скелет списку — висота селекта, три ряди з каскадною пульсацією.
.tech-loss__skeleton {
  @apply flex flex-col gap-6;
}

@keyframes tech-loss-pulse {
  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}

.tech-loss__skeleton-row {
  @apply block rounded-lg;
  height: 14px;
  background: rgba(var(--ds-primary-rgb), 0.08);
  animation: tech-loss-pulse 1.4s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 120ms);

  &:nth-child(1) {
    width: 78%;
  }

  &:nth-child(2) {
    width: 62%;
  }

  &:nth-child(3) {
    width: 70%;
  }
}

// Метадані обраної серії: раунд, формат і рахунок, id вузла Challonge.
.tech-loss__series {
  @apply m-0 flex flex-wrap items-center gap-6;
}

// `line-height` задано явно: усередині опції селекта чіп інакше успадкує 34px від рядка.
.tech-loss__series-chip,
.tech-loss-option__chip {
  @apply inline-flex items-center whitespace-nowrap rounded-md px-6 py-3;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  &.is-bo3 {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.08);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
  }
}

.tech-loss__series-id {
  @apply ml-auto;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

// Плейсхолдер кроку 02 — тримає висоту, доки матч не обрано, щоб діалог не стрибав.
.tech-loss__placeholder {
  @apply flex min-h-[132px] flex-col items-center justify-center gap-8 rounded-xl border border-dashed;
  border-color: rgba(255, 255, 255, 0.1);
  background: repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 10px);
  color: var(--ds-text-faint);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;

  svg {
    color: rgba(var(--ds-primary-rgb), 0.55);
  }
}

.tech-loss__teams {
  @apply grid items-stretch gap-10;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}

.tech-loss__vs {
  @apply self-center;
  font-family: var(--ds-font-display);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ds-primary-rgb), 0.55);
}

// Порожній стан — жовтий; помилка — червоний з кнопкою повтору.
.tech-loss__empty {
  @apply m-0 inline-flex items-start gap-8 rounded-lg border px-12 py-10;
  font-size: 13px;
  line-height: 1.45;
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.08);

  svg {
    flex: none;
    margin-top: 1px;
    color: var(--ds-warning);
  }

  &.is-error {
    @apply items-center;
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.08);

    svg {
      margin-top: 0;
      color: var(--ds-error);
    }
  }
}

.tech-loss__retry {
  @apply inline-flex shrink-0 items-center gap-4 rounded-md border-0 px-8 py-4;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background-color var(--ds-duration-fast) ease, transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

// Попередження про наслідки — червоний тон, бо дія одразу змінює сітку.
.tech-loss__warning {
  @apply m-0 inline-flex items-start gap-8 rounded-lg border px-12 py-10;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.07);

  svg {
    flex: none;
    margin-top: 1px;
    color: var(--ds-error);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (hover: hover) and (pointer: fine) {
  .tech-loss__retry:hover {
    background: rgba(255, 255, 255, 0.16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .tech-loss__step-head,
  .tech-loss__retry {
    transition: none;
  }

  .tech-loss__skeleton-row {
    animation: none;
    opacity: 0.6;
  }

  .tech-loss__retry:active {
    transform: none;
  }
}
</style>

<style lang="scss">
// Не scoped: `.el-dialog` і поппер селекта рендеряться поза коренем компонента.
// Те саме темне скло, що й у діалогах профілю та кваліфікації.
.el-dialog.tech-loss-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .tech-loss-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.tech-loss-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.tech-loss-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.tech-loss-dialog__close {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.tech-loss-dialog__foot {
  @apply flex flex-wrap items-center justify-between gap-10;

  .el-button > span {
    @apply inline-flex items-center;
  }
}

// Пояснює, чому кнопка вимкнена; підсвічується, коли все готово.
.tech-loss-dialog__foot-hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-ready {
    color: var(--ds-success);
  }
}

// Опція селекта: команди зліва, чіпи раунду / формату справа.
.tech-loss-select-popper .tech-loss-option {
  @apply flex w-full items-center justify-between gap-12;
}

.tech-loss-select-popper .tech-loss-option__teams {
  @apply inline-flex min-w-0 items-baseline gap-6 truncate;
}

.tech-loss-select-popper .tech-loss-option__vs {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ds-primary-rgb), 0.55);
}

.tech-loss-select-popper .tech-loss-option__meta {
  @apply inline-flex shrink-0 items-center gap-4;
}

@media (hover: hover) and (pointer: fine) {
  .tech-loss-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
