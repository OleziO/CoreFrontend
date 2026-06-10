<template>
  <div
    class="relative group z-10 flex !cursor-pointer flex-col items-center rounded-2xl p-20
           bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
           border border-white/10 shadow-elevation-3
           transition-all duration-300 ease-out w-[250px]
           hover:border-primary/60 hover:shadow-glow-primary"
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
        <div class="w-[220px] flex flex-col gap-10 p-10 rounded-lg shadow-lg">
          <el-button
            :type="isVerified ? 'warning' : 'success'"
            class="h-30 w-full justify-center shrink-0 max-sm:text-xs max-sm:!px-8"
            :loading="verificationLoading"
            @click.stop="toggleVerificationFromMenu"
          >
            <component
              :is="isVerified ? PhSealWarning : PhSealCheck"
              class="mr-8 shrink-0"
              weight="bold"
              size="16"
            />
            {{ isVerified ? 'Зняти верифікацію' : 'Верифікувати' }}
          </el-button>
        </div>
      </template>
    </el-dropdown>

    <!-- Avatar -->
    <div class="relative mb-15 mt-6">
      <el-avatar
        size="large"
        :src="user.avatarUrl ?? ''"
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
        <StatusBadge
          :preset="isVerified ? 'verified' : 'unverified'"
          size="sm"
          icon-only
          class="absolute -top-6 -right-6 z-10 ring-2 ring-gray-900"
        />
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

    <!-- Командний статус і ролі — строга 50% / 50% на всю ширину картки -->
    <div
      class="
        -mx-20 mt-10 grid w-[calc(100%+40px)] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-0
        border-t border-dashed border-white/10 py-16"
    >
      <div class="min-w-0 overflow-x-auto pl-20 pr-8 [scrollbar-width:thin]">
        <PlayerTeamTag stretch-in-grid :user />
      </div>
      <div class="min-w-0 overflow-x-auto pr-20 pl-8 [scrollbar-width:thin]">
        <PlayerRoleTag stretch-in-grid :user />
      </div>
    </div>

    <!-- Рейтинг (ранг) + позиції -->
    <div
      class="mt-8 flex w-full items-stretch justify-center gap-20 rounded-xl
             border border-white/10
             bg-gradient-to-br from-gray-900/70 via-gray-900/40 to-gray-950/70
             py-12 px-10 shadow-inner"
    >
      <el-tooltip
        v-if="rankImageSrc"
        :content="ratingMmrLabel"
        placement="top"
        effect="dark"
      >
        <div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 cursor-default">
          <img
            :src="rankImageSrc"
            alt=""
            class="h-36 w-auto max-w-[72px] object-contain select-none"
            width="72"
            height="36"
            loading="lazy"
            draggable="false"
          >
          <span class="text-[10px] uppercase tracking-widest text-gray-400/80">Рейтинг</span>
        </div>
      </el-tooltip>
      <el-tooltip
        v-else
        :content="ratingMmrLabel"
        placement="top"
        effect="dark"
      >
        <div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-4">
          <span class="text-sm text-white/90 tabular-nums">{{ user.rating }}</span>
          <span class="text-[10px] uppercase tracking-widest text-gray-400/80">Рейтинг</span>
        </div>
      </el-tooltip>

      <div
        class="w-px shrink-0 self-stretch min-h-[40px] bg-white/10"
        aria-hidden="true"
      />

      <PlayerPositionsTooltip :summary="positionsSummary" placement="top">
        <div
          class="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 cursor-default"
        >
          <div
            class="flex h-40 w-40 items-center justify-center
                   text-white/70 transition-colors hover:text-primary"
            :class="!positionsSummary.hasPositions ? 'opacity-50' : ''"
          >
            <PhCompassRose :size="22" weight="duotone" />
          </div>
          <span class="text-[10px] uppercase tracking-widest text-gray-400/80">Позиції</span>
        </div>
      </PlayerPositionsTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard, useWindowSize } from '@vueuse/core'
import { ElMessage } from 'element-plus'

import { routeNames } from '@/router/route-names'
import { formatPlayerPositionsSummary, formatPlayerRatingMmr, getPlayerRankImageSrcFromPlayerRank, isPlayerVerified } from '@/core/helpers'
import {
  PhCopy,
  PhSealCheck,
  PhUser,
  PhSealWarning,
  PhDotsThree,
  PhCompassRose
} from '@phosphor-icons/vue'

import { playersService } from '@/views/players/players.service'

const props = withDefaults(defineProps<{
  user: TPlayer
  width?: number
}>(), {
  width: 210
})

const { copy } = useClipboard({ legacy: true })
const window = useWindowSize()
const me = useAuthStore()
const router = useRouter()

const isMobile = computed(() => window.width.value < 850)
const verificationLoading = ref(false)

const isVerified = computed(() => isPlayerVerified(props.user))

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(props.user.rank))

const ratingMmrLabel = computed(() => formatPlayerRatingMmr(props.user.rating))

const positionsSummary = computed(() => formatPlayerPositionsSummary(props.user))

function copyDiscordName (player: TPlayer) {
  if (!player.discordUsername) return
  copy(player.discordUsername)
  ElMessage.success('Discord скопійовано')
}

function goToPlayerPage (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}

async function toggleVerificationFromMenu () {
  const u = props.user
  if (!u || verificationLoading.value) return
  verificationLoading.value = true
  try {
    const wantVerified = !isVerified.value
    const updated = await playersService.setPlayerVerificationByAdmin(u.id, wantVerified)
    if (updated) usePlayersStore().patchPlayerInList(updated)
  } finally {
    verificationLoading.value = false
  }
}
</script>
