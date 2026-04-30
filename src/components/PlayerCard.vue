<template>
  <div v-if="player" class="relative">
    <RouterLink :to="{ name: routeNames.player, params: { id: player.id } }">
      <div
        class="relative flex items-center justify-between py-10 px-10 rounded-2xl
               bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
               border shadow-[0_0_20px_rgba(0,0,0,0.5)]
               transition-all duration-300 ease-out cursor-pointer
               hover:border-primary/60"
        :class="isVerified
          ? 'border-green-800 hover:shadow-green-800'
          : 'border-red-800 hover:shadow-red-800'"
      >
        <div class="flex items-center gap-10 z-10 justify-between w-full">
          <div class="flex items-center justify-between w-full gap-10">
            <div class="relative truncate flex items-center gap-15">
              <el-avatar
                :src="player.avatarUrl ?? ''"
                class="border-2 relative min-w-50 size-50 border-gray-700 shadow-sm transition-all duration-300"
              />

              <div class="flex truncate flex-col">
                <div>
                  <h3
                    class="text-white truncate font-semibold leading-tight
                           group-hover:text-primary transition-colors duration-300 flex gap-8 items-center min-w-0"
                  >
                    <el-tooltip
                      v-if="isCaptain"
                      placement="top"
                      effect="dark"
                      content="Капітан команди"
                    >
                      <span
                        class="inline-flex shrink-0 cursor-default text-[#e8b931]
                               drop-shadow-[0_0_8px_rgba(232,185,49,0.55)]
                               [&_svg]:block"
                        role="img"
                        aria-label="Капітан команди"
                      >
                        <PhCrown
                          weight="fill"
                          :size="18"
                        />
                      </span>
                    </el-tooltip>

                    <el-tooltip :content="player.discordName || '-'" placement="top">
                      <span class="max-w-[100px] min-w-0 truncate">{{ player.discordName }}</span>
                    </el-tooltip>
                  </h3>

                  <el-tooltip :content="player.discordUsername || ''">
                    <span
                      class="text-xs text-gray-500 hover:text-primary animate-pulse
                             transition-colors duration-300 truncate block max-w-100 md:max-w-200"
                      @click.prevent="player.discordUsername && getCopy(player.discordUsername, 'Discord скопійовано')"
                    >
                      {{ player.discordUsername ? `@${player.discordUsername}` : '-' }}
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center">
              <el-tooltip
                v-if="rankImageSrc"
                :content="ratingMmrLabel"
                effect="dark"
                placement="top"
              >
                <div class="flex min-w-[60px] cursor-default items-center justify-center">
                  <img
                    :src="rankImageSrc"
                    alt=""
                    class="h-44 w-auto max-w-[72px] object-contain select-none"
                    width="72"
                    height="44"
                    loading="lazy"
                    draggable="false"
                  >
                </div>
              </el-tooltip>
              <el-tooltip
                v-else
                :content="ratingMmrLabel"
                effect="dark"
                placement="top"
              >
                <div class="flex min-w-[40px] cursor-default items-center justify-center tabular-nums">
                  <span class="text-base font-semibold text-white/90">{{ player.rating }}</span>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </RouterLink>

    <!-- Адмін/модер: без переходу за посиланням картки -->
    <el-button
      v-if="showAdminVerificationActions"
      :loading="verifyLoading"
      :type="isVerified ? 'warning' : 'success'"
      size="small"
      class="!absolute bottom-12 right-12 z-20 shadow-md max-[480px]:!text-[11px] max-[480px]:!px-10"
      @click.stop.prevent="onVerificationClick"
    >
      {{ isVerified ? 'Зняти' : 'Верифікація' }}
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'

import { routeNames } from '@/router/route-names'
import { playersService } from '@/views/players/players.service'
import { PhCrown } from '@phosphor-icons/vue'
import { getCopy, formatPlayerRatingMmr, getPlayerRankImageSrc, isPlayerVerified } from '@/core/helpers'
import type { TPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  player: TPlayer | null
  isCaptain?: boolean
  showStatusGlow?: boolean
  showRegularCap?: boolean
  skipTeamFetch?: boolean
  isMixCap?: boolean
}>(), {
  isCaptain: false,
  showStatusGlow: true,
  showRegularCap: true,
  skipTeamFetch: false
})

const emit = defineEmits<{ playerUpdated: [player: TPlayer] }>()

const me = useAuthStore()
const verifyLoading = ref(false)

const isVerified = computed(() => isPlayerVerified(props.player))

const showAdminVerificationActions = computed(() => {
  if (!(me.isAdmin.isAdmin || me.isAdmin.isModerator) || !props.player || !me.user) return false
  return props.player.id !== me.user.id
})

async function onVerificationClick () {
  if (!props.player || verifyLoading.value) return
  verifyLoading.value = true
  try {
    const updated = await playersService.setPlayerVerificationByAdmin(props.player.id, !isVerified.value)
    if (updated) emit('playerUpdated', updated)
  } finally {
    verifyLoading.value = false
  }
}

type TPlayerWithRank = TPlayer & { rank?: { numericName?: number } | null }

const rankImageSrc = computed(() =>
  props.player ? getPlayerRankImageSrc((props.player as TPlayerWithRank).rank?.numericName) : ''
)

const ratingMmrLabel = computed(() => formatPlayerRatingMmr(props.player?.rating))
</script>
