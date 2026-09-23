<template>
  <article
    class="tournament-card neon-card neon-card--gold group relative flex w-full cursor-pointer flex-col
           overflow-hidden rounded-2xl px-14 pb-12 pt-14"
    :class="{ 'is-ended': isEndedBySchedule }"
    :style="{ maxWidth: `${width}px`, height: `${TOURNAMENT_CARD_HEIGHT}px` }"
    @click="toTournamentPage(tournament.id)"
  >
    <!-- Банер: постер події з HUD-кутами; статус, слоти і дати лежать на ньому -->
    <div class="tournament-card__banner hud-corners hud-corners--fade relative shrink-0 overflow-hidden rounded-xl">
      <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[2]" aria-hidden="true" />

      <TournamentBannerImage
        :url="tournament.listBannerUrl"
        variant="card"
        :lazy="true"
        scale-on-hover
        extra-class="tournament-card__image"
      />
      <span class="tournament-card__scrim" aria-hidden="true" />

      <div class="absolute inset-x-10 top-10 z-10 flex items-start justify-between gap-8">
        <TournamentStatusTag
          v-if="tournament.tournamentStatus && !isEndedBySchedule"
          :status="tournament.tournamentStatus"
          class="tournament-card__status"
        />
        <span v-else class="tournament-card__status tournament-card__status--ended">Завершено</span>

        <el-tooltip
          v-if="tournament.tournamentSlots"
          :content="`Команд: ${participantsCount} з ${tournament.tournamentSlots}`"
          placement="top"
          effect="dark"
          :show-after="180"
        >
          <span
            class="tournament-card__chip"
            :class="{ 'is-full': isFull }"
            :aria-label="`Команд: ${participantsCount} з ${tournament.tournamentSlots}`"
          >
            <PhUsersThree :size="12" weight="bold" />
            <span>
              {{ pad(participantsCount) }}<span class="opacity-50">/{{ pad(tournament.tournamentSlots) }}</span>
            </span>
          </span>
        </el-tooltip>
      </div>

      <div class="absolute inset-x-10 bottom-10 z-10 flex items-end justify-between gap-8">
        <span class="tournament-card__chip tournament-card__chip--dates">
          <PhCalendarBlank :size="12" weight="bold" />
          <span>{{ eventDatesLabel }}</span>
        </span>
        <span v-if="tournament.hasQualification === false" class="tournament-card__chip tournament-card__chip--soft">
          Одразу плей-оф
        </span>
      </div>
    </div>

    <!-- Назва: постерний заголовок по центру між двома золотими лініями -->
    <h2 class="tournament-card__name">
      <el-tooltip :content="tournament.name" placement="top" effect="dark" :show-after="400">
        <span class="tournament-card__name-text line-clamp-2">{{ tournament.name }}</span>
      </el-tooltip>
    </h2>

    <!-- Приз: головне число картки -->
    <div class="tournament-card__prize" :class="{ 'is-empty': !hasPrize }">
      <span class="tournament-card__prize-icon" aria-hidden="true">
        <PhTrophy :size="18" weight="duotone" />
      </span>
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <span class="sys-label !text-[9px]" :class="hasPrize ? 'sys-label--gold' : 'sys-label--muted'">
          Призовий фонд
        </span>
        <span class="tournament-card__prize-value truncate">{{ prizeLabel }}</span>
      </div>
      <span v-if="entryFeeLabel" class="tournament-card__fee">
        <PhTicket :size="12" weight="bold" />
        <span>{{ entryFeeLabel }}</span>
      </span>
    </div>

    <!-- Віхи: наступна підсвічена, друга — тлом -->
    <ol class="tournament-card__timeline">
      <li v-for="(item, index) in dateInfo" :key="item.label" class="tournament-card__step">
        <span class="tournament-card__dot" :class="{ 'is-next': index === 0 }" aria-hidden="true" />
        <span class="tournament-card__step-label">{{ item.label }}</span>
        <span class="tournament-card__step-date">{{ item.date }}</span>
      </li>
    </ol>

    <!-- Явна дія: справжня кнопка (як «Учасники» у картці команди); картка теж клікабельна -->
    <el-button
      class="tournament-card__cta mt-auto w-full"
      @click.stop="toTournamentPage(tournament.id)"
    >
      <span class="inline-flex items-center gap-8">
        <PhTrophy :size="16" weight="bold" />
        <span>Відкрити турнір</span>
      </span>
      <PhArrowRight :size="14" weight="bold" class="tournament-card__cta-arrow" />
    </el-button>
  </article>
