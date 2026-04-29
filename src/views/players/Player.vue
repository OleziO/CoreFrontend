<template>
  <div
    v-loading.fullscreen="loading"
    class="w-full relative overflow-y-auto px-20 lg:px-40"
  >
    <div
      class="mx-auto flex flex-col 2md:justify-center items-center py-20 relative"
    >
      <!-- Загальний контейнер для всіх карточок -->
      <div class="w-full xl:max-w-[1040px] flex flex-col gap-24 relative">
        <AppBackButton />

        <!-- ================= PLAYER CARD ================= -->
        <div class="flex gap-20 flex-wrap 2lg:flex-nowrap nm:pt-60 pt-20">
          <div
            v-if="player"
            class="
            relative w-full
            rounded-2xl flex flex-col justify-between
            border border-gray-800/80
            bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
            p-20
            shadow-[0_15px_40px_rgba(0,0,0,0.45)]
          "
          >
            <!-- HEADER -->
            <div class="flex mt-10 items-center justify-between gap-20 px-10">
              <!-- LEFT -->
              <div class="flex items-center gap-16 min-w-0">
                <!-- Avatar -->
                <div class="relative">
                  <el-avatar
                    size="large"
                    :src="player.avatarUrl ?? ''"
                    class="ring-2 ring-gray-800 shadow-md"
                  >
                    <template #default>
                      <PhUser size="26" weight="bold" class="text-white/70" />
                    </template>
                  </el-avatar>

                  <el-tooltip
                    :content="isVerified ? 'Верифікований' : 'Не верифікований'"
                  >
                    <div
                      class="absolute -bottom-4 -right-4 flex h-20 w-20 items-center justify-center
                   rounded-full ring-2 ring-gray-900"
                      :class="isVerified ? 'bg-green-600' : 'bg-red-600'"
                    >
                      <component
                        :is="isVerified ? PhSealCheck : PhSealWarning"
                        size="12"
                        weight="fill"
                      />
                    </div>
                  </el-tooltip>
                </div>

                <!-- Names -->
                <div class="min-w-0">
                  <h2 class="truncate text-lg font-semibold text-white">
                    {{ player.discordName || '-' }}
                  </h2>

                  <span
                    v-if="player.discordUsername"
                    class="mt-4 flex w-fit items-center gap-6 text-xs text-gray-400
                 hover:text-primary transition cursor-pointer"
                    @click.stop="getCopy(player.discordUsername, 'Discord скопійовано')"
                  >
                    @{{ player.discordUsername }}
                    <PhCopy size="13" />
                  </span>
                </div>
              </div>

              <!-- Ранг (картинка); рейтинг MMR — у tooltip -->
              <el-tooltip
                v-if="rankImageSrc"
                :content="ratingMmrLabel"
                placement="top"
              >
                <div class="flex flex-col items-center shrink-0 cursor-default">
                  <img
                    :src="rankImageSrc"
                    alt=""
                    class="h-36 w-auto object-contain select-none"
                    width="64"
                    height="36"
                    loading="lazy"
                    draggable="false"
                  >
                  <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Рейтинг</span>
                </div>
              </el-tooltip>
              <el-tooltip
                v-else
                :content="ratingMmrLabel"
                placement="top"
              >
                <div class="flex flex-col items-center shrink-0">
                  <span class="text-lg font-semibold text-white tabular-nums">{{ player.rating }}</span>
                  <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Рейтинг</span>
                </div>
              </el-tooltip>
            </div>

            <div class="flex w-full flex-col gap-10 mt-20 p-8">
              <div class="flex w-full gap-10">
                <el-button
                  v-if="showAdminVerificationActions"
                  :loading="verifyLoading"
                  :type="isVerified ? 'warning' : 'success'"
                  class="h-30 flex-1 shrink-0 max-sm:text-xs max-sm:!px-8"
                  @click="togglePlayerVerification"
                >
                  <component
                    :is="isVerified ? PhSealWarning : PhSealCheck"
                    class="mr-8 shrink-0"
                    weight="bold"
                    size="16"
                  />

                  {{ isVerified ? 'Зняти верифікацію' : 'Верифікувати' }}
                </el-button>

                <el-button
                  v-if="showAdditionalInfo"
                  type="primary"
                  class="h-30 flex-1 shrink-0 max-sm:text-xs max-sm:!px-8"
                  :class="{ 'w-full': !showAdminVerificationActions }"
                  @click="openEditProfileModal"
                >
                  <PhPencil />

                  <span class="ml-8">Редагувати {{ window.width.value > 650 ? ' профіль' : '' }}</span>
                </el-button>
              </div>

              <el-button
                v-if="isProfilePage && !player.steamId"
                :loading="linkingSteam"
                class="h-30 w-full"
                @click="handleSteamLink"
              >
                <Icon :size="16" name="steam" />

                <span class="ml-8">
                  Прив'язати Steam
                </span>
              </el-button>
            </div>

            <!-- FOOTER -->
            <div
              class="flex items-center justify-between gap-20
                border-t border-gray-800/60 pt-16 px-10"
            >
              <!-- Roles: один рядок; при переповненні — горизонтальний скрол у PlayerRoleTag -->
              <div
                v-if="player"
                class="min-w-0 flex flex-1 items-center gap-8"
              >
                <PlayerRoleTag
                  :user="player"
                  :max="window.width.value < 1280 ? 1 : 2"
                  no-wrap
                />
              </div>

              <!-- Socials: Steam та Dotabuff лише за наявності steamId -->
              <div class="flex shrink-0 gap-8">
                <el-button
                  v-if="player.steamId"
                  class="!size-36 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.steam"
                >
                  <Icon :size="16" name="steam" />
                </el-button>

                <el-button
                  v-if="player.steamId"
                  class="!size-36 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.dotabuff"
                >
                  <Icon :size="16" name="dotabuff" />
                </el-button>

                <el-button
                  v-if="player.discordId"
                  class="!size-36 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.discord"
                >
                  <Icon :size="16" name="discord" />
                </el-button>
              </div>
            </div>
          </div>

          <!-- Статистика матчів -->
          <div
            class="
              rounded-2xl
              border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 2md:p-24
              shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
              flex flex-col items-stretch gap-16
            "
          >
            <h3
              class="text-center text-[14px] font-medium uppercase tracking-[0.22em] text-gray-500"
            >
              Статистика
            </h3>

            <div
              class="
                grid w-full grid-cols-2 gap-10 mt-20
                2md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)]
                2md:items-stretch 2md:gap-10
              "
            >
              <!-- Матчі: на мобільному на всю ширину; перемоги та поразки — в один рядок під ним -->
              <div
                class="col-span-2 2md:col-span-1 2md:min-w-0
                  group flex min-h-0 min-w-0 flex-col
                "
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                        tracking-widest text-gray-500"
                  >
                    Матчі
                  </span>

                  <p
                    class="inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-1.5
                      text-center text-base font-medium tabular-nums leading-none tracking-tight
                      text-white/95"
                  >
                    <span>{{ matchStats.total }}</span>
                    <span :class="matchStats.winrateClass">
                      ({{ matchStats.winrateText }}%)
                    </span>
                  </p>
                </div>
              </div>

              <!-- Перемоги -->
              <div
                class="2md:min-w-0 group flex min-w-0 flex-col"
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                      tracking-widest text-gray-500"
                  >
                    Перемоги
                  </span>
                  <span
                    class="text-base font-medium tabular-nums leading-none
                      text-emerald-300/90"
                  >
                    {{ matchStats.wins }}
                  </span>
                </div>
              </div>

              <!-- Поразки -->
              <div
                class="2md:min-w-0 group flex min-w-0 flex-col"
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                      tracking-widest text-gray-500"
                  >
                    Поразки
                  </span>
                  <span
                    class="text-base font-medium tabular-nums leading-none
                      text-red-300/90"
                  >
                    {{ matchStats.losses }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Профіль /me: команда (50%) + позиції (50%); на мобільному — стовпчик -->
        <div
          v-if="isProfilePage && player"
          class="grid w-full grid-cols-1 gap-20 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-14
              rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:p-24"
          >
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div class="max-w-[90%] text-sm leading-relaxed text-gray-400">
              Інформація про команду недоступна
            </div>
          </div>

          <div
            class="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-14
              rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:p-24"
          >
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              v-if="profilePositionRows.length"
              class="flex w-full flex-wrap justify-center gap-10"
            >
              <div
                v-for="row in profilePositionRows"
                :key="row.id"
                class="inline-flex items-center gap-10 rounded-xl border border-white/10
                  bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                  px-14 py-10 text-left
                  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                  transition duration-200 hover:-translate-y-px hover:border-white/15"
              >
                <component
                  :is="row.icon"
                  :size="22"
                  weight="duotone"
                  class="shrink-0 text-primary"
                />
                <span class="text-sm font-medium leading-tight text-white">{{ row.label }}</span>
              </div>
            </div>
            <p
              v-else
              class="max-w-[90%] text-sm text-gray-500"
            >
              Позиції не вказані. Їх можна додати при редагуванні профілю.
            </p>
          </div>
        </div>

        <!-- Чужий профіль `/players/:id`: команда + позиції (публічно), як layout на `/me` -->
        <div
          v-else-if="player && !isProfilePage"
          class="grid w-full grid-cols-1 gap-20 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-14
              rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:p-24"
          >
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div class="max-w-[90%] text-sm leading-relaxed text-gray-400">
              Інформація про команду недоступна
            </div>
          </div>

          <div
            class="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-14
              rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:p-24"
          >
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              v-if="profilePositionRows.length"
              class="flex w-full flex-wrap justify-center gap-10"
            >
              <div
                v-for="row in profilePositionRows"
                :key="row.id"
                class="inline-flex items-center gap-10 rounded-xl border border-white/10
                  bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                  px-14 py-10 text-left
                  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                  transition duration-200 hover:-translate-y-px hover:border-white/15"
              >
                <component
                  :is="row.icon"
                  :size="22"
                  weight="duotone"
                  class="shrink-0 text-primary"
                />
                <span class="text-sm font-medium leading-tight text-white">{{ row.label }}</span>
              </div>
            </div>
            <p
              v-else
              class="max-w-[90%] text-sm text-gray-500"
            >
              Позиції не вказані
            </p>
          </div>
        </div>

        <!-- ================= STATS SECTION ================= -->
        <div class="flex flex-wrap justify-center gap-20 w-full">
          <!-- TODO: endpoint not in API yet (opendota heroes, positions) -->
          <div
            class="
              rounded-2xl
              border-2 border-gray-800/80
              bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-gray-950/80
              p-24
              shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              flex-1
            "
          >
            <div class="flex flex-col items-center gap-16">
              <span class="text-sm uppercase tracking-[0.2em] text-gray-400">Статистика</span>
              <span class="text-gray-600 text-sm">Дані недоступні</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhCopy,
  PhSealCheck,
  // PhInfo,
  PhUser,
  PhSealWarning,
  PhPencil
} from '@phosphor-icons/vue'

