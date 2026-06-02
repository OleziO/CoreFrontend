<template>
  <section class="profile">
    <div
      class="w-full max-w-[1000px] my-40 h-max mx-auto bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
        rounded-3xl
        p-30 flex flex-col gap-30 relative
        transition-all duration-300"
    >
      <div class="flex justify-between items-center">
        <ProfileRoles />
        <el-dropdown trigger="click">
          <Ellipsis :size="30" />
          <template #dropdown>
            <el-dropdown-menu>
              <a
                v-if="user?.steamId"
                :href="getSteamProfileUrl(user.steamId)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <el-dropdown-item :icon="steamImg">
                  Steam
                </el-dropdown-item>
              </a>
              <a
                v-if="user?.discordId"
                :href="getDiscordProfileUrl(user.discordId)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <el-dropdown-item :icon="discordImg">Discord</el-dropdown-item>
              </a>
              <a
                v-if="user?.steamId"
                :href="getDotabuffProfileUrl(user.steamId)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <el-dropdown-item :icon="dotabuffImg">Dotabuff</el-dropdown-item>
              </a>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="flex items-center gap-30 border-b border-gray-800 pb-20">
        <el-avatar
          :src="user?.avatarUrl ?? ''"
          size="large"
          class="ring-2 ring-gray-700 shadow-md"
        />

        <div class="flex flex-col justify-center">
          <h1 class="text-2xl font-semibold text-white leading-tight">
            {{ user?.discordName }}
          </h1>

          <p class="text-gray-400 text-sm">@{{ user?.discordUsername }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-30">
        <!-- Позиції: ті самі Ph-іконки, що в positionOptions (фільтри / редагування) -->
        <div
          class="col-span-2 w-full flex flex-col gap-14
            bg-gray-900/60 border border-gray-800
            rounded-2xl px-24 py-24 transition-all duration-300 md:py-28"
        >
          <h2 class="text-sm uppercase font-semibold tracking-wider text-gray-400">
            Позиції
          </h2>
          <div
            v-if="profilePositionRows.length"
            class="flex flex-wrap items-center gap-10"
          >
            <div
              v-for="row in profilePositionRows"
              :key="row.id"
              class="inline-flex items-center gap-10 rounded-xl border border-white/10
                bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-14 py-10
                shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                transition duration-200 hover:-translate-y-px hover:border-white/15"
            >
              <component
                :is="row.icon"
                :size="22"
                weight="duotone"
                class="shrink-0 text-primary"
              />
              <span class="text-sm font-medium text-white leading-tight">{{ row.label }}</span>
            </div>
          </div>
          <p
            v-else
            class="text-sm text-gray-500"
          >
            Позиції не вказані
          </p>
        </div>

        <div
          class="col-span-2 flex flex-col items-center justify-center
            bg-gray-900/60 border border-gray-800
            rounded-2xl py-20 transition-all duration-300"
        >
          <span class="text-sm text-gray-400 mb-2">Рейтинг (MMR)</span>
          <span class="text-white text-base font-semibold tabular-nums">{{ user?.rating ?? '-' }}</span>
        </div>

        <div
          class="bg-gray-900/60 border border-gray-800 rounded-2xl p-20 flex flex-col gap-10"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm uppercase font-semibold text-white">
                Команда:
              </h2>
            </div>
          </div>
          <!-- TODO: team info not in TPlayer API schema yet -->
          <div class="text-gray-500 text-sm italic">
            Ви ще не приєднані до жодної команди
          </div>
        </div>
        <div
          class="bg-gray-900/60 border border-gray-800 rounded-2xl p-20 flex flex-col gap-10"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm uppercase font-semibold text-white">
                MIX Команда:
              </h2>
            </div>
          </div>
          <div class="text-gray-500 text-sm italic w-full h-full flex items-center justify-center">
            Ви ще не приєднані до жодної MIX команди
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getDiscordProfileUrl, getDotabuffProfileUrl, getSteamProfileUrl, getPlayerDotaPositions } from '@/core/helpers'
import { positionOptions } from '@/components/player-tags/player.enums'
import { Ellipsis } from 'lucide-vue-next'

import steamImg from '@/assets/icons/steam.svg'
import discordImg from '@/assets/icons/discord.svg'
import dotabuffImg from '@/assets/icons/dotabuff.svg'

const authStore = useAuthStore()

const user = computed(() => {
  return authStore.user
})

/** Позиції 1–5 з тієї ж мапи `positionOptions` (PhSword, PhLightning, …) */
const profilePositionRows = computed(() => {
  const ids = getPlayerDotaPositions(user.value)
  return ids
    .map((id) => {
      const opt = positionOptions.find((o) => o.value === id)
      if (!opt) return null
      return { id, label: opt.label, icon: opt.icon }
    })
    .filter((x): x is { id: number; label: string; icon: (typeof positionOptions)[0]['icon'] } => x != null)
})

</script>
