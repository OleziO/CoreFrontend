<template>
  <div class="flex flex-col max-h-full w-full overflow-hidden relative">
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
        <!-- DESKTOP / TABLET -->
        <div
          v-if="!isMobile"
          class="flex justify-between items-center w-full pt-40 pb-20"
        >
          <div class="flex flex-col gap-6">
            <span class="sys-label">Реєстр</span>
            <div class="flex items-baseline gap-12">
              <h1 class="font-display text-3xl xl:text-4xl uppercase tracking-wide text-white neon-text-subtle">
                Команди {{ window.width.value > 1024 ? 'платформи' : '' }}
              </h1>
              <span class="font-mono text-xl text-primary/60">[{{ filteredTeams.length }}]</span>
            </div>
          </div>

          <div class="flex items-center gap-12 shrink-0">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="shrink-0"
                @click="openTeamFiltersModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>
            <el-input
              v-model="search"
              class="w-[400px]"
              v-bind="$attrs"
              placeholder="Введіть назву команди"
              clearable
            >
              <template #prepend>
                <el-icon>
                  <Search />
                </el-icon>
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
                @click="openTeamFiltersModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
              </el-button>
            </el-badge>
            <el-input
              v-model="search"
              class="flex-1"
              placeholder="Назва команди"
              clearable
            >
              <template #prepend>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </div>

    <div class="h-full w-full relative z-10">
      <div
        v-if="teamsStore.loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-24
               justify-items-center px-20 pt-130 pb-20"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="w-full max-w-[300px] rounded-2xl border border-white/10 bg-dark-card animate-pulse"
          :style="{ height: `${teamCardHeight}px` }"
        />
      </div>

      <VirtualList
        v-else
        :items="filteredTeams"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="teamCardHeight"
        :item-width="effectiveCardWidth"
        grid-cell-class="pb-10 pr-12"
        empty-text="Команди не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <TeamCard
            v-model="showTeamPlayers"
            :width="effectiveCardWidth"
            :team="item"
          />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PhSlidersHorizontal } from '@phosphor-icons/vue'
import { useWindowSize } from '@vueuse/core'
import { countActiveTeamsFilters, parseTeamsFilters, teamMatchesFilters } from '@/views/teams/teams-filters.utils'

const TEAM_CARD_WIDTH = 300
/** Висота картки без логотипа (назва, рейтинг, Dota ID, кнопка, відступи, рамка), px. */
const TEAM_CARD_CHROME_HEIGHT = 206
/** Вертикальний відступ між рядами — `pb-10` у `grid-cell-class`. */
const TEAM_CARD_ROW_GAP = 10
/** Логотип у TeamCard має aspect 8/7 і ширину картки мінус `px-12` та рамку. */
const TEAM_CARD_LOGO_INSET = 26

const teamsStore = useTeamsStore()
const window = useWindowSize()
const { open } = useAppModals()
const route = useRoute()
const { cardsPerRow, effectiveCardWidth } = useVirtualGridLayout({ cardWidth: TEAM_CARD_WIDTH })

/** Крок сітки залежить від ширини картки: логотип росте разом з нею в одноколонковому режимі. */
const teamCardHeight = computed(() =>
  Math.ceil(((effectiveCardWidth.value - TEAM_CARD_LOGO_INSET) * 7) / 8) + TEAM_CARD_CHROME_HEIGHT + TEAM_CARD_ROW_GAP
)

const showTeamPlayers = ref(false)

const search = ref('')

/** Фільтри живуть у query — одна логіка збігу з модалкою (teams-filters.utils). */
const filters = computed(() => parseTeamsFilters(route.query))

const filteredTeams = computed(() => {
  const searchValue = search.value.toLowerCase().trim()

  const mappedTeams = teamsStore.teams.filter(team => teamMatchesFilters(team, filters.value))

  return searchValue
    ? mappedTeams.filter(team => team.name?.toLowerCase().includes(searchValue))
    : mappedTeams
})

const isMobile = computed(() => window.width.value < 850)

const activeFiltersCount = computed(() => countActiveTeamsFilters(filters.value))

function openTeamFiltersModal () {
  open('TeamsFilterModal')
}

onMounted(() => {
  teamsStore.getTeams()
})

</script>
