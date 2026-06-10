<template>
  <footer
    class="
      sticky bottom-0 z-50 w-full
      border-t border-white/10
      shadow-[0_-10px_30px_rgba(0,0,0,0.35)]
      bg-surface/80 backdrop-blur-xl
      flex justify-center items-center
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
        <nav class="hidden lg:flex flex-1 items-center gap-32">
          <RouterLink
            v-for="item in footerNavItems"
            :key="item.name"
            :to="{ name: item.name }"
            active-class=""
            exact-active-class=""
            class="
              footer-site-link p-0 text-sm font-medium tracking-[4] text-white/70 no-underline
              transition-colors hover:text-primary
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- LOGO -->
        <RouterLink
          :to="{ name: routeNames.rootPage }"
          class="footer-site-link hidden h-full items-center justify-center py-10 lg:flex"
        >
          <el-image
            class="h-full w-full max-h-30 cursor-pointer"
            fit="contain"
            :src="logo"
            alt="Core League"
          />
        </RouterLink>

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
import logo from '@/assets/images/core-league-logo-full.png'
import Icon, { type TIconName } from '@/components/Icon.vue'

const footerNavItems: Array<{ name: string; label: string }> = [
  { name: routeNames.tournaments, label: 'Турніри' },
  { name: routeNames.teams, label: 'Команди' },
  { name: routeNames.players, label: 'Гравці' }
]

const socialLinks: Array<{
  name: string
  url: string
  icon: TIconName
}> = [
  { name: 'youtube', url: 'https://www.youtube.com/@Core_League', icon: 'youtube' },
  { name: 'telegram', url: 'https://t.me/s/core_league', icon: 'telegram' },
  { name: 'discord', url: 'https://discord.gg/QeDj9TjmgM', icon: 'discord' },
  { name: 'instagram', url: 'https://www.instagram.com/core__league/', icon: 'instagram' },
  { name: 'tiktok', url: 'https://www.tiktok.com/@core_league_dota2', icon: 'tiktok' },
  { name: 'twitch', url: 'https://www.twitch.tv/core_league', icon: 'twitch' }
]

</script>

<style scoped>
/* Чистий текстовий вигляд: без «плашки» як у кнопок EP / фокус-фону браузера */
.footer-site-link {
  @apply m-0 inline-flex items-center rounded-none border-0 bg-transparent shadow-none;
  @apply outline-none ring-0 ring-offset-0;
}

.footer-site-link:hover,
.footer-site-link:focus,
.footer-site-link:focus-visible,
.footer-site-link:active {
  @apply bg-transparent shadow-none outline-none ring-0;
}
</style>
