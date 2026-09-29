<template>
  <component
    :is="player ? RouterLink : 'div'"
    v-bind="player ? { to: { name: routeNames.player, params: { id: player.id } } } : {}"
    class="player-tile no-underline"
    :class="side ? `player-tile--${side}` : ''"
  >
    <span class="sys-label sys-label--muted !text-[9px]">{{ label }}</span>
    <el-avatar :src="resolvePublicOrApiUrl(player?.avatarUrl)" :size="48" class="player-tile__avatar">
      {{ duelPlayerInitial(player) }}
    </el-avatar>
    <span class="player-tile__name truncate">{{ player ? duelPlayerName(player) : '—' }}</span>
    <span class="player-tile__rating">{{ player ? formatDuelNumber(player.rating) : '—' }} pts</span>
    <span v-if="side" class="player-tile__side">{{ duelSideLabels[side] }}</span>
  </component>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelPlayerInitial, duelPlayerName, duelSideLabels, formatDuelNumber } from '@/views/duels/duels.utils'
import type { TDuelLobbySide, TDuelPlayer } from '@/api/types/api.types'

defineProps<{
  player: TDuelPlayer | null
  side: TDuelLobbySide | null
  label: string
}>()
</script>

<style scoped>
.player-tile {
  --tile-tone: var(--ds-primary-rgb);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 14px 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--tile-tone), 0.25);
  background: rgba(var(--tile-tone), 0.05);
  text-align: center;
  color: inherit;
  transition: border-color var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

.player-tile--radiant {
  --tile-tone: 74, 222, 128;
}

.player-tile--dire {
  --tile-tone: 248, 113, 113;
}

.player-tile__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  width: 48px;
  height: 48px;
  font-size: 16px;
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.5);
}

.player-tile__name {
  max-width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.player-tile__rating {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
}

.player-tile__side {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--tile-tone));
}

@media (hover: hover) and (pointer: fine) {
  a.player-tile:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--tile-tone), 0.6);
  }
}
</style>
