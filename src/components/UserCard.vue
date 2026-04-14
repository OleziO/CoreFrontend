<template>
  <div
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
          <el-tooltip content="Функціонал в розробці">
            <el-button disabled type="success" class="h-30">
              Верифікувати
            </el-button>
          </el-tooltip>

          <el-tooltip content="Функціонал в розробці">
            <el-button disabled type="danger" class="h-30">
              Заблокувати
            </el-button>
          </el-tooltip>
        </div>
      </template>
    </el-dropdown>

    <!-- Avatar -->
    <div class="relative mb-15 mt-6">
      <el-avatar
        size="large"
        :src="user.avatarUrl ? `${apiPublicUrl}${user.avatarUrl}` : ''"
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

    <!-- Discord name -->
    <el-tooltip
      :disabled="!user.discordName"
      :content="user.discordName || 'Імʼя відсутнє'"
      placement="top"
      effect="dark"
      :show-after="200"
    >
      <h2 class="max-w-[70%] truncate text-center font-semibold text-white text-lg">
        {{ user.discordName || '-' }}
      </h2>
    </el-tooltip>

    <!-- Discord username -->
    <span
      class="text-xs mb-6 mt-1 flex gap-4 items-center
             text-gray-500/80 hover:text-primary
             transition-all duration-300 cursor-pointer"
      @click.stop="user.discordUsername && copyDiscordName(user)"
    >
      {{ user.discordUsername ? `@${user.discordUsername}` : '-' }}
      <PhCopy v-if="user.discordUsername" size="14" />
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
      <div class="flex flex-col items-center">
        <span class="text-sm text-white/70">{{ user.rating }}</span>
        <span class="text-[10px] uppercase tracking-widest text-gray-400/80">
          Rating
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useClipboard, useWindowSize } from '@vueuse/core'
import { ElMessage } from 'element-plus'

import { routeNames } from '@/router/route-names'

import {
  PhCopy,
  PhSealCheck,
  PhUser,
  PhSealWarning,
  PhDotsThree
} from '@phosphor-icons/vue'

import type { TPlayer as Player } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  user: Player
  width?: number
}>(), {
  width: 210
})

const { copy } = useClipboard({ legacy: true })
const window = useWindowSize()
const me = useAuthStore()
const router = useRouter()

const isMobile = computed(() => window.width.value < 850)
const isVerified = computed(() => !!props.user.verifiedAt)

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

function copyDiscordName (player: Player) {
  if (!player.discordUsername) return
  copy(player.discordUsername)
  ElMessage.success('Discord скопійовано')
}

function goToPlayerPage (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}
</script>
