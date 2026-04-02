<template>
  <div
    v-loading.fullscreen="playerStore.loading"
    class="relative group z-10 flex !cursor-pointer flex-col items-center rounded-2xl p-20
           bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
           border shadow-[0_0_20px_rgba(0,0,0,0.5)]
           transition-all duration-300 ease-out w-[250px]
           hover:border-primary/60"
    :class="isVerified
      ? 'border-green-800 hover:shadow-green-800'
      : 'border-red-800 hover:shadow-red-800'"
    @click="goToPlayerPage(user.id)"
  >
    <!-- Dropdown три крапки -->
    <el-dropdown
      v-if="me.isAdmin.isAdmin || me.isAdmin.isModerator"
      trigger="click"
      :placement="isMobile ? 'left-start' : 'bottom'"
      class="absolute top-10 right-15 text-white z-30 hover:text-white/50"
      @click.stop
    >
      <PhDotsThree size="20" weight="bold" @click.stop />

      <template #dropdown>
        <div class="w-[200px] flex flex-col gap-10 p-10 rounded-lg shadow-lg">
          <el-button
            v-if="!isVerified"
            type="success"
            class="h-30"
            @click.stop="verifyPlayer(user.id)"
          >
            Верифікувати
          </el-button>

          <el-tooltip content="Функціонал в розробці">
            <el-button disabled type="danger" class="h-30">
              Заблокувати
            </el-button>
          </el-tooltip>
        </div>
      </template>
    </el-dropdown>

    <!-- Like / Dislike badge -->
    <div
      v-if="isVerified && me.user?.id && user.id !== me.user?.id &&
        me.user.roles?.every(role => role.type_name !== ERole.GUEST) &&
        !user.is_viewer_respected"
      class="absolute top-10 left-15 z-20 flex items-center
             rounded-lg border border-white/15
             bg-black/40 backdrop-blur-md overflow-hidden
             shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
      @click.stop
    >
      <el-button
        class="flex h-full p-8 w-full items-center gap-4 text-xs text-green-400
               hover:bg-white/15 hover:text-green-300 transition-colors !rounded-none !border-none"
        @click.stop="likeUser(user.id)"
      >
        <PhThumbsUp size="12" weight="fill" />
      </el-button>

      <div class="h-14 w-px mx-2 bg-white/15" />
      <el-button
        class="flex h-full w-full p-8 items-center gap-4 text-xs text-red-400
               hover:text-red-300  transition-colors hover:bg-white/15 !rounded-none !border-none"
        @click.stop="dislikeUser(user.id)"
      >
        <PhThumbsDown size="12" weight="fill" />
      </el-button>
    </div>

    <!-- Avatar -->
    <div class="relative mb-15 mt-6">
      <el-avatar
        size="large"
        :src="user.avatar_url ? `${apiPublicUrl}${user.avatar_url}` : ''"
        class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
      >
        <template #default>
          <PhUser size="28" weight="bold" class="text-white/70" />
        </template>
      </el-avatar>

      <!-- Verification badge -->
      <el-tooltip
        :content="isVerified ? 'Верифікований' : 'Не верифікований'"
        placement="bottom"
        effect="dark"
      >
        <div
          class="absolute -top-6 -right-6 z-10 flex h-24 w-24 items-center justify-center
                 rounded-full ring-2 ring-gray-900 shadow-md"
          :class="isVerified
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'"
        >
          <component
            :is="isVerified ? PhSealCheck : PhSealWarning"
            :size="15"
            weight="fill"
          />
        </div>
      </el-tooltip>
    </div>

    <!-- Steam name -->
    <el-tooltip
      :disabled="!user.steam_name"
      :content="user.steam_name || 'Імʼя відсутнє'"
      placement="top"
      effect="dark"
      :show-after="200"
    >
      <h2 class="max-w-[70%] truncate text-center font-semibold text-white text-lg">
        {{ user.steam_name || '-' }}
      </h2>
    </el-tooltip>

    <!-- Discord -->
    <span
      class="text-xs mb-6 mt-1 flex gap-4 items-center
             text-gray-500/80 hover:text-primary
             transition-all duration-300 cursor-pointer"
      @click.stop="user.user_name && copyDiscordName(user)"
    >
      {{ user.user_name ? `@${user.user_name}` : '-' }}
      <PhCopy v-if="user.user_name" size="14" />
    </span>

    <!-- Role tags -->
    <div
      class="mt-10 flex w-full gap-10 border-t border-dashed py-16"
      :class="isVerified
        ? 'border-green-800/60'
        : 'border-red-800/60'"
    >
      <PlayerTeamTag :user />
      <PlayerRoleTag :user />
    </div>

    <!-- Stats -->
    <div
      class="mt-8 flex w-full justify-around rounded-xl
             border border-gray-800/60
             bg-gradient-to-br from-gray-900/70 via-gray-900/40 to-gray-950/70
             pt-16 pb-14 shadow-inner"
      :class="isVerified
        ? 'border-green-800/60'
        : 'border-red-800/60'"
    >
      <!-- Rank -->
      <div class="flex flex-col items-center">
        <div class="flex h-40 items-center">
          <el-tooltip
            v-if="user?.rang?.img_url"
            :content="`${user.mmr?.toString()} MMP`"
            effect="dark"
            placement="top"
          >
            <el-image
              class="!size-30 drop-shadow-[0_0_10px_rgba(168,85,247,0.45)]
                     hover:scale-110 transition-transform"
              :src="rank"
            />
          </el-tooltip>

          <span v-else class="min-h-[40px] text-sm text-white flex items-center">-</span>
        </div>

        <span class="text-[10px] uppercase tracking-widest text-gray-400/80">
          Ранг
        </span>
      </div>

      <!-- Position -->
      <div class="flex flex-col items-center justify-end">
        <el-tooltip
          effect="dark"
          placement="top"
          class="custom-tooltip"
          popper-class="!bg-gradient-to-br !from-gray-900 !via-gray-850
          !rounded-xl !shadow-lg !shadow-white/10 !to-gray-950"
        >
          <PhArrowsOut :size="22" :rotate="45" class="!h-full !flex !items-center" />
          <template #content>
            <div
              v-if="user.positions?.length"
              class="py-15 px-10 flex gap-10 rounded-lg border-none
                     bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 cursor-pointer"
            >
              <el-tooltip
                v-for="pos in user.positions || []"
                :key="pos"
                placement="top"
                class="custom-tooltip"
                :content="positionMap[pos]?.label"
              >
                <component
                  :is="positionMap[pos]?.icon"

                  :size="20"
                  class="text-white/80"
                />
              </el-tooltip>
            </div>

            <div v-else>
              Не вказано
            </div>
          </template>
        </el-tooltip>

        <span class="text-[10px] uppercase tracking-widest text-gray-400/80 mt-2">
          Позиції
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useClipboard, useWindowSize } from '@vueuse/core'
import { ElMessage } from 'element-plus'

