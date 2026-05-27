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
      <div class="w-full px-20 lg:px-40">
        <!-- DESKTOP -->
        <div
          v-if="!isMobile"
          class="flex justify-between items-center w-full pt-40 pb-20"
        >
          <h1 class="text-4xl font-semibold text-white">
            Командні турніри
          </h1>
          <div class="flex items-center gap-25">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="h-full w-fit px-25"
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
            >
              <template #prepend>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- MOBILE -->
        <div v-else class="w-full">
          <el-carousel
            :loop="false"
            :autoplay="false"
            :dots="false"
            indicator-position="none"
            arrow="always"
            height="80px"
            class="w-full !flex-1 py-10 relative"
          >
            <el-carousel-item class="flex w-full items-center justify-center">
              <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
                <el-button
                  type="primary"
                  class="flex mx-auto min-w-[195px] h-full items-center justify-center gap-2"
                  @click="openTournamentFilterModal"
                >
                  <PhSlidersHorizontal size="20" weight="bold" />
                  <span class="text-sm font-medium">Фільтрувати</span>
                </el-button>
              </el-badge>
            </el-carousel-item>

            <el-carousel-item class="flex w-full items-center justify-center px-70">
              <el-input
                v-model="search"
                placeholder="Введіть назву турніру"
              >
                <template #prepend>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </div>

    <div class="h-full w-full relative z-10">
      <VirtualList
        :items="filteredTournaments"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="TOURNAMENT_LIST_ITEM_HEIGHT"
        :item-width="TOURNAMENT_LIST_ITEM_WIDTH"
        empty-text="Турніри не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <TournamentCard
            :tournament="item"
            :width="TOURNAMENT_CARD_WIDTH"
          />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { PhSlidersHorizontal } from '@phosphor-icons/vue'
import { TOURNAMENT_CARD_HEIGHT, TOURNAMENT_CARD_WIDTH } from '@/constants/tournaments'
import { VIRTUAL_GRID_CARD_GAP_PX } from '@/composables/use-virtual-grid'
import { useTournamentStore } from './tournaments.store'
import type { LocationQuery } from 'vue-router'

/** Як Teams/Players: `VirtualList` додає `pb-20 pr-20`, тому розмір кроку сітки = картка + gap (px те саме число у `useVirtualGridLayout`). */
const TOURNAMENT_LIST_ITEM_WIDTH = TOURNAMENT_CARD_WIDTH + VIRTUAL_GRID_CARD_GAP_PX
const TOURNAMENT_LIST_ITEM_HEIGHT = TOURNAMENT_CARD_HEIGHT + VIRTUAL_GRID_CARD_GAP_PX

const { open } = useAppModals()
const window = useWindowSize()
const route = useRoute()
const search = ref('')

const isMobile = computed(() => window.width.value < 850)

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

function checkQueryFilter (tournament: TTournament, query: LocationQuery) {
  if (query.status) {
    const status = query.status.toString().split(',')
    if (!status.includes(tournament.tournamentStatus as string)) return false
  }

  return true
}

function searchTournament (tournament: TTournament) {
  if (!search.value) return true
  return tournament.name?.toLowerCase().includes(search.value.toLowerCase())
}

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
