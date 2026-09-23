<template>
  <div class="mt-16 flex flex-col gap-16">
    <!-- Шапка етапу: HUD-панель зі статусом, вікном подачі, відліком і зведенням по матчах -->
    <section
      class="qual-phase hud-panel hud-corners hud-corners--fade rounded-2xl overflow-hidden"
      aria-label="Кваліфікаційний етап"
    >
      <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0" aria-hidden="true" />
      <span class="qual-phase__glow" aria-hidden="true" />

      <div
        class="relative grid gap-20 px-36 py-30 sm:px-44 sm:py-34 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center
          lg:gap-40"
      >
        <div class="qual-phase__reveal flex min-w-0 flex-col gap-12" style="--reveal-index: 0">
          <p class="qual-phase__eyebrow sys-label">
            <span class="qual-phase__tick" aria-hidden="true" />
            <span>Етап</span>
            <span class="qual-phase__sep" aria-hidden="true">/</span>
            <span>Кваліфікація</span>
          </p>

          <div class="flex flex-wrap items-center gap-x-12 gap-y-8">
            <h2 class="qual-phase__title">Кваліфікаційний етап</h2>
            <StatusBadge
              v-if="phaseStatus"
              :preset="phaseStatus.preset"
              :tone="phaseStatus.tone"
              :label="phaseStatus.label"
              size="sm"
            />
          </div>

          <p v-if="phaseWindowText" class="qual-phase__window">
            <PhCalendarBlank :size="14" weight="bold" aria-hidden="true" />
            <span>{{ phaseWindowText }}</span>
          </p>

          <p v-if="windowNotice" class="qual-phase__notice" role="status">
            <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
            <span>{{ windowNotice }}</span>
          </p>
        </div>

        <!-- Відлік: до старту (поки вікно не відкрилось) або до кінця подачі -->
        <div
          v-if="countdownTargetIso"
          class="qual-phase__reveal qual-phase__timer"
          :class="{ 'is-urgent': countdownUrgent, 'is-over': countdownOver }"
          style="--reveal-index: 1"
        >
          <span class="qual-phase__timer-label">
            <PhHourglassMedium :size="12" weight="bold" aria-hidden="true" />
            {{ countdownTitle }}
          </span>
          <div class="qual-phase__segments" role="timer" :aria-label="countdownAriaLabel">
            <div v-for="seg in countdownSegments" :key="seg.unit" class="qual-phase__seg">
              <span class="qual-phase__seg-value">{{ seg.value }}</span>
              <span class="qual-phase__seg-unit">{{ seg.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Рейка прогресу вікна кваліфікації -->
      <div
        v-if="phaseProgress !== null"
        class="qual-phase__rail"
        role="progressbar"
        aria-label="Пройдено від вікна кваліфікації"
        :aria-valuenow="phaseProgressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span class="qual-phase__rail-fill" :style="{ transform: `scaleX(${phaseProgress})` }" />
      </div>

      <dl class="qual-phase__stats qual-phase__reveal" style="--reveal-index: 2">
        <div class="qual-phase__stat">
          <dt>
            <PhUsersThree :size="12" weight="bold" aria-hidden="true" />
            Команд
          </dt>
          <dd>{{ teamsCount }}</dd>
        </div>
        <div class="qual-phase__stat">
          <dt>
            <PhFlagCheckered :size="12" weight="bold" aria-hidden="true" />
            Зіграно
          </dt>
          <dd>
            {{ playedCount }}<span class="qual-phase__stat-dim">/{{ matches.length }}</span>
          </dd>
        </div>
        <div class="qual-phase__stat">
          <dt>
            <PhHourglassMedium :size="12" weight="bold" aria-hidden="true" />
            Очікують
          </dt>
          <dd>{{ pendingCount }}</dd>
        </div>
      </dl>
    </section>

    <QualificationMatchesList
      :matches="sortedDisplayMatches"
      :tournament-teams="tournamentTeams"
      :player-points="qualificationPhase?.playerTournamentPoints ?? null"
      :loading="qualificationHydrateInFlight"
      :show-add-result-button="showAddResultButton"
      :show-test-match-button="isLocalhost"
      :show-tech-loss-button="isAdmin"
      @add-result="openAddModal"
      @test-match="openTestMatchModal"
      @tech-loss="openTechLossModal"
    />

    <QualificationAddResultModal
      v-model="modalOpen"
      :tournament-id="tournamentId"
      :submission-blocked-reason="submissionBlockedReason"
      @submitted="onSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useIntervalFn } from '@vueuse/core'
import {
  PhCalendarBlank,
  PhFlagCheckered,
  PhHourglassMedium,
  PhUsersThree,
  PhWarningCircle
} from '@phosphor-icons/vue'
import QualificationMatchesList from './qualification/QualificationMatchesList.vue'
import QualificationAddResultModal from '../modals/QualificationAddResultModal.vue'
import { buildQualificationMatrixTeams } from './qualification/qualification-matrix.utils'
import type { TStatusPresetKey, TStatusTone } from '@/components/status/status.presets'
import type {
  TQualificationMatch as QualificationMatch,
  TQualificationPhase as QualificationPhase
} from '@/api/types/api.types'
dayjs.locale('uk')

const props = defineProps<{
  tournamentId: string
  tournament: TTournament | null
}>()

const emit = defineEmits<{
  (e: 'patch-tournament', value: TTournament): void
}>()

const authStore = useAuthStore()
const { open: openAppModal } = useAppModals()

const qualificationPhase = shallowRef<QualificationPhase | null>(null)

// tournament.teams comes from the embedded Tournament schema (Team[]), not the /teams list (TTeam[]).
// Cast bridging the schema mismatch — structurally compatible at runtime.
const tournamentTeams = computed(() => (props.tournament?.teams ?? null) as TTeam[] | null)

/** Захист від паралельних GET та від циклу watch → patch → watch. */
const qualificationHydrateInFlight = ref(false)

async function hydrateQualification () {
  if (qualificationHydrateInFlight.value) return
  const fromDetail = props.tournament?.qualification
  if (fromDetail?.matches?.length) {
    qualificationPhase.value = fromDetail
    return
  }

  qualificationHydrateInFlight.value = true
  const requestTournamentId = props.tournamentId
  try {
    const fetched = await tournamentsService.fetchQualification(requestTournamentId)
    if (props.tournamentId !== requestTournamentId) return
    qualificationPhase.value = fetched
    /**
     * Підмішуємо в батька лише коли є матчі — інакше patch створює новий об'єкт qualification
     * з порожнім matches, deep-watch знову викликає hydrate → безкінечні GET.
     */
    const hasMatches = (fetched?.matches?.length ?? 0) > 0
    const parentHasNoMatches = !(props.tournament?.qualification?.matches?.length ?? 0)
    if (fetched && props.tournament && parentHasNoMatches && hasMatches) {
      emit('patch-tournament', { ...props.tournament, qualification: fetched })
    }
  } catch {
    qualificationPhase.value = null
  } finally {
    qualificationHydrateInFlight.value = false
  }
}

onMounted(() => {
  hydrateQualification()
})

/**
 * Не deep-watch на весь `qualification` — після patch-tournament змінюється посилання
 * і Vue знову викликає hydrate безкінечно. Достатньо id турніру + довжини списку матчів.
 */
watch(
  () => [props.tournamentId, props.tournament?.qualification?.matches?.length ?? -1] as const,
  () => {
    hydrateQualification()
  }
)

const matches = computed(() => qualificationPhase.value?.matches ?? [])

/** Спочатку матчі з результатом, далі — що ще чекають подачу. */
const sortedDisplayMatches = computed(() => {
  const list = [...matches.value]
  list.sort((a, b) => {
    const aDone = !!(a.dotaMatchId || a.winner)
    const bDone = !!(b.dotaMatchId || b.winner)
    if (aDone !== bDone) return aDone ? -1 : 1
    return 0
  })
  return list
})

// ─── Зведення для шапки ──────────────────────────────────────────────────────
/** Команди в матриці — ті ж, що бачить користувач у таблиці нижче. */
const teamsCount = computed(() => buildQualificationMatrixTeams(tournamentTeams.value, matches.value).length)

/** «Зіграно» узгоджено з матрицею: результат є лише за наявності `winner`. */
const playedCount = computed(() => matches.value.filter((m) => !!m.winner).length)

const pendingCount = computed(() => matches.value.length - playedCount.value)

/**
 * Тікає щосекунди разом із таймером, щоб гейти нижче перемикалися без перезавантаження
 * сторінки, коли вікно кваліфікації відкривається або закривається.
 */
const nowMs = ref(Date.now())

useIntervalFn(() => {
  nowMs.value = Date.now()
}, 1000)

/**
 * Вікно подачі кваліфікаційних матчів. Пріоритет — сама сутність `Qualification`
 * з бекенду, фолбек — власні колонки турніру. Обидва джерела дзеркалять одні й ті
 * самі дати: раніше тут стояв `registrationEndsAt`, через що зсув дедлайну
 * реєстрації мовчки рухав і межу подачі матчів.
 */
const qualificationWindowStartIso = computed(
  () => qualificationPhase.value?.startTime ?? props.tournament?.qualificationStartsAt ?? ''
)

const qualificationSubmissionDeadlineIso = computed(
  () => qualificationPhase.value?.endTime ?? props.tournament?.qualificationEndsAt ?? ''
)

const beforeSubmissionWindow = computed(() => {
  const start = qualificationWindowStartIso.value
  if (!start) return false
  return dayjs(nowMs.value).isBefore(dayjs(start))
})

/** Клієнтська перевірка: поза цим вікном бекенд відхиляє подані матчі. */
const pastSubmissionWindow = computed(() => {
  const end = qualificationSubmissionDeadlineIso.value
  if (!end) return false
  return dayjs(nowMs.value).isAfter(dayjs(end))
})

/** Причина блокування подачі або null. Дзеркалить повідомлення бекенду. */
const submissionBlockedReason = computed<string | null>(() => {
  if (beforeSubmissionWindow.value) return 'Кваліфікаційний етап ще не розпочався.'
  if (pastSubmissionWindow.value) return 'Строк подачі результату завершено.'
  return null
})

interface IPhaseStatus {
  preset: TStatusPresetKey
  tone?: TStatusTone
  label: string
}

/** Бейдж стану етапу. «Триває» — на ціановому тоні, а не червоному «live», бо це не трансляція. */
const phaseStatus = computed<IPhaseStatus | null>(() => {
  if (!qualificationWindowStartIso.value && !qualificationSubmissionDeadlineIso.value) return null
  if (beforeSubmissionWindow.value) return { preset: 'upcoming', label: 'Незабаром' }
  if (pastSubmissionWindow.value) return { preset: 'completed', label: 'Завершено' }
  return { preset: 'live', tone: 'primary', label: 'Триває' }
})

const phaseWindowText = computed(() => {
  const start = qualificationWindowStartIso.value
  const end = qualificationSubmissionDeadlineIso.value
  if (start && end) return `${formatUk(start)} — ${formatUk(end)}`
  if (end) return `Межа для подань (кінець кваліфікації): ${formatUk(end)}`
  if (start) return `Старт етапу: ${formatUk(start)}`
  return ''
})

const windowNotice = computed(() => {
  if (beforeSubmissionWindow.value) {
    return 'Кваліфікаційний етап ще не розпочався — подача результатів відкриється ' +
      `${formatUk(qualificationWindowStartIso.value)}.`
  }
  if (pastSubmissionWindow.value) {
    return 'Термін подачі результату завершено — сервер може відхилити нові матчі (після кінця вікна кваліфікації).'
  }
  return ''
})

function formatUk (iso: string) {
  return dayjs(iso).format('DD MMM YYYY, HH:mm')
}

// ─── Відлік ──────────────────────────────────────────────────────────────────
interface ICountdownSegment {
  value: string
  unit: string
}

/** До відкриття вікна рахуємо до старту, далі — до кінця подачі. */
const countdownTargetIso = computed(() =>
  beforeSubmissionWindow.value
    ? qualificationWindowStartIso.value
    : qualificationSubmissionDeadlineIso.value
)

const countdownTitle = computed(() => {
  if (beforeSubmissionWindow.value) return 'До старту етапу'
  if (pastSubmissionWindow.value) return 'Подачу закрито'
  return 'До кінця подачі'
})

const countdownDiffSec = computed(() => {
  const target = countdownTargetIso.value
  if (!target) return 0
  return Math.max(0, dayjs(target).diff(dayjs(nowMs.value), 'second'))
})

const countdownOver = computed(() => !!countdownTargetIso.value && countdownDiffSec.value <= 0)

/** Остання година подачі — цифри підсвічуються рожевим. */
const countdownUrgent = computed(
  () => !countdownOver.value && !beforeSubmissionWindow.value && countdownDiffSec.value < 3600
)

const countdownSegments = computed<ICountdownSegment[]>(() => {
  const total = countdownDiffSec.value
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  const segments: ICountdownSegment[] = []
  if (days > 0) segments.push({ value: String(days), unit: 'дн' })
  segments.push(
    { value: pad(hours), unit: 'год' },
    { value: pad(minutes), unit: 'хв' },
    { value: pad(seconds), unit: 'с' }
  )
  return segments
})

const countdownAriaLabel = computed(
  () => `${countdownTitle.value}: ${countdownSegments.value.map((s) => `${s.value} ${s.unit}`).join(' ')}`
)

/** Частка вікна, що вже минула (0…1); null, коли дат бракує або вони некоректні. */
const phaseProgress = computed<number | null>(() => {
  const startIso = qualificationWindowStartIso.value
  const endIso = qualificationSubmissionDeadlineIso.value
  if (!startIso || !endIso) return null
  const start = dayjs(startIso)
  const end = dayjs(endIso)
  if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return null
  const ratio = (nowMs.value - start.valueOf()) / (end.valueOf() - start.valueOf())
  return Math.min(1, Math.max(0, ratio))
})

const phaseProgressPercent = computed(() => Math.round((phaseProgress.value ?? 0) * 100))

/** Кнопка «Додати результат» для авторизованого користувача, поки триває вікно кваліфікації. */
const showAddResultButton = computed(
  () => !!authStore.token && submissionBlockedReason.value === null
)

const isAdmin = computed(() => authStore.isAdmin?.isAdmin || authStore.isAdmin?.isModerator)

const modalOpen = ref(false)

function openAddModal () {
  modalOpen.value = true
}

function openTechLossModal () {
  openAppModal('TechLossQualificationModal', {
    matches: matches.value,
    onSubmitted: (matchId: string, winnerId: string) => {
      const q = qualificationPhase.value
      if (!q) return
      const list = [...(q.matches ?? [])]
      const i = list.findIndex((m) => m.id === matchId)
      if (i >= 0) {
        const m = list[i]
        const fullWinner = m.teamA?.id === winnerId ? m.teamA : m.teamB
        list[i] = { ...m, winner: fullWinner, dotaMatchId: `tech_loss_${matchId}` }
      }
      qualificationPhase.value = { ...q, matches: list }
      const t = props.tournament
      if (t) emit('patch-tournament', { ...t, qualification: { ...q, matches: list } })
    }
  })
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

function openTestMatchModal () {
  openAppModal('TestMatchCreationModal', {
    tournamentId: props.tournamentId,
    phase: 'qualification',
    teams: props.tournament?.teams ?? []
  })
}

function onSubmitted (updated: QualificationMatch) {
  const q = qualificationPhase.value
  if (!q) return
  const list = [...(q.matches ?? [])]
  const i = list.findIndex((m) => m.id === updated.id)
  if (i >= 0) list[i] = updated
  const nextPhase: QualificationPhase = { ...q, matches: list }
  qualificationPhase.value = nextPhase
  const t = props.tournament
  if (t) emit('patch-tournament', { ...t, qualification: nextPhase })
}
</script>

<style scoped lang="scss">
// ─── Панель ─────────────────────────────────────────────────────────────────
// HUD-кутники з м'яким сяйвом і ціаново-рожеве «повітря» в протилежних кутах —
// той самий рецепт, що й панель приєднання в героя, тож вкладка читається як
// продовження сторінки, а не окремий віджет.
.qual-phase {
  --hud-corner-size: 14px;
  --hud-corner-inset: 10px;
  --hud-corner-radius: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.55);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.4));
}

