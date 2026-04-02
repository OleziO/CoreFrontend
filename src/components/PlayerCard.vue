<template>
  <RouterLink v-if="player" :to="{ name: routeNames.player, params: { id: player.id } }">
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
              :src="`${apiPublicUrl}${player.avatar_url}`"
              class="border-2 relative min-w-50 size-50 border-gray-700 shadow-sm transition-all duration-300"
            />

            <div class="flex truncate flex-col">
              <div>
                <h3
                  class="text-white truncate font-semibold leading-tight
                         group-hover:text-primary transition-colors duration-300 flex gap-5 items-center"
                >
                  <el-tooltip :content="player.steam_name || '-'" placement="top">
                    <span class="max-w-[100px] truncate">{{ player.steam_name }}</span>
                  </el-tooltip>

                  <span v-if="isMixCap">
                    <el-tooltip content="Капітан Mix команди" placement="top">
                      <PhCrownSimple color="yellow" weight="fill" />
                    </el-tooltip>
                  </span>

                  <span v-else-if="showRegularCap && player.is_cap">
                    <el-tooltip content="Капітан Regular команди" placement="top">
                      <PhCrownSimple color="yellow" weight="fill" />
                    </el-tooltip>
                  </span>
                </h3>

                <el-tooltip :content="player.user_name || ''">
                  <span
                    class="text-xs text-gray-500 hover:text-primary animate-pulse
                           transition-colors duration-300 truncate block max-w-100 md:max-w-200"
                    @click.prevent="player.user_name && getCopy(player.user_name, 'Discord скопійовано')"
                  >
                    {{ player.user_name ? `@${player.user_name}` : '-' }}
                  </span>
                </el-tooltip>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-10">
            <el-tooltip
              v-if="player?.rang?.img_url"
              :content="`${player.mmr?.toString()} MMP`"
              effect="dark"
              placement="top"
            >
              <el-image
                class="!size-40 drop-shadow-[0_0_10px_rgba(168,85,247,0.45)]
                       hover:scale-110 transition-transform"
                :src="`/images/ranks/${player.rang?.img_url}`"
              />
            </el-tooltip>
          </div>
        </div>

        <RoleGuard
          v-show="player.is_cap"
          :roles="['admin', 'moderator']"
        >
          <el-popconfirm
            title="Видалити гравця"
            icon-color="#626AEF"
            width="300"
            class="custom-popconfirm"
            placement="bottom-end"
            :icon="Info"
          >
            <template #reference>
              <button
                class="absolute -top-10 -right-10 z-20 size-20 flex items-center justify-center
                       rounded-full bg-gray-800/90 border border-red-600 shadow-md
                       hover:bg-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]
                       transition-all duration-300 backdrop-blur-md"
                aria-label="Видалити"
                @click.prevent
              >
                <Minus :size="12" />
              </button>
            </template>

            <template #actions="{ confirm, cancel }">
              <div class="flex justify-center gap-10 mt-10">
                <el-button
                  type="primary"
                  @click="cancel"
                >
                  Скасувати
                </el-button>

                <el-button
                  type="danger"
                  @click="(e) => { confirm(e); kickFromTeam() }"
                >
                  <PhTrash />
                  <span class="ml-4">Видалити</span>
                </el-button>
              </div>
            </template>
          </el-popconfirm>
        </RoleGuard>
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import RoleGuard from '@/guards/RoleGuard.vue'
import { Info, Minus } from 'lucide-vue-next'
import { PhTrash, PhCrownSimple } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
import { routeNames } from '@/router/route-names'
import checkRoles, { getCopy } from '@/core/helpers'
import { ERole } from '@/types/general.types'

const props = withDefaults(defineProps<{
  player: TPlayer | null
  showStatusGlow?: boolean
  showRegularCap?: boolean
  skipTeamFetch?: boolean
  isMixCap?: boolean
}>(), {
  showStatusGlow: true,
  showRegularCap: true,
  skipTeamFetch: false
})
const emit = defineEmits(['removePlayer'])

const isVerified = computed(() => {
  const roles = props.player?.roles || []
  return !checkRoles(roles, ERole.GUEST)
})

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

function kickFromTeam () {
  emit('removePlayer', props.player?.id)
}
</script>
