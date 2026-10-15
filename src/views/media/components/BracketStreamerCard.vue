<template>
  <section class="bstreamer" :class="{ 'is-live': live }" aria-labelledby="bstreamer-title">
    <span class="bstreamer__grid" aria-hidden="true" />
    <span class="bstreamer__glow" aria-hidden="true" />

    <!-- Хто веде турнір -->
    <div class="bstreamer__info">
      <div class="bstreamer__eyebrow">
        <span v-if="live" class="bstreamer__onair">
          <span class="bstreamer__onair-dot" aria-hidden="true" />
          В ефірі
        </span>
        <span class="bstreamer__eyebrow-label">
          <PhBroadcast :size="14" weight="bold" aria-hidden="true" />
          Стрімер турніру
        </span>
      </div>

      <div class="bstreamer__who">
        <span class="bstreamer__avatar-ring">
          <el-avatar :src="resolvePublicOrApiUrl(streamer?.avatarUrl)" :size="96" class="bstreamer__avatar">
            {{ duelPlayerInitial(streamer) }}
          </el-avatar>
        </span>
        <div class="bstreamer__id">
          <h2 id="bstreamer-title" class="bstreamer__name">{{ duelPlayerName(streamer) }}</h2>
          <div class="bstreamer__meta">
            <span v-if="streamer?.discordUsername" class="bstreamer__handle">@{{ streamer.discordUsername }}</span>
            <RouterLink
              v-if="streamer"
              :to="{ name: routeNames.player, params: { id: streamer.id } }"
              class="bstreamer__profile no-underline"
            >
              Профіль у лізі
              <PhArrowRight :size="13" weight="bold" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </div>

      <a
        v-if="twitchChannel && streamUrl"
        :href="streamUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="no-underline w-fit"
      >
        <el-button size="large" class="bstreamer__external">
          <PhTwitchLogo :size="16" weight="fill" />
          <span class="ml-8">twitch.tv/{{ twitchChannel }}</span>
          <PhArrowSquareOut :size="14" class="ml-8 opacity-60" />
        </el-button>
      </a>

      <!-- Інші канали стрімера -->
      <ul v-if="channels.length" class="bstreamer__channels" aria-label="Канали стрімера">
        <li v-for="channel in channels" :key="channel.key">
          <a
            :href="channel.url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="bstreamer__channel no-underline"
            :style="{ '--brand': channel.rgb }"
            :title="channel.label"
            :aria-label="`${channel.label} стрімера`"
          >
            <Icon :name="channel.icon" :size="20" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </div>

    <!-- «Екран»: Twitch вбудовуємо, інші платформи — посиланням -->
    <div class="bstreamer__screen">
      <iframe
        v-if="twitchChannel && playerOpen"
        :src="playerUrl"
        :title="`Стрім ${twitchChannel} на Twitch`"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        class="bstreamer__player"
      />
      <button
        v-else-if="twitchChannel"
        type="button"
        class="bstreamer__poster is-action"
        @click="playerOpen = true"
      >
        <span class="bstreamer__play" aria-hidden="true">
          <PhPlay :size="30" weight="fill" />
        </span>
        <span class="bstreamer__poster-title">Дивитися трансляцію тут</span>
        <span class="bstreamer__poster-sub">Плеєр Twitch відкриється прямо на сторінці</span>
      </button>
      <a
        v-else-if="streamUrl"
        :href="streamUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="bstreamer__poster is-action no-underline"
      >
        <span class="bstreamer__play" aria-hidden="true">
          <PhYoutubeLogo v-if="platform === 'youtube'" :size="30" weight="fill" />
          <Icon v-else-if="platform === 'kick'" name="kick" :size="26" />
          <PhPlay v-else :size="30" weight="fill" />
        </span>
        <span class="bstreamer__poster-title">
          {{ platformName ? `Дивитися на ${platformName}` : 'Відкрити трансляцію' }}
        </span>
        <span class="bstreamer__poster-sub">
          Трансляція відкриється в новій вкладці
          <PhArrowSquareOut :size="12" aria-hidden="true" />
        </span>
      </a>
      <div v-else class="bstreamer__poster">
        <span class="bstreamer__play is-muted" aria-hidden="true">
          <PhBroadcast :size="28" weight="bold" />
        </span>
        <span class="bstreamer__poster-title">Трансляцію ще не підключено</span>
        <span class="bstreamer__poster-sub">Посилання на стрім з’явиться тут, щойно стрімер його додасть.</span>
      </div>
    </div>

    <div v-if="description" class="bstreamer__about">
      <span class="bstreamer__about-label">Про турнір</span>
      <p class="bstreamer__about-text">{{ description }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PhArrowRight,
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
import { STREAMER_LINK_PLATFORMS, streamPlatformOf, twitchChannelOf } from '@/views/media/media.utils'
import type { TDuelBracketStreamerLinks, TDuelPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  streamer: TDuelPlayer | null
  streamUrl: string | null
  streamerLinks?: TDuelBracketStreamerLinks | null
  description: string | null
  /** Турнір іде зараз — плеєр відкривається сам. */
  live?: boolean
}>(), {
  streamerLinks: null,
  live: false
})

