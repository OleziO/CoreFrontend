<template>
  <ul v-if="rows.length" class="dhistory">
    <li
      v-for="(row, index) in rows"
      :key="row.duel.id"
      class="dhistory__row"
      :class="`is-${row.outcome}`"
      :style="{ '--i': Math.min(index, 12) }"
    >
      <span class="dhistory__badge" :title="isFriendDuel(row.duel) ? 'Дружня дуель (±10)' : undefined">
        {{ duelOutcomeLabels[row.outcome] }}<template v-if="isFriendDuel(row.duel)"> · дружня</template>
      </span>

      <RouterLink
        v-if="row.opponent"
        :to="{ name: routeNames.player, params: { id: row.opponent.id } }"
        class="dhistory__opponent no-underline"
      >
        <el-avatar :src="resolvePublicOrApiUrl(row.opponent.avatarUrl)" :size="28" class="dhistory__avatar">
          {{ duelPlayerInitial(row.opponent) }}
        </el-avatar>
        <span class="truncate">{{ duelPlayerName(row.opponent) }}</span>
      </RouterLink>
      <span v-else class="dhistory__opponent text-white/50">Суперник невідомий</span>

      <span v-if="row.stats" class="dhistory__stats" :title="`Герой #${row.stats.heroId ?? '?'}`">
        <PhSword :size="12" weight="bold" class="shrink-0" />
        {{ formatDuelKda(row.stats) }}
        <span v-if="row.stats.lastHits != null" class="dhistory__stats-lh">· {{ row.stats.lastHits }} LH</span>
      </span>
      <span v-else-if="row.outcome === 'cancelled' || row.outcome === 'failed'" class="dhistory__stats text-white/45">
        {{ duelEndReasonLabel(row.duel) }}
      </span>
      <span v-else-if="row.outcome === 'processing'" class="dhistory__stats text-white/45">
        збираємо результат
      </span>
      <span v-else class="dhistory__stats text-white/35">без статистики</span>

      <span
        class="dhistory__delta"
        :class="row.delta != null ? (row.delta > 0 ? 'is-plus' : 'is-minus') : ''"
      >
        {{ row.delta != null ? formatDuelDelta(row.delta) : '—' }}
      </span>

      <span class="dhistory__date">{{ formatDate(row.duel.finishedAt ?? row.duel.createdAt) }}</span>
    </li>
  </ul>
  <p v-else class="dhistory__empty">{{ emptyText }}</p>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhSword } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import {
  duelEndReasonLabel,
  duelOutcomeLabels,
  duelPlayerInitial,
  duelPlayerName,
  formatDuelDelta,
  formatDuelKda,
  isFriendDuel,
  toDuelHistoryRow
} from '@/views/duels/duels.utils'
import type { TDuel } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  duels: TDuel[]
  /** Гравець, з погляду якого показуємо результат. */
  playerId: string | null
  emptyText?: string
}>(), {
  emptyText: 'Ще жодної дуелі'
})

const rows = computed(() => props.duels.map((duel) => toDuelHistoryRow(duel, props.playerId)))

function formatDate (iso: string): string {
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD.MM HH:mm') : ''
}
</script>

<style scoped>
.dhistory {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dhistory__row {
  --tone: 148, 163, 184;

  /*
   * Телефон — два рядки з явними зонами: бейдж, суперник, дельта й дата в один рядок,
   * під ними статистика. Без зон авто-розкладка кидала дельту й дату на третій рядок.
   */
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  grid-template-areas:
    'badge opponent delta date'
    'stats stats stats stats';
  align-items: center;
  gap: 6px 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--tone), 0.2);
  background: rgba(var(--tone), 0.04);
  font-size: 13px;
  color: var(--ds-text);
}

.dhistory__badge {
  grid-area: badge;
}

.dhistory__opponent {
  grid-area: opponent;
}

.dhistory__stats {
  grid-area: stats;
}

.dhistory__delta {
  grid-area: delta;
}

.dhistory__date {
  grid-area: date;
}

@media (min-width: 640px) {
  .dhistory__row {
    grid-template-columns: 82px minmax(0, 1fr) minmax(0, 1fr) 52px 84px;
    grid-template-areas: 'badge opponent stats delta date';
    gap: 8px 10px;
    padding: 8px 12px;
  }
}

.dhistory__row.is-win {
  --tone: 34, 197, 94;
}

.dhistory__row.is-loss {
  --tone: 244, 63, 94;
}

.dhistory__row.is-active {
  --tone: var(--ds-gold-rgb);
}

.dhistory__row.is-processing {
  --tone: var(--ds-primary-rgb);
}

.dhistory__badge {
  display: inline-flex;
  justify-content: center;
  padding: 3px 6px;
  border-radius: 6px;
  border: 1px solid rgba(var(--tone), 0.4);
  background: rgba(var(--tone), 0.1);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--tone));
  white-space: nowrap;
}

.dhistory__opponent {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dhistory__opponent:hover {
  color: var(--ds-primary);
}

.dhistory__avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: 11px;
}

.dhistory__stats {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-muted);
}

.dhistory__stats-lh {
  color: var(--ds-text-faint);
}

.dhistory__delta {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ds-text-faint);
}

.dhistory__delta.is-plus {
  color: #22c55e;
}

.dhistory__delta.is-minus {
  color: #fb7185;
}

.dhistory__date {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  text-align: right;
  white-space: nowrap;
  color: var(--ds-text-faint);
}

.dhistory__empty {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

@media (prefers-reduced-motion: no-preference) {
  .dhistory__row {
    animation: dhistory-in 360ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i) * 30ms);
  }

  @keyframes dhistory-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