import {
  getCopy,
  getSteamProfileUrl,
  getDotabuffProfileUrl,
  getDiscordProfileUrl,
  getPlayerMatchStats,
  getPlayerRankImageSrc,
  formatPlayerRatingMmr,
  getPlayerDotaPositions,
  isPlayerVerified
} from '@/core/helpers'
import { positionOptions } from '@/components/player-tags/player.constants'
import { routeNames } from '@/router/route-names'
import { playersService } from '@/views/players/players.service'
import type { TPlayer } from '@/api/types/api.types'

const route = useRoute()
const router = useRouter()
const player = ref<TPlayer | null>(null)

const { open } = useAppModals()
const window = useWindowSize()

const playerStore = usePlayersStore()
const me = useAuthStore()

const loading = ref(false)
const linkingSteam = ref(false)
const verifyLoading = ref(false)

const links = computed(() => {
  return {
    discord: getDiscordProfileUrl(player.value?.discordId),
    steam: getSteamProfileUrl(player.value?.steamId),
    dotabuff: getDotabuffProfileUrl(player.value?.steamId)
  }
})

const rankImageSrc = computed(() => getPlayerRankImageSrc(player.value?.rank?.numericName))
const ratingMmrLabel = computed(() => formatPlayerRatingMmr(player.value?.rating))

