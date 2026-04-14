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
          :src="getImageUrl(user?.avatarUrl as string)"
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
        <div
          class="flex flex-col items-center justify-center bg-gray-900/60 border border-gray-800
            rounded-2xl py-20 transition-all duration-300"
        >
          <span class="text-sm text-gray-400 mb-2">Рейтинг</span>
          <span class="text-white text-base font-semibold">{{ user?.rating ?? '-' }}</span>
        </div>

        <div
          class="flex flex-col items-center justify-center bg-gray-900/60 border border-gray-800
            rounded-2xl py-20 transition-all duration-300"
        >
          <span class="text-sm text-gray-400 mb-2">Позиція</span>
          <!-- TODO: position not in API yet -->
          <span class="text-white text-base font-semibold">-</span>
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
          <!-- TODO: team info not in Player API schema yet -->
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
import { getDiscordProfileUrl, getDotabuffProfileUrl, getImageUrl, getSteamProfileUrl } from '@/core/helpers'
import { Ellipsis } from 'lucide-vue-next'

import steamImg from '@/assets/icons/steam-logo.svg'
import discordImg from '@/assets/icons/discord-logo.svg'
import dotabuffImg from '@/assets/icons/dotabuff-logo.svg'

const authStore = useAuthStore()

const user = computed(() => {
  return authStore.user
})

onMounted(() => {
  // TODO: endpoint not in API yet (fetchUser)
})

</script>
