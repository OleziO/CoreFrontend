<template>
  <section class="bstreamer" aria-labelledby="bstreamer-title">
    <span class="bstreamer__glow" aria-hidden="true" />

    <span class="bstreamer__eyebrow">
      <PhBroadcast :size="12" weight="bold" aria-hidden="true" />
      // Стрімер турніру
    </span>

    <div class="bstreamer__who">
      <span class="bstreamer__avatar-ring" :class="{ 'is-live': live }">
        <el-avatar :src="resolvePublicOrApiUrl(streamer?.avatarUrl)" :size="56">
          {{ duelPlayerInitial(streamer) }}
        </el-avatar>
        <span v-if="live" class="bstreamer__live">LIVE</span>
      </span>
      <div class="flex min-w-0 flex-col gap-2">
        <h2 id="bstreamer-title" class="bstreamer__name">{{ duelPlayerName(streamer) }}</h2>
        <span v-if="streamer?.discordUsername" class="bstreamer__handle">@{{ streamer.discordUsername }}</span>
        <RouterLink
          v-if="streamer"
          :to="{ name: routeNames.player, params: { id: streamer.id } }"
          class="bstreamer__profile no-underline"
        >
          Профіль у лізі
        </RouterLink>
      </div>
    </div>

    <!-- Стрім: Twitch-канал вбудовуємо, інші платформи — посиланням -->
    <template v-if="streamUrl">
      <div v-if="twitchChannel && playerOpen" class="bstreamer__player">
        <iframe
          :src="playerUrl"
          :title="`Стрім ${twitchChannel} на Twitch`"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        />
      </div>
      <div class="bstreamer__actions">
        <el-button v-if="twitchChannel && !playerOpen" class="bstreamer__watch" @click="playerOpen = true">
          <PhPlay :size="14" weight="fill" />
          <span class="ml-6">Дивитися тут</span>
        </el-button>
        <a :href="streamUrl" target="_blank" rel="noopener noreferrer nofollow" class="no-underline">
          <el-button :class="{ bstreamer__watch: !twitchChannel }">
            <PhTwitchLogo v-if="platform === 'twitch'" :size="15" weight="fill" />
            <PhYoutubeLogo v-else-if="platform === 'youtube'" :size="15" weight="fill" />
            <PhBroadcast v-else :size="15" weight="bold" />
            <span class="ml-6">{{ streamLinkLabel }}</span>
            <PhArrowSquareOut :size="13" class="ml-6 opacity-60" />
          </el-button>
        </a>
      </div>
    </template>
    <p v-else class="bstreamer__muted">Посилання на трансляцію стрімер ще не додав.</p>

    <div v-if="description" class="bstreamer__about">
      <span class="bstreamer__about-label">Про турнір</span>
      <p class="bstreamer__about-text">{{ description }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PhArrowSquareOut,
  PhBroadcast,
  PhPlay,
  PhTwitchLogo,
  PhYoutubeLogo
} from '@phosphor-icons/vue'
import { buildTwitchPlayerUrl } from '@/config/streaming'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { duelPlayerInitial, duelPlayerName } from '@/views/duels/duels.utils'
import { streamPlatformOf, twitchChannelOf } from '@/views/media/media.utils'
import type { TDuelPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  streamer: TDuelPlayer | null
  streamUrl: string | null
  description: string | null
  /** Турнір іде зараз — плеєр відкривається сам. */
  live?: boolean
}>(), {
  live: false
})

const platform = computed(() => streamPlatformOf(props.streamUrl))
const twitchChannel = computed(() => twitchChannelOf(props.streamUrl))
const playerUrl = computed(() =>
  twitchChannel.value ? buildTwitchPlayerUrl(window.location.hostname, twitchChannel.value) : ''
)

const playerOpen = ref(props.live)
watch(() => props.live, (live) => {
  if (live) playerOpen.value = true
})

const streamLinkLabel = computed(() => {
  switch (platform.value) {
    case 'twitch': return twitchChannel.value ? `twitch.tv/${twitchChannel.value}` : 'Twitch'
    case 'youtube': return 'YouTube'
    case 'kick': return 'Kick'
    default: return 'Трансляція'
  }
})
</script>

<style scoped>
.bstreamer {
  --tw: 145, 70, 255;

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.bstreamer__glow {
  position: absolute;
  top: -80px;
  right: -80px;
  z-index: -1;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--tw), 0.3), transparent 70%);
}

.bstreamer__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(190, 160, 255);
}

.bstreamer__who {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.bstreamer__avatar-ring {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--tw)), rgba(var(--ds-pink-rgb), 0.8));
  box-shadow: 0 0 16px rgba(var(--tw), 0.45);
}

.bstreamer__avatar-ring.is-live {
  animation: bstreamer-ring 2.4s ease-in-out infinite;
}

.bstreamer__live {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  background: rgb(220, 38, 38);
}

.bstreamer__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-display);
  font-size: 20px;
  line-height: 1.15;
  color: var(--ds-text-strong);
}

.bstreamer__handle {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.bstreamer__profile {
  width: fit-content;
  font-size: 12px;
  font-weight: 600;
  color: rgb(190, 160, 255);
}

.bstreamer__player {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  border: 1px solid rgba(var(--tw), 0.35);
  background: #000;
}

.bstreamer__player iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.bstreamer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bstreamer__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.bstreamer__watch {
  --el-button-bg-color: rgb(var(--tw));
  --el-button-border-color: rgb(var(--tw));
  --el-button-hover-bg-color: rgb(165, 100, 255);
  --el-button-hover-border-color: rgb(165, 100, 255);
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;
}

.bstreamer__muted {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.bstreamer__about {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.bstreamer__about-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.bstreamer__about-text {
  white-space: pre-line;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ds-text-muted);
}

@keyframes bstreamer-ring {
  0%, 100% { box-shadow: 0 0 12px rgba(var(--tw), 0.4); }
  50% { box-shadow: 0 0 24px rgba(var(--tw), 0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .bstreamer__avatar-ring.is-live {
    animation: none;
  }
}
</style>
