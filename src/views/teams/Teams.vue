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
          <div class="flex items-baseline gap-12">
            <h1 class="text-4xl font-semibold text-white">
              Команди {{ window.width.value > 1024 ? 'платформи' : '' }}
            </h1>
            <span class="text-small tabular-nums text-white/40">{{ filteredTeams.length }}</span>
          </div>

          <div class="flex items-center gap-16 w-1/2">
            <el-input
              v-model="search"
              class="flex-1"
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
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="h-40 px-16 shrink-0"
                @click="openTeamFiltersModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>
          </div>
        </div>

        <!-- MOBILE — persistent search + filter (no carousel) -->
        <div v-else class="w-full py-12">
          <div class="flex items-center gap-10">
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
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="!h-40 !w-40 shrink-0"
                aria-label="Фільтрувати"
                @click="openTeamFiltersModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
              </el-button>
            </el-badge>
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
          :style="{ height: `${TEAM_CARD_HEIGHT}px` }"
        />
      </div>

      <VirtualList
        v-else
        :items="filteredTeams"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="TEAM_CARD_HEIGHT"
        :item-width="TEAM_CARD_WIDTH"
        grid-cell-class="pb-10 pr-12"
        empty-text="Команди не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <TeamCard
            v-model="showTeamPlayers"
            :width="TEAM_CARD_WIDTH"
            :team="item"
            show-division-tag
          />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PhSlidersHorizontal } from '@phosphor-icons/vue'
import { useWindowSize } from '@vueuse/core'
import { parseQueryArray } from '@/core/helpers'

const TEAM_CARD_WIDTH = 300
/** Висота кроку сітки ≈ картка + вертикальний відступ (`grid-cell-class` на VirtualList). */
const TEAM_CARD_HEIGHT = 472

const teamsStore = useTeamsStore()
const window = useWindowSize()
const { open } = useAppModals()
const route = useRoute()
const { cardsPerRow } = useVirtualGridLayout({ cardWidth: TEAM_CARD_WIDTH })

const showTeamPlayers = ref(false)

const search = ref('')

const filters = ref<{ status: string[] }>({
  status: []
})

watch(
  () => route.query,
  () => syncFiltersWithUrl(),
  { deep: true }
)

const filteredTeams = computed(() => {
  const searchValue = search.value.toLowerCase().trim()

  const mappedTeams = teamsStore.teams.filter(team => {
    if (filters.value.status.length) {
      const statusKey = team.isVerified ? 'approved' : 'applied'
      if (!filters.value.status.includes(statusKey)) return false
    }

    return true
  })

  return searchValue
    ? mappedTeams.filter(team => team.name?.toLowerCase().includes(searchValue))
    : mappedTeams
})

const isMobile = computed(() => window.width.value < 850)

const activeFiltersCount = computed(() => (filters.value.status.length ? 1 : 0))

function openTeamFiltersModal () {
  open('TeamsFilterModal')
}

function syncFiltersWithUrl () {
  filters.value.status = parseQueryArray(route.query.status)
}

onMounted(async () => {
  await teamsStore.getTeams()

  syncFiltersWithUrl()
})

</script>
