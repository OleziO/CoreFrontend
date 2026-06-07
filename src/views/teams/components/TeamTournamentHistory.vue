<template>
  <div
    class="flex flex-col rounded-xl bg-gray-900 border
    border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] p-15 pr-0
     pt-15 overflow-hidden max-h-[450px] w-full min-w-0"
  >
    <div class="flex flex-col gap-2 min-h-0 flex-1 overflow-hidden min-w-0">
      <h3 class="text-xl text-center font-semibold shrink-0 mr-15">Історія турнірів</h3>
      <el-divider class="mt-15 w-[calc(100%-15px)] shrink-0" />

      <p v-if="!tournaments.length" class="text-gray-400 text-sm mt-2 shrink-0">
        Команда ще не приймала участь у турнірах
      </p>

      <div
        v-else
        class="flex flex-col gap-15 overflow-y-auto overflow-x-hidden flex-1
        custom-scrollbar min-h-0 pr-15"
      >
        <RouterLink
          v-for="tournament in tournaments"
          :key="tournament.id"
          :to="{ name: routeNames.tournament, params: { id: tournament.id } }"
          class="flex items-center gap-20 p-15 shrink-0 min-w-0
          rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors backdrop-blur-sm"
        >
          <TournamentBannerImage
            :url="tournament.listBannerUrl"
            variant="thumb"
          />

          <div class="flex flex-col w-full gap-15 min-w-0">
            <h3 class="flex justify-between gap-20 items-center font-semibold text-sm text-white">
              <span class="text-lg truncate pr-2">{{ tournament.name }}</span>

              <el-tooltip placement="top" effect="dark">
                <PhCalendarDots
                  :size="18"
                  class="text-white/30 hover:text-white/80 cursor-pointer transition-colors shrink-0"
                />
                <template #content>
                  <div class="flex flex-col gap-2 p-2 text-xs">
                    <div class="flex gap-2 justify-between">
                      <span class="text-white/70">Початок:</span>
                      <span class="text-white">
                        {{ dayjs(tournament.tournamentStartsAt).format("D MMMM YYYY") }}
                      </span>
                    </div>
                    <div class="flex gap-2 justify-between">
                      <span class="text-white/70">Кінець:</span>
                      <span class="text-white">
                        {{ dayjs(tournament.tournamentEndsAt).format("D MMMM YYYY") }}
                      </span>
                    </div>
                  </div>
                </template>
              </el-tooltip>
            </h3>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCalendarDots } from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { routeNames } from '@/router/route-names'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
dayjs.locale('uk')

defineProps<{
  tournaments: NonNullable<TTeam['tournaments']>
}>()
</script>
