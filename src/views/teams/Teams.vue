<template>
  <div
    v-loading.fullscreen="teamsStore.loading"
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
          class="flex justify-between items-center w-full pt-40 pb-20"
        >
          <h1 class="text-4xl font-semibold text-white">
            Команди {{ window.width.value > 1024 ? 'платформи' : '' }}
          </h1>

          <div class="flex items-center gap-25">
            <el-tooltip
              :content="String(filteredTeams?.length)"
              placement="top"
              :disabled="filteredTeams?.length < 100"
              effect="dark"
              :show-arrow="false"
            >
              <el-badge
                :value="filteredTeams?.length"
                class="cursor-pointer"
                :class="{'cursor-default': filteredTeams.length < 100}"
                type="primary"
              >
                <el-button
                  type="primary"
                  class="h-full w-fit"
                  @click="openTeamFiltersModal"
                >
                  <PhSlidersHorizontal size="20" weight="bold" />
                  <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
                </el-button>
              </el-badge>
            </el-tooltip>
            <el-input v-model="search" class="w-[540px]" v-bind="$attrs" placeholder="Введіть назву команди">
              <template #prepend>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- MOBILE TOOLBAR -->
        <div v-else class="w-full px-4">
          <el-carousel
            :loop="false"
            :autoplay="false"
            :dots="false"
            indicator-position="none"
            arrow="always"
            height="80px"
            class="w-full !flex-1 py-10 relative"
          >
            <!-- Кнопка Фільтрувати -->
            <el-carousel-item class="flex w-full items-center justify-center">
              <el-tooltip
                :content="String(filteredTeams?.length)"
                placement="top"
                :disabled="filteredTeams?.length < 100"
                effect="dark"
                :show-arrow="false"
              >
                <el-badge
                  :value="filteredTeams?.length"
                  :hidden="!filteredTeams"
                  class="cursor-pointer"
                  :class="{'cursor-default': filteredTeams.length < 100}"
                  type="primary"
                >
                  <el-button
                    type="primary"
                    class="flex w-[240px] h-full"
                    @click="openTeamFiltersModal"
                  >
                    <PhSlidersHorizontal size="20" weight="bold" />
                    <span class="ml-10 text-sm font-medium">Фільтрувати</span>
                  </el-button>
                </el-badge>
              </el-tooltip>
            </el-carousel-item>

            <!-- Кнопка Зв'язатися з гравцями -->
            <el-carousel-item class="flex items-center justify-center">
              <el-input v-model="search" class="w-[240px]" v-bind="$attrs" placeholder="Введіть назву команди">
                <template #prepend>
                  <el-icon>
                    <Search />
                  </el-icon>
                </template>
              </el-input>
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </div>

    <div class="h-full w-full relative z-10">
      <VirtualList
        :items="filteredTeams"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="TEAM_CARD_HEIGHT"
        :item-width="TEAM_CARD_WIDTH"
        empty-text="Команди не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <TeamCard
            v-model="showTeamPlayers"
            :width="TEAM_CARD_WIDTH"
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
import { parseQueryArray } from '@/core/helpers'

const TEAM_CARD_WIDTH = 300
const TEAM_CARD_HEIGHT = 410

const teamsStore = useTeamsStore()
const window = useWindowSize()
const { open } = useAppModals()
const route = useRoute()
const { cardsPerRow } = useVirtualGridLayout({ cardWidth: TEAM_CARD_WIDTH })

const showTeamPlayers = ref(false)

const search = ref('')

const filters = ref<Record<string, string[]>>({
  status: [],
  divisions: []
})

const filteredTeams = computed(() => {
  syncFiltersWithUrl()

  const searchValue = search.value.toLowerCase().trim()

  const mappedTeams = teamsStore.teams.filter(team => {
    if (
      filters.value.status.length
    ) {
      const isVerified = team.isVerified ? 'verified' : 'unverified'
      if (!filters.value.status.includes(isVerified)) return false
    }

    return true
  })

  return searchValue
    ? mappedTeams.filter(team => team.name?.toLowerCase().includes(searchValue))
    : mappedTeams
})

const isMobile = computed(() => window.width.value < 850)

function openTeamFiltersModal () {
  open('TeamsFilterModal')
}

function syncFiltersWithUrl () {
  const query = route.query

  filters.value.divisions = parseQueryArray(query.divisions)
  filters.value.status = parseQueryArray(query.status)
}

onMounted(async () => {
  await teamsStore.getTeams()

  syncFiltersWithUrl()
})

</script>
