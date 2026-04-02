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
                    :src="player.avatar_url ? `${apiPublicUrl}${player.avatar_url}` : ''"
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
                    {{ player.steam_name || '-' }}
                  </h2>

                  <span
                    v-if="player.user_name"
                    class="mt-4 flex w-fit items-center gap-6 text-xs text-gray-400
                 hover:text-primary transition cursor-pointer"
                    @click.stop="getCopy(player.user_name, 'Discord скопійовано')"
                  >
                    @{{ player.user_name }}
                    <PhCopy size="13" />
                  </span>
                </div>
              </div>

              <!-- RIGHT / RANK -->
              <el-tooltip
                v-if="player?.rang?.img_url"
                placement="left"
                :content="`${player.mmr} MMP`"
              >
                <div class="flex flex-col items-center shrink-0 cursor-pointer">
                  <el-image
                    class="!size-42 drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
                    :src="rank"
                  />

                  <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">
                    Ранг
                  </span>
                </div>
              </el-tooltip>
            </div>

            <div class="w-full flex items-center justify-between mt-20 gap-20 p-8">
              <el-button
                v-if="showAdditionalInfo"
                type="primary"
                class="h-30 flex-1"
                @click="isAdminOrModerator ? openAdminMmrModal() : openEditProfileModal()"
              >
                <PhPencil />
                <span class="ml-8">Редагувати {{ window.width.value > 650 ? ' профіль' : '' }}</span>
              </el-button>

              <el-button
                v-if="isAdminOrModerator"
                type="info"
                class="h-30"
                @click.stop="openAddPointsModal"
              >
                <PhCoins />

                <span v-if="window.width.value > 600" class="ml-8">Нарахувати Points</span>
              </el-button>

              <el-button
                v-if="canRequestVerification"
                type="warning"
                class="h-30"
                @click.stop="createVerificationRequest"
              >
                <PhSealCheck />
                <span v-if="window.width.value > 600" class="ml-8">Подати запит на верификацію</span>
              </el-button>

              <el-button
                v-if="!isVerified && (me.isAdmin.isAdmin || me.isAdmin.isModerator)"
                type="success"
                class="h-30"
                @click.stop="verifyPlayer(player.id)"
              >
                <PhCheck />
                <span v-if="window.width.value > 600" class="ml-8">Верифікувати</span>
              </el-button>

              <!-- <el-tooltip
                v-if="me.isAdmin.isAdmin || me.isAdmin.isModerator"
                content="Функціонал в розробці" placement="top"
              >
                <el-button disabled type="danger" class="h-30 invisible">
                  <PhUserMinus />

                  <span v-if="window.width.value > 600" class="ml-8">Заблокувати</span>
                </el-button>
              </el-tooltip> -->
            </div>

            <!-- FOOTER -->
            <div
              class="flex items-center justify-between gap-20
                border-t border-gray-800/60 pt-16 px-10"
            >
              <!-- Roles -->
              <div v-if="player" class="max-w-[40%] flex gap-8 items-center">
                <PlayerRoleTag :user="player" :max="window.width.value < 1280 ? 1 :2" />
              </div>

              <!-- Socials -->
              <div class="flex gap-8">
                <el-button
                  class="!size-36 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.steam"
                >
                  <Icon :size="16" name="steam" />
                </el-button>

                <el-button
                  class="!size-36 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.dotabuff"
                >
                  <Icon :size="16" name="dotabuff" />
                </el-button>

                <el-button
                  v-if="player.discord_id"
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

          <!-- ========== NEW BLOCK: MIX CAP POINTS & BALANCE (стилізований) ========== -->
          <div
            class="
              rounded-2xl
              border-2 border-gray-800/80
              bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-gray-950/80
              p-24
              shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
              flex flex-col items-center gap-20
            "
          >
            <span class="text-sm uppercase tracking-[0.2em] text-gray-400 mb-20 xl:mb-0">
              Статистика
            </span>

            <div
              class="flex gap-14 w-full justify-between flex-wrap h-full items-center mt-0 2md:-mt-20"
            >
              <!-- Порядність -->
              <div class="flex flex-1 gap-14">
                <div
                  class="
                    group
                    flex flex-col items-center justify-between
                    h-96 min-w-96
                    p-24 flex-1
                    rounded-2xl
                    bg-gray-800/60
                    shadow-inner
                    transition
                    hover:-translate-y-1
                  "
                >
                  <span class="text-xs uppercase text-center tracking-widest text-gray-400 cursor-default">
                    Порядність
                  </span>

                  <span
                    class="mt-10 text-lg font-semibold text-white cursor-default"
                    :class="[
                      player?.respect || 0 >= 0
                        ? '!text-green-400'
                        : '!text-red-400',
                      {'!text-white': !player?.respect}
                    ]"
                  >
                    {{ player?.respect! > 0 ? '+' : '' }}{{ player?.respect || 0 }}
                  </span>
                </div>
              </div>

              <!-- Mix Cup Points -->
              <div
                v-if="showAdditionalInfo"
                class="
                  group
                  flex flex-col items-center justify-between
                  h-96 min-w-[110px]
                  rounded-2xl
                  p-24 flex-1
                  bg-gray-800/60
                  shadow-inner
                  transition
                  hover:-translate-y-1
                "
              >
                <span
                  class="text-xs uppercase text-center tracking-widest
                    whitespace-nowrap text-gray-400 cursor-default"
                >
                  Core Points
                </span>

                <div class="mt-10 flex gap-4 items-center">
                  <PhChartPolar />
                  <span class="text-lg font-semibold text-white cursor-default">{{ player?.points || 0 }}</span>
                </div>
              </div>

              <div
                class="
                  group
                  flex flex-col items-center justify-between
                  h-96 min-w-96
                  rounded-2xl
                  p-24 flex-1
                  bg-gray-800/60
                  shadow-inner
                  transition
                  hover:-translate-y-1
                "
              >
                <el-tooltip content="Очки участі у подіях (Regular Cup, Mix Cup)" placement="top">
                  <span
                    class="text-xs uppercase text-center tracking-widest
                    whitespace-nowrap text-gray-400 cursor-default"
                  >
                    Участь
                  </span>
                </el-tooltip>

                <div class="mt-10 flex gap-4 items-center">
                  <span class="text-lg font-semibold text-white cursor-default">{{ player?.activity || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="
            rounded-2xl flex justify-between flex-wrap
            border-2 border-gray-800/80
            bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-gray-950/80
            p-24
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            flex-1
          "
          :class="{'!cursor-pointer': player?.team_id}"
          @click="player?.team_id && $router.push({name: routeNames.team, params: {id: player?.team_id}})"
        >
          <div
            v-if="player?.team_id"
            class="flex items-center gap-16 min-w-0 mr-50 mb-20 truncate"
          >
            <!-- Avatar -->
            <div class="relative">
              <el-avatar
                size="large"
                :src="player?.team?.avatar_url ? `${apiPublicUrl}${player?.team?.avatar_url}` : ''"
                class="ring-2 ring-gray-800 shadow-md"
              >
                <template #default>
                  <PhUsersThree size="26" weight="bold" class="text-white/70" />
                </template>
              </el-avatar>
            </div>

            <!-- Names -->
            <div class="min-w-0 flex-1">
              <el-tooltip :content="player?.team?.team_name || '-'" placement="top">
                <h2 class="truncate text-lg font-semibold text-white">
                  {{ player?.team?.team_name || '-' }}
                </h2>
              </el-tooltip>

              <span
                v-if="player?.team?.dota_team_id"
                class="mt-4 flex w-fit items-center gap-6 text-xs text-gray-400
                 hover:text-primary transition cursor-pointer flex-1 lg:flex-none"
                @click.stop="getCopy(player.team.dota_team_id, 'Dota Team ID скопійовано')"
              >
                {{ player.team.dota_team_id }}
                <PhCopy size="13" />
              </span>
            </div>
          </div>

          <div v-if="player?.team_id" class="flex gap-14 w-full lg:w-fit">
            <div
              class="
                  group
                  flex flex-col items-center justify-between
                  h-96 min-w-96
                  rounded-2xl cursor-default
                  p-24 flex-1 lg:flex-none
                  bg-gray-800/60
                  shadow-inner
                  transition
                  hover:-translate-y-1
                "
            >
              <span
                class="text-xs uppercase text-center cursor-default
                     tracking-widest whitespace-nowrap text-gray-400"
              >
                Перемог
              </span>

              <div class="mt-10 flex gap-4 items-center cursor-default">
                <PhTrophy />
                <span class="text-lg font-semibold text-white">{{ player?.team?.wins }}</span>
              </div>
            </div>

            <div
              class="
                  group
                  flex flex-col items-center justify-between
                  h-96 min-w-96
                  rounded-2xl
                  p-24 flex-1
                  bg-gray-800/60
                  shadow-inner cursor-default
                  transition
                  hover:-translate-y-1
                "
            >
              <span
                class="text-xs uppercase text-center tracking-widest
                      whitespace-nowrap cursor-default text-gray-400"
              >
                Учасників
              </span>

              <div class="mt-10 flex gap-4 items-center cursor-default">
                <PhUsersThree />
                <span class="text-lg font-semibold text-white">{{ player?.team_players_count }}</span>
              </div>
            </div>
          </div>

          <div v-else class="w-full h-full flex flex-col justify-center items-center">
            <div class="text-sm tracking-[0.2em] text-gray-400 my-20">Команда відсутня</div>
            <template v-if="showMelInfo">
              <el-button
                type="primary" @click.stop="open('TeamCreateModal', {
                  onSubmit: onTeamCreate
                })"
              >
                <PhPlus size="20" weight="bold" />
                <span class="ml-10 text-sm font-medium">
                  Створити команду
                </span>
              </el-button>
            </template>
            <template v-if="canInvitePlayer">
              <div class="flex flex-col gap-15 mt-20">
                <el-button
                  type="primary"
                  :loading="inviting"
                  @click.stop="invitePlayer(true)"
                >
                  <PhUsersThree size="20" weight="bold" />
                  <span class="ml-10 text-sm font-medium">
                    Запросити до основи команди
                  </span>
                </el-button>

                <el-button
                  type="warning"
                  :loading="inviting"
                  @click.stop="invitePlayer(false)"
                >
                  <PhUsersThree size="20" weight="bold" />
                  <span class="ml-10 text-sm font-medium">
                    Запросити до запасу команди
                  </span>
                </el-button>
              </div>
            </template>
          </div>
        </div>

        <!-- ================= STATS SECTION ================= -->
        <div class="flex flex-wrap justify-center gap-20 w-full">
          <!-- ========== HEROES ========== -->
          <div
            class="
              rounded-2xl
              border-2 border-gray-800/80
              bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-gray-950/80
              p-24
              shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              flex-1
              relative
            "
          >
            <div
              v-if="heroesLoading"
              class="absolute w-full flex-1 inset-0 z-20 flex flex-col items-center
               justify-center bg-[#111827]/90 backdrop-blur-sm transition-all"
            >
              <PhCircleNotch class="animate-spin text-primary" size="32" weight="bold" />
              <span class="mt-2 text-xs font-medium text-gray-400 tracking-wider">Завантаження...</span>
            </div>

            <div class="!w-full flex-1 h-full min-h-[150px]">
              <div class="flex flex-col items-center gap-16">
                <span class="text-sm uppercase tracking-[0.2em] text-gray-400 flex items-center">
                  <el-tooltip placement="top" content="Дані з opendota.com">
                    <PhInfo size="16" weight="bold" class="cursor-pointer" />
                  </el-tooltip>

                  <span class="ml-8">Улюблені герої</span>
                </span>

                <div class="flex flex-1 flex-nowrap min-w-fit gap-14">
                  <template
                    v-if="favoriteHeroes.length &&
                      !Number.isNaN(favoriteHeroes[0].winRate) &&
                      favoriteHeroes[0].winRate > 0"
                  >
                    <div
                      v-for="hero in favoriteHeroes"
                      :key="hero.name"
                      class="
              flex flex-col items-center justify-center
              w-80 h-80 xs:h-96 xs:w-96
              rounded-2xl
              transition
              hover:-translate-y-1
            "
                    >
                      <el-avatar
                        shape="square"
                        :src="hero.image"
                        class="size-32 bg-[transparent] ring-0"
                      >
                        <PhQuestion size="30" />
                      </el-avatar>

                      <div
                        class="mt-8 px-15 py-4 rounded-xl text-xs shadow-inner cursor-default"
                        :class="
                          hero.winRate >= 50
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        "
                      >
                        {{ hero.winRate }}%
                      </div>
                    </div>
                  </template>

                  <span v-else-if="!heroesLoading" class="text-gray-600 text-sm">
                    Герої відсутні
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== POSITIONS ========== -->
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
              <span class="text-sm uppercase tracking-[0.2em] text-gray-400 text-center whitespace-nowrap">
                Улюблені ролі
              </span>

              <div class="flex justify-center flex-wrap 2sm:flex-nowrap lg:min-w-[500px] gap-14">
                <template v-if="playerPositionObjects.length">
                  <div
                    v-for="pos in playerPositionObjects"
                    :key="pos!.value"
                    class="
                    group
                    flex flex-col items-center justify-center
                    h-96 w-96
                    rounded-2xl
                    bg-gray-800/60
                    shadow-inner
                    transition
                    hover:-translate-y-1
                  "
                  >
                    <div
                      class="
                      flex items-center justify-center
                      h-44 w-44 rounded-full
                      bg-gradient-to-br from-primary/20 to-primary/5
                      text-primary
                      shadow-[0_0_20px_rgba(168,85,247,0.25)]
                      transition
                    "
                    >
                      <component
                        :is="pos!.icon"
                        size="24"
                        weight="bold"
                      />
                    </div>

                    <span
                      class="
                      mt-10
                      text-[11px]
                      uppercase tracking-widest
                      text-gray-400 cursor-default
                      group-hover:text-gray-300
                    "
                    >
                      {{ pos!.label }}
                    </span>
                  </div>
                </template>

                <span v-else class="text-gray-600 text-sm">
                  Позиції відсутні
                </span>
              </div>
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
import { ElMessage } from 'element-plus'
import {
  PhCopy,
  PhPlus,
  PhSealCheck,
  PhTrophy,
  PhInfo,
  PhUser,
  PhUsersThree,
  PhSealWarning,
  PhQuestion,
  PhCheck,
  PhPencil,
  PhChartPolar,
  PhCircleNotch,
  PhCoins
} from '@phosphor-icons/vue'

import checkRoles, { getCopy, getDiscordProfileUrl, getDotabuffProfileUrl, getSteamProfileUrl } from '@/core/helpers'
import { ERole } from '@/types/general.types'
import { positionOptions } from '@/components/player-tags/player.constants'
import { routeNames } from '@/router/route-names'

const route = useRoute()
const router = useRouter()
const player = ref<TPlayer | TPlayerMe | null>(null)

const { open, close } = useAppModals()

const window = useWindowSize()

const teamsStore = useTeamsStore()
const playerStore = usePlayersStore()
const me = useAuthStore()

const favoriteHeroes = ref<IDotaHero[]>([])

const loading = ref(false)
const heroesLoading = ref(false)
const inviting = ref(false)
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const links = computed(() => {
  return {
    discord: getDiscordProfileUrl(player.value?.discord_id),
    steam: getSteamProfileUrl(player.value?.steam_id),
    dotabuff: getDotabuffProfileUrl(player.value?.steam_id)
  }
})

const isVerified = computed(
  () => player.value && !checkRoles(player.value.roles || [], ERole.GUEST)
)

const showAdditionalInfo = computed(() => {
  return route.name === routeNames.profile || me.isAdmin.isAdmin || me.isAdmin.isModerator
})
const showMelInfo = computed(() => {
  return route.name === routeNames.profile
})

const isAdminOrModerator = computed(() => {
  return (me.isAdmin.isAdmin || me.isAdmin.isModerator) && route.name !== routeNames.profile
})

const canRequestVerification = computed(() => {
  return (
    !isVerified.value &&
    player.value?.discord_id &&
    player.value?.mmr != null &&
    route.name === routeNames.profile
  )
})

const canInvitePlayer = computed(() => {
  return (
    me.user?.is_cap === true &&
    me.user?.team_id &&
    route.name !== routeNames.profile &&
    !player.value?.team_id
  )
})

const rank = computed(
  () => (player.value ? `/images/ranks/${player.value.rang?.img_url}` : '')
)

const playerPositionObjects = computed(() => {
  if (!player.value?.positions) return []
  const map = new Map(positionOptions.map(p => [p.value, p]))
  return player.value?.positions.map(v => map.get(v)).filter(Boolean)
})

async function onTeamCreate (team: ICreateTeamForm) {
  try {
    await teamsStore.createTeam(team)

    close('TeamCreateModal')
  } catch (e) {
    if (e instanceof Error) {
      ElMessage.error(e)
    }
  }
}

async function verifyPlayer (playerId: number) {
  loading.value = true
  try {
    const newPlayer = await playerStore.verifyPlayer(playerId)

    if (newPlayer) player.value = newPlayer
  } finally {
    loading.value = false
  }
}

async function updatePlayerPoints (playerId: number, _points: number) {
  loading.value = true
  try {
    await playerStore.updatePlayerPoints(playerId, _points)
  } finally {
    loading.value = false
  }
}

function openAddPointsModal () {
  if (!player.value) return

  open('AdminAddPointsModal' as any, {
    onSubmit: async (points: number) => {
      if (player.value) {
        await updatePlayerPoints(player.value.id, points)
        ElMessage.success(`Успішно нараховано ${points} Points`)
        close('AdminAddPointsModal' as any)
      }
    }
  })
}

function handlePlayerUpdated (updatedPlayer: TPlayer) {
  if (player.value && updatedPlayer) {
    player.value = updatedPlayer

    if (route.name === routeNames.profile && me.user) {
      player.value = me.user
    }
  }
}

function openEditProfileModal () {
  if (!player.value) return
  open('PLayerEditProfileModal', {
    player: player.value,
    onUpdated: handlePlayerUpdated
  })
}

function openAdminMmrModal () {
  if (!player.value) return

  open('AdminUpdateMmrModal', {
    playerId: player.value.id,
    currentMmr: player.value.mmr,
    currentRoles: player.value.roles || [],
    onUpdated: handlePlayerUpdated
  })
}

async function createVerificationRequest () {
  if (!player.value) return
  loading.value = true
  try {
    await requestsService.createVerificationRequest('player_verification')
    ElMessage.success('Запит на верифікацію успішно подано')
  } catch (error: any) {
    const errorMessage = error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Помилка при створенні запиту'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

async function invitePlayer (isTeamMain: boolean) {
  if (!player.value?.id || !me.user?.team_id) return

  inviting.value = true
  try {
    await teamsService.invitePlayerToTeam(me.user.team_id, player.value.id, isTeamMain)
  } finally {
    inviting.value = false
  }
}

watch(() => route.name, async () => {
  if (route.name === routeNames.player || routeNames.profile) { await onOpen() }
})

async function onOpen () {
  const id = Number(route.params.id)
  const isMePage = route.name === routeNames.profile

  loading.value = true
  try {
    player.value = isMePage ? me.user : await playerStore.findPlayer(id)

    if (!player.value) throw new Error()
  } catch {
    router.push('/')
  } finally {
    loading.value = false
  }

  if (player.value?.steam_id) {
    heroesLoading.value = true
    try {
      favoriteHeroes.value =
        await playersService.getPlayerFavoriteHeroes(player.value.steam_id)
    } catch (error) {
      console.error('Ошибка загрузки героев:', error)
    } finally {
      heroesLoading.value = false
    }
  }
}

onMounted(onOpen)
</script>
