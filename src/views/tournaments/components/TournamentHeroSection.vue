<template>
  <div class="hero flex flex-col gap-14 lg:gap-18">
    <!-- Системний надпис: реєстр HUD, як у шапці («SYS://CORE LEAGUE») -->
    <p class="hero__eyebrow hero__reveal" style="--reveal-index: 0">
      <span class="hero__eyebrow-tick" aria-hidden="true" />
      <span>Турнір</span>
      <span class="hero__eyebrow-sep" aria-hidden="true">/</span>
      <span>Dota 2</span>
      <span v-if="tournament?.id" class="hero__eyebrow-sep" aria-hidden="true">/</span>
      <span v-if="tournament?.id" class="hero__eyebrow-id">#{{ shortId }}</span>
    </p>

    <div class="flex flex-col gap-10">
      <h1 class="hero__title hero__reveal" style="--reveal-index: 1">
        {{ tournament?.name }}
      </h1>
      <span class="hero__rule hero__reveal" style="--reveal-index: 2" aria-hidden="true" />
    </div>

    <!-- Статус + контекст: до коли реєстрація, формат -->
    <div class="hero__chips hero__reveal" style="--reveal-index: 3">
      <TournamentStatusTag
        :status="tournament?.tournamentStatus"
        class="hero__status shrink-0"
      />

      <span v-if="registrationDeadlineLabel" class="hero-chip hero-chip--live">
        <PhHourglassMedium :size="13" weight="bold" />
        <span>Реєстрація до {{ registrationDeadlineLabel }}</span>
      </span>

      <span v-if="tournament?.hasQualification === false" class="hero-chip hero-chip--soft">
        <PhLightning :size="12" weight="fill" />
        <span>Одразу плей-оф</span>
      </span>
      <span v-else-if="tournament?.hasQualification" class="hero-chip hero-chip--soft">
        <PhFlagCheckered :size="12" weight="fill" />
        <span>З кваліфікацією</span>
      </span>
    </div>

    <!-- Етапи: пройдені — заповнені, поточний — світиться, майбутні — контур -->
    <ol
      class="hero-timeline hero__reveal"
      style="--reveal-index: 4"
      :style="{ '--steps': stages.length }"
      aria-label="Етапи турніру"
    >
      <li
        v-for="stage in stages"
        :key="stage.key"
        class="hero-timeline__step"
        :class="{ 'is-done': stage.state === 'done', 'is-current': stage.state === 'current' }"
        :aria-current="stage.state === 'current' ? 'step' : undefined"
      >
        <span class="hero-timeline__node" aria-hidden="true" />
        <span class="hero-timeline__label">{{ stage.label }}</span>
        <span class="hero-timeline__dates">{{ stage.dates }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { isJoinableTournamentStatus } from '@/components/tournaments-tags/tournament.constants'
import { PhHourglassMedium, PhLightning, PhFlagCheckered } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

type TStageState = 'done' | 'current' | 'upcoming'

interface IStage {
  key: 'REGISTRATION' | 'QUALIFICATIONS' | 'PLAYOFF'
  label: string
  dates: string
  state: TStageState
}

interface IProps {
  tournament: TTournament | null
}

const props = defineProps<IProps>()

// Короткий хвіст UUID — читається як номер квитка, а не як технічний ідентифікатор.
const shortId = computed(() => (props.tournament?.id ?? '').slice(-6).toUpperCase())

// «26–27 вер.» / «30 лип. — 2 серп.» / «27 вер.»; порожні або биті дати → «—».
function formatRange (from?: string | null, to?: string | null): string {
  const start = dayjs(from).tz(TZ)
  const end = dayjs(to).tz(TZ)
  if (!from || !start.isValid()) return '—'
  if (!to || !end.isValid() || start.isSame(end, 'day')) return start.format('D MMM')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM')}`
  return `${start.format('D MMM')} — ${end.format('D MMM')}`
}

// Дедлайн показуємо лише поки він попереду й статус ще дозволяє приєднатися;
// закриту реєстрацію пояснює банер у панелі праворуч.
const registrationDeadlineLabel = computed(() => {
  const t = props.tournament
  if (!t || !isJoinableTournamentStatus(t.tournamentStatus) || t.registrationClosedAt) return ''
  const end = dayjs(t.registrationEndsAt).tz(TZ)
  if (!t.registrationEndsAt || !end.isValid() || end.isBefore(dayjs())) return ''
  return end.format('D MMM, HH:mm')
})

const stages = computed<IStage[]>(() => {
  const t = props.tournament
  if (!t) return []

  const order: IStage['key'][] = t.hasQualification === false
    ? ['REGISTRATION', 'PLAYOFF']
    : ['REGISTRATION', 'QUALIFICATIONS', 'PLAYOFF']

  // Завершений за статусом або за датою — усі етапи пройдені.
  const endedByDate = !!t.tournamentEndsAt && dayjs(t.tournamentEndsAt).isBefore(dayjs())
  const currentIndex = t.tournamentStatus === 'COMPLETED' || endedByDate
    ? order.length
    : order.indexOf(t.tournamentStatus as IStage['key'])

  const stateAt = (index: number): TStageState => {
    if (currentIndex < 0) return 'upcoming'
    if (index < currentIndex) return 'done'
    return index === currentIndex ? 'current' : 'upcoming'
  }

  const datesFor: Record<IStage['key'], string> = {
    REGISTRATION: formatRange(t.registrationStartsAt, t.registrationEndsAt),
    // Вікно кваліфікації може бути не заповнене — тоді це проміжок між реєстрацією і плей-оф.
    QUALIFICATIONS: formatRange(
      t.qualificationStartsAt ?? t.registrationEndsAt,
      t.qualificationEndsAt ?? t.tournamentStartsAt
    ),
    PLAYOFF: formatRange(t.tournamentStartsAt, t.tournamentEndsAt)
  }
  const labels: Record<IStage['key'], string> = {
    REGISTRATION: 'Реєстрація',
    QUALIFICATIONS: 'Кваліфікація',
    PLAYOFF: 'Плей-оф'
  }

  return order.map((key, index) => ({ key, label: labels[key], dates: datesFor[key], state: stateAt(index) }))
})
</script>

<style scoped lang="scss">
// ─── Поява ──────────────────────────────────────────────────────────────────
// Один оркестрований вхід сторінки: надпис → заголовок → лінія → чипи → етапи,
// з кроком 70 мс. Заголовок додатково виходить із легкого розмиття — так два
// стани не читаються як «два об'єкти». Під `prefers-reduced-motion`
// глушиться глобально в `_tokens.scss`.
@keyframes hero-reveal {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
  }
}

@keyframes hero-title-reveal {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
    filter: blur(6px);
  }
}

