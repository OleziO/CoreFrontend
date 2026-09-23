<template>
  <article class="spotlight neon-card rounded-2xl">
    <!-- Media: banner under a scrim, gold HUD frame, status + meta pinned to corners -->
    <div class="spotlight__media hud-corners hud-corners--fade">
      <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[3]" aria-hidden="true" />
      <TournamentBannerImage
        :url="tournament.listBannerUrl"
        variant="hero"
        extra-class="spotlight__image"
      />
      <div class="spotlight__scrim" aria-hidden="true" />
      <div class="scanlines" aria-hidden="true" />

      <div class="absolute left-16 top-16 z-[4]">
        <TournamentStatusTag :status="tournament.tournamentStatus" />
      </div>
      <span class="sys-label sys-label--muted absolute bottom-16 left-16 z-[4] !text-[9px]">
        Dota 2 · 5×5 · {{ eventDatesLabel }}
      </span>
    </div>

    <!-- Body -->
    <div class="spotlight__body">
      <span class="spotlight__kicker">
        <span class="sys-label !text-[10px]">// Найближчий турнір</span>
        <span class="spotlight__phase" :class="`is-${phase}`">
          <span class="spotlight__phase-dot" aria-hidden="true" />
          {{ phaseLabel }}
        </span>
      </span>

      <h3 class="spotlight__name">{{ tournament.name }}</h3>

      <!-- Countdown to the next milestone; hidden once the milestone has passed -->
      <div v-if="countdown" class="spotlight__timer" role="timer" :aria-label="`${countdown.label}: ${countdown.text}`">
        <span class="spotlight__timer-label">{{ countdown.label }}</span>
        <div class="spotlight__digits" aria-hidden="true">
          <template v-for="(part, index) in countdown.parts" :key="part.unit">
            <span v-if="index" class="spotlight__colon">:</span>
            <span class="spotlight__digit">
              <b>{{ part.value }}</b>
              <small>{{ part.unit }}</small>
            </span>
          </template>
        </div>
      </div>

      <dl class="spotlight__stats">
        <div class="spotlight__stat is-gold">
          <dt><PhTrophy :size="12" weight="fill" /> Призовий фонд</dt>
          <dd>{{ prizeLabel }}</dd>
        </div>
        <div class="spotlight__stat">
          <dt><PhUsersThree :size="12" weight="fill" /> Команди</dt>
          <dd>
            {{ pad(participantsCount) }}<span class="spotlight__of">/{{ pad(tournament.tournamentSlots) }}</span>
          </dd>
          <span class="spotlight__bar" aria-hidden="true">
            <span
              class="spotlight__bar-fill"
              :class="{ 'is-full': isFull }"
              :style="{ transform: `scaleX(${fill})` }"
            />
          </span>
        </div>
        <div class="spotlight__stat">
          <dt><PhTicket :size="12" weight="fill" /> Внесок</dt>
          <dd>{{ entryFeeLabel }}</dd>
        </div>
      </dl>

      <div class="spotlight__actions">
        <RouterLink :to="{ name: routeNames.tournament, params: { id: tournament.id } }" class="spotlight__cta">
          <PhTrophy :size="18" weight="fill" />
          <span>Відкрити турнір</span>
          <PhArrowRight :size="16" weight="bold" class="spotlight__cta-arrow" />
        </RouterLink>
        <RouterLink :to="{ name: routeNames.tournaments }" class="spotlight__ghost">
          Усі турніри
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatEntryFeeUah } from '@/core/utils/formatters'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { routeNames } from '@/router/route-names'
import { getTournamentPhase, type TTournamentPhase } from '@/views/tournaments/tournaments.utils'
import { PhArrowRight, PhTicket, PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

const props = defineProps<{
  tournament: TTournament
}>()

// Ticks once a second; drives the countdown and the phase label.
const now = useNow({ interval: 1000 })

const pad = (n: number) => String(Math.min(Math.max(n, 0), 99)).padStart(2, '0')

const participantsCount = computed(() => props.tournament.teams?.length ?? 0)
const isFull = computed(() =>
  Boolean(props.tournament.tournamentSlots) && participantsCount.value >= props.tournament.tournamentSlots
)
const fill = computed(() => {
  const slots = props.tournament.tournamentSlots
  return slots ? Math.min(participantsCount.value / slots, 1) : 0
})

const prizeLabel = computed(() =>
  Number(props.tournament.prizePool) > 0
    ? `${Number(props.tournament.prizePool).toLocaleString('uk-UA')} грн`
    : 'Без призового'
)

const entryFeeLabel = computed(() => {
  const fee = props.tournament.entryFee
  if (fee == null) return '—'
  return Number(fee) > 0 ? formatEntryFeeUah(fee) : 'Без внеску'
})

/** «26–27 вер» або «26 вер — 3 жов»; один день — просто дата. */
const eventDatesLabel = computed(() => {
  const start = dayjs(props.tournament.tournamentStartsAt).tz(TZ)
  const end = dayjs(props.tournament.tournamentEndsAt).tz(TZ)
  if (!start.isValid()) return '—'
  if (!end.isValid() || start.isSame(end, 'day')) return start.format('D MMM')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM')}`
  return `${start.format('D MMM')} — ${end.format('D MMM')}`
})

const phase = computed<TTournamentPhase>(() => getTournamentPhase(props.tournament, dayjs(now.value)))

const PHASE_LABELS: Record<TTournamentPhase, string> = {
  live: 'Триває зараз',
  upcoming: 'Скоро старт',
  past: 'Завершено'
}
const phaseLabel = computed(() => PHASE_LABELS[phase.value])

// Next milestone by status: registration close → playoff start → final.
const milestone = computed<{ label: string; at: string | undefined } | null>(() => {
  const t = props.tournament
  switch (t.tournamentStatus) {
    case 'REGISTRATION':
      return { label: 'Реєстрація закривається через', at: t.registrationEndsAt }
    case 'QUALIFICATIONS':
      return { label: 'Плей-оф стартує через', at: t.tournamentStartsAt }
    case 'PLAYOFF':
      return { label: 'Фінал через', at: t.tournamentEndsAt }
    case 'COMPLETED':
      return null
    default:
      return { label: 'Старт через', at: t.tournamentStartsAt }
  }
})

interface ICountdownPart {
  value: string
  unit: string
}

const countdown = computed(() => {
  if (!milestone.value?.at) return null
  const target = dayjs(milestone.value.at)
  if (!target.isValid()) return null
  const total = Math.floor(target.diff(now.value) / 1000)
  if (total <= 0) return null

  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const seconds = total % 60

  const parts: ICountdownPart[] = [
    { value: pad(days), unit: 'дн' },
    { value: pad(hours), unit: 'год' },
    { value: pad(minutes), unit: 'хв' },
    { value: pad(seconds), unit: 'сек' }
  ]

  return {
    label: milestone.value.label,
    parts,
    text: `${days} дн ${hours} год ${minutes} хв`
  }
})
</script>

<style lang="scss" scoped>
.spotlight {
  --hud-corner-inset: 10px;
  --hud-corner-size: 22px;
  --hud-corner-weight: 2px;
  --hud-corner-color: rgba(var(--ds-gold-rgb), 0.75);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-gold-rgb), 0.5));

  display: grid;
  overflow: hidden;

  @screen lg {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  }
}

