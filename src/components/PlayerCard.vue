<template>
  <RouterLink
    v-if="player"
    :to="{ name: routeNames.player, params: { id: player.id } }"
    class="player-card neon-card rounded-2xl"
    :class="{ 'is-captain': isCaptain }"
  >
    <!-- Avatar + verification seal -->
    <span class="player-card__avatar">
      <el-avatar :src="avatarSrc" :size="48" class="player-card__img">
        <template #default>
          <PhUser :size="20" weight="bold" class="text-white/70" />
        </template>
      </el-avatar>
      <el-tooltip :content="isVerified ? 'Верифікований' : 'Не верифікований'" placement="top" effect="dark">
        <StatusBadge
          :preset="isVerified ? 'verified' : 'unverified'"
          size="xs"
          icon-only
          class="player-card__seal"
        />
      </el-tooltip>
    </span>

    <!-- Name + handle -->
    <span class="player-card__body">
      <span class="player-card__name">
        <el-tooltip v-if="isCaptain" placement="top" effect="dark" content="Капітан команди">
          <span class="player-card__crown" role="img" aria-label="Капітан команди">
            <PhCrown weight="fill" :size="14" />
          </span>
        </el-tooltip>
        <el-tooltip :content="player.discordName || '-'" placement="top">
          <span class="truncate">{{ player.discordName }}</span>
        </el-tooltip>
      </span>

      <el-tooltip :content="player.discordUsername ? 'Скопіювати Discord' : ''" placement="top">
        <button
          type="button"
          class="player-card__handle"
          :class="{ 'is-static': !player.discordUsername }"
          :disabled="!player.discordUsername"
          @click.prevent.stop="player.discordUsername && getCopy(player.discordUsername, 'Discord')"
        >
          <span class="truncate">{{ player.discordUsername ? `@${player.discordUsername}` : '—' }}</span>
          <PhCopy v-if="player.discordUsername" :size="11" class="player-card__copy" />
        </button>
      </el-tooltip>
    </span>

    <!-- Rank: medal over the rating number -->
    <span class="player-card__rank">
      <img
        v-if="rankImageSrc"
        :src="rankImageSrc"
        alt=""
        class="player-card__medal"
        width="64"
        height="40"
        loading="lazy"
        draggable="false"
      >
      <span class="player-card__mmr">{{ player.rating ?? '—' }}</span>
    </span>
  </RouterLink>
</template>

<script lang="ts" setup>
import { routeNames } from '@/router/route-names'
import { PhCopy, PhCrown, PhUser } from '@phosphor-icons/vue'
import {
  getCopy, getPlayerRankImageSrcFromPlayerRank, isPlayerVerified, resolvePublicOrApiUrl
} from '@/core/helpers'
import type { TPlayerResponseDto } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  player: TPlayer | TPlayerResponseDto | null
  isCaptain?: boolean
  showStatusGlow?: boolean
  showRegularCap?: boolean
  skipTeamFetch?: boolean
  isMixCap?: boolean
}>(), {
  isCaptain: false,
  showStatusGlow: true,
  showRegularCap: true,
  skipTeamFetch: false
})

const isVerified = computed(() => isPlayerVerified(props.player))

const avatarSrc = computed(() =>
  props.player ? resolvePublicOrApiUrl(props.player.avatarUrl) : ''
)

const rankImageSrc = computed(() =>
  props.player ? getPlayerRankImageSrcFromPlayerRank(props.player.rank) : ''
)
</script>

<style lang="scss" scoped>
.player-card {
  @apply relative grid w-full items-center gap-12 overflow-hidden py-10 pl-14 pr-12 no-underline;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  color: inherit;
  cursor: pointer;

  // Left rail: lights on hover; captains carry it in gold at rest.
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &.is-captain::before {
    opacity: 1;
    background: var(--ds-gold);
    box-shadow: 0 0 8px rgba(var(--ds-gold-rgb), 0.9);
  }

  &:active {
    transform: scale(0.99);
  }
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
.player-card__avatar {
  @apply relative block size-48 shrink-0;
}

.player-card__img {
  width: 48px !important;
  height: 48px !important;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 2px rgba(var(--ds-primary-rgb), 0.25), 0 6px 16px rgba(0, 0, 0, 0.4);
  transition: box-shadow var(--ds-duration-base) ease;
}

.player-card__seal {
  @apply absolute -bottom-2 -right-2 z-[2];
}

// ─── Body ───────────────────────────────────────────────────────────────────
.player-card__body {
  @apply flex min-w-0 flex-col gap-3;
}

.player-card__name {
  @apply flex min-w-0 items-center gap-6 font-display text-[14px] uppercase leading-tight tracking-wide text-white;
  transition: color var(--ds-duration-base) ease;
}

.player-card__crown {
  @apply inline-flex shrink-0 cursor-default;
  color: var(--ds-gold);
  filter: drop-shadow(0 0 6px rgba(var(--ds-gold-rgb), 0.55));
}

.player-card__handle {
  @apply inline-flex max-w-full min-w-0 items-center gap-6 self-start rounded border-0 bg-transparent p-0 text-left;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-base) ease;

  &.is-static {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }
}

.player-card__copy {
  @apply shrink-0;
  opacity: 0.5;
  transition: opacity var(--ds-duration-base) ease;
}

// ─── Rank ───────────────────────────────────────────────────────────────────
.player-card__rank {
  @apply flex shrink-0 cursor-default flex-col items-center gap-2;
  min-width: 56px;
}

.player-card__medal {
  @apply h-36 w-auto max-w-[64px] select-none object-contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.player-card__mmr {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
  font-variant-numeric: tabular-nums;
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .player-card:hover {
    &::before {
      opacity: 1;
    }

    .player-card__name {
      color: var(--ds-primary);
    }

    .player-card__img {
      box-shadow: 0 0 0 2px rgba(var(--ds-primary-rgb), 0.6), 0 6px 18px rgba(var(--ds-primary-rgb), 0.25);
    }

    .player-card__medal {
      transform: translateY(-1px) scale(1.04);
    }
  }

  .player-card__handle:not(.is-static):hover {
    color: #fff;

    .player-card__copy {
      opacity: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .player-card__medal {
    transition: none;
  }

  .player-card:hover .player-card__medal {
    transform: none;
  }
}
</style>
