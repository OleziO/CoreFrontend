<template>
  <div
    v-loading.fullscreen="playersStore.loading"
    class="flex flex-col max-h-full w-full overflow-hidden relative"
  >
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
          <h1 class="text-4xl font-semibold text-white">
            Гравці {{ window.width.value > 1000 ? 'платформи' : '' }}
          </h1>

          <div class="flex items-center gap-25 w-full ml-80 2lg:ml-0 lg:w-1/2">
            <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
              <el-button
                type="primary"
                class="h-full w-fit"
                @click="openPlayersFilterModal"
              >
                <PhSlidersHorizontal size="20" weight="bold" />
                <span v-if="window.width.value > 1400" class="ml-10 text-sm font-medium">Фільтрувати</span>
              </el-button>
            </el-badge>

            <el-input
              v-model="search"
              class="flex-1"
              placeholder="Пошук по ніку..."
            >
              <template #prepend>
                <PhMagnifyingGlass size="16" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- MOBILE TOOLBAR -->
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
            <!-- Кнопка Фільтрувати -->
            <el-carousel-item class="flex w-full items-center justify-center">
              <el-badge
                :value="activeFiltersCount"
                :hidden="!activeFiltersCount"
              >
                <el-button
                  type="primary"
                  class="flex mx-auto min-w-[195px] h-full items-center justify-center gap-2"
                  @click="openPlayersFilterModal"
                >
                  <PhSlidersHorizontal size="20" weight="bold" />
                  <span class="text-sm font-medium">Фільтрувати</span>
                </el-button>
              </el-badge>
            </el-carousel-item>

            <!-- Пошук -->
            <el-carousel-item class="flex w-full items-center justify-center px-70">
              <el-input
                v-model="search"
                placeholder="Пошук по ніку"
              >
                <template #prepend>
                  <PhMagnifyingGlass size="16" />
                </template>
              </el-input>
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </div>

    <!-- ================= CONTENT ================= -->
    <div class="h-full w-full relative z-10">
      <VirtualList
        :items="filteredPlayers"
        :grid-items="cardsPerRow"
        :grid-width="window.height.value"
        withTopMargin
        :item-height="USER_CARD_HEIGHT"
        :item-width="USER_CARD_WIDTH"
        empty-text="Гравці не знайдені"
        id-key="id"
      >
        <template #item="{ item }">
          <UserCard :user="item" :width="USER_CARD_WIDTH" />
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSlidersHorizontal, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { LocationQuery } from 'vue-router'
import { ERole } from '@/types/general.enums'

import {
  getPlayerDotaPositions,
  isPlayerVerified,
  parseQueryArray,
  playerMatchesRoleFilterToken
} from '@/core/helpers'

function parseTeamStatusQuery (query: LocationQuery): boolean[] {
  const raw = query.teamStatus
  if (raw == null) return []
  if (Array.isArray(raw)) return raw.map(v => Boolean(Number(v)))
  return String(raw).split(',').filter(Boolean).map(v => Boolean(Number(v)))
}

const USER_CARD_WIDTH = 270
const USER_CARD_HEIGHT = 360

const { cardsPerRow } = useVirtualGridLayout({ cardWidth: USER_CARD_WIDTH })

const window = useWindowSize()
const isMobile = computed(() => window.width.value < 850)

const playersStore = usePlayersStore()
const { open } = useAppModals()
const route = useRoute()
const search = ref('')

const filteredPlayers = computed(() => {
  const query = route.query

  const mappedPlayers = playersStore.players?.filter(player => checkQueryFilter(player, query)) || []

  return search.value
    ? mappedPlayers?.filter(player => searchPlayer(player)) || []
    : mappedPlayers
})

function checkQueryFilter (player: TPlayer, query: LocationQuery) {
  const ratingFrom = query.ratingFrom != null ? Number(query.ratingFrom) : 0
  const ratingTo = query.ratingTo != null ? Number(query.ratingTo) : 9999
  const rating = player.rating ?? 0
  if (rating < ratingFrom || rating > ratingTo) return false

  if (query.roles) {
    const tokens = String(query.roles).split(',').map(s => s.trim()).filter(Boolean)
    const catalog = playersStore.userRolesCatalog
    if (tokens.length && !tokens.some(t => playerMatchesRoleFilterToken(player, t, catalog))) return false
  }

  if (query.positions) {
    const wanted = parseQueryArray(query.positions, Number).filter(n => n >= 1 && n <= 5)
    if (wanted.length) {
      const have = new Set(getPlayerDotaPositions(player))
      if (!wanted.some(w => have.has(w))) return false
    }
  }

  if (query.teamStatus) {
    const flags = parseTeamStatusQuery(query)
    if (flags.length) {
      const hasTeam = Boolean((player as { teamId?: string | null }).teamId)
      if (!flags.includes(hasTeam)) return false
    }
  }

  if (query.verificationStatus) {
    const statuses = parseQueryArray(query.verificationStatus)
    if (statuses.length) {
      const verified = isPlayerVerified(player)
      const ok = statuses.some((s) => {
        if (s === ERole.PLAYER) return verified
        if (s === ERole.GUEST) return !verified
        return false
      })
      if (!ok) return false
    }
  }

  return true
}

const activeFiltersCount = computed(() => {
  const query = route.query
  let count = 0
  if (query.ratingFrom != null || query.ratingTo != null) count += 1
  if (query.roles) count += 1
  if (query.positions) count += 1
  if (query.teamStatus) count += 1
  if (query.verificationStatus) count += 1
  return count
})

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
