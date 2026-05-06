<template>
  <div
    class="relative group flex flex-col justify-between rounded-2xl
           bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
           border border-gray-700 h-[400px] w-[360px]
           hover:border-cyan-400/50
           shadow-[0_0_25px_rgba(0,0,0,0.5)]
           transition-all duration-400 ease-out
           overflow-hidden cursor-pointer"
    @click="toTournamentPage(tournament.id)"
  >
    <!-- === OVERLAY після кінця турніру за датою (API статусів лише QUALIFICATIONS | PLAYOFF) === -->
    <div
      v-if="isEndedBySchedule"
      class="absolute inset-0 bg-black/70
             backdrop-blur-[4px] z-20 flex items-center justify-center transition-opacity duration-300"
    >
      <span
        class="shadow-lg mx-50 rounded-lg text-xs px-20 py-10 text-white font-semibold uppercase
               tracking-wide border border-slate-500/40 bg-slate-500/15"
      >
        Завершено
      </span>
    </div>

    <!-- === ЗОБРАЖЕННЯ === -->
    <div class="p-10 flex flex-col items-center w-full">
      <div class="overflow-hidden w-full relative rounded-lg shadow-lg transition-all duration-500">
        <el-image
          :src="tournament.listBannerUrl"
          fit="cover"
          class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- === Статус API (до завершення за датою) === -->
        <div class="absolute right-0 top-5 flex justify-between gap-1 z-10">
          <TournamentStatusTag
            v-if="tournament.tournamentStatus && !isEndedBySchedule"
            :status="tournament.tournamentStatus"
            class="shadow-md backdrop-blur-sm
             text-xs text-white/90 hover:text-cyan-300 transition-colors duration-300"
          />
        </div>
      </div>

      <!-- === Нагорода === -->
      <div class="text-center w-full flex flex-col mt-5">
        <div class="flex justify-between items-start w-full my-10 gap-10">
          <el-tag
            class="shadow-lg backdrop-blur-md text-xs !px-10 !py-15 !animate-none
            !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
            rounded-lg font-semibold uppercase tracking-wide flex-1"
          >
            <span class="ml-1">{{ tournament.name }}</span>
          </el-tag>

          <el-tag
            class="shadow-lg backdrop-blur-md text-xs !px-10 !py-15 !animate-none
                   !border !border-yellow-500/50 !bg-yellow-500/15 !text-yellow-400
                   rounded-lg flex items-center transition-transform duration-300 flex-1"
          >
            <div class="flex items-center">
              <span class="mr-5">Приз:</span>
              <PhTrophy />
              <span class="ml-2">{{ tournament.prizePool }}</span>
            </div>
          </el-tag>
        </div>
      </div>
    </div>

    <!-- === СЕКЦІЯ ЧАСУ === -->
    <div
      class="relative w-full p-20 !max-h-[90px] !h-[90px]
             bg-white/10 backdrop-blur-xl
             border border-white/20
             rounded-xl flex items-center
             shadow-[0_0_20px_rgba(0,255,255,0.15)]
             transition-all duration-300
             before:absolute
             before:inset-0 before:bg-gradient-to-br
             before:from-cyan-500/10 before:to-transparent before:pointer-events-none
             text-sm"
    >
      <div class="relative z-10 flex w-full flex-col gap-3 text-white">
        <div
          v-for="(item, index) in dateInfo"
          :key="index"
          class="flex justify-between items-center py-1.5
                 border-b border-white/5 last:border-none
                 transition-all duration-300 hover:bg-white/5 rounded-lg px-2"
        >
          <span class="text-white/40 text-xs sm:text-sm tracking-wide">{{ item.label }}</span>
          <span class="font-semibold text-white/90 sm:text-sm text-xs drop-shadow-[0_0_6px_rgba(0,255,255,0.5)]">
            {{ item.date }}
          </span>
        </div>
      </div>

      <div
        class="absolute top-0 left-0 w-full h-[2px]
               bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-50"
      />
      <el-badge
        :value="participantsCount"
        :hidden="participantsCount === 0"
        class="absolute -top-5 -right-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhTrophy } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { routeNames } from '@/router/route-names'
import { useRouter } from 'vue-router'
import type { TTournament as Tournament } from '@/api/types/api.types'

const router = useRouter()
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

const props = withDefaults(
  defineProps<{
    tournament: Tournament
    width?: number
  }>(),
  { width: 250 }
)

const isEndedBySchedule = computed(() => {
  const end = props.tournament.tournamentEndsAt
  if (!end) return false
  return dayjs(end).isBefore(dayjs())
})

const participantsCount = computed(() => {
  return props.tournament.teams?.length ?? 0
})

const fmt = (date: string | Date, format: string = 'D MMM YYYY, HH:mm') =>
  dayjs(date).tz(TZ).format(format)

const dateInfo = computed(() => {
  const {
    tournamentStatus, registrationStartsAt, registrationEndsAt, tournamentStartsAt, tournamentEndsAt
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
        { label: 'Реєстрація до:', date: fmt(registrationEndsAt) },
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
