<template>
  <div
    v-loading.fullscreen="mixTournamentsStore.isLoading"
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
          class="flex justify-between flex-1 items-center w-full pt-40 pb-20"
        >
          <h1 v-if="!isMobile" class="text-4xl font-semibold text-white">
            Mix Cup
          </h1>
          <div class="w-full 2md:w-fit flex items-center gap-25">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount" class="flex-1">
              <el-button
                type="primary"
                class="h-full flex-1 px-25 w-fit"
                @click="openMixTournamentFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span class="flex-1 w-full text-sm font-medium ml-6">Фільтрувати</span>
              </el-button>
            </el-badge>
            <el-input v-model="search" class="w-[400px] max-w-full" placeholder="Пошук мікс турнірів" />
          </div>
        </div>
      </div>
    </div>

    <!-- VirtualList -->
    <div class="h-full w-full relative z-10">
      <VirtualList
        :items="filteredMixTournaments"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="TOURNAMENT_CARD_HEIGHT"
        :item-width="TOURNAMENT_CARD_WIDTH"
        empty-text="Турніри не знайдені"
        id-key="id"
      >
        <template #item="{item}">
          <TournamentCard :tournament="item" :width="TOURNAMENT_CARD_WIDTH" />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSlidersHorizontal } from '@phosphor-icons/vue'
import type { LocationQuery } from 'vue-router'

const TOURNAMENT_CARD_WIDTH = 380
const TOURNAMENT_CARD_HEIGHT = 420

const { cardsPerRow } = useVirtualGridLayout({ cardWidth: TOURNAMENT_CARD_WIDTH })
const { open } = useAppModals()
const window = useWindowSize()
const route = useRoute()
const mixTournamentsStore = useMixTournamentStore()

const search = ref('')

const isMobile = computed(() => {
  return window.width.value < 850
})

const filteredMixTournaments = computed(() => {
  const query = route.query

  return mixTournamentsStore.mixTournaments.filter(tournament => {
    if (!checkQueryFilter(tournament, query)) return false
    if (!searchTournament(tournament)) return false

    return true
  })
})

function searchTournament (tournament: TMixTournament) {
  if (!search.value) return true

  return tournament.title.toLowerCase().includes(search.value.toLowerCase())
}

function checkQueryFilter (tournament: TTournament | TMixTournament, query: LocationQuery) {
  if (query.status) {
    const status = query.status.toString().split(',')
    if (!status.includes(tournament.status)) return false
  }

  return true
}

const activeFiltersCount = computed(() => {
  const query = route.query
  let count = 0

  if (query.status) count += 1

  return count
})

function openMixTournamentFilterModal () {
  open('MixTournamentFilterModal')
}

onMounted(mixTournamentsStore.getMixTournaments)
</script>
