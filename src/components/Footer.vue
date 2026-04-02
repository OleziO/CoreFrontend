<template>
  <footer
    class="
      sticky bottom-0 z-50 w-full
      border-t-2 border-white/15
      shadow-[0_-10px_30px_rgba(0,0,0,0.35)]
      bg-black/20 backdrop-blur-xl
      flex justify-center items-center
      py-15
      after:absolute after:left-0 after:right-0 after:top-0
      after:h-16 after:bg-gradient-to-t after:from-transparent after:to-black/40 after:pointer-events-none
    "
  >
    <div
      class="w-full flex justify-center px-20 lg:px-40"
    >
      <div
        class="flex items-center justify-between w-full"
      >
        <!-- DESKTOP NAV -->
        <nav class="hidden lg:flex items-center gap-32 flex-1">
          <router-link :to="{ name: routeNames.tournaments }">
            <el-button type="primary" link class="tracking-[4]">Турніри</el-button>
          </router-link>
          <router-link :to="{ name: routeNames.teams }">
            <el-button type="primary" link class="tracking-[4]">Команди</el-button>
          </router-link>
          <router-link :to="{ name: routeNames.rules }">
            <el-button type="primary" link class="tracking-[4]">FAQ</el-button>
          </router-link>
        </nav>

        <!-- LOGO -->
        <router-link
          :to="{ name: routeNames.rootPage }"
          class="hidden lg:flex items-center justify-center h-full py-10"
        >
          <el-image
            class="h-full w-full max-h-30 cursor-pointer"
            fit="contain"
            :src="logo"
            alt="Core League"
          />
        </router-link>

        <!-- SOCIAL MEDIA -->
        <div
          class="flex items-center gap-32 justify-center w-full lg:flex-1 lg:justify-end"
        >
          <a
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white/70 hover:text-white transition-colors p-2 rounded flex items-center justify-center"
            :title="social.name"
          >
            <Icon :name="social.icon" :size="20" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import logo from '@/assets/LongLogo.png'
import Icon, { type TIconName } from '@/components/Icon.vue'

const socialLinks: Array<{
  name: string
  url: string
  icon: TIconName
}> = [
  { name: 'youtube', url: 'https://www.youtube.com/@Core_League', icon: 'youtube' },
  { name: 'telegram', url: 'https://t.me/s/core_league', icon: 'telegram' },
  { name: 'discord', url: 'https://discord.gg/QeDj9TjmgM', icon: 'discord' },
  { name: 'instagram', url: 'https://www.instagram.com/core__league/', icon: 'instagram' },
  { name: 'tiktok', url: 'https://www.tiktok.com/@core_league', icon: 'tiktok' },
  { name: 'twitch', url: 'https://www.twitch.tv/core_league', icon: 'twitch' }
]

</script>
