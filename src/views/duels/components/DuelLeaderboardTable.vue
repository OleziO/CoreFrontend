<template>
  <!--
    Таблиця живе і в бічній колонці (~300–560px), і на всю ширину сторінки рейтингу. Колонки вмикаються
    за шириною контейнера, причому лише тоді, коли гравцю (аватар + нік) лишається місце, — тож
    горизонтального скролу немає, а колонка гравця ніколи не стискається до нуля.
  -->
  <div class="dboard-wrap">
    <table class="dboard" :class="{ 'dboard--prizes': hasPrizes }">
      <thead>
        <tr>
          <th scope="col" class="dboard__th dboard__th--pos">#</th>
          <th scope="col" class="dboard__th">Гравець</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--rating">Рейтинг</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--wl dboard__col--wide">W – L</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--winrate dboard__col--wide">Вінрейт</th>
          <th scope="col" class="dboard__th dboard__th--num dboard__th--streak dboard__col--streak">Серія</th>
          <th scope="col" class="dboard__th dboard__th--date dboard__col--full">Остання гра</th>
          <th v-if="hasPrizes" scope="col" class="dboard__th dboard__th--prize">
            <span class="dboard__prize-head">Приз</span>
          </th>
          <!-- Остання колонка завжди є: на вузькому — кнопка «Детальніше», на широкому — тонкий відступ -->
          <th scope="col" class="dboard__th dboard__th--more">
            <span class="sr-only">Детальніше</span>
          </th>
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
              <span class="dboard__avatar-wrap">
                <el-avatar :src="resolvePublicOrApiUrl(row.player.avatarUrl)" :size="36" class="dboard__avatar">
                  {{ duelPlayerInitial(row.player) }}
                </el-avatar>
                <span v-if="row.position === 1" class="dboard__crown" aria-hidden="true">
                  <PhCrownSimple :size="11" weight="fill" />
                </span>
              </span>
              <span class="dboard__names">
                <span class="dboard__name-line">
                  <RouterLink
                    :to="{ name: routeNames.player, params: { id: row.player.id } }"
                    class="dboard__name truncate no-underline"
                    @click.stop
                  >
                    {{ duelPlayerName(row.player) }}
                  </RouterLink>
                  <span v-if="row.player.id === highlightId" class="dboard__me">ви</span>
                </span>
                <span v-if="row.player.discordUsername" class="dboard__handle truncate">
                  @{{ row.player.discordUsername }}
                </span>
              </span>
            </div>
          </td>
          <td class="dboard__td dboard__td--num dboard__td--rating">{{ formatDuelNumber(row.rating) }}</td>
          <td class="dboard__td dboard__td--num dboard__col--wide">
            <span class="dboard__wl">
              <span class="text-success">{{ row.wins }}</span>
              <span class="dboard__wl-sep">–</span>
              <span class="dboard__wl-loss">{{ row.losses }}</span>
            </span>
          </td>
          <td class="dboard__td dboard__td--num dboard__col--wide">
            <span class="dboard__winrate">
              {{ formatDuelPercent(row.winrate) }}
              <span class="dboard__winrate-bar" aria-hidden="true">
                <span class="dboard__winrate-fill" :style="{ width: `${row.winrate ?? 0}%` }" />
              </span>
            </span>
          </td>
          <td class="dboard__td dboard__td--num dboard__col--streak">
            <span
              class="dboard__streak"
              :class="row.streak > 0 ? 'is-up' : row.streak < 0 ? 'is-down' : ''"
            >
              {{ formatDuelStreak(row.streak) }}
            </span>
          </td>
          <td class="dboard__td dboard__td--date dboard__col--full">
            {{ row.lastPlayedAt ? dayjs(row.lastPlayedAt).format('DD.MM.YYYY HH:mm') : '—' }}
          </td>
          <td v-if="hasPrizes" class="dboard__td dboard__td--prize">
            <DuelPrizeTile v-if="prizeOf(row)" :prize="prizeOf(row)!" />
          </td>
          <td class="dboard__td dboard__td--more">
            <button
              type="button"
              class="dboard__more"
              :aria-label="`Детальніше про ${duelPlayerName(row.player)}`"
              @click.stop="openRow(row)"
            >
              <PhCaretRight :size="14" weight="bold" />
            </button>
          </td>
        </tr>

        <!-- Призові місця, які ще ніхто не посідає (або не розіграні): приз видно ще до старту турніру -->
        <tr
          v-for="(prize, index) in unclaimedPrizes"
          :key="`prize-${prize.place}`"
          class="dboard__row dboard__row--ghost"
          :style="{ '--i': Math.min(rows.length + index, 24), '--tile-tone': toneOf(prize.place) }"
        >
          <td class="dboard__td dboard__td--pos">
            <span class="dboard__pos">{{ prize.place }}</span>
          </td>
          <td class="dboard__td">
            <span class="dboard__ghost-label truncate">
              {{ prizesSettled ? 'Не розіграно' : 'Вільне призове місце' }}
            </span>
          </td>
          <td class="dboard__td dboard__td--num dboard__td--rating dboard__ghost-dash">—</td>
          <td class="dboard__td dboard__col--wide" />
          <td class="dboard__td dboard__col--wide" />
          <td class="dboard__td dboard__col--streak" />
          <td class="dboard__td dboard__td--date dboard__col--full" />
          <td class="dboard__td dboard__td--prize">
            <DuelPrizeTile :prize="prize" />
          </td>
          <td class="dboard__td dboard__td--more" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhCaretRight, PhCrownSimple } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import {
  duelPlayerInitial,
  duelPlayerName,
  formatDuelNumber,
  formatDuelPercent,
  formatDuelStreak
} from '@/views/duels/duels.utils'
import DuelPrizeTile from '@/views/duels/components/DuelPrizeTile.vue'
import type { TDuelLeaderboardRow, TDuelTournamentPrize } from '@/api/types/api.types'

