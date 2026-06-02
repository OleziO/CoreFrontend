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
          <PlayerProfileHeader
            v-if="player"
            :player="player"
            :is-verified="isVerified"
            :rank-image-src="rankImageSrc"
            :rating-mmr-label="ratingMmrLabel"
            :verify-loading="verifyLoading"
            :show-admin-verification-actions="showAdminVerificationActions"
            :show-additional-info="showAdditionalInfo"
            :linking-steam="linkingSteam"
            :is-profile-page="isProfilePage"
            :links="links"
            @toggle-verification="togglePlayerVerification"
            @edit-profile="openEditProfileModal"
            @link-steam="handleSteamLink"
          />
          <PlayerMatchStats :match-stats="matchStats" />
        </div>

        <!-- Улюблені герої (OpenDota + Steam CDN) -->
        <PlayerFavoriteHeroes
          :has-account="favoriteHeroesHasAccount"
          :is-pending="favoriteHeroesPending"
          :is-error="favoriteHeroesError"
          :is-empty="favoriteHeroesEmpty"
          :heroes="favoriteHeroes"
          :skeleton-count="favoriteHeroesSkeletons"
        />

        <!-- Профіль /me: команда (50%) + позиції (50%); на мобільному — стовпчик -->
        <div
          v-if="isProfilePage && player"
          class="grid w-full grid-cols-1 gap-16 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <template v-if="playerTeamLinkId">
                <RouterLink
                  :to="{ name: routeNames.team, params: { id: playerTeamLinkId } }"
                  class="group flex w-full max-w-full min-w-0 cursor-pointer items-start gap-16 rounded-xl
                    border border-white/10 bg-white/[0.03] px-12 py-12 no-underline
                    transition hover:border-white/15 hover:bg-white/[0.06]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <div
                    class="relative h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]
                      shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-gray-800/80"
                  >
                    <img
                      v-if="profileTeamLogoSrc"
                      :src="profileTeamLogoSrc"
                      alt=""
                      class="pointer-events-none h-full w-full object-cover"
                    >
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-white/35"
                    >
                      <PhUsersThree :size="24" weight="duotone" />
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3
                      class="truncate text-lg font-semibold text-white transition group-hover:text-primary/90"
                    >
                      {{ profileTeam?.name ?? 'Команда' }}
                    </h3>
                    <span
                      v-if="profileTeamDotaTeamIdDisplay"
                      class="mt-4 flex w-fit max-w-full items-center gap-6 text-xs text-gray-400
                        transition hover:text-primary cursor-pointer"
                      @click.stop.prevent="
                        getCopy(profileTeamDotaTeamIdDisplay, 'Dota ID команди скопійовано')
                      "
                    >
                      {{ profileTeamDotaTeamIdDisplay }}
                      <PhCopy size="13" />
                    </span>
                  </div>
                </RouterLink>
              </template>
              <template v-else>
                <div class="flex w-full justify-center">
                  <el-button type="primary" @click="openCreateTeamModal">
                    Створити команду
                  </el-button>
                </div>
              </template>
            </div>
          </div>

          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8"
            >
              <div
                v-if="profilePositionRows.length"
                class="flex w-full flex-wrap justify-center gap-8"
              >
                <div
                  v-for="row in profilePositionRows"
                  :key="row.id"
                  class="inline-flex items-center gap-8 rounded-lg border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-12 py-7 text-left
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
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500"
              >
                Позиції не вказані. Їх можна додати при редагуванні профілю.
              </p>
            </div>
          </div>
        </div>

        <!-- Чужий профіль `/players/:id`: команда + позиції (публічно), як layout на `/me` -->
        <div
          v-else-if="player && !isProfilePage"
          class="grid w-full grid-cols-1 gap-16 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <RouterLink
                v-if="playerTeamLinkId"
                :to="{ name: routeNames.team, params: { id: playerTeamLinkId } }"
                class="group flex w-full max-w-full min-w-0 cursor-pointer items-start gap-16 rounded-xl
                  border border-white/10 bg-white/[0.03] px-12 py-12 no-underline
                  transition hover:border-white/15 hover:bg-white/[0.06]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div
                  class="relative h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]
                    shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-gray-800/80"
                >
                  <img
                    v-if="profileTeamLogoSrc"
                    :src="profileTeamLogoSrc"
                    alt=""
                    class="pointer-events-none h-full w-full object-cover"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-white/35"
                  >
                    <PhUsersThree :size="24" weight="duotone" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-lg font-semibold text-white transition group-hover:text-primary/90">
                    {{ profileTeam?.name ?? 'Команда' }}
                  </h3>
                  <span
                    v-if="profileTeamDotaTeamIdDisplay"
                    class="mt-4 flex w-fit max-w-full items-center gap-6 text-xs text-gray-400
                      transition hover:text-primary cursor-pointer"
                    @click.stop.prevent="
                      getCopy(profileTeamDotaTeamIdDisplay, 'Dota ID команди скопійовано')
                    "
                  >
                    {{ profileTeamDotaTeamIdDisplay }}
                    <PhCopy size="13" />
                  </span>
                </div>
              </RouterLink>
              <span v-else class="block w-full text-center text-sm text-gray-500">
                Інформація про команду недоступна
              </span>
            </div>
          </div>

          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8"
            >
              <div
                v-if="profilePositionRows.length"
                class="flex w-full flex-wrap justify-center gap-8"
              >
                <div
                  v-for="row in profilePositionRows"
                  :key="row.id"
                  class="inline-flex items-center gap-8 rounded-lg border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-12 py-7 text-left
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
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500"
              >
                Позиції не вказані
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhCopy,
  PhUsersThree
} from '@phosphor-icons/vue'

