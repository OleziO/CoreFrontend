<template>
  <div class="board-scroll">
    <table class="board">
      <thead>
        <tr>
          <th scope="col" class="board__th board__th--pos">#</th>
          <th scope="col" class="board__th board__th--player">Гравець</th>
          <th scope="col" class="board__th board__th--rank hidden lg:table-cell" :class="activeClass('rating')">
            Ранг
          </th>
          <th scope="col" class="board__th board__th--num board__th--score" :class="activeClass('score')">
            Рахунок
          </th>
          <th
            scope="col"
            class="board__th board__th--num board__th--trophies hidden md:table-cell"
            :class="activeClass('achievements')"
          >
            Трофеї
          </th>
          <th scope="col" class="board__th board__th--podium hidden xl:table-cell">П’єдестал</th>
          <th
            scope="col"
            class="board__th board__th--num board__th--matches hidden md:table-cell"
            :class="activeClass('wins')"
          >
            <span :class="activeClass('maps')">Матчі</span>
          </th>
          <th
            scope="col"
            class="board__th board__th--num board__th--winrate hidden md:table-cell"
            :class="activeClass('winrate')"
          >
            Вінрейт
          </th>
          <th
            scope="col"
            class="board__th board__th--num board__th--points hidden xl:table-cell"
            :class="activeClass('tournamentPoints')"
          >
            Очки
          </th>
          <th
            scope="col"
            class="board__th board__th--num board__th--kda hidden xl:table-cell"
            :class="activeClass('kills')"
          >
            K / D / A
          </th>
          <!-- Телефон: замість статистики — кнопка «Детальніше», що відкриває модалку (як у таблиці дуелей) -->
          <th scope="col" class="board__th board__th--more md:hidden">
            <span class="sr-only">Детальніше</span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="row.playerId"
          class="board__row"
          :class="{
            'board__row--me': row.playerId === highlightId,
            'board__row--top': row.position <= 3
          }"
          :style="{ '--i': Math.min(index, 24), '--tile-tone': toneOf(row.position) }"
          @click="goToPlayer(row.playerId)"
        >
          <td class="board__td board__td--pos">
            <span class="board__pos">{{ row.position }}</span>
          </td>

          <td class="board__td board__td--player">
            <div class="board__player">
              <el-avatar :src="resolvePublicOrApiUrl(row.avatarUrl)" :size="34" class="board__avatar">
                {{ initialOf(row) }}
              </el-avatar>
              <span class="board__names">
                <span class="board__name-line">
                  <RouterLink
                    :to="{ name: routeNames.player, params: { id: row.playerId } }"
                    class="board__name truncate no-underline"
                    @click.stop
                  >
                    {{ displayName(row) }}
                  </RouterLink>
                </span>
                <span v-if="row.discordUsername" class="board__handle truncate">@{{ row.discordUsername }}</span>
              </span>
            </div>
          </td>

          <td class="board__td board__td--rank hidden lg:table-cell">
            <span class="board__rank">
              <img
                v-if="rankImageOf(row)"
                :src="rankImageOf(row)"
                alt=""
                width="30"
                height="24"
                loading="lazy"
                draggable="false"
                class="h-24 w-auto max-w-[30px] select-none object-contain"
              >
              <span class="board__rank-text">
                <span class="truncate">{{ row.rank.nameUk }}</span>
                <span class="board__mmr">{{ formatLeaderboardNumber(row.rating) }} MMR</span>
              </span>
            </span>
          </td>

          <td class="board__td board__td--num board__td--score" :class="activeClass('score')">
            {{ formatLeaderboardNumber(row.score) }}
          </td>

          <td class="board__td board__td--num hidden md:table-cell" :class="activeClass('achievements')">
            {{ formatLeaderboardNumber(row.achievements) }}
          </td>

          <td class="board__td board__td--podium hidden xl:table-cell">
            <span class="board__podium">
              <span class="board__medal board__medal--gold" :class="{ 'is-empty': !row.podium.first }">
                <PhTrophy :size="12" weight="fill" />{{ row.podium.first }}
              </span>
              <span class="board__medal board__medal--silver" :class="{ 'is-empty': !row.podium.second }">
                <PhMedal :size="12" weight="fill" />{{ row.podium.second }}
              </span>
              <span class="board__medal board__medal--bronze" :class="{ 'is-empty': !row.podium.third }">
                <PhMedalMilitary :size="12" weight="fill" />{{ row.podium.third }}
              </span>
            </span>
          </td>

          <td class="board__td board__td--num hidden md:table-cell" :class="activeClass('wins') || activeClass('maps')">
            <span class="board__wl">
              <span class="board__wl-win">{{ row.wins }}</span>
              <span class="board__wl-sep">–</span>
              <span class="board__wl-loss">{{ row.losses }}</span>
            </span>
          </td>

          <td class="board__td board__td--num board__td--winrate hidden md:table-cell" :class="activeClass('winrate')">
            {{ formatLeaderboardPercent(row.winrate) }}
          </td>

          <td class="board__td board__td--num hidden xl:table-cell" :class="activeClass('tournamentPoints')">
            {{ formatLeaderboardNumber(row.tournamentPoints) }}
          </td>

          <td class="board__td board__td--num board__td--kda hidden xl:table-cell" :class="activeClass('kills')">
            {{ row.kills }} / {{ row.deaths }} / {{ row.assists }}
          </td>
          <td class="board__td board__td--more md:hidden">
            <button
              type="button"
              class="board__more"
              :aria-label="`Детальніше про ${displayName(row)}`"
              @click.stop="openRow(row)"
            >
              <PhCaretRight :size="14" weight="bold" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { PhCaretRight, PhMedal, PhMedalMilitary, PhTrophy } from '@phosphor-icons/vue'
