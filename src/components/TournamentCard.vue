<template>
  <div
    class="relative group flex w-full flex-col rounded-2xl border border-gray-700/90
           bg-gradient-to-b from-gray-900 to-gray-950
           overflow-hidden cursor-pointer shadow-lg shadow-black/45
           transition-[border-color,box-shadow] duration-300 ease-out
           hover:border-[#43bfee]/50 hover:shadow-[0_16px_48px_-12px_rgba(67,191,238,0.30)]"
    :style="{ maxWidth: `${width}px`, height: `${TOURNAMENT_CARD_HEIGHT}px` }"
    @click="toTournamentPage(tournament.id)"
  >
    <div
      v-if="isEndedBySchedule"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/72 backdrop-blur-[3px]
             transition-opacity duration-300"
    >
      <span
        class="rounded-lg border border-slate-500/45 bg-slate-900/50 px-16 py-8 text-xs font-semibold uppercase
               tracking-wide text-white shadow-lg"
      >
        Завершено
      </span>
    </div>

    <div class="flex min-h-0 flex-1 flex-col px-14 pt-14 pb-10">
      <div class="relative w-full overflow-hidden rounded-xl ring-1 ring-white/10">
        <TournamentBannerImage
          :url="tournament.listBannerUrl"
          variant="card"
          :lazy="true"
          scale-on-hover
        />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50
                 to-transparent"
        />
        <div class="absolute right-10 top-10 z-10 flex justify-end gap-6">
          <TournamentStatusTag
            v-if="tournament.tournamentStatus && !isEndedBySchedule"
            :status="tournament.tournamentStatus"
            class="shadow-md backdrop-blur-sm text-xs text-white/90"
          />
        </div>
      </div>

      <h2
        class="mt-14 line-clamp-2 px-6 text-center text-[15px] font-semibold uppercase leading-snug tracking-wide
               text-white/95 lg:text-[16px]"
      >
        {{ tournament.name }}
      </h2>

      <div
        class="mx-6 mt-12 flex min-w-0 shrink-0 flex-nowrap items-center gap-10"
        :class="tournament.division ? '' : 'justify-center'"
      >
        <div
          v-if="tournament.division"
          class="flex shrink-0 items-center"
        >
          <DivisionTag
            :division="tournament.division"
            variant="tournamentCard"
          />
        </div>

        <div
          class="min-w-0"
          :class="tournament.division ? 'flex-1' : 'w-full'"
        >
          <div
            class="flex min-w-0 items-center justify-center gap-10 rounded-xl border border-green-500/25
                   bg-green-950/20 px-12 py-10 text-[13px] text-green-100/95 backdrop-blur-sm"
          >
            <PhTrophy :size="18" weight="duotone" class="shrink-0 text-green-400/90" />
            <span class="text-[11px] font-semibold uppercase tracking-widest text-green-200/65">Приз</span>
            <span class="truncate font-semibold tabular-nums text-green-100">
              {{ formatTournamentPrizeUah(tournament.prizePool) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="relative mx-12 mb-12 mt-auto max-h-[88px] min-h-[88px] shrink-0 rounded-xl border border-white/10
             bg-black/45 px-12 py-10 backdrop-blur-md"
    >
      <div
        class="flex h-full w-full flex-col justify-center gap-6 text-[13px] text-white"
        :class="participantsCount > 0 ? 'pr-[2.375rem]' : ''"
      >
        <div
          v-for="(item, index) in dateInfo"
          :key="index"
          class="flex items-center justify-between gap-16 border-b border-white/[0.06] pb-6 last:border-0 last:pb-0"
        >
          <span class="shrink-0 text-[11px] font-medium uppercase tracking-wide text-white/45">
            {{ item.label }}
          </span>
          <span class="min-w-0 truncate text-right text-[12px] font-semibold tabular-nums text-white/90">
            {{ item.date }}
          </span>
        </div>
      </div>

      <span
        v-if="participantsCount > 0"
        class="pointer-events-none absolute right-11 top-8 z-10 inline-flex h-[22px] min-w-[22px] shrink-0
               items-center justify-center rounded-full border border-black/35 bg-[var(--el-color-primary)] px-6
               text-[11px] font-semibold tabular-nums leading-none text-white
               shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] select-none ring-2 ring-black/45"
        :title="`Команд учасників: ${participantsCount}`"
      >
        {{ participantsBadgeText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTournamentPrizeUah } from '@/core/utils/formatters'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { TOURNAMENT_CARD_HEIGHT, TOURNAMENT_CARD_WIDTH } from '@/views/tournaments/tournaments.enums'
import { routeNames } from '@/router/route-names'
import { PhTrophy } from '@phosphor-icons/vue'
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

const participantsBadgeText = computed(() => {
  const n = participantsCount.value
  if (n > 99) return '99+'
  return String(n)
})

const fmt = (date: string | Date, format: string = 'D MMM YYYY, HH:mm') =>
  dayjs(date).tz(TZ).format(format)

const dateInfo = computed(() => {
  const {
    tournamentStatus, registrationEndsAt, tournamentStartsAt, tournamentEndsAt
  } = props.tournament

  if (isEndedBySchedule.value) {
    return [
      {
        label: 'Турнір проходив:',
        date: dayjs(tournamentStartsAt).isSame(tournamentEndsAt, 'day')
          ? `${fmt(tournamentEndsAt, 'D MMM YYYY')}`
          : `${fmt(tournamentStartsAt, 'D')}—${fmt(tournamentEndsAt, 'D MMM YYYY')}`
      }
    ]
  }

  switch (tournamentStatus) {
    case 'QUALIFICATIONS':
      return [
        { label: 'Кваліфікація до:', date: fmt(registrationEndsAt) },
        { label: 'Плей-оф з:', date: fmt(tournamentStartsAt) }
      ]
    case 'PLAYOFF':
      return [{ label: 'Фінал:', date: fmt(tournamentEndsAt) }]
    default:
      return [{ label: 'Початок:', date: fmt(tournamentStartsAt) }]
  }
})

function toTournamentPage (id: string) {
  router.push({ name: routeNames.tournament, params: { id } })
}
</script>