import {
  getCopy,
  getSteamProfileUrl,
  getDotabuffProfileUrl,
  getDiscordProfileUrl,
  getPlayerMatchStats,
  getPlayerRankImageSrcFromPlayerRank,
  formatPlayerRatingMmr,
  getPlayerDotaPositions,
  isPlayerVerified,
  resolvePublicOrApiUrl
} from '@/core/helpers'
import { positionOptions } from '@/components/player-tags/player.enums'
import { routeNames } from '@/router/route-names'
import { playersService } from '@/views/players/players.service'
import type { TCreateTeamPayload } from '@/views/teams/teams.service'
import { teamsService } from '@/views/teams/teams.service'
import { usePlayerFavoriteHeroes } from '@/views/players/composables/use-player-heroes'

const route = useRoute()
const router = useRouter()
const player = ref<TPlayer | null>(null)

const { open, close } = useAppModals()

const playerStore = usePlayersStore()
const teamsStore = useTeamsStore()
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

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(player.value?.rank))
const ratingMmrLabel = computed(() => formatPlayerRatingMmr(player.value?.rating))

const isVerified = computed(() => isPlayerVerified(player.value))

const matchStats = computed(() => getPlayerMatchStats(player.value))

const {
  hasAccount: favoriteHeroesHasAccount,
  heroes: favoriteHeroes,
  isPending: favoriteHeroesPending,
  isError: favoriteHeroesError,
  isEmpty: favoriteHeroesEmpty
} = usePlayerFavoriteHeroes(() => player.value?.steamId)

/** Скільки скелетів показати при завантаженні (= ліміт у composable). */
const favoriteHeroesSkeletons = 3

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

const playerTeamLinkId = computed(() => {
  const id = player.value?.teamId
  if (id == null || id === '') return null
  return String(id)
})

const profileTeam = shallowRef<TTeam | null>(null)
const profileTeamLoading = ref(false)

watch(
  playerTeamLinkId,
  async (teamId) => {
    profileTeam.value = null
    if (!teamId) return
    profileTeamLoading.value = true
    profileTeam.value = await teamsService.fetchTeam(teamId, { silent: true }).catch(() => null)
    profileTeamLoading.value = false
  },
  { immediate: true }
)

const profileTeamLogoSrc = computed(() =>
  resolvePublicOrApiUrl(profileTeam.value?.logoUrl)
)

/** Dota Team ID з API для підпису та копіювання */
const profileTeamDotaTeamIdDisplay = computed(() => {
  const raw = profileTeam.value?.dotaTeamId
  if (raw == null || String(raw).trim() === '') return null
  return String(raw).trim()
})

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
    player.value = isMePage ? (me.user as TPlayer) : await playerStore.findPlayer(id)
    if (!player.value) router.push('/')
  } finally {
    loading.value = false
  }
}

async function handleSteamLink () {
  linkingSteam.value = true
  await me.linkSteam().finally(() => { linkingSteam.value = false })
}

async function togglePlayerVerification () {
  if (!player.value || verifyLoading.value) return
  verifyLoading.value = true
  try {
    const updated = await playersService.setPlayerVerificationByAdmin(player.value.id, !isVerified.value)
    if (updated) {
      player.value = updated
      playerStore.patchPlayerInList(updated)
    }
  } finally {
    verifyLoading.value = false
  }
}

async function handleCreateTeam (dto: TCreateTeamPayload) {
  const created = await teamsStore.createTeam(dto)
  if (!created) {
    throw new Error('CREATE_TEAM_FAILED')
  }
  close('TeamCreateModal')
  await me.fetchUser()
  player.value = me.user as TPlayer
  await router.push({ name: routeNames.team, params: { id: created.id } })
}

function openCreateTeamModal () {
  open('TeamCreateModal', {
    onSubmit: handleCreateTeam
  })
}

function openEditProfileModal () {
  if (!player.value) return

  open('PlayerEditProfileModal', {
    player: player.value,
    onUpdated: async (updated: TPlayer) => {
      player.value = updated
      if (route.name === routeNames.profile) {
        await me.fetchUser()
        player.value = me.user as TPlayer
      }
    }
  })
}

onMounted(async () => {
  await onOpen()
  const result = me.handleSteamCallback(route.query)
  if (result === 'linked') {
    await me.fetchUser()
    player.value = me.user as TPlayer
    router.replace({ name: routeNames.profile })
  } else if (result === 'error') {
    router.replace({ name: routeNames.profile })
  }
})
</script>