.qual-phase__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 80% at 0% 0%, rgba(var(--ds-primary-rgb), 0.1), transparent 60%),
    radial-gradient(ellipse 40% 70% at 100% 100%, rgba(var(--ds-pink-rgb), 0.06), transparent 65%);
}

// Поява каскадом: текст → відлік → зведення. Під `prefers-reduced-motion`
// глушиться глобально в `_tokens.scss`.
@keyframes qual-phase-in {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0);
  }
}

.qual-phase__reveal {
  animation: qual-phase-in 360ms var(--ds-ease-out) both;
  animation-delay: calc(var(--reveal-index, 0) * 60ms);
}

// ─── Текстовий блок ─────────────────────────────────────────────────────────
.qual-phase__eyebrow {
  @apply m-0 inline-flex flex-wrap items-center gap-8;
}

.qual-phase__tick {
  width: 16px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7);
}

.qual-phase__sep {
  color: rgba(var(--ds-primary-rgb), 0.45);
  text-shadow: none;
}

.qual-phase__title {
  @apply m-0 font-display uppercase text-white;
  font-size: clamp(1.125rem, 0.95rem + 0.8vw, 1.5rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 20px rgba(var(--ds-primary-rgb), 0.18);
}

.qual-phase__window {
  @apply m-0 inline-flex items-center gap-8;
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);

  svg {
    flex: none;
    color: rgba(var(--ds-primary-rgb), 0.8);
  }
}

