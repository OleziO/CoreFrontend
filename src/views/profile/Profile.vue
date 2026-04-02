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
                v-if="user?.steam_id"
                :href="getSteamProfileUrl(user.steam_id)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <el-dropdown-item
                  :icon="steamImg"
                >
                  Steam
                </el-dropdown-item>
              </a>
              <a
                v-if="user?.discord_id"
                :href="getDiscordProfileUrl(user.discord_id)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <el-dropdown-item :icon="discordImg">Discord</el-dropdown-item>
              </a>
              <a
                v-if="user?.steam_id"
                :href="getDotabuffProfileUrl(user.steam_id)"
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
          :src="getImageUrl(user?.avatar_url as string)"
          size="large"
          class="ring-2 ring-gray-700 shadow-md"
        />
        <div class="flex flex-col justify-center">
          <h1 class="text-2xl font-semibold text-white leading-tight">
            {{ user?.steam_name }}
          </h1>
          <p class="text-gray-400 text-sm">@{{ user?.user_name }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-30">
        <div
          class="flex flex-col items-center justify-center bg-gray-900/60 border border-gray-800
            rounded-2xl py-20 transition-all duration-300"
        >
          <span class="text-sm text-gray-400 mb-2">Ранг</span>
          <el-tooltip
            v-if="user?.rang?.img_url?.length"
            :content="`MMR: ${user.mmr}`"
            effect="dark"
            placement="top"
          >
            <el-image
              :src="`/images/ranks/${user.rang?.img_url}`"
              class="!size-40"
              fit="contain"
            />
          </el-tooltip>
          <span v-else class="text-white text-base font-semibold">-</span>
        </div>

        <div
          class="flex flex-col items-center justify-center bg-gray-900/60 border border-gray-800
            rounded-2xl py-20 transition-all duration-300"
        >
          <span class="text-sm text-gray-400 mb-2">Позиція</span>
          <span class="text-white text-base font-semibold">
            {{ user?.position || '-' }}
          </span>
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
            <div>
              <el-tag
                v-if="user?.is_cap"
                type="warning"
                class="ml-auto text-sm font-medium px-10 bg-yellow-500/10 text-yellow-400 border-0"
              >
                Капітан
              </el-tag>
            </div>
          </div>
          <RouterLink v-if="user?.team" :to="`/teams/${user?.team_id}`">
            <div class="flex items-center gap-20 hover:bg-gray-700 p-10 rounded-xl">
              <el-avatar
                size="default"
                :src="getImageUrl(user?.team?.avatar_url as string)"
                class="ring-2 ring-gray-700"
              />
              <div class="flex flex-col">
                <span class="text-white font-medium">{{ user?.team.team_name }}</span>
                <span class="text-xs text-gray-500">ID: {{ user?.team.dota_team_id }}</span>
              </div>
            </div>
          </RouterLink>
          <div v-else class="text-gray-500 text-sm italic">
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
          <!-- Тут надо будет отобразить микс команду турнира -->
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
console.log(user)

onMounted(() => {
  authStore.fetchUser()
})

</script>