</template>

<script setup lang="ts">
import { formatEntryFeeUah } from '@/core/utils/formatters'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { TOURNAMENT_CARD_HEIGHT, TOURNAMENT_CARD_WIDTH } from '@/views/tournaments/tournaments.enums'
import { routeNames } from '@/router/route-names'
import { PhArrowRight, PhCalendarBlank, PhTicket, PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

const props = withDefaults(
  defineProps<{
    tournament: TTournament
    width?: number
  }>(),
  { width: TOURNAMENT_CARD_WIDTH }
)

const router = useRouter()

const isEndedBySchedule = computed(() => {
  const end = props.tournament.tournamentEndsAt
  if (!end) return false
  return dayjs(end).isBefore(dayjs())
})

const participantsCount = computed(() => props.tournament.teams?.length ?? 0)

const isFull = computed(() =>
  Boolean(props.tournament.tournamentSlots) && participantsCount.value >= props.tournament.tournamentSlots
)

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

const hasPrize = computed(() => Number(props.tournament.prizePool) > 0)

// Розряди через пробіл («12 000 грн») — велике число має читатись з відстані.
const prizeLabel = computed(() =>
  hasPrize.value ? `${Number(props.tournament.prizePool).toLocaleString('uk-UA')} грн` : 'Без призового'
)

// Внесок показуємо лише коли бекенд його віддав; 0 — «безкоштовно».
const entryFeeLabel = computed(() => {
  const fee = props.tournament.entryFee
  if (fee == null) return ''
  return Number(fee) > 0 ? formatEntryFeeUah(fee) : 'Без внеску'
})

const fmt = (date: string | Date, format: string = 'D MMM YYYY, HH:mm') =>
  dayjs(date).tz(TZ).format(format)

/** «26–27 вер» або «26 вер — 3 жов»; один день — просто дата. */
const eventDatesLabel = computed(() => {
  const { tournamentStartsAt, tournamentEndsAt } = props.tournament
  const start = dayjs(tournamentStartsAt).tz(TZ)
  const end = dayjs(tournamentEndsAt).tz(TZ)
  if (!start.isValid()) return '—'
  if (!end.isValid() || start.isSame(end, 'day')) return start.format('D MMM')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM')}`
  return `${start.format('D MMM')} — ${end.format('D MMM')}`
})

const dateInfo = computed(() => {
  const {
    tournamentStatus, registrationEndsAt, tournamentStartsAt, tournamentEndsAt,
    qualificationStartsAt, hasQualification
  } = props.tournament

  if (isEndedBySchedule.value) {
    return [
      {
        label: 'Проходив',
        date: dayjs(tournamentStartsAt).isSame(tournamentEndsAt, 'day')
          ? `${fmt(tournamentEndsAt, 'D MMM YYYY')}`
          : `${fmt(tournamentStartsAt, 'D')}—${fmt(tournamentEndsAt, 'D MMM YYYY')}`
      }
    ]
  }

  switch (tournamentStatus) {
    case 'REGISTRATION':
      // Без кваліфікації наступна віха — одразу сітка.
      if (hasQualification === false) {
        return [
          { label: 'Реєстрація до', date: fmt(registrationEndsAt) },
          { label: 'Плей-оф з', date: fmt(tournamentStartsAt) }
        ]
      }
      return [
        { label: 'Реєстрація до', date: fmt(registrationEndsAt) },
        // Дати кваліфікації опційні, доки `npm run api` не підхопить схему.
        { label: 'Кваліфікація з', date: fmt(qualificationStartsAt ?? tournamentStartsAt) }
      ]
    case 'QUALIFICATIONS':
      // Реєстрація могла лишатись відкритою — вікна свідомо перетинаються.
      return [
        { label: 'Реєстрація до', date: fmt(registrationEndsAt) },
        { label: 'Плей-оф з', date: fmt(tournamentStartsAt) }
      ]
    case 'PLAYOFF':
      return [{ label: 'Фінал', date: fmt(tournamentEndsAt) }]
    default:
      return [{ label: 'Початок', date: fmt(tournamentStartsAt) }]
  }
})

function toTournamentPage (id: string) {
  router.push({ name: routeNames.tournament, params: { id } })
}
</script>

<style scoped lang="scss">
// Event poster card. The banner is the hero and carries the live facts
// (status, slots, dates) as glass chips; below it one gold number (the prize)
// and a two-step milestone rail. Gold is the tournament register — cyan is
// reserved for the "next" milestone and interactive states.
.tournament-card {
  --card-gold: var(--ds-gold-rgb);
}

// ─── Banner ────────────────────────────────────────────────────────────────
.tournament-card__banner {
  --hud-corner-inset: 0px;
  --hud-corner-size: 26px;
  --hud-corner-radius: 12px;
  --hud-corner-weight: 2px;
  --hud-corner-color: rgba(var(--card-gold), 0.85);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--card-gold), 0.6));

  border: 1px solid rgba(var(--card-gold), 0.22);
  transition: border-color var(--ds-duration-base) ease;
}

