<template>
  <div
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
            <StatusBadge
              :preset="isVerified ? 'verified' : 'unverified'"
              size="sm"
              icon-only
              class="absolute -bottom-4 -right-4 ring-2 ring-gray-900"
            />
          </el-tooltip>
        </div>

        <!-- Names -->
        <div class="min-w-0">
          <div class="flex items-center gap-8 min-w-0">
            <h2 class="truncate text-lg font-semibold text-white">
              {{ player.discordName || '-' }}
            </h2>

            <PlayerModerationTags class="shrink-0" :tags="playerTags" />
          </div>

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
          @click="emit('toggleVerification')"
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
          @click="emit('editProfile')"
        >
          <PhPencil />

          <span class="ml-8">Редагувати {{ showFullLabel ? ' профіль' : '' }}</span>
        </el-button>
      </div>

      <el-button
        v-if="isProfilePage && !player.steamId"
        :loading="linkingSteam"
        class="h-30 w-full"
        @click="emit('linkSteam')"
      >
        <Icon :size="16" name="steam" />

        <span class="ml-8">
          Прив'язати Steam
        </span>
      </el-button>
    </div>

    <!-- Ролі + посилання (висота тегів як на картці; кнопки трохи вищі — по центру рядка) -->
    <div
      class="-mx-20 flex w-[calc(100%+40px)] flex-wrap items-center justify-between
        gap-x-88 gap-y-32 border-t border-gray-800/60 px-20 pt-16 md:flex-nowrap"
    >
      <div
        class="flex min-w-0 flex-1 items-center overflow-x-auto px-12 [scrollbar-width:thin]"
      >
        <PlayerRoleTag
          stretch-in-grid
          :user="player"
        />
      </div>

      <div
        class="flex shrink-0 items-center justify-end gap-10
          max-sm:w-full max-sm:justify-end max-sm:flex-wrap"
      >
        <el-button
          v-if="player.steamId"
          class="!size-36 shrink-0 hover:bg-white/10"
          tag="a"
          target="_blank"
          :href="links.steam"
        >
          <Icon :size="16" name="steam" />
        </el-button>

        <el-button
          v-if="player.steamId"
          class="!size-36 shrink-0 hover:bg-white/10"
          tag="a"
          target="_blank"
          :href="links.dotabuff"
        >
          <Icon :size="16" name="dotabuff" />
        </el-button>

        <el-button
          v-if="player.discordId"
          class="!size-36 shrink-0 hover:bg-white/10"
          tag="a"
          target="_blank"
          :href="links.discord"
        >
          <Icon :size="16" name="discord" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhSealCheck,
  PhSealWarning,
  PhUser,
  PhPencil,
  PhCopy
} from '@phosphor-icons/vue'
import { getCopy } from '@/core/helpers'
import type { TTag } from '@/services/tags.types'

interface IProps {
  player: TPlayer
  playerTags: TTag[]
  isVerified: boolean
  rankImageSrc: string | null
  ratingMmrLabel: string
  verifyLoading: boolean
  showAdminVerificationActions: boolean
  showAdditionalInfo: boolean
  linkingSteam: boolean
  isProfilePage: boolean
  links: { discord: string | undefined; steam: string | undefined; dotabuff: string | undefined }
}

defineProps<IProps>()

const emit = defineEmits<{
  toggleVerification: []
  editProfile: []
  linkSteam: []
}>()

const windowSize = useWindowSize()
const showFullLabel = computed(() => windowSize.width.value > 650)
</script>
