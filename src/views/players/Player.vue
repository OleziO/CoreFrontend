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

              <!-- Rating -->
              <div class="flex flex-col items-center shrink-0">
                <span class="text-lg font-semibold text-white">{{ player.rating }}</span>
                <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Rating</span>
              </div>
            </div>

            <div class="w-full flex items-center justify-between mt-20 gap-20 p-8">
              <el-button
                v-if="showAdditionalInfo"
                type="primary"
                class="h-30 flex-1"
                @click="openEditProfileModal"
              >
                <PhPencil />

                <span class="ml-8">Редагувати {{ window.width.value > 650 ? ' профіль' : '' }}</span>
              </el-button>

              <el-button
                v-if="showAdditionalInfo && !player.steamId"
                :loading="linkingSteam"
                class="h-30 flex-1"
                @click="handleSteamLink"
              >
                <Icon :size="16" name="steam" />

                <span class="ml-8">
                  Прив'язати Steam
                </span>
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

                  <span class="mt-10 text-lg font-semibold text-white cursor-default">
                    {{ player?.rating || 0 }}
                  </span>
                </div>
              </div>

              <!-- Core Points -->
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
                  <span class="text-lg font-semibold text-white cursor-default">—</span>
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
                <el-tooltip content="Очки участі у подіях та турнірах" placement="top">
                  <span
                    class="text-xs uppercase text-center tracking-widest
                    whitespace-nowrap text-gray-400 cursor-default"
                  >
                    Участь
                  </span>
                </el-tooltip>

                <div class="mt-10 flex gap-4 items-center">
                  <span class="text-lg font-semibold text-white cursor-default">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Team section commented out: team membership fields not in new TPlayer schema -->
        <div
          class="
            rounded-2xl flex justify-between flex-wrap
            border-2 border-gray-800/80
            bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-gray-950/80
            p-24
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            flex-1
          "
        >
          <div class="w-full h-full flex flex-col justify-center items-center">
            <div class="text-sm tracking-[0.2em] text-gray-400 my-20">
              Інформація про команду недоступна
            </div>
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

import { getCopy, getSteamProfileUrl, getDotabuffProfileUrl, getDiscordProfileUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
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

const links = computed(() => {
  return {
    discord: getDiscordProfileUrl(player.value?.discordId),
    steam: getSteamProfileUrl(player.value?.steamId),
    dotabuff: getDotabuffProfileUrl(player.value?.steamId)
  }
})

const isVerified = computed(() => !!player.value?.verifiedAt)

const showAdditionalInfo = computed(() => {
  return route.name === routeNames.profile || me.isAdmin.isAdmin || me.isAdmin.isModerator
})
// const showMelInfo = computed(() => route.name === routeNames.profile)

// const isAdminOrModerator = computed(() => {
//   return (me.isAdmin.isAdmin || me.isAdmin.isModerator) && route.name !== routeNames.profile
// })

// TODO: endpoint not in API yet (/players/me)
// const canRequestVerification = computed(() => false)

// TODO: endpoint not in API yet (invitePlayerToTeam)
// const canInvitePlayer = computed(() => false)
// const inviting = ref(false)

watch(() => route.name, async () => {
  if (route.name === routeNames.player || routeNames.profile) { await onOpen() }
})

async function onOpen () {
  const id = String(route.params.id)
  const isMePage = route.name === routeNames.profile

  loading.value = true
  try {
    player.value = isMePage ? (me.user as TPlayer) : await playerStore.findPlayer(id)
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

function openEditProfileModal () {
  if (!player.value) return

  open('PLayerEditProfileModal', {
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

  const steamLinked = route.query.steam_linked
  const steamError = route.query.steam_error

  if (steamLinked === 'true') {
    ElMessage.success("Steam акаунт успішно прив'язано!")
    await me.fetchUser()
    player.value = me.user as TPlayer
    router.replace({ name: routeNames.profile })
  } else if (steamError) {
    ElMessage.error(`Помилка прив'язки Steam: ${steamError}`)
    router.replace({ name: routeNames.profile })
  }
})
</script>