const channels = computed(() =>
  STREAMER_LINK_PLATFORMS
    .map(p => ({ ...p, url: props.streamerLinks?.[p.key] ?? null }))
    .filter((c): c is typeof c & { url: string } => !!c.url)
)

const platform = computed(() => streamPlatformOf(props.streamUrl))
const twitchChannel = computed(() => twitchChannelOf(props.streamUrl))
const playerUrl = computed(() =>
  twitchChannel.value ? buildTwitchPlayerUrl(window.location.hostname, twitchChannel.value) : ''
)

const playerOpen = ref(props.live)
watch(() => props.live, (live) => {
  if (live) playerOpen.value = true
})

const platformName = computed(() => {
  switch (platform.value) {
    case 'twitch': return 'Twitch'
    case 'youtube': return 'YouTube'
    case 'kick': return 'Kick'
    default: return ''
  }
})
</script>

<style scoped>
/* Головна «сцена» сторінки: стрімер ліворуч, екран трансляції праворуч */
.bstreamer {
  --tw: 145, 70, 255;
  --live: 239, 68, 68;

  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  padding: 22px;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(var(--tw), 0.45);
  background:
    linear-gradient(90deg, transparent, rgba(var(--tw), 0.95), rgba(var(--ds-pink-rgb), 0.75), transparent)
      top / 100% 1px no-repeat,
    linear-gradient(120deg, rgba(44, 24, 88, 0.92) 0%, rgba(18, 15, 38, 0.96) 50%, rgba(10, 11, 22, 0.98) 100%);
  box-shadow: var(--ds-elevation-4), 0 0 48px rgba(var(--tw), 0.22);
}

.bstreamer.is-live {
  animation: bstreamer-breathe 3.2s ease-in-out infinite;
}

.bstreamer__grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(rgba(var(--tw), 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--tw), 0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 60% 90% at 15% 40%, #000, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 60% 90% at 15% 40%, #000, transparent 75%);
}

.bstreamer__glow {
  position: absolute;
  top: -160px;
  left: -120px;
  z-index: -1;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--tw), 0.42), rgba(var(--ds-pink-rgb), 0.1) 45%, transparent 70%);
  filter: blur(12px);
}

/* ─── Ліва колонка ─────────────────────────────────────────────────────── */
.bstreamer__info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.bstreamer__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.bstreamer__eyebrow-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(200, 175, 255);
}

.bstreamer__onair {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #fff;
  background: rgb(var(--live));
  box-shadow: 0 0 16px rgba(var(--live), 0.6);
}

.bstreamer__onair-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: bstreamer-pulse 1.3s ease-in-out infinite;
}

.bstreamer__who {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.bstreamer__avatar-ring {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 50%;
}

.bstreamer__avatar-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgb(var(--tw)), rgb(var(--ds-pink-rgb)), rgb(var(--tw)));
  box-shadow: 0 0 28px rgba(var(--tw), 0.55);
}

.bstreamer.is-live .bstreamer__avatar-ring::before {
  background: conic-gradient(from 0deg, rgb(var(--live)), rgb(var(--tw)), rgb(var(--ds-pink-rgb)), rgb(var(--live)));
  animation: bstreamer-spin 4s linear infinite;
}

/* Глобальний .el-avatar фіксує 56px */
.bstreamer__avatar {
  width: 72px;
  height: 72px;
  font-size: 26px;
  border: 3px solid rgb(14, 13, 30);
  box-shadow: none;
}

.bstreamer__id {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.bstreamer__name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
  font-family: var(--ds-font-display);
  font-size: clamp(22px, 3vw, 36px);
  line-height: 1.1;
  color: #fff;
  text-shadow: 0 0 24px rgba(var(--tw), 0.55);
}

.bstreamer__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
}

.bstreamer__handle {
  font-size: 13px;
  color: var(--ds-text-faint);
}

