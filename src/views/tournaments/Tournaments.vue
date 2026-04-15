<template>
  <div
    v-loading.fullscreen="tournamentStore.loading"
    class="flex flex-col max-h-full w-full overflow-hidden relative"
  >
    <div
      class="absolute top-0 left-0 z-30 flex justify-center w-full
             bg-white/2 backdrop-blur-lg
             shadow-[0_8px_24px_rgba(0,0,0,0.1)]
             after:absolute after:left-0 after:right-0 after:bottom-0
             after:h-16 after:bg-gradient-to-b
             after:from-transparent after:to-black/10
             after:pointer-events-none"
    >
      <div
        class="w-full px-20 lg:px-40"
      >
        <div
          v-if="!isMobile"
          class="flex w-full justify-between flex-1 pt-40 pb-20"
        >
          <h1 class="text-4xl font-semibold text-white">
            Командні турніри
          </h1>
          <div class="flex items-center gap-25">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="h-full px-25 w-fit"
                @click="openTournamentFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>
            <el-input
              v-model="search"
              class="flex-1 w-[400px]"
              placeholder="Введіть назву турніру"
            />
          </div>
        </div>

        <div v-else class="w-full px-4">
          <el-carousel
            height="80px"
            trigger="hover"
            arrow="always"
            :loop="false"
            :autoplay="false"
            class="w-full !flex-1 pb-20 pt-10 relative"
          >
            <el-carousel-item class="flex w-full items-center justify-center">
              <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
                <el-button
                  type="primary"
                  class="flex mx-auto items-center justify-center h-full w-250"
                  @click="openTournamentFilterModal"
                >
                  <PhSlidersHorizontal size="20" weight="bold" />
                  <span class="ml-10 text-sm font-medium">Фільтрувати</span>
                </el-button>
              </el-badge>
            </el-carousel-item>
            <el-carousel-item class="flex items-center justify-center">
              <el-input
                v-model="search"
                class="w-[240px]"
                placeholder="Введіть назву турніру"
              />
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </div>

    <!-- VirtualList -->
    <div class="h-full w-full">
      <div class="mx-auto w-full">
        <VirtualList
          :items="filteredTournaments"
          :grid-items="cardsPerRow"
          :grid-width="window.height.value"
          withTopMargin
          :item-height="TOURNAMENT_CARD_HEIGHT"
          :item-width="TOURNAMENT_CARD_WIDTH"
          empty-text="Турніри не знайдені"
          id-key="id"
        >
          <template #item="{item}">
            <TournamentCard :tournament="item" :width="TOURNAMENT_CARD_WIDTH" class="h-full" />
          </template>
        </VirtualList>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSlidersHorizontal } from '@phosphor-icons/vue'
import { useTournamentStore } from './tournaments.store'
import type { LocationQuery } from 'vue-router'
import type { TTournament as Tournament } from '@/api/types/api.types'

const { open } = useAppModals()
const window = useWindowSize()
const route = useRoute()
const search = ref('')

const isMobile = computed(() => {
  return window.width.value < 850
})

const TOURNAMENT_CARD_WIDTH = 380
const TOURNAMENT_CARD_HEIGHT = 420

const { cardsPerRow } = useVirtualGridLayout({ cardWidth: TOURNAMENT_CARD_WIDTH })
const tournamentStore = useTournamentStore()

const filteredTournaments = computed(() => {
  const query = route.query

  return tournamentStore.tournamentsData.filter(tournament => {
    if (!checkQueryFilter(tournament, query)) return false
    if (!searchTournament(tournament)) return false
    return true
  })
})

function checkQueryFilter (tournament: Tournament, query: LocationQuery) {
  if (query.status) {
    const status = query.status.toString().split(',')
    if (!status.includes(tournament.tournamentStatus as string)) return false
  }

  return true
}

function searchTournament (tournament: Tournament) {
  if (!search.value) return true
  return tournament.name?.toLowerCase().includes(search.value.toLowerCase())
}

// Подсчёт активных фильтров
const activeFiltersCount = computed(() => {
  const query = route.query
  let count = 0
  if (query.status) count += 1
  if (query.division) count += 1

  return count
})

function openTournamentFilterModal () {
  open('TournamentFilterModal')
}

onMounted(async () => {
  await tournamentStore.getTournaments()
})
</script>