const isVerified = computed(() => isPlayerVerified(player.value))

const matchStats = computed(() => getPlayerMatchStats(player.value))

const showAdditionalInfo = computed(() => {
  return route.name === routeNames.profile || me.isAdmin.isAdmin || me.isAdmin.isModerator
})

/** Адмін/модер: верифікація на `/players/:id` (навіть своєму id) та на профілі `/me`. */
const showAdminVerificationActions = computed(() => {
  if (!(me.isAdmin.isAdmin || me.isAdmin.isModerator)) return false
  if (!player.value || !me.user) return false
  if (route.name === routeNames.profile) return true
  if (route.name === routeNames.player) return true
  return false
})

const isProfilePage = computed(() => route.name === routeNames.profile)

/** Позиції Dota з `positionOptions` (ті самі іконки, що в фільтрах) — для /me */
const profilePositionRows = computed(() => {
  if (!player.value) return []
  const ids = getPlayerDotaPositions(player.value)
  return ids
    .map((id) => {
      const opt = positionOptions.find((o) => o.value === id)
      if (!opt) return null
      return { id, label: opt.label, icon: opt.icon }
    })
    .filter((x): x is { id: number; label: string; icon: (typeof positionOptions)[0]['icon'] } => x != null)
})

// const isAdminOrModerator = computed(() => {
//   return (me.isAdmin.isAdmin || me.isAdmin.isModerator) && route.name !== routeNames.profile
// })