.hero__reveal {
  animation: hero-reveal 520ms var(--ds-ease-out) both;
  animation-delay: calc(var(--reveal-index, 0) * 70ms);
}

// ─── Надпис ─────────────────────────────────────────────────────────────────
.hero__eyebrow {
  @apply m-0 inline-flex flex-wrap items-center gap-8;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.hero__eyebrow-tick {
  width: 18px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7);
}

.hero__eyebrow-sep {
  color: rgba(var(--ds-primary-rgb), 0.45);
  text-shadow: none;
}

.hero__eyebrow-id {
  color: var(--ds-text-faint);
  letter-spacing: 0.12em;
  text-shadow: none;
}

// ─── Заголовок ──────────────────────────────────────────────────────────────
// Постерний реєстр: дисплейна гарнітура, капс, щільний інтерліньяж; глибока
// тінь відриває літери від банера, ціанове сяйво — підпис бренду.
.hero__title {
  @apply m-0 font-display uppercase text-white;
  font-size: clamp(2.25rem, 1.1rem + 3.6vw, 4.25rem);
  line-height: 1.02;
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
  text-shadow:
    0 2px 18px rgba(0, 0, 0, 0.75),
    0 0 28px rgba(var(--ds-primary-rgb), 0.22);
  animation-name: hero-title-reveal;
}

.hero__rule {
  display: block;
  width: 96px;
  height: 2px;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--ds-primary) 0%, var(--ds-pink) 100%);
  box-shadow: 0 0 12px rgba(var(--ds-primary-rgb), 0.55);
}

