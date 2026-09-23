<template>
  <RouterLink
    :to="{ name: routeNames.player, params: { id: player.id } }"
    class="roster-row group"
  >
    <!-- Аватар з крапкою верифікації -->
    <span class="relative shrink-0">
      <el-avatar :src="avatarSrc" :size="36" class="roster-row__avatar">
        <template #default>
          <PhUser :size="16" weight="bold" class="text-white/70" />
        </template>
      </el-avatar>
      <el-tooltip
        :content="isVerified ? 'Верифікований' : 'Не верифікований'"
        placement="top"
        effect="dark"
        :show-after="180"
      >
        <StatusBadge
          :preset="isVerified ? 'verified' : 'unverified'"
          size="xs"
          icon-only
          class="absolute -bottom-2 -right-2"
        />
      </el-tooltip>
    </span>

    <!-- Ім'я + discord -->
    <span class="flex min-w-0 flex-1 flex-col gap-2">
      <span class="roster-row__name">
        <el-tooltip
          v-if="isCaptain"
          placement="top"
          effect="dark"
          content="Капітан команди"
        >
          <PhCrown
            weight="fill"
            :size="14"
            class="shrink-0 text-gold drop-shadow-[0_0_6px_rgba(232,185,49,0.55)]"
            aria-label="Капітан команди"
          />
        </el-tooltip>
        <span class="truncate">{{ player.discordName || '—' }}</span>
      </span>
      <button
        v-if="player.discordUsername"
        type="button"
        class="roster-row__handle"
        :title="`Скопіювати @${player.discordUsername}`"
        @click.prevent.stop="getCopy(player.discordUsername, 'Discord')"
      >
        @{{ player.discordUsername }}
      </button>
    </span>

    <!-- Ранг або рейтинг -->
    <el-tooltip :content="ratingLabel" effect="dark" placement="top" :show-after="180">
      <span class="roster-row__rank">
        <img
          v-if="rankImageSrc"
          :src="rankImageSrc"
          alt=""
          class="h-32 w-auto max-w-[48px] select-none object-contain"
          width="48"
          height="32"
          loading="lazy"
          draggable="false"
        >
        <span v-else class="font-mono text-[13px] font-semibold tabular-nums text-primary neon-text-subtle">
          {{ player.rating ?? '—' }}
        </span>
      </span>
    </el-tooltip>
  </RouterLink>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import { PhCrown, PhUser } from '@phosphor-icons/vue'
import {
  getCopy,
  formatPlayerRatingMmr,
  getPlayerRankImageSrcFromPlayerRank,
  isPlayerVerified,
  resolvePublicOrApiUrl
} from '@/core/helpers'

const props = withDefaults(defineProps<{
  player: TPlayer
  isCaptain?: boolean
}>(), {
  isCaptain: false
})

const isVerified = computed(() => isPlayerVerified(props.player))
const avatarSrc = computed(() => resolvePublicOrApiUrl(props.player.avatarUrl))
const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(props.player.rank))
const ratingLabel = computed(() => formatPlayerRatingMmr(props.player.rating))
</script>

<style scoped lang="scss">
// Compact roster line: 52px tall, dark well, cyan hairline that lights on
// hover. Five of these plus the header fit a phone screen without scrolling.
.roster-row {
  @apply flex items-center gap-10 rounded-lg px-10 py-8 no-underline;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(0, 0, 0, 0.28);
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

.roster-row__avatar {
  @apply shrink-0;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(0, 0, 0, 0.5);
}

.roster-row__name {
  @apply inline-flex min-w-0 items-center gap-6 font-display text-[13px] uppercase leading-tight tracking-wide
    text-white;
  transition: color var(--ds-duration-base) ease;
}

.roster-row__handle {
  @apply m-0 w-fit max-w-full truncate border-0 bg-transparent p-0 text-left font-mono text-[11px] text-white/45;
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

.roster-row__rank {
  @apply flex min-w-[48px] shrink-0 cursor-default items-center justify-center;
}

@media (hover: hover) and (pointer: fine) {
  .roster-row:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(var(--ds-primary-rgb), 0.05);
    box-shadow: var(--ds-glow-primary-soft);

    .roster-row__name {
      color: var(--ds-primary);
    }
  }

  .roster-row__handle:hover {
    color: var(--ds-primary);
  }
}
</style>
