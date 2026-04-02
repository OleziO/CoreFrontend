<template>
  <component
    :is="icons[name]"
    class="icon"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>

<script setup lang="ts">
import SteamLogo from '@/assets/icons/steam-logo.svg'
import DiscordLogo from '@/assets/icons/discord-logo.svg'
import DotabuffLogo from '@/assets/icons/dotabuff-logo.svg'
import YouTubeIcon from '@/assets/icons/youtube.svg'
import TelegramIcon from '@/assets/icons/telegram.svg'
import InstagramIcon from '@/assets/icons/instagram.svg'
import TikTokIcon from '@/assets/icons/tiktok.svg'
import TwitchIcon from '@/assets/icons/twitch.svg'

const icons = {
  steam: SteamLogo,
  discord: DiscordLogo,
  dotabuff: DotabuffLogo,
  youtube: YouTubeIcon,
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  twitch: TwitchIcon
}

export type TIconName = keyof typeof icons

withDefaults(defineProps<{
  name: TIconName
  size?: number
}>(), {
  size: 24
})

</script>
