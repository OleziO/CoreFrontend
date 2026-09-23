<template>
  <div class="flex flex-col max-h-full w-full overflow-hidden relative">
    <!-- Атмосферний відблиск у стилі головної сторінки -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[260px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(46,229,255,0.1),transparent_70%)]"
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
            <span class="sys-label">Змагання</span>
            <h1 class="font-display text-3xl xl:text-4xl uppercase tracking-wide text-white neon-text-subtle">
              Командні турніри
            </h1>
          </div>
          <div class="flex items-center gap-12 shrink-0">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="shrink-0"
                @click="openTournamentFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>
            <el-input
              v-model="search"
              class="w-[400px]"
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
          <div class="flex items-center gap-8">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="btn-icon"
                aria-label="Фільтрувати"
                @click="openTournamentFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
              </el-button>
            </el-badge>
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
        :item-width="tournamentItemWidth"
        empty-text="Турніри не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <TournamentCard
            :tournament="item"
            :width="effectiveCardWidth"
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
import {
  countActiveTournamentsFilters,
  parseTournamentsFilters,
  tournamentMatchesFilters
} from '@/views/tournaments/tournaments-filters.utils'
import { sortTournamentsForList } from '@/views/tournaments/tournaments.utils'

/** Як Teams/Players: `VirtualList` додає `pb-20 pr-20`, тому розмір кроку сітки = картка + gap (px те саме число у `useVirtualGridLayout`). */
const TOURNAMENT_LIST_ITEM_HEIGHT = TOURNAMENT_CARD_HEIGHT + VIRTUAL_GRID_CARD_GAP_PX

const { open } = useAppModals()
const window = useWindowSize()
const route = useRoute()
const search = ref('')

const isMobile = computed(() => window.width.value < 850)

const { cardsPerRow, effectiveCardWidth } = useVirtualGridLayout({ cardWidth: TOURNAMENT_CARD_WIDTH })

// У багатоколонковому режимі додаємо gap до кроку сітки (праве поле `pr-20` лишається);
// в одноколонковому `VirtualList` прибирає `pr-20`, тож крок = ширині картки.
const tournamentItemWidth = computed(() =>
  cardsPerRow.value > 1
    ? effectiveCardWidth.value + VIRTUAL_GRID_CARD_GAP_PX
    : effectiveCardWidth.value)
const tournamentStore = useTournamentStore()

/** Фільтри живуть у query — одна логіка збігу з модалкою (tournaments-filters.utils). */
const filters = computed(() => parseTournamentsFilters(route.query))

/** Порядок: поточні → найближчі → минулі (див. tournaments.utils). */
const filteredTournaments = computed(() =>
  sortTournamentsForList(
    tournamentStore.tournamentsData.filter(
      tournament => tournamentMatchesFilters(tournament, filters.value) && searchTournament(tournament)
    )
  )
)

function searchTournament (tournament: TTournament) {
  if (!search.value) return true
  return tournament.name?.toLowerCase().includes(search.value.toLowerCase())
}

const activeFiltersCount = computed(() => countActiveTournamentsFilters(filters.value))

function openTournamentFilterModal () {
  open('TournamentFilterModal')
}

onMounted(async () => {
  await tournamentStore.getTournaments()
})
</script>
