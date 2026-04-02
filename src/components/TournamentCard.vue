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
    <!-- === OVERLAY ДЛЯ ЗАВЕРШЕНОГО ТУРНІРУ === -->
    <div
      v-if="tournament.status === ETournamentStatus.ENDED"
      class="absolute inset-0 bg-black/70
             backdrop-blur-[4px] z-20 flex items-center justify-center transition-opacity duration-300"
    >
      <TournamentStatusTag
        :status="tournament.status"
        class="shadow-lg mx-50 !rounded-lg text-xs !px-20 !py-10 text-white animate-none"
      />
    </div>

    <!-- === ЗОБРАЖЕННЯ === -->
    <div class="p-10 flex flex-col items-center w-full">
      <div class="overflow-hidden w-full relative rounded-lg shadow-lg transition-all duration-500">
        <el-image
          :src="getImageUrl(tournament.img_url)"
          fit="cover"
          class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- === СТАТУС (якщо не ENDED) === -->
        <div class="absolute right-0 top-5 flex justify-between gap-1 z-10">
          <TournamentStatusTag
            v-if="tournament.status && tournament.status !== ETournamentStatus.ENDED"
            :status="(tournament.status as ETournamentStatus)"
            class="shadow-md backdrop-blur-sm
             text-xs text-white/90 hover:text-cyan-300 transition-colors duration-300"
          />
        </div>
      </div>

      <!-- === Дивізіон і нагорода === -->
      <div class="text-center w-full flex flex-col mt-5">
        <div v-if="tournament.division" class="flex items-center justify-center gap-2 w-full">
          <DivisionTag :divisionName="tournament.division?.name" />
        </div>

        <div class="flex justify-between items-start w-full my-10 gap-10">
          <el-tag
            class="shadow-lg backdrop-blur-md text-xs !px-10 !py-15 !animate-none
            !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
            rounded-lg font-semibold uppercase tracking-wide flex-1"
          >
            <span class="ml-1">{{ tournament.title }}</span>
          </el-tag>

          <el-tag
            class="shadow-lg backdrop-blur-md text-xs !px-10 !py-15 !animate-none
                   !border !border-yellow-500/50 !bg-yellow-500/15 !text-yellow-400
                   rounded-lg flex items-center transition-transform duration-300 flex-1"
          >
            <div class="flex items-center">
              <span class="mr-5">Приз:</span>
              <PhTrophy />
              <span class="ml-2">{{ tournament.prizes }}</span>
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
import { getImageUrl } from '@/core/helpers'
import { ETournamentStatus } from './tournaments-tags/tournament.constants'
import { PhTrophy } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { routeNames } from '@/router/route-names'
import { useRouter } from 'vue-router'

const router = useRouter()
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uk')

const TZ = 'Europe/Kyiv'

const props = withDefaults(
  defineProps<{
    tournament: TTournament | TMixTournament
    width?: number
  }>(),
  { width: 250 }
)
const participantsCount = computed(() => {
  if (props.tournament.type === 'mix') {
    return (props.tournament as TMixTournament)?.mix_pools?.length ?? 0
  }
  return (props.tournament as TTournament)?.participants?.length ?? 0
})

const fmt = (date: string | Date, format: string = 'D MMM YYYY, HH:mm') =>
  dayjs(date).tz(TZ).format(format)

const dateInfo = computed(() => {
  // eslint-disable-next-line camelcase
  const { status, start_registration, end_registration, start_time, end_time } = props.tournament

  switch (status) {
    case 'pre-registration':
      return [{ label: 'Реєстрація від:', date: fmt(start_registration) }]
    case 'registration':
      return [
        { label: 'Реєстрація до:', date: fmt(end_registration) },
        { label: 'Початок:', date: fmt(start_time) }
      ]
    case 'team-creation':
      return [{ label: 'Початок:', date: fmt(start_time) }]
    case 'in-progress':
      return [{ label: 'Кінець:', date: fmt(end_time) }]
    case 'ended':
      return [
        {
          label: 'Турнір проходив:',
          date: dayjs(start_time).isSame(end_time, 'day')
            ? `${fmt(end_time, 'D MMM YYYY')}`
            : `${fmt(start_time, 'D')}—${fmt(end_time, 'D MMM YYYY')}`
        }
      ]
    default:
      return [{ label: 'Початок:', date: fmt(start_time) }]
  }
})

function toTournamentPage (id: number) {
  const routeName = props.tournament.type === 'mix'
    ? routeNames.mixTournament
    : routeNames.teamTournament

  router.push({ name: routeName, params: { id } })
}
</script>

<style scoped>
.cyber-border::before,
.cyber-border::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid cyan;
  border-radius: 2px;
  transition: all 0.3s ease-in-out;
}
.cyber-border::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  opacity: 0.4;
}
.cyber-border::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  opacity: 0.4;
}
@keyframes neon-glow {
  0%, 100% { opacity: 0.6; transform: scaleX(1); }
  50% { opacity: 1; transform: scaleX(1.05); }
}
.animate-neon-glow {
  animation: neon-glow 1.5s infinite ease-in-out;
}
</style>