.tournament-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(7, 8, 15, 0.55) 0%, transparent 32%),
    linear-gradient(0deg, rgba(7, 8, 15, 0.8) 0%, transparent 45%);
}

// Ended tournaments keep the poster but drain its colour.
.is-ended :deep(.tournament-card__image) {
  filter: grayscale(0.85) brightness(0.7);
}

// Glass chips on the banner: mono digits, dark glass, gold hairline.
.tournament-card__chip {
  @apply inline-flex h-24 items-center gap-5 rounded-md border px-8;
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

  &.is-full {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &--dates {
    letter-spacing: 0.02em;
    text-transform: lowercase;
  }

  &--soft {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);
  }
}

// Status tag sits on the poster: a stronger dark backing than the default tag.
.tournament-card__status {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);

  &--ended {
    @apply inline-flex h-24 items-center rounded px-8;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(7, 8, 15, 0.7);
  }
}

// ─── Title ──────────────────────────────────────────────────────────────────
// Poster heading: the name sits centred between two gold hairlines that fade
// outward, so a one-word name and a two-line name both look framed.
.tournament-card__name {
  @apply m-0 mt-12 grid min-h-[40px] items-center gap-10 text-center font-display text-[16px] uppercase
    leading-[1.2] tracking-wide text-white;
  grid-template-columns: minmax(12px, 1fr) auto minmax(12px, 1fr);
  transition: color var(--ds-duration-base) ease, text-shadow var(--ds-duration-base) ease;

  &::before,
  &::after {
    content: '';
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(var(--card-gold), 0.55));
  }

  &::after {
    background: linear-gradient(90deg, rgba(var(--card-gold), 0.55), transparent);
  }
}

.tournament-card__name-text {
  @apply block max-w-[240px] px-4;
}

// ─── Prize ──────────────────────────────────────────────────────────────────
.tournament-card__prize {
  @apply mt-10 flex items-center gap-10 rounded-xl border px-10 py-8;
  border-color: rgba(var(--card-gold), 0.28);
  background:
    linear-gradient(90deg, rgba(var(--card-gold), 0.12), transparent 70%),
    rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--card-gold), 0.16);

  &.is-empty {
    border-color: rgba(var(--ds-primary-rgb), 0.14);
    background: rgba(0, 0, 0, 0.3);
    box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.1);
  }
}

