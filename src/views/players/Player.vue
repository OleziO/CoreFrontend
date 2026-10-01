<template>
  <div
    v-loading.fullscreen="loading"
    class="w-full relative overflow-y-auto px-20 lg:px-40"
    :style="vipFrameStyle"
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
            :class="roleAccentClass"
            :player="player"
            :player-tags="playerTags"
            :is-verified="isVerified"
            :rank-image-src="rankImageSrc"
            :rating-mmr-label="ratingMmrLabel"
            :verify-loading="verifyLoading"
            :show-admin-verification-actions="showAdminVerificationActions"
            :show-additional-info="showAdditionalInfo"
            :linking-steam="linkingSteam"
            :is-profile-page="isProfilePage"
            :links="links"
            :can-view-links="canViewLinks"
            :can-request-mmr="canRequestMmr"
            :pending-mmr-request="pendingMmrRequest"
            :show-friend-actions="showFriendActions"
            :friend-relation="friendRelation"
            :friend-busy="friendBusy"
            :challenging="challenging"
            @toggle-verification="togglePlayerVerification"
            @open-vip="open('VipModal')"
            @edit-profile="openEditProfileModal"
            @link-steam="handleSteamLink"
            @request-mmr="openRequestMmrModal"
            @add-friend="friendsStore.sendRequest(player.id)"
            @accept-friend="friendRelation.requestId && friendsStore.acceptRequest(friendRelation.requestId)"
            @cancel-friend-request="friendRelation.requestId && friendsStore.cancelRequest(friendRelation.requestId)"
            @remove-friend="confirmRemoveFriend"
            @challenge="challengeFriend"
          />
          <PlayerMatchStats
            :class="roleAccentClass"
            :stats="matchStats"
            :loading="matchStatsPending"
            :error="matchStatsError"
          />
        </div>

        <!-- Досягнення: місця в турнірах і рекорди платформи — на всю ширину, над локацією -->
        <PlayerAchievements
          v-if="player"
          :class="roleAccentClass"
          :achievements="achievements"
          :is-pending="achievementsPending"
          :is-error="achievementsError"
          :is-empty="achievementsEmpty"
        />

        <!-- Дуелі: рейтинг, W/L і останні матчі — під досягненнями -->
        <PlayerDuelStats
          v-if="player"
          :class="roleAccentClass"
          :player-id="player.id"
        />

        <!-- Локація + «Хочу грати» — на обох профілях, над улюбленими героями -->
        <PlayerPlayPreferences
          v-if="player"
          :player="player"
          :is-profile-page="isProfilePage"
          :accent-class="roleAccentClass"
        />

        <!-- Улюблені герої (OpenDota + Steam CDN) -->
        <PlayerFavoriteHeroes
          :class="roleAccentClass"
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
            class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
              px-16 py-16 text-center 2md:px-20 2md:py-18"
            :class="roleAccentClass"
          >
            <h2 class="section-title shrink-0">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <PlayerTeamTile
                v-if="playerTeamLinkId"
                :team-id="playerTeamLinkId"
                :team="profileTeam"
                :player-id="player.id"
              />
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
            class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
              px-16 py-16 text-center 2md:px-20 2md:py-18"
            :class="roleAccentClass"
          >
            <h2 class="section-title shrink-0">
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
                  class="position-chip inline-flex items-center gap-8 rounded-lg px-12 py-8 text-left"
                >
                  <component
                    :is="row.icon"
                    :size="22"
                    weight="duotone"
                    class="position-chip__icon shrink-0 text-primary"
                  />
                  <span class="font-display text-[12px] uppercase tracking-wide leading-tight text-white">
                    {{ row.label }}
                  </span>
                </div>
              </div>
              <p
                v-else
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500 px-12 py-12 rounded-xl border
                  border-dashed border-primary/20 bg-black/20"
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
            class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
              px-16 py-16 text-center 2md:px-20 2md:py-18"
            :class="roleAccentClass"
          >
            <h2 class="section-title shrink-0">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <PlayerTeamTile
                v-if="playerTeamLinkId"
                :team-id="playerTeamLinkId"
                :team="profileTeam"
                :player-id="player.id"
              />
              <div
                v-else
                class="flex w-full flex-col items-center justify-center gap-8 rounded-xl border border-dashed
                  border-primary/20 bg-black/20 px-12 py-16 text-center"
              >
                <PhUsersThree :size="26" weight="duotone" class="text-primary/50" />
                <span class="text-sm text-gray-500">Інформація про команду недоступна</span>
              </div>
            </div>
          </div>

          <div
            class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
              px-16 py-16 text-center 2md:px-20 2md:py-18"
            :class="roleAccentClass"
          >
            <h2 class="section-title shrink-0">
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
                  class="position-chip inline-flex items-center gap-8 rounded-lg px-12 py-8 text-left"
                >
                  <component
                    :is="row.icon"
                    :size="22"
                    weight="duotone"
                    class="position-chip__icon shrink-0 text-primary"
                  />
                  <span class="font-display text-[12px] uppercase tracking-wide leading-tight text-white">
                    {{ row.label }}
                  </span>
                </div>
              </div>
              <p
                v-else
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500 px-12 py-12 rounded-xl border
                  border-dashed border-primary/20 bg-black/20"
              >
                Позиції не вказані
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Pending MMR request notification -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="isProfilePage && !mmrNotificationDismissed && pendingMmrRequest?.status === 'pending'"
        class="fixed bottom-32 right-24 z-50 w-[420px] rounded-2xl
               border border-white/10
               shadow-[0_20px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
        style="background: rgba(13,18,35,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
      >
        <!-- Header -->
        <div class="flex items-center gap-8 px-16 pt-14 pb-10 border-b border-white/[0.07]">
          <PhClockCountdown :size="15" weight="duotone" class="text-primary shrink-0" />
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Запит на оновлення MMR
          </span>
          <span class="ml-auto flex items-center gap-5 text-[10px] font-semibold text-warning">
            <span class="inline-block w-5 h-5 rounded-full bg-warning animate-pulse" />
            Pending
          </span>
          <el-button
            text
            size="small"
            class="btn-icon ml-8"
            aria-label="Закрити"
            @click="mmrNotificationDismissed = true"
          >
            <PhX :size="13" weight="bold" />
          </el-button>
        </div>

        <!-- Body -->
        <div class="px-16 py-14 flex flex-col gap-12">
          <!-- MMR change -->
          <div class="flex items-center gap-10">
            <span class="text-2xl font-bold tabular-nums text-gray-400">
              {{ pendingMmrRequest?.oldMmr }}
            </span>
            <PhArrowRight :size="16" class="text-gray-600 shrink-0" />
            <span class="text-2xl font-bold tabular-nums text-white">
              {{ pendingMmrRequest?.newMmr }}
            </span>
          </div>

          <!-- Proof thumbnails -->
          <div v-if="pendingMmrRequest?.proofs?.length" class="flex gap-6">
            <img
              v-for="proof in pendingMmrRequest.proofs"
              :key="proof.id"
              :src="proof.url"
              :alt="proof.name"
              class="h-[40px] w-[71px] rounded-md object-cover border border-white/10"
            >
          </div>

          <!-- Date -->
          <span class="text-xs text-gray-500">
            Подано {{ dayjs(pendingMmrRequest?.createdAt).format('DD.MM.YYYY') }}
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  PhUsersThree,
  PhArrowRight,
  PhClockCountdown,
  PhX
} from '@phosphor-icons/vue'
import dayjs from 'dayjs'
import type { TMmrUpdateRequest } from '@/views/players/mmr-requests.service'

