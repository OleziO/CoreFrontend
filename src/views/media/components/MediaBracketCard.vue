<template>
  <RouterLink
    :to="{ name: routeNames.mediaBracket, params: { id: bracket.id } }"
    class="mb-card no-underline"
    :class="`is-${bracket.status.toLowerCase()}`"
    :aria-label="`Турнір ${bracket.name}`"
  >
    <span class="mb-card__glow" aria-hidden="true" />

    <header class="mb-card__top">
      <span class="mb-card__status">
        <span v-if="bracket.status === 'LIVE'" class="mb-card__live-dot" aria-hidden="true" />
        {{ duelBracketStatusLabels[bracket.status] }}
      </span>
      <span class="flex items-center gap-6">
        <span v-if="bracket.joined" class="mb-card__chip is-joined">
          <PhCheckCircle :size="12" weight="fill" aria-hidden="true" />
          Ви в турнірі
        </span>
        <span v-if="bracket.hasPassword" class="mb-card__chip" title="Реєстрація за паролем">
          <PhLockSimple :size="12" weight="bold" aria-hidden="true" />
        </span>
      </span>
    </header>

    <h3 class="mb-card__title">{{ bracket.name }}</h3>

    <!-- Стрімер -->
    <div class="mb-card__streamer">
      <el-avatar :src="resolvePublicOrApiUrl(bracket.createdBy?.avatarUrl)" :size="28" class="mb-card__avatar">
        {{ duelPlayerInitial(bracket.createdBy) }}
      </el-avatar>
      <span class="flex min-w-0 flex-col">
        <span class="mb-card__streamer-label">Стрімер</span>
        <span class="mb-card__streamer-name">{{ duelPlayerName(bracket.createdBy) }}</span>
      </span>
      <span v-if="platform === 'twitch'" class="mb-card__platform" title="Стрім на Twitch">
        <PhTwitchLogo :size="16" weight="fill" />
      </span>
      <span v-else-if="bracket.streamUrl" class="mb-card__platform" title="Є трансляція">
        <PhBroadcast :size="16" weight="bold" />
      </span>
    </div>

    <!-- Учасники: заповненість сітки -->
    <div class="mb-card__slots">
      <div class="flex items-baseline justify-between gap-8">
        <span class="mb-card__meta-label">Учасники</span>
        <span class="mb-card__slots-count">
          <strong>{{ bracket.participantsCount }}</strong> / {{ bracket.maxParticipants }}
        </span>
      </div>
      <span class="mb-card__bar" aria-hidden="true">
        <span class="mb-card__bar-fill" :style="{ width: `${fillPercent}%` }" />
      </span>
    </div>

    <!-- Чемпіон або призи -->
    <div v-if="bracket.winner" class="mb-card__winner">
      <PhCrown :size="16" weight="fill" aria-hidden="true" />
      <span class="truncate">{{ duelPlayerName(bracket.winner) }}</span>
    </div>
    <div v-else-if="bracket.prizes.length" class="mb-card__prizes">
      <DuelPrizeChip v-for="prize in bracket.prizes.slice(0, 3)" :key="prize.place" :prize="prize" />
      <span v-if="bracket.prizes.length > 3" class="mb-card__more">+{{ bracket.prizes.length - 3 }}</span>
    </div>

    <footer class="mb-card__foot">
      <span class="mb-card__when">
        <PhCalendarBlank :size="13" aria-hidden="true" />
        {{ whenLabel }}
      </span>
      <span class="mb-card__open">
        {{ bracket.status === 'REGISTRATION' && !bracket.joined ? 'Зареєструватися' : 'Відкрити' }}
        <PhArrowRight :size="13" weight="bold" aria-hidden="true" />
      </span>
    </footer>
  </RouterLink>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import {
  PhArrowRight,
  PhBroadcast,
  PhCalendarBlank,
  PhCheckCircle,
  PhCrown,
  PhLockSimple,
  PhTwitchLogo
} from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import DuelPrizeChip from '@/views/duels/components/DuelPrizeChip.vue'
import { duelPlayerInitial, duelPlayerName } from '@/views/duels/duels.utils'
import { duelBracketStatusLabels, streamPlatformOf } from '@/views/media/media.utils'
import type { TDuelBracketSummary } from '@/api/types/api.types'

const props = defineProps<{
  bracket: TDuelBracketSummary
}>()