import checkRoles from '@/core/helpers'
import { ERole } from '@/types/general.types'
import { routeNames } from '@/router/route-names'
import { positionOptions } from './player-tags/player.constants'

import {
  PhCopy,
  PhSealCheck,
  PhUser,
  PhSealWarning,
  PhDotsThree,
  PhArrowsOut,
  PhThumbsUp,
  PhThumbsDown
} from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{
  user: TPlayer
  width?: number
}>(), {
  width: 210
})

const { copy } = useClipboard({ legacy: true })
const window = useWindowSize()
const playerStore = usePlayersStore()
const me = useAuthStore()
const router = useRouter()

const isMobile = computed(() => window.width.value < 850)
const isVerified = computed(() =>
  !checkRoles(props.user.roles || [], ERole.GUEST)
)

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL
const rank = computed(() => `/images/ranks/${props.user.rang?.img_url}`)

const positionMap = computed(() =>
  positionOptions.reduce((acc, pos) => {
    acc[pos.value] = pos
    return acc
  }, {} as Record<number, typeof positionOptions[0]>)
)

function copyDiscordName (player: TPlayer) {
  if (!player.user_name) return
  copy(player.user_name)
  ElMessage.success('Discord скопійовано')
}

async function likeUser (id: number) {
  await playerStore.changePlayerRespect(id, 'like')
}

async function dislikeUser (id: number) {
  await playerStore.changePlayerRespect(id, 'dislike')
}

async function verifyPlayer (playerId: number) {
  await playerStore.verifyPlayer(playerId)
}

function goToPlayerPage (id: number) {
  router.push({ name: routeNames.player, params: { id } })
}
</script>
