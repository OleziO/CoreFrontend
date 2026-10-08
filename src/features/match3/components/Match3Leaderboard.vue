<template>
  <section class="m3-board-table" aria-labelledby="m3-leaderboard-title">
    <header class="m3-board-table__head">
      <h3 id="m3-leaderboard-title" class="sys-label sys-label--gold">// Таблиця рекордів</h3>
      <span v-if="board?.totalPlayers" class="m3-board-table__meta">{{ board.totalPlayers }} гравців</span>
    </header>

    <template v-if="isPending && !board">
      <span v-for="n in 6" :key="n" class="skeleton-bone block h-[38px] !rounded-xl" />
    </template>

    <p v-else-if="error" class="m3-board-table__empty text-error">Не вдалося завантажити таблицю</p>

    <p v-else-if="!board?.rows.length" class="m3-board-table__empty">
      Рекордів ще немає — станьте першим.
    </p>

    <ol v-else class="m3-board-table__list">
      <li
        v-for="row in board.rows"
        :key="row.player.id"
        class="m3-row"
        :class="{ 'm3-row--me': row.player.id === viewerId, [`m3-row--top${row.position}`]: row.position <= 3 }"
      >
        <span class="m3-row__pos">
          <PhCrownSimple v-if="row.position === 1" :size="13" weight="fill" aria-label="1" />
          <template v-else>{{ row.position }}</template>
        </span>
        <el-avatar :src="resolvePublicOrApiUrl(row.player.avatarUrl)" :size="26" class="m3-row__avatar">
          {{ nameOf(row.player).charAt(0) }}
        </el-avatar>
        <span class="m3-row__name" :title="nameOf(row.player)">
          <span class="truncate">{{ nameOf(row.player) }}</span>
          <span v-if="row.player.id === viewerId" class="m3-row__me">ви</span>
        </span>
        <span class="m3-row__score">{{ formatMatch3Score(row.score) }}</span>
      </li>
    </ol>

    <!-- Я поза топом — окремий рядок під таблицею -->
    <div v-if="meOutside" class="m3-row m3-row--me m3-row--detached">
      <span class="m3-row__pos">{{ meOutside.position }}</span>
      <span class="m3-row__name">Ваш рекорд</span>
      <span class="m3-row__score">{{ formatMatch3Score(meOutside.best) }}</span>
    </div>

    <p v-if="!viewerId" class="m3-board-table__note">
      Увійдіть, щоб ваші результати потрапляли в таблицю.
    </p>
    <p v-else class="m3-board-table__note">
      Очки рахує сервер за вашими ходами — у таблиці лише чесні рекорди.
    </p>
  </section>
</template>

<script setup lang="ts">
import { PhCrownSimple } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { useGetMatch3Leaderboard } from '@/features/match3/match3.queries'
import { formatMatch3Score } from '@/features/match3/match3.utils'
import type { TMatch3LeaderboardRow } from '@/api/types/api.types'

const props = defineProps<{
  viewerId: string | null
}>()

const { data: board, isPending, error } = useGetMatch3Leaderboard(() => props.viewerId)

const meOutside = computed(() => {
  const me = board.value?.me
  if (!me || board.value?.rows.some((row) => row.player.id === props.viewerId)) return null
  return me
})

function nameOf (player: TMatch3LeaderboardRow['player']): string {
  return player.discordName || player.discordUsername || 'Гравець'
}
</script>

<style scoped>
.m3-board-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.m3-board-table__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.m3-board-table__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ds-text-faint);
}

.m3-board-table__empty {
  padding: 18px 4px;
  font-size: 13px;
  text-align: center;
  color: var(--ds-text-muted);
}

.m3-board-table__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.m3-board-table__note {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

.m3-row {
  --row-tone: 255, 255, 255;

  display: grid;
  grid-template-columns: 22px 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 5px 10px 5px 6px;
  border-radius: 10px;
  border: 1px solid rgba(var(--row-tone), 0.06);
  background: rgba(var(--row-tone), 0.03);
}

.m3-row--top1 {
  --row-tone: var(--ds-gold-rgb);
}

.m3-row--top2 {
  --row-tone: 203, 213, 225;
}

.m3-row--top3 {
  --row-tone: 217, 119, 6;
}

.m3-row--top1,
.m3-row--top2,
.m3-row--top3 {
  border-color: rgba(var(--row-tone), 0.25);
  background: rgba(var(--row-tone), 0.07);
}

.m3-row--me {
  border-color: rgba(var(--ds-primary-rgb), 0.55);
  background: rgba(var(--ds-primary-rgb), 0.1);
}

.m3-row--detached {
  grid-template-columns: 22px minmax(0, 1fr) auto;
  border-style: dashed;
}

.m3-row__pos {
  display: inline-flex;
  justify-content: center;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--row-tone));
}

/* Глобальний .el-avatar задає 56px — тут потрібен компактний */
.m3-row__avatar {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  font-size: 11px;
}

.m3-row__name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-strong);
}

.m3-row__me {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--ds-primary-rgb), 0.2);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-primary);
}

.m3-row__score {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}
</style>