import {
  getSteamProfileUrl,
  getDotabuffProfileUrl,
  getDiscordProfileUrl,
  getPlayerRankImageSrcFromPlayerRank,
  formatPlayerRatingMmr,
  getPlayerDotaPositions,
  getPlayerRoleAccentClass,
  getPlayerVipFrameStyle,
  canViewPlayerProfileLinks,
  isPlayerVerified
} from '@/core/helpers'
import { positionOptions } from '@/components/player-tags/player.enums'
import { routeNames } from '@/router/route-names'
import type { TTag } from '@/services/tags.types'
import type { TCreateTeamPayload } from '@/views/teams/teams.service'
import { usePlayerFavoriteHeroes } from '@/views/players/composables/use-player-heroes'
import { usePlayerMatchStats } from '@/views/players/composables/use-player-match-stats'
import { usePlayerAchievements } from '@/views/players/composables/use-player-achievements'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { useSeo } from '@/composables/use-seo'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
/** Модераційні теги гравця (лише для адмін/модер перегляду) — не входять у `TPlayer`. */
const playerTags = ref<TTag[]>([])

const { open, close } = useAppModals()

const playerStore = usePlayersStore()
const teamsStore = useTeamsStore()
const me = useAuthStore()

/** Джерело істини — стори (/me → auth, інакше players); мутації патчать їх, тож сторінка оновлюється сама. */
const routePlayerId = computed(() => String(route.params.id ?? ''))
const player = computed<TPlayer | null>(() =>
  route.name === routeNames.profile
    ? (me.user as TPlayer | null)
    : (playerStore.players.find((p) => p.id === routePlayerId.value) ?? null)
)

