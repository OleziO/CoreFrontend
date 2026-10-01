<template>
  <div class="flex flex-col max-h-full w-full overflow-hidden relative">
    <!-- ================= HEADER ================= -->
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
            <h1 class="font-display text-3xl xl:text-4xl uppercase tracking-wide text-white neon-text-subtle">
              Гравці {{ window.width.value > 1000 ? 'платформи' : '' }}
            </h1>
          </div>

          <div class="flex items-center gap-12 shrink-0">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="shrink-0"
                @click="openPlayersFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>

            <el-input
              v-model="search"
              class="w-[400px]"
              placeholder="Пошук по ніку..."
            >
              <template #prepend>
                <PhMagnifyingGlass size="16" />
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
                @click="openPlayersFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
              </el-button>
            </el-badge>
            <el-input
              v-model="search"
              class="flex-1"
              placeholder="Пошук по ніку"
              clearable
            >
              <template #prepend>
                <PhMagnifyingGlass size="16" />
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= CONTENT ================= -->
    <div class="h-full w-full relative z-10">
      <!-- Скелети повторюють геометрію VirtualList, тож картки стають на місце без стрибка -->
      <CardGridSkeleton
        v-if="playersStore.loading"
        :columns="cardsPerRow"
        :item-width="effectiveCardWidth"
        :item-height="USER_CARD_HEIGHT"
        label="Завантажуємо гравців…"
      >
        <template #item>
          <UserCardSkeleton :width="effectiveCardWidth" />
        </template>
      </CardGridSkeleton>

      <VirtualList
        v-else
        :items="filteredPlayers"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="USER_CARD_HEIGHT"
        :item-width="effectiveCardWidth"
        empty-text="Гравці не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <UserCard :user="item" :width="effectiveCardWidth" />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSlidersHorizontal, PhMagnifyingGlass } from '@phosphor-icons/vue'
import {
  countActivePlayersFilters,
  parsePlayersFilters,
  playerMatchesFilters
} from '@/views/players/players-filters.utils'
import { sortPlayersByRolePriority } from '@/views/players/players-sort.utils'

/** Ширша картка: 4 в ряд замість 5, щоб імена та теги мали місце. */
const USER_CARD_WIDTH = 340
/** Крок сітки ≈ висота картки (~244px) + вертикальний відступ. */
const USER_CARD_HEIGHT = 268

const { cardsPerRow, effectiveCardWidth } = useVirtualGridLayout({ cardWidth: USER_CARD_WIDTH })

const window = useWindowSize()
const isMobile = computed(() => window.width.value < 850)

const playersStore = usePlayersStore()
const { open } = useAppModals()
const route = useRoute()
const search = ref('')

/** Фільтри живуть у query — одна логіка збігу з модалкою (players-filters.utils). */
const filters = computed(() => parsePlayersFilters(route.query))

const filteredPlayers = computed(() => {
  const mappedPlayers = (playersStore.players ?? []).filter(
    player => playerMatchesFilters(player, filters.value, playersStore.userRolesCatalog)
  )

  const visiblePlayers = search.value
    ? mappedPlayers.filter(player => searchPlayer(player))
    : mappedPlayers

  /** Адміни → Медіа → VIP → Верифіковані → Неверифіковані (players-sort.utils). */
  return sortPlayersByRolePriority(visiblePlayers)
})

const activeFiltersCount = computed(() => countActivePlayersFilters(filters.value))

function searchPlayer (player: TPlayer) {
  if (!search.value) return true
  return player.discordName?.toLowerCase().includes(search.value.toLowerCase()) ||
         player.discordUsername?.toLowerCase().includes(search.value.toLowerCase()) ||
         player.steamId?.toLowerCase().includes(search.value.toLowerCase())
}

function openPlayersFilterModal () {
  open('PlayersFilterModal')
}

onMounted(() => {
  playersStore.getPlayers()
  playersStore.fetchUserRoles().catch(() => {})
})
</script>