// ─── Media ──────────────────────────────────────────────────────────────────
.spotlight__media {
  position: relative;
  min-height: 240px;
  overflow: hidden;
  background: var(--ds-background);

  @screen lg {
    min-height: 100%;
  }
}

:deep(.spotlight__image) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 900ms var(--ds-ease-out);
}

.spotlight__scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(7, 8, 15, 0.55) 0%, transparent 35%, transparent 60%, rgba(7, 8, 15, 0.85) 100%),
    linear-gradient(90deg, transparent 70%, rgba(7, 8, 15, 0.35) 100%);
}

// ─── Body ───────────────────────────────────────────────────────────────────
.spotlight__body {
  @apply flex flex-col gap-20 p-24 md:p-28;
  position: relative;
  border-top: 1px solid var(--ds-border);

  @screen lg {
    border-top: 0;
    border-left: 1px solid var(--ds-border);
  }
}

.spotlight__kicker {
  @apply flex flex-wrap items-center justify-between gap-12;
}

.spotlight__phase {
  @apply inline-flex items-center gap-8 rounded-md px-10 py-5;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-primary);
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.08);

  &.is-live {
    color: var(--ds-pink);
    border-color: rgba(var(--ds-pink-rgb), 0.4);
    background: rgba(var(--ds-pink-rgb), 0.08);
  }

  &.is-past {
    color: var(--ds-text-faint);
    border-color: var(--ds-border);
    background: transparent;
  }
}

.spotlight__phase-dot {
  @apply block size-6 rounded-full;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
  animation: phase-pulse 2.2s ease-in-out infinite;
}