const platform = computed(() => streamPlatformOf(props.bracket.streamUrl))

const fillPercent = computed(() =>
  Math.min(100, Math.round((props.bracket.participantsCount / Math.max(1, props.bracket.maxParticipants)) * 100))
)

const whenLabel = computed(() => {
  const b = props.bracket
  if (b.status === 'LIVE' && b.startedAt) return `Стартував ${dayjs(b.startedAt).format('DD.MM, HH:mm')}`
  if ((b.status === 'FINISHED' || b.status === 'CANCELLED') && b.finishedAt) {
    return dayjs(b.finishedAt).format('DD.MM.YYYY')
  }
  if (b.scheduledAt) return `Старт ${dayjs(b.scheduledAt).format('DD.MM, HH:mm')}`
  return 'Старт — за рішенням стрімера'
})
</script>

<style scoped>
.mb-card {
  --tw: 145, 70, 255;
  --tone: var(--tw);

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 18px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(var(--tone), 0.22);
  background:
    linear-gradient(90deg, transparent 0%, rgba(var(--tone), 0.7) 50%, transparent 100%) top / 100% 1px no-repeat,
    linear-gradient(165deg, rgba(31, 22, 56, 0.9) 0%, rgba(13, 15, 28, 0.94) 60%);
  box-shadow: var(--ds-elevation-3);
  color: var(--ds-text);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.mb-card.is-finished,
.mb-card.is-cancelled {
  --tone: 148, 163, 184;
}

.mb-card.is-cancelled {
  opacity: 0.72;
}

.mb-card:focus-visible {
  outline: 2px solid rgba(var(--tw), 0.7);
  outline-offset: 2px;
}

.mb-card__glow {
  position: absolute;
  inset: -40% -20% auto auto;
  z-index: -1;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--tone), 0.22), transparent 70%);
  pointer-events: none;
}

.mb-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mb-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(var(--tone), 1);
  background: rgba(var(--tone), 0.12);
  border: 1px solid rgba(var(--tone), 0.3);
}

.mb-card.is-live .mb-card__status {
  color: #fff;
  background: linear-gradient(90deg, rgba(var(--tw), 0.85), rgba(var(--ds-pink-rgb), 0.75));
  border-color: transparent;
  box-shadow: 0 0 14px rgba(var(--tw), 0.5);
}

.mb-card.is-registration .mb-card__status {
  --tone: var(--ds-primary-rgb);
}

.mb-card__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: mb-pulse 1.4s ease-in-out infinite;
}

.mb-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.mb-card__chip.is-joined {
  color: var(--ds-success);
  background: rgba(34, 197, 94, 0.12);
}

.mb-card__title {
  font-family: var(--ds-font-display);
  font-size: 20px;
  line-height: 1.2;
  color: var(--ds-text-strong);
  overflow-wrap: anywhere;
}

.mb-card__streamer {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mb-card__avatar {
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(var(--tw), 0.55);
}

.mb-card__streamer-label,
.mb-card__meta-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.mb-card__streamer-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.mb-card__platform {
  margin-left: auto;
  display: inline-flex;
  color: rgb(var(--tw));
  filter: drop-shadow(0 0 6px rgba(var(--tw), 0.6));
}

.mb-card__slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mb-card__slots-count {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.mb-card__slots-count strong {
  font-size: 15px;
  color: var(--ds-text-strong);
}

.mb-card__bar {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.mb-card__bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(var(--tone), 0.9), rgba(var(--ds-pink-rgb), 0.8));
  box-shadow: 0 0 8px rgba(var(--tone), 0.6);
  transition: width var(--ds-duration-base) var(--ds-ease-out);
}

.mb-card__winner {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 600;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.1);
  border: 1px solid rgba(var(--ds-gold-rgb), 0.25);
}

.mb-card__prizes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.mb-card__more {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.mb-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mb-card__when {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ds-text-faint);
}

.mb-card__open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--tone));
  transition: gap var(--ds-duration-fast) ease;
}

@media (hover: hover) and (pointer: fine) {
  .mb-card:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--tone), 0.55);
    box-shadow: var(--ds-elevation-3), 0 0 22px rgba(var(--tone), 0.28);
  }

  .mb-card:hover .mb-card__open {
    gap: 10px;
  }
}

@keyframes mb-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .mb-card__live-dot {
    animation: none;
  }
}
</style>
