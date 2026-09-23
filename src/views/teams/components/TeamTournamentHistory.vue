<template>
  <section class="history neon-card rounded-2xl">
    <!-- Header: HUD label + count -->
    <div class="history__head">
      <span class="sys-label !text-[10px]">// Історія турнірів</span>
      <span class="hud-line h-px flex-1 min-w-20" aria-hidden="true" />
      <span class="history__count">{{ pad(tournaments.length) }}</span>
    </div>

    <!-- Empty -->
    <div v-if="!sorted.length" class="history__empty">
      <span class="history__empty-well">
        <PhTrophy :size="20" weight="duotone" />
      </span>
      <span class="text-sm text-gray-400">Команда ще не брала участі в турнірах</span>
      <RouterLink :to="{ name: routeNames.tournaments }" class="history__empty-link">
        Переглянути турніри <PhArrowRight :size="12" weight="bold" />
      </RouterLink>
    </div>

    <!-- Rows -->
    <ol v-else class="history__list custom-scrollbar">
      <li v-for="(tournament, idx) in sorted" :key="tournament.id">
        <RouterLink
          :to="{ name: routeNames.tournament, params: { id: tournament.id } }"
          class="history-row"
          :class="`is-${phaseOf(tournament)}`"
        >
          <span class="history-row__index">{{ pad(idx + 1) }}</span>

          <span class="history-row__thumb">
            <TournamentBannerImage :url="tournament.listBannerUrl" variant="thumb" extra-class="history-row__img" />
          </span>

          <span class="flex min-w-0 flex-col gap-4">
            <span class="history-row__name truncate">{{ tournament.name }}</span>
            <span class="history-row__dates">
              <PhCalendarBlank :size="12" />
              {{ datesLabel(tournament) }}
            </span>
          </span>

          <span class="history-row__tag">
            <TournamentStatusTag v-if="phaseOf(tournament) !== 'past'" :status="tournament.tournamentStatus" />
            <span v-else class="history-row__done">Завершено</span>
          </span>

          <PhArrowRight :size="14" weight="bold" class="history-row__arrow" />
        </RouterLink>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { PhArrowRight, PhCalendarBlank, PhTrophy } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { routeNames } from '@/router/route-names'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { getTournamentPhase, sortTournamentsForList } from '@/views/tournaments/tournaments.utils'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

type TTeamTournament = NonNullable<TTeam['tournaments']>[number]

const props = defineProps<{
  tournaments: NonNullable<TTeam['tournaments']>
}>()

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

// Live first, then upcoming, then past — same order as the tournaments page.
const sorted = computed(() => sortTournamentsForList(props.tournaments))

const phaseOf = (t: TTeamTournament) => getTournamentPhase(t)

/** «26–27 вер 2025» або «26 вер — 3 жов 2025»; один день — просто дата. */
function datesLabel (t: TTeamTournament): string {
  const start = dayjs(t.tournamentStartsAt).tz(TZ)
  const end = dayjs(t.tournamentEndsAt).tz(TZ)
  if (!start.isValid()) return '—'
  if (!end.isValid() || start.isSame(end, 'day')) return start.format('D MMM YYYY')
  if (start.isSame(end, 'month')) return `${start.format('D')}–${end.format('D MMM YYYY')}`
  return `${start.format('D MMM')} — ${end.format('D MMM YYYY')}`
}
</script>

<style lang="scss" scoped>
.history {
  @apply flex w-full min-w-0 flex-col gap-14 p-20;
  max-height: 450px;
}

.history__head {
  @apply flex shrink-0 items-center gap-12;
}

.history__count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

// ─── Empty ──────────────────────────────────────────────────────────────────
.history__empty {
  @apply flex flex-col items-center gap-10 rounded-xl border px-16 py-24 text-center;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);
}

.history__empty-well {
  @apply inline-flex size-40 items-center justify-center rounded-xl;
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--ds-border);
}

.history__empty-link {
  @apply mt-4 inline-flex items-center gap-6 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-primary);
}

// ─── List ───────────────────────────────────────────────────────────────────
.history__list {
  @apply m-0 flex min-h-0 flex-1 list-none flex-col gap-8 overflow-y-auto overflow-x-hidden p-0 pr-4;
}

.history-row {
  @apply relative grid items-center gap-12 overflow-hidden rounded-xl border py-10 pl-14 pr-12 no-underline;
  grid-template-columns: 22px 64px minmax(0, 1fr) auto 14px;
  color: inherit;
  border-color: var(--ds-border);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.025), transparent 60%), rgba(7, 8, 15, 0.45);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);

  // Left rail lights on hover; live tournaments keep it lit in pink.
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &.is-live::before {
    opacity: 1;
    background: var(--ds-pink);
    box-shadow: 0 0 8px rgba(var(--ds-pink-rgb), 0.9);
  }

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }
}

.history-row__index {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;
}

.history-row__thumb {
  @apply block h-40 w-64 shrink-0 overflow-hidden rounded-lg;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 0 0 1px rgba(var(--ds-primary-rgb), 0.25);
}

// The banner component's thumb variant is a fixed 60px square; stretch every
// layer to the landscape well instead and let the image cover it.
:deep(.history-row__img) {
  width: 100% !important;
  height: 100% !important;
  border-radius: inherit;
}

:deep(.history-row__img .el-image),
:deep(.history-row__img .el-image__wrapper),
:deep(.history-row__img .el-image__inner) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

:deep(.history-row__img .el-image__inner) {
  object-fit: cover;
  object-position: center;
  transition: transform 600ms var(--ds-ease-out);
}

.history-row__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.9);
  transition: color var(--ds-duration-base) ease;
}

.history-row__dates {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.history-row__tag {
  @apply hidden shrink-0 sm:inline-flex;
}

.history-row__done {
  @apply inline-flex items-center rounded-md border px-8 py-3;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  border-color: var(--ds-border);
}

.history-row__arrow {
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .history-row:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.45);
    box-shadow: var(--ds-elevation-3), 0 0 18px rgba(var(--ds-primary-rgb), 0.12);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }

    .history-row__index,
    .history-row__arrow {
      color: var(--ds-primary);
    }

    .history-row__name {
      color: #fff;
    }

    .history-row__arrow {
      transform: translateX(3px);
    }

    :deep(.history-row__img .el-image__inner) {
      transform: scale(1.06);
    }
  }

  .history__empty-link:hover {
    color: #fff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-row,
  .history-row__arrow,
  :deep(.history-row__img .el-image__inner) {
    transition: none;
  }

  .history-row:hover,
  .history-row:hover .history-row__arrow,
  .history-row:hover :deep(.history-row__img .el-image__inner) {
    transform: none;
  }
}
</style>