@keyframes phase-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.spotlight__name {
  @apply font-display text-2xl uppercase tracking-wide text-white md:text-3xl;
  line-height: 1.05;
  text-shadow: var(--ds-neon-text-subtle);
}

// ─── Countdown ──────────────────────────────────────────────────────────────
.spotlight__timer {
  @apply flex flex-col gap-8 rounded-xl border p-16;
  border-color: rgba(var(--ds-primary-rgb), 0.22);
  background:
    linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.08), transparent 60%),
    rgba(7, 8, 15, 0.5);
}

.spotlight__timer-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.spotlight__digits {
  @apply flex items-end gap-6;
}

.spotlight__digit {
  @apply flex flex-col items-center;
  min-width: 48px;

  b {
    font-family: var(--ds-font-mono);
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #fff;
    font-variant-numeric: tabular-nums;
    text-shadow: var(--ds-neon-text-subtle);
  }

  small {
    margin-top: 4px;
    font-family: var(--ds-font-mono);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }
}

.spotlight__colon {
  padding-bottom: 18px;
  font-family: var(--ds-font-mono);
  font-size: 22px;
  line-height: 1;
  color: rgba(var(--ds-primary-rgb), 0.6);
  animation: colon-blink 1s steps(1) infinite;
}

@keyframes colon-blink {
  50% { opacity: 0.25; }
}

// ─── Stats ──────────────────────────────────────────────────────────────────
.spotlight__stats {
  @apply grid grid-cols-3 gap-10;
}

.spotlight__stat {
  @apply relative flex flex-col gap-6 rounded-lg border p-12;
  min-width: 0;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);

  dt {
    @apply inline-flex items-center gap-6;
    font-family: var(--ds-font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
    white-space: nowrap;
  }

  dd {
    font-family: var(--ds-font-mono);
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.is-gold {
    border-color: rgba(var(--ds-gold-rgb), 0.35);
    background:
      linear-gradient(135deg, rgba(var(--ds-gold-rgb), 0.14), transparent 70%),
      rgba(7, 8, 15, 0.45);

    dt { color: rgba(var(--ds-gold-rgb), 0.85); }
    dd { color: var(--ds-gold); text-shadow: var(--ds-neon-text-gold); }
  }
}

.spotlight__of {
  color: var(--ds-text-faint);
  font-weight: 600;
}

.spotlight__bar {
  position: absolute;
  inset: auto 12px 8px 12px;
  height: 2px;
  border-radius: 1px;
  background: rgba(var(--ds-primary-rgb), 0.15);
  overflow: hidden;
}

.spotlight__bar-fill {
  display: block;
  height: 100%;
  transform-origin: left center;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.8);
  transition: transform 900ms var(--ds-ease-out);

  &.is-full {
    background: var(--ds-pink);
    box-shadow: 0 0 8px rgba(var(--ds-pink-rgb), 0.8);
  }
}

// ─── Actions ────────────────────────────────────────────────────────────────
.spotlight__actions {
  @apply mt-auto flex flex-wrap items-center gap-12 pt-4;
}

.spotlight__cta {
  @apply inline-flex items-center gap-10 rounded-xl px-22 py-13 font-display text-[13px] uppercase no-underline;
  letter-spacing: 0.08em;
  color: var(--ds-background);
  background: linear-gradient(180deg, #7df0ff 0%, var(--ds-primary) 55%, #14cfe9 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 0 0 1px rgba(var(--ds-primary-rgb), 0.6),
    var(--ds-glow-primary-soft);
  transition:
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.8);
    outline-offset: 3px;
  }
}

.spotlight__cta-arrow {
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.spotlight__ghost {
  @apply inline-flex items-center rounded-xl border px-18 py-12 text-sm font-semibold no-underline;
  color: rgba(255, 255, 255, 0.72);
  border-color: rgba(var(--ds-primary-rgb), 0.25);
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 3px;
  }
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .spotlight:hover :deep(.spotlight__image) {
    transform: scale(1.04);
  }

  .spotlight__cta:hover {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      0 0 0 1px rgba(var(--ds-primary-rgb), 0.9),
      var(--ds-glow-primary);

    .spotlight__cta-arrow {
      transform: translateX(4px);
    }
  }

  .spotlight__ghost:hover {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spotlight__phase-dot,
  .spotlight__colon {
    animation: none;
  }

  :deep(.spotlight__image),
  .spotlight__bar-fill,
  .spotlight__cta-arrow {
    transition: none;
  }

  .spotlight:hover :deep(.spotlight__image),
  .spotlight__cta:hover .spotlight__cta-arrow {
    transform: none;
  }
}
</style>