import { getPlayerRankImageSrc, resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { formatLeaderboardNumber, formatLeaderboardPercent } from '@/views/leaderboard/leaderboard.utils'

const props = defineProps<{
  rows: TLeaderboardRow[]
  sortKey: TLeaderboardSortKey
  /** id залогіненого гравця — його рядок підсвічується. */
  highlightId: string | null
}>()

const router = useRouter()
const { open } = useAppModals()

/** На телефоні в рядку лише нік і рахунок — решта статистики в модалці. */
function openRow (row: TLeaderboardRow) {
  open('LeaderboardRowModal', { row, highlightId: props.highlightId })
}

const TONES: Record<number, string> = {
  1: 'var(--ds-gold-rgb)',
  2: '198, 205, 220',
  3: '205, 127, 50'
}

const toneOf = (position: number) => TONES[position] ?? 'var(--ds-primary-rgb)'

function activeClass (key: TLeaderboardSortKey): string {
  return props.sortKey === key ? 'is-sorted' : ''
}

function displayName (row: TLeaderboardRow): string {
  return row.discordName || row.discordUsername || 'Гравець'
}

function initialOf (row: TLeaderboardRow): string {
  return displayName(row).charAt(0).toUpperCase()
}

function rankImageOf (row: TLeaderboardRow): string {
  return getPlayerRankImageSrc(row.rank?.numericName)
}

function goToPlayer (id: string) {
  router.push({ name: routeNames.player, params: { id } })
}
</script>

<style scoped>
.board-scroll {
  width: 100%;
  min-width: 0;
}

/*
  Фіксована розкладка: числові колонки мають задану ширину (у шапці), а колонка гравця
  забирає решту й обрізає довгі ніки. Auto-розкладка ігнорує max-width на комірках,
  тож на вузьких екранах таблиця вилазила за межі панелі.
*/
.board {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0 4px;
}

.board__th {
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

.board__th--num,
.board__td--num {
  text-align: right;
}

/* Трекінг 0.14em додає «хвіст» після останньої літери — без компенсації підпис на 1–2px правіше за числа. */
.board__th--num {
  padding-right: calc(10px - 0.14em);
}

.board__th--pos,
.board__td--pos {
  text-align: center;
}

/* Ширини колонок для fixed-розкладки; колонка гравця без ширини — отримує залишок. */
.board__th--pos {
  width: 44px;
}

.board__th--rank {
  width: 170px;
}

.board__th--score {
  width: 84px;
}

.board__th--trophies {
  width: 72px;
}

.board__th--podium {
  width: 164px;
}

.board__th--matches {
  width: 84px;
}

.board__th--winrate {
  width: 76px;
}

.board__th--points {
  width: 72px;
}

.board__th--kda {
  width: 140px;
}

.board__td {
  overflow: hidden;
}

.board__th.is-sorted,
.board__th .is-sorted {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.board__row {
  --tile-tone: var(--ds-primary-rgb);

  cursor: pointer;
  transition: background-color var(--ds-duration-fast) ease;
}

.board__td {
  padding: 8px 10px;
  vertical-align: middle;
  font-size: 13px;
  color: var(--ds-text);
  background: rgba(255, 255, 255, 0.025);
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.board__td:first-child {
  border-left: 1px solid transparent;
  border-radius: 10px 0 0 10px;
}

/*
 * Правий край рядка заокруглюємо на тій комірці, що реально остання видима: на телефоні це кнопка
 * «Детальніше», від md — «Вінрейт», від xl — K/D/A. Решта ховається через display: none,
 * тож `:last-child` сам по собі не підходить.
 */
.board__td--more {
  border-right: 1px solid transparent;
  border-radius: 0 10px 10px 0;
}

@media (min-width: 768px) {
  .board__td--winrate {
    border-right: 1px solid transparent;
    border-radius: 0 10px 10px 0;
  }
}

@media (min-width: 1280px) {
  .board__td--winrate {
    border-right: 0;
    border-radius: 0;
  }

  .board__td--kda {
    border-right: 1px solid transparent;
    border-radius: 0 10px 10px 0;
  }
}

.board__th--more {
  width: 40px;
}

.board__td--more {
  padding-left: 0 !important;
  padding-right: 6px !important;
  text-align: right;
}

.board__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--tile-tone), 0.3);
  border-radius: 8px;
  background: rgba(var(--tile-tone), 0.08);
  color: rgb(var(--tile-tone));
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.board__more:active {
  transform: scale(0.92);
}

.board__more:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: 2px;
}

/* Перша трійка — обводка в тоні місця; власний рядок — ціанова обводка й підсвітка. */
.board__row--top .board__td {
  border-color: rgba(var(--tile-tone), 0.28);
  background: rgba(var(--tile-tone), 0.05);
}

.board__row--me .board__td {
  border-color: rgba(var(--ds-primary-rgb), 0.5);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: inset 0 0 0 0 transparent, 0 0 12px rgba(var(--ds-primary-rgb), 0.12);
}

@media (hover: hover) and (pointer: fine) {
  .board__row:hover .board__td {
    background: rgba(255, 255, 255, 0.06);
  }

  .board__row--top:hover .board__td {
    background: rgba(var(--tile-tone), 0.1);
  }
}

.board__pos {
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

.board__row--top .board__pos {
  border: 1px solid rgba(var(--tile-tone), 0.5);
  background: rgba(var(--tile-tone), 0.12);
  color: rgb(var(--tile-tone));
  box-shadow: 0 0 10px rgba(var(--tile-tone), 0.25);
}

.board__player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* Глобальний .el-avatar фіксує 56px — у таблиці мініатюра. */
.board__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  flex-shrink: 0;
  width: 34px;
  height: 34px;
  font-size: 13px;
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.45);
}