useSeo(() => ({
  title: route.name === routeNames.profile
    ? 'Мій профіль'
    : (player.value?.discordName ? `${player.value.discordName} — гравець Dota 2` : undefined)
}))

const loading = ref(false)
const linkingSteam = ref(false)
const verifyLoading = ref(false)

/** Steam / Dotabuff / Discord — перк VIP (а також медіа, адмінів і власного профілю). */
const canViewLinks = computed(() => canViewPlayerProfileLinks(me.user, player.value?.id))

const links = computed(() => {
  if (!canViewLinks.value) return { discord: undefined, steam: undefined, dotabuff: undefined }
  return {
    discord: getDiscordProfileUrl(player.value?.discordId),
    steam: getSteamProfileUrl(player.value?.steamId),
    dotabuff: getDotabuffProfileUrl(player.value?.steamId)
  }
})

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(player.value?.rank))
const ratingMmrLabel = computed(() => formatPlayerRatingMmr(player.value?.rating))

const isVerified = computed(() => isPlayerVerified(player.value))

/** Рольовий акцент рамок профілю (`.role-frame--*`): адмін — золото, медіа — фіолет. */
const roleAccentClass = computed(() => getPlayerRoleAccentClass(player.value))
/** `--vip-frame-rgb` на корені сторінки: усі рамки з `.role-frame--vip` успадковують колір. */
const vipFrameStyle = computed(() => getPlayerVipFrameStyle(player.value))

/** Матчі у турнірах платформи — окремий запит, бо не входять у `TPlayer`. */
const {
  stats: matchStats,
  isPending: matchStatsPending,
  isError: matchStatsError
} = usePlayerMatchStats(() => player.value?.id)

/** Трофеї профілю — окремий запит, обчислюється на беку з результатів турнірів. */
const {
  achievements,
  isPending: achievementsPending,
  isError: achievementsError,
  isEmpty: achievementsEmpty
} = usePlayerAchievements(() => player.value?.id)

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

const canRequestMmr = computed(() =>
  isProfilePage.value &&
  isVerified.value
)

// ─── Друзі та виклик на дуель: лише на чужому профілі залогіненого користувача ──
const friendsStore = useFriendsStore()
const { isBusy: isChallengeBusy, challenge } = useDuelChallenges()

const showFriendActions = computed(() =>
  !!me.token && !isProfilePage.value && !!player.value && player.value.id !== me.user?.id
)
const friendRelation = computed<TFriendRelationState>(() => friendsStore.relationWith(player.value?.id))
const friendBusy = computed(() => {
  const id = player.value?.id
  if (!id) return false
  const requestId = friendRelation.value.requestId
  return friendsStore.isBusy(id) || (!!requestId && friendsStore.isBusy(requestId))
})
const challenging = computed(() => !!player.value && isChallengeBusy(player.value.id))