.bstreamer__profile {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: rgb(200, 175, 255);
  transition: color var(--ds-duration-fast) ease;
}

.bstreamer__profile:focus-visible {
  outline: 2px solid rgba(var(--tw), 0.8);
  outline-offset: 2px;
  border-radius: 4px;
}

.bstreamer__external {
  --el-button-bg-color: rgba(var(--tw), 0.12);
  --el-button-border-color: rgba(var(--tw), 0.45);
  --el-button-hover-bg-color: rgba(var(--tw), 0.24);
  --el-button-hover-border-color: rgba(var(--tw), 0.8);
  --el-button-active-bg-color: rgba(var(--tw), 0.3);
  --el-button-text-color: rgb(220, 205, 255);
  --el-button-hover-text-color: #fff;
}

.bstreamer__channels {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bstreamer__channel {
  --brand: 148, 163, 184;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(var(--brand), 0.35);
  background: rgba(var(--brand), 0.1);
  color: rgb(var(--brand));
  transition:
    background-color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.bstreamer__channel:focus-visible {
  outline: 2px solid rgba(var(--brand), 0.8);
  outline-offset: 2px;
}

.bstreamer__channel:active {
  transform: scale(0.94);
}

/* ─── Екран трансляції ─────────────────────────────────────────────────── */
.bstreamer__screen {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  min-width: 0;
  border-radius: 16px;
  border: 1px solid rgba(var(--tw), 0.4);
  background: rgb(6, 6, 14);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.02);
}

.bstreamer.is-live .bstreamer__screen {
  border-color: rgba(var(--live), 0.55);
}

.bstreamer__player {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.bstreamer__poster {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 16px;
  text-align: center;
  color: var(--ds-text);
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 4px),
    radial-gradient(ellipse 60% 70% at 50% 50%, rgba(var(--tw), 0.3), transparent 70%);
}

.bstreamer__poster.is-action {
  cursor: pointer;
}

.bstreamer__poster.is-action:focus-visible {
  outline: 2px solid rgba(var(--tw), 0.9);
  outline-offset: -4px;
  border-radius: 16px;
}

.bstreamer__play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  margin-bottom: 4px;
  border-radius: 50%;
  color: #fff;
  background: rgb(var(--tw));
  box-shadow: 0 0 0 10px rgba(var(--tw), 0.18), 0 0 44px rgba(var(--tw), 0.75);
  transition: transform var(--ds-duration-base) var(--ds-ease-out), box-shadow var(--ds-duration-base) ease;
}

.bstreamer__play.is-muted {
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.bstreamer__poster.is-action:active .bstreamer__play {
  transform: scale(0.95);
}

.bstreamer__poster-title {
  font-family: var(--ds-font-display);
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.2;
  color: #fff;
}

.bstreamer__poster-sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 36ch;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

/* ─── Опис ─────────────────────────────────────────────────────────────── */
.bstreamer__about {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.bstreamer__about-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.bstreamer__about-text {
  white-space: pre-line;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ds-text-muted);
}

@media (min-width: 640px) {
  .bstreamer__avatar {
    width: 96px;
    height: 96px;
    font-size: 34px;
  }
}

@media (min-width: 1024px) {
  .bstreamer {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: 32px;
    padding: 32px;
  }

  .bstreamer__about {
    grid-column: 1 / -1;
  }
}

@media (hover: hover) and (pointer: fine) {
  .bstreamer__profile:hover {
    color: #fff;
  }

  .bstreamer__channel:hover {
    border-color: rgba(var(--brand), 0.8);
    background: rgba(var(--brand), 0.2);
    box-shadow: 0 0 16px rgba(var(--brand), 0.35);
  }

  .bstreamer__poster.is-action:hover .bstreamer__play {
    transform: scale(1.06);
    box-shadow: 0 0 0 14px rgba(var(--tw), 0.22), 0 0 56px rgba(var(--tw), 0.9);
  }
}

@keyframes bstreamer-breathe {
  0%, 100% { box-shadow: var(--ds-elevation-4), 0 0 40px rgba(var(--tw), 0.2); }
  50% { box-shadow: var(--ds-elevation-4), 0 0 64px rgba(var(--tw), 0.42); }
}

@keyframes bstreamer-spin {
  to { transform: rotate(360deg); }
}

@keyframes bstreamer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .bstreamer.is-live,
  .bstreamer.is-live .bstreamer__avatar-ring::before,
  .bstreamer__onair-dot {
    animation: none;
  }
}
</style>
