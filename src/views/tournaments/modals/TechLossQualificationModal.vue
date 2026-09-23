<template>
  <el-dialog
    v-model="modelValue"
    align-center
    width="560"
    class="tech-loss-dialog"
    destroy-on-close
    :show-close="false"
    @open="resetForm"
  >
    <!-- Шапка: системний ярлик, заголовок, закриття -->
    <template #header>
      <div class="tech-loss-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label sys-label--pink">// Адмін · Кваліфікація</span>
          <h2 class="tech-loss-dialog__title">Внести результат</h2>
        </div>
        <button type="button" class="tech-loss-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="tech-loss">
      <p class="tech-loss__lead">
        Оберіть матч і команду-переможця. Результат записується без ID матчу Dota 2.
      </p>

      <!-- Крок 01 — матч -->
      <section class="tech-loss__step">
        <header class="tech-loss__step-head">
          <span class="tech-loss__step-index">01</span>
          <span class="tech-loss__step-label">Матч</span>
          <span v-if="props.matches.length" class="tech-loss__step-meta">
            {{ props.matches.length }} відкритих
          </span>
        </header>

        <div v-if="props.matches.length === 0" class="tech-loss__empty" role="status">
          <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
          <span>Немає відкритих матчів — зараховувати нічого.</span>
        </div>
        <el-select
          v-else
          v-model="selectedMatchId"
          placeholder="Оберіть матч"
          class="w-full"
          filterable
          :disabled="loading"
          @change="winnerTeamId = ''"
        >
          <el-option
            v-for="m in props.matches"
            :key="m.id"
            :label="matchLabel(m)"
            :value="m.id"
          />
        </el-select>
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

          <div v-else-if="!selectedMatch.teamA || !selectedMatch.teamB" key="missing" class="tech-loss__empty">
            <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
            <span>Дані матчу недоступні.</span>
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

      <!-- Попередження: дія впливає на таблицю і не має ID матчу -->
      <p class="tech-loss__warning" role="note">
        <PhShieldWarning :size="16" weight="fill" aria-hidden="true" />
        <span>
          Результат вноситься вручну, без ID матчу Dota 2, і одразу впливає на таблицю
          кваліфікації. Перед збереженням переконайтеся, що обидва капітани підтвердили підсумок.
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
            type="primary"
            :loading="loading"
            :disabled="!canSubmit"
            @click="submit"
          >
            <PhCheck v-if="!loading" :size="16" weight="bold" class="mr-8 shrink-0" />
            Внести результат
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhCheck, PhCursorClick, PhShieldWarning, PhWarningCircle, PhX } from '@phosphor-icons/vue'
import type { TQualificationMatch } from '@/api/types/api.types'
import MatchTeamSelectCard from '@/components/MatchTeamSelectCard.vue'

const props = defineProps<{
  matches: TQualificationMatch[]
  onSubmitted?: (matchId: string, winnerId: string) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedMatchId = ref<string>('')
const winnerTeamId = ref<string>('')
const loading = ref(false)

const selectedMatch = computed(() =>
  props.matches.find((m) => m.id === selectedMatchId.value) ?? null
)

const canSubmit = computed(() => Boolean(selectedMatchId.value && winnerTeamId.value))

const winnerName = computed(() => {
  if (!selectedMatch.value || !winnerTeamId.value) return ''
  const { teamA, teamB } = selectedMatch.value
  return teamA?.id === winnerTeamId.value ? teamA?.name ?? '' : teamB?.name ?? ''
})

// Підказка у футері — пояснює, чому кнопка вимкнена, і підтверджує вибір.
const footHint = computed(() => {
  if (props.matches.length === 0) return 'Немає відкритих матчів'
  if (!selectedMatchId.value) return 'Оберіть матч'
  if (!winnerTeamId.value) return 'Вкажіть переможця'
  return `Перемога: ${winnerName.value}`
})

function teamLabel (team: TQualificationMatch['teamA']): string {
  if (!team) return '?'
  return team.disbandedAt ? `${team.name} (розпущено)` : team.name
}

function matchLabel (m: TQualificationMatch): string {
  return `${teamLabel(m.teamA)} vs ${teamLabel(m.teamB)}`
}

function cardState (teamId: string): 'neutral' | 'winner' | 'loser' {
  if (!winnerTeamId.value) return 'neutral'
  return winnerTeamId.value === teamId ? 'winner' : 'loser'
}

function toggleWinner (teamId: string) {
  winnerTeamId.value = winnerTeamId.value === teamId ? '' : teamId
}

function resetForm () {
  selectedMatchId.value = ''
  winnerTeamId.value = ''
  loading.value = false
}

function close () {
  modelValue.value = false
}

async function submit () {
  if (!canSubmit.value) return
  loading.value = true
  try {
    const res = await tournamentsService.adminTechLossQualificationMatch(
      selectedMatchId.value,
      winnerTeamId.value
    )
    ElMessage.success('Технічну поразку зараховано')
    props.onSubmitted?.(res.matchId, res.winnerId)
    close()
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e !== null && 'response' in e
        ? ((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
        : ''
    ElMessage.error(msg || 'Не вдалося зарахувати технічну поразку')
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

// Порожній стан / недоступні дані — жовтий тон, іконка + текст.
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
}

// Попередження про наслідки — червоний тон, бо дія одразу змінює таблицю.
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

@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .tech-loss__step-head {
    transition: none;
  }
}
</style>

<style lang="scss">
// Не scoped: `.el-dialog` рендериться поза коренем компонента. Те саме темне
// скло, що й у діалогах профілю (`.mmr-dialog`).
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

@media (hover: hover) and (pointer: fine) {
  .tech-loss-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
