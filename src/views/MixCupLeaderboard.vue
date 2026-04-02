<template>
  <div
    v-loading.fullscreen="playersStore.loading"
    class="relative flex h-full w-full flex-col overflow-hidden"
  >
    <!-- ================= HEADER ================= -->
    <div
      class="
        absolute top-0 left-0 z-30 w-full
        bg-white/5 backdrop-blur-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        after:absolute after:inset-x-0 after:bottom-0
        after:h-16 after:bg-gradient-to-b
        after:from-transparent after:to-black/20
        after:pointer-events-none
      "
    >
      <div
        class="mx-auto w-full px-20 lg:px-40"
      >
        <div
          class="
            flex items-center justify-between
            pt-32 pb-16
          "
        >
          <h1
            v-if="window.width.value > 1000"
            class="text-3xl font-bold tracking-wide text-white"
          >
            🏆 Найактивніші гравці
          </h1>

          <el-input
            v-model="search"
            class="2lg:max-w-[260px]"
            placeholder="Пошук по ніку..."
            size="small"
          >
            <template #prepend>
              <PhMagnifyingGlass size="14" />
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- ================= CONTENT ================= -->
    <div v-if="!playersStore.loading" class="flex-1 overflow-auto">
      <div
        class="mx-auto w-full pt-[120px] pb-24 px-20 lg:px-40"
      >
        <div class="flex flex-col gap-8 md:max-w-[1240px] max-w-[800px] mx-auto">
          <!-- ================= ROW ================= -->
          <div
            v-for="player in filteredPlayers.slice(0, 100)"
            :key="player.id"
            class="
              group relative
              grid
              items-center
              rounded-xl
              cursor-pointer
              border border-white/5 hover:border-primary
              transition-all duration-300 ease-out
            "
            :class="[rowHighlight(getPlayerPlace(player.id) - 1), isMobile
              ? 'grid-cols-[32px_auto_120px] gap-16 px-14 py-10'
              : 'grid-cols-[40px_auto_120px] gap-24 px-20 py-12']"
            @click="goToPlayerPage(player.id)"
          >
            <!-- ===== PLACE ===== -->
            <div
              class="flex items-center justify-end gap-2
            sm:gap-4 font-semibold text-white/90 text-[11px] sm:text-sm"
            >
              <div class="flex w-14 justify-center">
                <component
                  :is="placeIcon(getPlayerPlace(player.id) - 1)?.icon"
                  v-if="placeIcon(getPlayerPlace(player.id) - 1)"
                  :size="16"
                  weight="fill"
                  :class="placeIcon(getPlayerPlace(player.id) - 1)?.color"
                />
              </div>

              <span class="w-14 text-center">
                {{ getPlayerPlace(player.id) > 0 ? getPlayerPlace(player.id) : '-' }}
              </span>
            </div>

            <!-- ===== PLAYER ===== -->
            <div class="flex items-center w-fit gap-20">
              <div class="relative shrink-0 flex-none">
                <el-avatar
                  :src="player.avatar_url ? `${apiPublicUrl}${player.avatar_url}` : ''"
                  :class="isMobile ? 'size-36' : 'size-56'"
                  class="ring-1 sm:ring-2 ring-white/10 shadow-sm"
                >
                  <template #default>
                    <PhUser :size="isMobile ? 14 : 18" class="text-white/50" />
                  </template>
                </el-avatar>

                <el-tooltip
                  :content="playersStore.isVerified(player) ? 'Верифікований' : 'Не верифікований'"
                  placement="bottom"
                  effect="dark"
                >
                  <div
                    class="absolute -top-5 -right-5 sm:-top-6
                          sm:-right-6 z-10 flex size-20 sm:size-24 items-center
                          justify-center rounded-full ring-2 ring-gray-900 shadow-md"
                    :class="playersStore.isVerified(player) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'"
                  >
                    <component
                      :is="playersStore.isVerified(player) ? PhSealCheck : PhSealWarning"
                      :size="15"
                      weight="fill"
                    />
                  </div>
                </el-tooltip>
              </div>

              <div class="flex flex-col flex-1 !max-w-[90px] sm:!max-w-[200px] overflow-hidden md:!max-w-none">
                <el-tooltip
                  :disabled="!player.steam_name"
                  :content="player.steam_name || 'Імʼя відсутнє'"
                  placement="top-start"
                  effect="dark"
                  :show-after="200"
                >
                  <h2 class="truncate font-medium text-white text-[13px] sm:text-base">
                    {{ player.steam_name || '-' }}
                  </h2>
                </el-tooltip>

                <span
                  v-if="player.user_name && window.width.value > 900"
                  class="mt-2 flex items-center
                        gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-white/40 hover:text-primary
                        transition-all duration-300 cursor-pointer truncate w-fit"
                  @click.stop="copyDiscordName(player)"
                >
                  @{{ player.user_name }}
                  <PhCopy :size="isMobile ? 10 : 12" />
                </span>
              </div>
            </div>

            <!-- ===== POINTS ===== -->
            <div
              class="
                flex flex-col w-fit items-center justify-center
                rounded-lg
                border border-white/5
                bg-black/25
                transition
                group-hover:bg-black/35
              "
              :class="isMobile ? 'px-8 py-6' : 'px-12 py-8'"
            >
              <span class="text-[8px] sm:text-[9px] uppercase tracking-widest whitespace-nowrap text-white/40">
                Участь у подіях
              </span>

              <div class="mt-4 flex items-center gap-3 sm:gap-4">
                <span class="text-[13px] sm:text-base font-semibold text-white">
                  {{ player.activity ?? 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- EMPTY -->
        <div
          v-if="!filteredPlayers.length"
          class="py-32 text-center text-base text-white/50"
        >
          <el-empty
            description="Гравців не знайдено"
            :image-size="250"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ERole } from '@/types/general.types'
import {
  PhMagnifyingGlass,
  PhUser,
  PhCrown,
  PhCopy,
  PhSealWarning,
  PhSealCheck,
  PhMedal
} from '@phosphor-icons/vue'
import { computed, ref, onMounted } from 'vue'
import { useWindowSize, useClipboard } from '@vueuse/core'
import { routeNames } from '@/router/route-names'

const playersStore = usePlayersStore()
const search = ref('')

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL
const window = useWindowSize()

const { copy } = useClipboard({ legacy: true })

const isMobile = computed(() => window.width.value < 850)

const router = useRouter()

/* ===== SORT & FILTER ===== */
const sortedPlayers = computed(() => {
  const players = (playersStore.players || [])
    .filter(player => player.roles?.every(role => role.type_name !== ERole.GUEST))

  return players.sort((a, b) => {
    return (b.activity ?? 0) - (a.activity ?? 0)
  })
})

const filteredPlayers = computed(() => {
  const q = search.value.toLowerCase()

  return sortedPlayers.value.filter(p =>
    !q ||
    p.user_name?.toLowerCase().includes(q) ||
    p.steam_name?.toLowerCase().includes(q)
  )
})

/* ===== HELPERS ===== */

function getPlayerPlace (id: number) {
  const index = sortedPlayers.value.findIndex(p => p.id === id)

  if (index === -1) return -1

  return Number(playersStore.isVerified(sortedPlayers.value[index]) ? index + 1 : -1)
}

function rowHighlight (index: number) {
  // 🥇 1 місце — золотий неон
  if (index === 0) {
    return `
      bg-gradient-to-br from-[#FFD84D]/30 via-[#FFB800]/20 to-[#FF8C00]/20
      ring-1 ring-[#FFB800]/40
      shadow-[0_0_35px_rgba(255,184,0,0.35)]
      border border-transparent

      hover:border-[#FFD84D]
      hover:shadow-[0_0_55px_rgba(255,200,0,0.75)]
      hover:ring-[#FFD84D]/80
      hover:scale-[1.015]

      transition-all duration-300 ease-out
    `
  }

  // 🥈 2 місце — холодний фіолетово-синій неон
  if (index === 1) {
    return `
      bg-gradient-to-br from-[#E6E9FF]/25 via-[#B8B8FF]/20 to-[#8F9BFF]/20
      ring-1 ring-[#B8B8FF]/35
      shadow-[0_0_30px_rgba(184,184,255,0.3)]
      border border-transparent

      hover:border-[#B8B8FF]
      hover:shadow-[0_0_55px_rgba(160,160,255,0.75)]
      hover:ring-[#B8B8FF]/80
      hover:scale-[1.015]

      transition-all duration-300 ease-out
    `
  }

  // 🥉 3 місце — помаранчево-мідний неон
  if (index === 2) {
    return `
      bg-gradient-to-br from-[#FFB37A]/25 via-[#FF8C42]/20 to-[#C96A2B]/20
      ring-1 ring-[#FF8C42]/35
      shadow-[0_0_30px_rgba(255,140,66,0.3)]
      border border-transparent

      hover:border-[#FF9A55]
      hover:shadow-[0_0_55px_rgba(255,140,66,0.75)]
      hover:ring-[#FF8C42]/80
      hover:scale-[1.015]

      transition-all duration-300 ease-out
    `
  }

  // звичайні рядки
  return `
    bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
    border border-white/5
    hover:border-primary
    transition-all duration-300
  `
}

function placeIcon (index: number) {
  if (index === 0) return { icon: PhCrown, color: '!text-[#FFB800]' }
  if (index === 1) return { icon: PhMedal, color: '!text-[#B8B8FF]' }
  if (index === 2) return { icon: PhMedal, color: '!text-[#FF8C42]' }
  return null
}

function copyDiscordName (p: TPlayer) {
  if (!p?.user_name) return
  copy(p.user_name)
  ElMessage.success('Discord скопійовано')
}

function goToPlayerPage (id: number) {
  router.push({ name: routeNames.player, params: { id } })
}

onMounted(playersStore.getPlayers)
</script>