const props = defineProps<{
  rows: TDuelLeaderboardRow[]
  /** id залогіненого гравця — його рядок підсвічується. */
  highlightId: string | null
  /** Призові місця (турніру чи сезону) — бейдж призу в рядку гравця. */
  prizes?: TDuelTournamentPrize[]
  /** Призи вже розіграно: бейдж у переможця (`awardedPlayerId`), а не за поточним місцем. */
  prizesSettled?: boolean
}>()

/** Поки турнір / сезон триває — приз «висить» на місці; після розіграшу — на гравці, що його виграв. */
const prizeByRow = computed(() => {
  const map = new Map<string, TDuelTournamentPrize>()
  for (const prize of props.prizes ?? []) {
    const playerId = props.prizesSettled
      ? prize.awardedPlayerId
      : props.rows.find(r => r.position === prize.place)?.player.id
    if (playerId) map.set(playerId, prize)
  }
  return map
})

const prizeOf = (row: TDuelLeaderboardRow) => prizeByRow.value.get(row.player.id) ?? null

const hasPrizes = computed(() => !!props.prizes?.length)

/** Призи без власника в таблиці — «порожні» рядки під гравцями. */
const unclaimedPrizes = computed(() => {
  const claimed = new Set(prizeByRow.value.values())
  return (props.prizes ?? []).filter(p => !claimed.has(p)).sort((a, b) => a.place - b.place)
})

const router = useRouter()
const { open } = useAppModals()

/** На вузькому контейнері в рядку лише нік і рейтинг — решта статистики в модалці. */
function openRow (row: TDuelLeaderboardRow) {
  open('DuelLeaderboardRowModal', { row, highlightId: props.highlightId, prize: prizeOf(row) })
}

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
/*
 * Бюджет ширини (table-layout: fixed): гравцю дістається все, що лишилось після фіксованих колонок.
 * Пороги нижче підібрані так, щоб на кожному з них гравцю лишалось ≥140px:
 *
 *   вузько                                  # 44 · рейтинг 72 · [приз-іконка 56] · «Детальніше» 40
 *   ≥500                                    рейтинг 84, + W–L 76 · вінрейт 84, «Детальніше» → відступ 8
 *   ≥500 (без призів) / ≥600 (з призами)    + серія 64
 *   ≥840 (з призами)                        приз-іконка 56 → плитка 200
 *   ≥720 (без призів) / ≥980 (з призами)    + остання гра 140
 */
.dboard-wrap {
  container-type: inline-size;
  width: 100%;
  min-width: 0;
}

.dboard {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0 5px;
}

/* ─── Видимість колонок ──────────────────────────────────────────────────── */

.dboard__col--wide,
.dboard__col--streak,
.dboard__col--full,
.dboard__handle {
  display: none;
}