.board__names {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* На телефоні видно лише #, гравця, рахунок і «Детальніше» — кожен піксель відступів іде на нік. */
@media (max-width: 767px) {
  .board__th,
  .board__td {
    padding-left: 5px;
    padding-right: 5px;
  }

  .board__th--pos {
    width: 34px;
  }

  .board__th--num {
    padding-right: calc(5px - 0.14em);
  }

  .board__th--score {
    width: 72px;
  }

  /* Хендл на телефоні ховаємо — нік не ріжеться */
  .board__handle {
    display: none;
  }

  .board__player {
    gap: 8px;
  }

  .board__avatar {
    width: 30px;
    height: 30px;
  }
}

.board__name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.board__name {
  min-width: 0;
  font-weight: 600;
  color: var(--ds-text-strong);
  transition: color var(--ds-duration-fast) ease;
}

.board__name:hover,
.board__name:focus-visible {
  color: var(--ds-primary);
  outline: none;
}

.board__handle {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.board__rank {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.board__rank-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  font-size: 12px;
  color: var(--ds-text-muted);
}

.board__mmr {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.board__td--num {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.board__td--score {
  font-size: 14px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.board__td.is-sorted {
  color: var(--ds-primary);
}

.board__td--score.is-sorted {
  text-shadow: var(--ds-neon-text-subtle);
}

.board__podium {
  display: inline-flex;
  gap: 4px;
}

.board__medal {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(var(--medal-rgb), 0.4);
  background: rgba(var(--medal-rgb), 0.1);
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--medal-rgb));
}

.board__medal.is-empty {
  opacity: 0.35;
}

.board__medal--gold {
  --medal-rgb: var(--ds-gold-rgb);
}

.board__medal--silver {
  --medal-rgb: 198, 205, 220;
}

.board__medal--bronze {
  --medal-rgb: 205, 127, 50;
}

.board__wl {
  display: inline-flex;
  gap: 3px;
}

.board__wl-win {
  color: var(--ds-success, #22c55e);
}

.board__wl-sep {
  color: var(--ds-text-faint);
}

.board__wl-loss {
  color: var(--ds-text-muted);
}

.board__td--kda {
  color: var(--ds-text-muted);
}

@media (prefers-reduced-motion: no-preference) {
  .board__row {
    animation: board-row-in 420ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i) * 28ms + 80ms);
  }

  @keyframes board-row-in {
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