watch(
  showFriendActions,
  (show) => {
    if (show) friendsStore.fetchOverview().catch(() => { /* кнопки покажуть стан «нема зв'язку» */ })
  },
  { immediate: true }
)

async function challengeFriend () {
  if (!player.value) return
  if (await challenge(player.value.id)) router.push({ name: routeNames.duels })
}

async function confirmRemoveFriend () {
  if (!player.value) return
  const name = player.value.discordName || 'гравця'
  try {
    await ElMessageBox.confirm(
      `Видалити ${name} з друзів? Дружні дуелі з цим гравцем стануть недоступні.`,
      'Видалити з друзів',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Скасувати', type: 'warning' }
    )
  } catch {
    return
  }
  await friendsStore.removeFriend(player.value.id)
}

const pendingMmrRequest = ref<TMmrUpdateRequest | null>(null)
const mmrNotificationDismissed = ref(false)

const playerTeamLinkId = computed(() => {
  const id = player.value?.teamId
  if (id == null || id === '') return null
  return String(id)
})

/** Команда гравця — зі стору (реактивно); GET /teams/:id лише якщо її в сторі ще немає. */
const profileTeam = computed(() =>
  playerTeamLinkId.value ? (teamsStore.teams.find((t) => t.id === playerTeamLinkId.value) ?? null) : null
)
const profileTeamLoading = ref(false)

watch(
  playerTeamLinkId,
  async (teamId) => {
    if (!teamId) return
    profileTeamLoading.value = true
    await teamsStore.ensureTeam(teamId)
    profileTeamLoading.value = false
  },
  { immediate: true }
)

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
  const isMePage = route.name === routeNames.profile
  loading.value = true
  try {
    // Cache-first: гравець зі стору без запиту; GET /players/:id лише коли його там ще немає.
    if (!isMePage) await playerStore.ensurePlayer(routePlayerId.value)
    if (!player.value) router.push('/')
    await loadPlayerTags()
  } finally {
    loading.value = false
  }
}

/** Теги бачать і редагують лише адмін/модер (та сама умова, що й верифікаційні дії). */
async function loadPlayerTags () {
  if (!player.value || !showAdminVerificationActions.value) {
    playerTags.value = []
    return
  }
  try {
    playerTags.value = await tagsService.fetchPlayerTags(player.value.id)
  } catch {
    playerTags.value = []
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
    await playerStore.setPlayerVerification(player.value.id, !isVerified.value)
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
  await router.push({ name: routeNames.team, params: { id: created.id } })
}

function openCreateTeamModal () {
  open('TeamCreateModal', {
    onSubmit: handleCreateTeam
  })
}

function openRequestMmrModal () {
  open('PlayerRequestMmrModal', {})
}

function openEditProfileModal () {
  if (!player.value) return

  open('PlayerEditProfileModal', {
    player: player.value,
    // Стори вже оновлено через playersStore; для /me додатково перечитуємо /auth/me (серверні поля, ролі).
    onUpdated: async () => {
      if (route.name === routeNames.profile) await me.fetchUser()
    },
    onTagsUpdated: (tags: TTag[]) => {
      playerTags.value = tags
    }
  })
}

onMounted(async () => {
  await onOpen()
  if (isProfilePage.value) {
    mmrNotificationDismissed.value = false
    pendingMmrRequest.value = await mmrRequestsService.getMyRequest().catch(() => null)
  }
  const result = me.handleSteamCallback(route.query)
  if (result === 'linked') {
    await me.fetchUser()
    router.replace({ name: routeNames.profile })
  } else if (result === 'error') {
    router.replace({ name: routeNames.profile })
  }
})
</script>

<style scoped lang="scss">
// Position chip: cyan-tinted well with a glowing role icon.
.position-chip {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(var(--ds-primary-rgb), 0.06);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.position-chip__icon {
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));
}

@media (hover: hover) and (pointer: fine) {
  .position-chip:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.1);
    box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.2), var(--ds-glow-primary-soft);
  }
}
</style>