/* Від 500px уся статистика вже в рядку — кнопка «Детальніше» стає тонким відступом під заокруглення. */
@container (min-width: 500px) {
  .dboard__col--wide,
  .dboard:not(.dboard--prizes) .dboard__col--streak {
    display: table-cell;
  }

  .dboard__handle {
    display: block;
  }

  /* `.dboard` попереду — базові правила `.dboard__th` / `.dboard__more` нижче у файлі інакше перемагають. */
  .dboard .dboard__th--more {
    width: 8px;
    padding-left: 0;
    padding-right: 0;
  }

  .dboard .dboard__td--more {
    padding-right: 0 !important;
  }

  .dboard .dboard__more {
    display: none;
  }
}

@container (min-width: 600px) {
  .dboard--prizes .dboard__col--streak {
    display: table-cell;
  }
}

@container (min-width: 720px) {
  .dboard:not(.dboard--prizes) .dboard__col--full {
    display: table-cell;
  }
}

@container (min-width: 980px) {
  .dboard--prizes .dboard__col--full {
    display: table-cell;
  }
}

/* ─── Ширини колонок ─────────────────────────────────────────────────────── */

.dboard__th--pos {
  width: 44px;
}

.dboard__th--rating {
  width: 72px;
}

.dboard__th--wl {
  width: 76px;
}

.dboard__th--winrate {
  width: 84px;
}

.dboard__th--streak {
  width: 64px;
}

.dboard__th--date {
  width: 140px;
}

.dboard__th--prize {
  width: 56px;
}

@container (max-width: 499px) {
  .dboard__th--more {
    width: 40px;
  }
}

@container (min-width: 500px) {
  .dboard__th--rating {
    width: 84px;
  }
}

@container (min-width: 840px) {
  .dboard__th--prize {
    width: 200px;
  }
}

/* ─── Шапка ──────────────────────────────────────────────────────────────── */

.dboard__th {
  padding: 4px 10px 8px;
  text-align: left;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-faint);
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

.dboard__th--num,
.dboard__td--num {
  text-align: right;
}

/* Трекінг 0.14em додає «хвіст» після останньої літери — без компенсації підпис на 1–2px правіше за числа. */
.dboard__th--num {
  padding-right: calc(10px - 0.14em);
}

.dboard__th--pos,
.dboard__td--pos {
  text-align: center;
}

/* Вузька колонка призу: підпис по центру над іконкою */
.dboard__th--prize {
  text-align: center;
}

@container (min-width: 840px) {
  .dboard__th--prize {
    text-align: left;
  }
}

/* ─── Рядки ──────────────────────────────────────────────────────────────── */

.dboard__row {
  --tile-tone: var(--ds-primary-rgb);

  cursor: pointer;
}

.dboard__td {
  overflow: hidden;
  height: 54px;
  padding: 6px 10px;
  vertical-align: middle;
  font-size: 13px;
  color: var(--ds-text);
  background: rgba(255, 255, 255, 0.025);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background-color var(--ds-duration-fast) ease, border-color var(--ds-duration-fast) ease;
}

/* Перша й остання (завжди присутня «Детальніше») комірки дають рядку заокруглену рамку. */
.dboard__td:first-child {
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px 0 0 12px;
}

.dboard__td--more {
  padding-left: 0 !important;
  padding-right: 6px !important;
  text-align: right;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 0 12px 12px 0;
}

/* Топ-3: тон місця — ліва «смуга», підкладка-градієнт і рамка */
.dboard__row--top .dboard__td {
  border-color: rgba(var(--tile-tone), 0.26);
  background: rgba(var(--tile-tone), 0.045);
}

.dboard__row--top .dboard__td:first-child {
  background: linear-gradient(90deg, rgba(var(--tile-tone), 0.16), rgba(var(--tile-tone), 0.045));
  box-shadow: inset 3px 0 0 rgba(var(--tile-tone), 0.85);
}

.dboard__row--me .dboard__td {
  border-color: rgba(var(--ds-primary-rgb), 0.5);
  background: rgba(var(--ds-primary-rgb), 0.08);
}

@media (hover: hover) and (pointer: fine) {
  .dboard__row:not(.dboard__row--ghost):hover .dboard__td {
    background: rgba(255, 255, 255, 0.06);
  }

  .dboard__row:not(.dboard__row--ghost):hover .dboard__more {
    border-color: rgba(var(--tile-tone), 0.6);
  }
}

/* ─── Місце ──────────────────────────────────────────────────────────────── */

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
  color: var(--ds-text-faint);
}

