<template>
  <div class="flex flex-col max-h-full w-full overflow-hidden relative bg-bg-primary">
    <!-- Атмосферний відблиск у стилі головної сторінки -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[260px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(67,191,238,0.07),transparent_70%)]"
    />

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
          class="flex justify-between items-end w-full pt-32 pb-20"
        >
          <div class="flex flex-col gap-6">
            <span class="text-[11px] uppercase tracking-[0.35em] text-[#43bfee] font-semibold">
              Змагання
            </span>
            <h1 class="text-3xl xl:text-4xl font-black uppercase tracking-tight text-white">
              Командні турніри
            </h1>
          </div>
          <div class="flex items-center gap-16">
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

        <!-- MOBILE — persistent search + filter (no carousel) -->
        <div v-else class="w-full py-12">
          <div class="flex items-center gap-10">
            <el-input
              v-model="search"
              class="flex-1"
              placeholder="Назва турніру"
              clearable
            >
              <template #prepend>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="!h-40 !w-40 shrink-0"
                aria-label="Фільтрувати"
                @click="openTournamentFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
              </el-button>
            </el-badge>
          </div>
        </div>
      </div>
    </div>

    <div class="h-full w-full relative z-10">
      <!-- Skeletons while the first load is in flight -->
      <div
        v-if="tournamentStore.loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-24
               justify-items-center px-20 pt-110 lg:pt-130 pb-20"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="w-full max-w-[280px] rounded-2xl border border-white/10 bg-dark-card animate-pulse"
          :style="{ height: `${TOURNAMENT_CARD_HEIGHT}px` }"
        />
      </div>

      <VirtualList
        v-else
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
import { TOURNAMENT_CARD_HEIGHT, TOURNAMENT_CARD_WIDTH } from '@/views/tournaments/tournaments.enums'
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