// TODO: endpoint not in API yet (/players/me)
// const canRequestVerification = computed(() => false)

// TODO: endpoint not in API yet (invitePlayerToTeam)
// const canInvitePlayer = computed(() => false)
// const inviting = ref(false)

watch(() => route.name, async () => {
  if (route.name === routeNames.player || route.name === routeNames.profile) { await onOpen() }
})

async function onOpen () {
  const id = String(route.params.id)
  const isMePage = route.name === routeNames.profile

  loading.value = true
  try {
    if (isMePage) {
      if (!me.user && me.token) {
        await me.fetchUser()
      }
      player.value = me.user as unknown as TPlayer
    } else {
      player.value = await playerStore.findPlayer(id)
    }
    if (!player.value) throw new Error()
  } catch {
    router.push('/')
  } finally {
    loading.value = false
  }
}

async function handleSteamLink () {
  linkingSteam.value = true
  try {
    await me.linkSteam()
  } catch {
    ElMessage.error('Не вдалося отримати посилання для Steam. Спробуйте ще раз.')
    linkingSteam.value = false
  }
}

async function togglePlayerVerification () {
  if (!player.value || verifyLoading.value) return

  verifyLoading.value = true
  try {
    const wantVerified = !isVerified.value
    const updated = await playersService.setPlayerVerificationByAdmin(
      player.value.id,
      wantVerified
    )

    if (updated) {
      player.value = updated
      const list = playerStore.players
      const ix = list.findIndex(p => p.id === updated.id)
      if (ix !== -1) {
        list.splice(ix, 1, updated)
      }
    }
  } finally {
    verifyLoading.value = false
  }
}

function openEditProfileModal () {
  if (!player.value) return

  open('PLayerEditProfileModal', {
    player: player.value,
    onUpdated: async (updated: TPlayer) => {
      player.value = updated
      if (route.name === routeNames.profile) {
        await me.fetchUser()
        player.value = me.user as unknown as TPlayer
      }
    }
  })
}

onMounted(async () => {
  await onOpen()

  const steamLinked = route.query.steam_linked
  const steamError = route.query.steam_error

  if (steamLinked === 'true') {
    ElMessage.success("Steam акаунт успішно прив'язано!")
    await me.fetchUser()
    player.value = me.user as unknown as TPlayer
    router.replace({ name: routeNames.profile })
  } else if (steamError) {
    ElMessage.error(`Помилка прив'язки Steam: ${steamError}`)
    router.replace({ name: routeNames.profile })
  }
})
</script>
