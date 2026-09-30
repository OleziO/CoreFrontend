<template>
  <div class="dboard-scroll">
    <table class="dboard">
      <thead>
        <tr>
          <th scope="col" class="dboard__th dboard__th--pos">#</th>
          <th scope="col" class="dboard__th">Гравець</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--rating">Рейтинг</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--wl hidden md:table-cell">W – L</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--winrate">Вінрейт</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--streak hidden md:table-cell">Серія</th>
          <th scope="col" class="dboard__th dboard__th--date hidden xl:table-cell">Остання гра</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="row.player.id"
          class="dboard__row"
          :class="{ 'dboard__row--me': row.player.id === highlightId, 'dboard__row--top': row.position <= 3 }"
          :style="{ '--i': Math.min(index, 24), '--tile-tone': toneOf(row.position) }"
          @click="goToPlayer(row.player.id)"
        >
          <td class="dboard__td dboard__td--pos">
            <span class="dboard__pos">{{ row.position }}</span>
          </td>
          <td class="dboard__td">
            <div class="dboard__player">
              <el-avatar :src="resolvePublicOrApiUrl(row.player.avatarUrl)" :size="34" class="dboard__avatar">
                {{ duelPlayerInitial(row.player) }}
              </el-avatar>
              <span class="dboard__names">
                <RouterLink
                  :to="{ name: routeNames.player, params: { id: row.player.id } }"
                  class="dboard__name truncate no-underline"
                  @click.stop
                >
                  {{ duelPlayerName(row.player) }}
                </RouterLink>
                <span v-if="row.player.discordUsername" class="dboard__handle truncate">
                  @{{ row.player.discordUsername }}
                </span>
              </span>
            </div>
          </td>
          <td class="dboard__td dboard__td--num dboard__td--rating">{{ formatDuelNumber(row.rating) }}</td>
          <td class="dboard__td dboard__td--num hidden md:table-cell">
            <span class="dboard__wl">
              <span class="text-success">{{ row.wins }}</span>
              <span class="dboard__wl-sep">–</span>
              <span class="dboard__wl-loss">{{ row.losses }}</span>
            </span>
          </td>
          <td class="dboard__td dboard__td--num">{{ formatDuelPercent(row.winrate) }}</td>
          <td
            class="dboard__td dboard__td--num hidden md:table-cell"
            :class="row.streak > 0 ? 'text-success' : row.streak < 0 ? 'dboard__wl-loss' : ''"
          >
            {{ formatDuelStreak(row.streak) }}
          </td>
          <td class="dboard__td dboard__td--date hidden xl:table-cell">
            {{ row.lastPlayedAt ? dayjs(row.lastPlayedAt).format('DD.MM.YYYY HH:mm') : '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import {
  duelPlayerInitial,
  duelPlayerName,
  formatDuelNumber,
  formatDuelPercent,
  formatDuelStreak
} from '@/views/duels/duels.utils'
import type { TDuelLeaderboardRow } from '@/api/types/api.types'

defineProps<{
  rows: TDuelLeaderboardRow[]
  /** id залогіненого гравця — його рядок підсвічується. */
  highlightId: string | null
}>()

const router = useRouter()

const TONES: Record<number, string> = {
  1: 'var(--ds-gold-rgb)',
  2: '198, 205, 220',
  3: '205, 127, 50'
}

const toneOf = (position: number) => TONES[position] ?? 'var(--ds-primary-rgb)'

function goToPlayer (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}
</script>

<style scoped>
.dboard-scroll {
  width: 100%;
  min-width: 0;
  /* Вузький контейнер (телефон, бічна колонка): таблиця прокручується, а не ріже аватар у колонці гравця. */
  overflow-x: auto;
}

.dboard {
  width: 100%;
  min-width: 340px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0 4px;
}

.dboard__th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 6px 10px 10px;
  text-align: left;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-faint);
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  background: var(--ds-surface);
}

.dboard__th--num,
.dboard__td--num {
  text-align: right;
}

.dboard__th--pos,
.dboard__td--pos {
  text-align: center;
}

.dboard__th--pos {
  width: 44px;
}

.dboard__th--rating {
  width: 90px;
}

.dboard__th--wl {
  width: 84px;
}

.dboard__th--winrate {
  width: 76px;
}

.dboard__th--streak {
  width: 64px;
}

.dboard__th--date {
  width: 150px;
}

.dboard__row {
  --tile-tone: var(--ds-primary-rgb);

  cursor: pointer;
}

.dboard__td {
  overflow: hidden;
  padding: 8px 10px;
  vertical-align: middle;
  font-size: 13px;
  color: var(--ds-text);
  background: rgba(255, 255, 255, 0.025);
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  transition: background-color var(--ds-duration-fast) ease;
}

.dboard__td:first-child {
  border-left: 1px solid transparent;
  border-radius: 10px 0 0 10px;
}

.dboard__td:last-child {
  border-right: 1px solid transparent;
  border-radius: 0 10px 10px 0;
}

.dboard__row--top .dboard__td {
  border-color: rgba(var(--tile-tone), 0.28);
  background: rgba(var(--tile-tone), 0.05);
}

.dboard__row--me .dboard__td {
  border-color: rgba(var(--ds-primary-rgb), 0.5);
  background: rgba(var(--ds-primary-rgb), 0.08);
}

@media (hover: hover) and (pointer: fine) {
  .dboard__row:hover .dboard__td {
    background: rgba(255, 255, 255, 0.06);
  }
}

.dboard__pos {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border-radius: 8px;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
}

.dboard__row--top .dboard__pos {
  border: 1px solid rgba(var(--tile-tone), 0.5);
  background: rgba(var(--tile-tone), 0.12);
  color: rgb(var(--tile-tone));
  box-shadow: 0 0 10px rgba(var(--tile-tone), 0.25);
}

.dboard__player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dboard__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  flex-shrink: 0;
  width: 34px;
  height: 34px;
  font-size: 13px;
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.45);
}

.dboard__names {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dboard__name {
  min-width: 0;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dboard__name:hover {
  color: var(--ds-primary);
}

.dboard__handle {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.dboard__td--num {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dboard__td--rating {
  font-size: 14px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.dboard__wl {
  display: inline-flex;
  gap: 3px;
}

.dboard__wl-sep {
  color: var(--ds-text-faint);
}

.dboard__wl-loss {
  color: var(--ds-text-muted);
}

.dboard__td--date {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .dboard__th,
  .dboard__td {
    padding-left: 5px;
    padding-right: 5px;
  }

  .dboard__th--pos {
    width: 34px;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .dboard__row {
    animation: dboard-row-in 420ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i) * 28ms + 80ms);
  }

  @keyframes dboard-row-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
