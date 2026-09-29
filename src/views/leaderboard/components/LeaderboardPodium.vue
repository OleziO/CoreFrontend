<template>
  <div class="podium">
    <RouterLink
      v-for="row in rows"
      :key="row.playerId"
      :to="{ name: routeNames.player, params: { id: row.playerId } }"
      class="podium-card neon-card hud-corners rounded-2xl no-underline"
      :class="[`podium-card--${row.position}`]"
      :style="{ '--tile-tone': toneOf(row.position), '--tile-delay': `${row.position * 80}ms` }"
      :aria-label="`${row.position} місце: ${displayName(row)}, ${formatLeaderboardNumber(row.score)} очок`"
    >
      <span class="podium-card__glow" aria-hidden="true" />

      <span class="podium-card__place">
        <component :is="iconOf(row.position)" :size="14" weight="fill" />
        #{{ row.position }}
      </span>

      <div class="podium-card__identity">
        <el-avatar :src="resolvePublicOrApiUrl(row.avatarUrl)" :size="64" class="podium-card__avatar">
          {{ initialOf(row) }}
        </el-avatar>
        <span class="podium-card__names">
          <span class="podium-card__name truncate">{{ displayName(row) }}</span>
          <span v-if="row.discordUsername" class="podium-card__handle truncate">@{{ row.discordUsername }}</span>
        </span>
      </div>

      <div class="podium-card__score">
        <span class="podium-card__score-value">{{ formatLeaderboardNumber(row.score) }}</span>
        <span class="podium-card__score-label">очок рейтингу</span>
      </div>

      <dl class="podium-card__stats">
        <div class="podium-card__stat">
          <dt>Перемог</dt>
          <dd>{{ formatLeaderboardNumber(row.wins) }}</dd>
        </div>
        <div class="podium-card__stat">
          <dt>Вінрейт</dt>
          <dd>{{ formatLeaderboardPercent(row.winrate) }}</dd>
        </div>
        <div class="podium-card__stat">
          <dt>Трофеїв</dt>
          <dd>{{ formatLeaderboardNumber(row.achievements) }}</dd>
        </div>
      </dl>

      <div class="podium-card__rank">
        <img
          v-if="rankImageOf(row)"
          :src="rankImageOf(row)"
          alt=""
          width="36"
          height="28"
          loading="lazy"
          draggable="false"
          class="h-28 w-auto max-w-[36px] select-none object-contain"
        >
        <span class="podium-card__rank-text">
          {{ row.rank.nameUk }}
          <span class="podium-card__mmr">· {{ formatLeaderboardNumber(row.rating) }} MMR</span>
        </span>
      </div>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { PhCrown, PhMedal, PhMedalMilitary } from '@phosphor-icons/vue'
import { getPlayerRankImageSrc, resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { formatLeaderboardNumber, formatLeaderboardPercent } from '@/views/leaderboard/leaderboard.utils'

defineProps<{
  /** Перші три рядки дошки в порядку позицій. */
  rows: TLeaderboardRow[]
}>()

const TONES: Record<number, string> = {
  1: 'var(--ds-gold-rgb)',
  2: '198, 205, 220',
  3: '205, 127, 50'
}

const ICONS: Record<number, Component> = {
  1: PhCrown,
  2: PhMedal,
  3: PhMedalMilitary
}

const toneOf = (position: number) => TONES[position] ?? 'var(--ds-primary-rgb)'
const iconOf = (position: number) => ICONS[position] ?? PhMedal

function displayName (row: TLeaderboardRow): string {
  return row.discordName || row.discordUsername || 'Гравець'
}

function initialOf (row: TLeaderboardRow): string {
  return displayName(row).charAt(0).toUpperCase()
}

function rankImageOf (row: TLeaderboardRow): string {
  return getPlayerRankImageSrc(row.rank?.numericName)
}
</script>

<style scoped>
/* Класичний п’єдестал на md+: срібло | золото (вище) | бронза; на мобільному — 1, 2, 3 згори вниз. */
.podium {
  display: grid;
  gap: 12px;
}

@media (min-width: 768px) {
  .podium {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }

  .podium-card--1 {
    order: 2;
    margin-top: -12px;
  }

  .podium-card--2 {
    order: 1;
  }

  .podium-card--3 {
    order: 3;
  }
}

.podium-card {
  --tile-tone: var(--ds-primary-rgb);
  --neon-card-line-color: var(--tile-tone);
  --neon-card-line: 0.7;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 18px 16px;
  color: inherit;
  overflow: hidden;
  border-color: rgba(var(--tile-tone), 0.28);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.podium-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--tile-tone), 0.6);
}

@media (hover: hover) and (pointer: fine) {
  .podium-card:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--tile-tone), 0.6);
    box-shadow: 0 0 22px rgba(var(--tile-tone), 0.22);
  }
}

/* Лампа в правому верхньому куті — колір місця. */
.podium-card__glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 170px;
  height: 170px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(var(--tile-tone), 0.24), transparent 65%);
  pointer-events: none;
}

.podium-card__place {
  position: absolute;
  top: 12px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--tile-tone), 0.45);
  background: rgba(var(--tile-tone), 0.1);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgb(var(--tile-tone));
}

.podium-card__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-right: 64px;
}

/* Глобальний .el-avatar фіксує 56px — тут аватар більший і в тоні місця. */
.podium-card__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  flex-shrink: 0;
  width: 64px;
  height: 64px;
  font-size: 22px;
  box-shadow: 0 0 0 2px var(--ds-surface), 0 0 0 3px rgba(var(--tile-tone), 0.6), 0 0 18px rgba(var(--tile-tone), 0.3);
}

.podium-card__names {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.podium-card__name {
  font-family: var(--ds-font-display);
  font-size: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
}

.podium-card__handle {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.podium-card__score {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.podium-card__score-value {
  font-family: var(--ds-font-body);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  color: var(--ds-text-strong);
  text-shadow: 0 0 14px rgba(var(--tile-tone), 0.5);
}

.podium-card__score-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--tile-tone), 0.9);
}

.podium-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 10px 0 0;
  border-top: 1px solid rgba(var(--tile-tone), 0.18);
}

.podium-card__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.podium-card__stat dt {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.podium-card__stat dd {
  margin: 0;
  font-family: var(--ds-font-mono);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}

.podium-card__rank {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.podium-card__rank-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ds-text-muted);
}

.podium-card__mmr {
  color: var(--ds-text-faint);
}

@media (prefers-reduced-motion: no-preference) {
  .podium-card {
    animation: podium-card-in 560ms var(--ds-ease-out) both;
    animation-delay: var(--tile-delay);
  }

  @keyframes podium-card-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