.tournament-card__prize-icon {
  @apply inline-flex size-34 shrink-0 items-center justify-center rounded-lg;
  color: var(--ds-gold);
  background: rgba(var(--card-gold), 0.12);
  border: 1px solid rgba(var(--card-gold), 0.35);
  filter: drop-shadow(0 0 6px rgba(var(--card-gold), 0.45));

  .is-empty & {
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    filter: none;
  }
}

.tournament-card__prize-value {
  font-family: var(--ds-font-mono);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-gold);
  text-shadow: var(--ds-neon-text-gold);

  .is-empty & {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.55);
    text-shadow: none;
  }
}

.tournament-card__fee {
  @apply inline-flex h-22 shrink-0 items-center gap-4 rounded px-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(7, 8, 15, 0.5);
}

// ─── Milestone rail ─────────────────────────────────────────────────────────
.tournament-card__timeline {
  @apply m-0 mt-10 flex list-none flex-col gap-0 rounded-xl border p-0;
  border-color: rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.1);
}

.tournament-card__step {
  @apply grid min-h-28 items-center gap-8 px-10;
  grid-template-columns: 8px auto minmax(0, 1fr);

  & + & {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.08);
  }
}

.tournament-card__dot {
  @apply block size-6 rounded-full;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;

  &.is-next {
    border-color: var(--ds-primary);
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.8);
  }
}

.tournament-card__step-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-faint);

  .is-next ~ & {
    color: rgba(255, 255, 255, 0.75);
  }
}

.tournament-card__step-date {
  @apply truncate text-right;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.6);

  .is-next ~ & {
    color: #fff;
  }
}

// ─── CTA ────────────────────────────────────────────────────────────────────
// Gold register to match the card: tinted gold fill, gold hairline and text
// with a faint neon halo; lights up on hover. Driven through EP's button
// variables so hover / active / focus keep working. Label left, arrow right
// (EP wraps children in one inner span).
.tournament-card__cta {
  --el-button-text-color: var(--ds-gold);
  --el-button-bg-color: rgba(var(--card-gold), 0.12);
  --el-button-border-color: rgba(var(--card-gold), 0.45);
  --el-button-hover-text-color: #fbe8a6;
  --el-button-hover-bg-color: rgba(var(--card-gold), 0.22);
  --el-button-hover-border-color: rgba(var(--card-gold), 0.8);
  --el-button-active-text-color: #fbe8a6;
  --el-button-active-bg-color: rgba(var(--card-gold), 0.28);
  --el-button-active-border-color: rgba(var(--card-gold), 0.85);
  --el-button-outline-color: rgba(var(--card-gold), 0.6);

  @apply font-display text-[12px] uppercase tracking-[0.08em];
  text-shadow: 0 0 8px rgba(var(--card-gold), 0.35);
  box-shadow: inset 0 1px 0 rgba(var(--card-gold), 0.2), 0 0 12px rgba(var(--card-gold), 0.12);
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  :deep(> span) {
    @apply flex w-full items-center justify-between;
  }
}

// Feedback only: the arrow leans 4px toward the action while the card is
// hovered or the button has keyboard focus. Press scale comes from the global
// button system.
.tournament-card__cta-arrow {
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.tournament-card__cta:focus-visible .tournament-card__cta-arrow {
  transform: translateX(4px);
}

@media (prefers-reduced-motion: reduce) {
  .tournament-card__cta-arrow,
  .tournament-card__cta:focus-visible .tournament-card__cta-arrow {
    transform: none;
  }

  .tournament-card__cta:hover {
    text-shadow: none;
  }
}

@media (hover: hover) and (pointer: fine) {
  .tournament-card:hover {
    .tournament-card__banner {
      border-color: rgba(var(--card-gold), 0.5);
    }

    .tournament-card__name {
      color: var(--ds-gold);
      text-shadow: var(--ds-neon-text-gold);
    }

    .tournament-card__cta .tournament-card__cta-arrow {
      transform: translateX(4px);
    }
  }

  .tournament-card__cta:hover {
    box-shadow: inset 0 1px 0 rgba(var(--card-gold), 0.3), var(--ds-glow-gold);
    text-shadow: var(--ds-neon-text-gold);
  }
}
</style>