// Попередження про закрите вікно — жовтий тон, іконка + текст (не лише колір).
.qual-phase__notice {
  @apply m-0 inline-flex items-start gap-8 rounded-lg border px-10 py-8;
  max-width: 60ch;
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

// ─── Відлік ─────────────────────────────────────────────────────────────────
.qual-phase__timer {
  @apply flex flex-col gap-8 lg:items-end;
}

.qual-phase__timer-label {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    flex: none;
    color: rgba(var(--ds-primary-rgb), 0.75);
  }
}

.qual-phase__segments {
  @apply flex items-stretch gap-6;
}

// Комірка відліку: темна лунка з ціановою волосиною, цифри — моно з
// табличними знаками, щоб секунди не «дрижали» шириною.
.qual-phase__seg {
  @apply flex min-w-[52px] flex-col items-center gap-4 rounded-lg border px-8 py-8 sm:min-w-[60px];
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition: border-color var(--ds-duration-base) ease;
}

.qual-phase__seg-value {
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
  transition: color var(--ds-duration-base) ease, text-shadow var(--ds-duration-base) ease;

  @screen sm {
    font-size: 26px;
  }
}

.qual-phase__seg-unit {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.qual-phase__timer.is-urgent {
  .qual-phase__seg {
    border-color: rgba(var(--ds-pink-rgb), 0.35);
  }

  .qual-phase__seg-value {
    color: var(--ds-pink);
    text-shadow: var(--ds-neon-text-pink);
  }
}

.qual-phase__timer.is-over .qual-phase__seg-value {
  color: var(--ds-text-faint);
}

// ─── Рейка прогресу ─────────────────────────────────────────────────────────
.qual-phase__rail {
  position: relative;
  height: 3px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.qual-phase__rail-fill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--ds-primary) 0%, var(--ds-pink) 100%);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.6);
  transition: transform 600ms var(--ds-ease-in-out);
}

// ─── Зведення ───────────────────────────────────────────────────────────────
.qual-phase__stats {
  @apply m-0 grid grid-cols-3;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.22);
}

.qual-phase__stat {
  @apply flex min-w-0 flex-col gap-6 px-36 py-22 sm:px-44 sm:py-24;

  & + & {
    border-left: 1px solid rgba(255, 255, 255, 0.06);
  }

  dt {
    @apply inline-flex items-center gap-5;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ds-text-faint);

    svg {
      flex: none;
      color: rgba(var(--ds-primary-rgb), 0.75);
    }
  }

  dd {
    @apply m-0;
    font-family: var(--ds-font-mono);
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ds-text-strong);
  }
}

.qual-phase__stat-dim {
  color: var(--ds-text-faint);
  font-weight: 600;
}
</style>