.dboard__row--top .dboard__pos {
  border: 1px solid rgba(var(--tile-tone), 0.5);
  background: rgba(var(--tile-tone), 0.14);
  color: rgb(var(--tile-tone));
  box-shadow: 0 0 10px rgba(var(--tile-tone), 0.25);
}

/* ─── Гравець ────────────────────────────────────────────────────────────── */

.dboard__player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dboard__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.dboard__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.28);

  width: 36px;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Топ-3 — кільце в тоні місця, щоб призові рядки читались з першого погляду */
.dboard__row--top .dboard__avatar {
  box-shadow:
    0 0 0 2px rgba(var(--tile-tone), 0.85),
    0 0 12px rgba(var(--tile-tone), 0.35);
}

.dboard__row--me .dboard__avatar {
  box-shadow: 0 0 0 2px rgba(var(--ds-primary-rgb), 0.8);
}

/* Корона лідера — на куті аватара */
.dboard__crown {
  position: absolute;
  top: -6px;
  right: -5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: rgb(var(--ds-gold-rgb));
  color: #1a1206;
  box-shadow: 0 0 0 2px var(--ds-surface), 0 0 10px rgba(var(--ds-gold-rgb), 0.6);
}

.dboard__names {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
}

.dboard__name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
}

.dboard__name {
  min-width: 0;
  font-weight: 600;
  color: var(--ds-text-strong);
  transition: color var(--ds-duration-fast) ease;
}

@media (hover: hover) and (pointer: fine) {
  .dboard__name:hover {
    color: var(--ds-primary);
  }
}

.dboard__me {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 9999px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.14);
}

.dboard__handle {
  max-width: 100%;
  font-size: 11px;
  color: var(--ds-text-faint);
}

/* ─── Числа ──────────────────────────────────────────────────────────────── */

.dboard__td--num {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dboard__td--rating {
  font-size: 15px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.dboard__row--top .dboard__td--rating {
  color: rgb(var(--tile-tone));
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

.dboard__winrate {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.dboard__winrate-bar {
  display: block;
  width: 44px;
  height: 3px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
}

.dboard__winrate-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.55), rgb(74, 222, 128));
}

.dboard__streak {
  display: inline-block;
  min-width: 30px;
  padding: 2px 6px;
  border-radius: 6px;
  text-align: center;
  color: var(--ds-text-faint);
}

.dboard__streak.is-up {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
}

.dboard__streak.is-down {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
}

.dboard__td--date {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

/* ─── Приз ───────────────────────────────────────────────────────────────── */

.dboard__td--prize {
  padding-top: 3px !important;
  padding-bottom: 3px !important;
}

/* Поки колонка вузька — лише квадрат картинки по центру; назва призу — в підказці й у модалці «Детальніше». */
@container (max-width: 839px) {
  .dboard__td--prize {
    padding-left: 0 !important;
    padding-right: 0 !important;
    text-align: center;
  }

  .dboard__td--prize .dprize-tile {
    display: inline-flex;
    width: auto;
    height: auto;
    padding: 0;
    border: 0;
    background: none;
    vertical-align: middle;
  }

  .dboard__td--prize :deep(.dprize-tile__title) {
    display: none;
  }
}

/* ─── «Детальніше» ───────────────────────────────────────────────────────── */

.dboard__more {
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

.dboard__more:active {
  transform: scale(0.92);
}

.dboard__more:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: 2px;
}

/* ─── Порожнє призове місце ──────────────────────────────────────────────── */

.dboard__row--ghost {
  cursor: default;
}

.dboard__row--ghost .dboard__td {
  border-style: dashed;
  border-color: rgba(var(--tile-tone), 0.3);
  background: transparent;
  box-shadow: none;
}

.dboard__ghost-label {
  display: block;
  font-size: 12px;
  font-style: italic;
  color: var(--ds-text-faint);
}

.dboard__ghost-dash {
  color: var(--ds-text-faint) !important;
  font-weight: 400 !important;
}

/* ─── Дуже вузько (телефон) ──────────────────────────────────────────────── */

@container (max-width: 419px) {
  .dboard__th,
  .dboard__td {
    padding-left: 5px;
    padding-right: 5px;
  }

  .dboard__th--num {
    padding-right: calc(5px - 0.14em);
  }

  .dboard__th--pos {
    width: 34px;
  }

  .dboard__th--rating {
    width: 60px;
  }

  .dboard__th--prize {
    width: 48px;
  }

  .dboard__player {
    gap: 8px;
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