// ─── Чипи ───────────────────────────────────────────────────────────────────
.hero__chips {
  @apply flex flex-wrap items-center gap-8;
}

// Статус-тег звужується до вмісту: смуга на всю ширину читалась як кнопка.
.hero__status {
  @apply w-auto;
}

.hero-chip {
  @apply inline-flex h-28 items-center gap-6 rounded-md border px-10;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(7, 8, 15, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  svg {
    flex: none;
    color: rgba(var(--ds-primary-rgb), 0.85);
  }

  // Дедлайн реєстрації — «гарячий» чип: ціановий контур, підсвічений текст.
  &--live {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.45);
    text-shadow: var(--ds-neon-text-subtle);
    box-shadow: 0 0 12px rgba(var(--ds-primary-rgb), 0.18);
  }

  &--soft {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);

    svg {
      color: rgba(255, 255, 255, 0.55);
    }
  }
}

// ─── Етапи ──────────────────────────────────────────────────────────────────
// Горизонтальна рейка: кожен крок — відрізок лінії (тривалість етапу) з
// вузлом на початку. Пройдені відрізки світяться ціаном, поточний згасає в
// напрямку майбутнього, майбутні — приглушена волосина. Останній відрізок
// розчиняється до краю, щоб рейка не «вибігала» за межі. На вузьких екранах
// стає вертикальним списком.
@keyframes hero-node-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--ds-primary-rgb), 0.55), 0 0 10px rgba(var(--ds-primary-rgb), 0.7);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(var(--ds-primary-rgb), 0), 0 0 10px rgba(var(--ds-primary-rgb), 0.7);
  }
}

.hero-timeline {
  @apply m-0 grid list-none gap-y-10 p-0;
  --line-dim: rgba(255, 255, 255, 0.14);
  --line-lit: rgba(var(--ds-primary-rgb), 0.7);

  @screen xs {
    grid-template-columns: repeat(var(--steps, 3), minmax(0, 1fr));
    column-gap: 0;
  }
}

.hero-timeline__step {
  @apply relative flex min-w-0 flex-col gap-4 pl-22;

  // Вертикальна лінія (мобільний): від вузла до наступного кроку.
  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 14px;
    bottom: -10px;
    width: 1px;
    background: var(--line-dim);
  }

  &:last-child::before {
    background: linear-gradient(180deg, var(--line-dim), transparent);
  }

  &.is-done::before {
    background: var(--line-lit);
  }

  &.is-current::before {
    background: linear-gradient(180deg, var(--line-lit), var(--line-dim));
  }

  @screen xs {
    @apply pl-0 pr-14 pt-18;

    // Горизонтальна лінія на рівні центру вузла.
    &::before {
      left: 0;
      right: 0;
      top: 5px;
      bottom: auto;
      width: auto;
      height: 1px;
    }

    &:last-child::before {
      background: linear-gradient(90deg, var(--line-dim), transparent);
    }

    &.is-done::before {
      background: var(--line-lit);
    }

    &.is-current::before {
      background: linear-gradient(90deg, var(--line-lit), var(--line-dim));
    }

    &.is-done:last-child::before {
      background: linear-gradient(90deg, var(--line-lit), transparent);
    }

    &:last-child {
      padding-right: 0;
    }
  }
}

.hero-timeline__node {
  position: absolute;
  left: 0;
  top: 2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  background: var(--ds-surface);
  transition: background-color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease;

  @screen xs {
    top: 0;
  }

  .is-done & {
    border-color: var(--line-lit);
    background: rgba(var(--ds-primary-rgb), 0.55);
  }

  .is-current & {
    border-color: var(--ds-primary);
    background: var(--ds-primary);
    animation: hero-node-pulse 2s ease-out infinite;
  }
}

.hero-timeline__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  .is-current & {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .is-done & {
    color: var(--ds-text-muted);
  }
}

.hero-timeline__dates {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-faint);

  .is-current & {
    color: var(--ds-text-strong);
  }

  .is-done & {
    color: var(--ds-text-muted);
  }
}
</style>
