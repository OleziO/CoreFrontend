<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="dboard-row-dialog"
    width="420"
    destroy-on-close
  >
    <template #header>
      <div class="dboard-row-dialog__head" :style="{ '--tile-tone': tone }">
        <span class="dboard-row-dialog__pos" :class="{ 'is-top': row.position <= 3 }">
          <PhCrown v-if="row.position === 1" :size="14" weight="fill" />
          <template v-else>#{{ row.position }}</template>
        </span>
        <el-avatar :src="resolvePublicOrApiUrl(row.player.avatarUrl)" :size="52" class="dboard-row-dialog__avatar">
          {{ duelPlayerInitial(row.player) }}
        </el-avatar>
        <div class="flex min-w-0 flex-col gap-2">
          <span class="sys-label sys-label--muted">// Рейтинг дуелей</span>
          <h2 class="dboard-row-dialog__name">
            {{ duelPlayerName(row.player) }}
            <span v-if="isMe" class="dboard-row-dialog__me">це ви</span>
          </h2>
          <span v-if="row.player.discordUsername" class="dboard-row-dialog__handle">
            @{{ row.player.discordUsername }}
          </span>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-14">
      <div class="dboard-row-dialog__rating">
        <DuelRatingBadge :rating="row.rating" :streak="row.streak" size="lg" />
      </div>

      <div v-if="prize" class="dboard-row-dialog__prize">
        <span class="dboard-row-dialog__prize-label">Приз за {{ prize.place }} місце</span>
        <DuelPrizeChip :prize="prize" size="md" />
      </div>

      <dl class="dboard-row-dialog__stats">
        <div class="dboard-row-dialog__stat" style="--i: 0">
          <dt>Перемоги</dt>
          <dd class="text-success">{{ row.wins }}</dd>
        </div>
        <div class="dboard-row-dialog__stat" style="--i: 1">
          <dt>Поразки</dt>
          <dd class="dboard-row-dialog__loss">{{ row.losses }}</dd>
        </div>
        <div class="dboard-row-dialog__stat" style="--i: 2">
          <dt>Вінрейт</dt>
          <dd>{{ formatDuelPercent(row.winrate) }}</dd>
        </div>
        <div class="dboard-row-dialog__stat" style="--i: 3">
          <dt>Серія</dt>
          <dd :class="row.streak > 0 ? 'text-success' : row.streak < 0 ? 'dboard-row-dialog__loss' : ''">
            {{ formatDuelStreak(row.streak) }}
          </dd>
        </div>
        <div class="dboard-row-dialog__stat dboard-row-dialog__stat--wide" style="--i: 4">
          <dt>Остання гра</dt>
          <dd>{{ row.lastPlayedAt ? dayjs(row.lastPlayedAt).format('DD.MM.YYYY HH:mm') : '—' }}</dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-8">
        <el-button @click="close">Закрити</el-button>
        <RouterLink :to="{ name: routeNames.player, params: { id: row.player.id } }" class="no-underline">
          <el-button type="primary" @click="close">
            <PhUser :size="16" weight="bold" class="mr-6" />
            Профіль гравця
          </el-button>
        </RouterLink>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhCrown, PhUser } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { duelPlayerInitial, duelPlayerName, formatDuelPercent, formatDuelStreak } from '@/views/duels/duels.utils'
import DuelPrizeChip from '@/views/duels/components/DuelPrizeChip.vue'
import DuelRatingBadge from '@/views/duels/components/DuelRatingBadge.vue'
import type { TDuelLeaderboardRow, TDuelTournamentPrize } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  row: TDuelLeaderboardRow
  /** id залогіненого гравця — його рядок позначається «це ви». */
  highlightId?: string | null
  /** Приз турніру, що «висить» на цьому рядку (лише в таблиці турніру). */
  prize?: TDuelTournamentPrize | null
}>(), {
  highlightId: null,
  prize: null
})

const modelValue = defineModel<boolean>({ default: false })

const TONES: Record<number, string> = {
  1: 'var(--ds-gold-rgb)',
  2: '198, 205, 220',
  3: '205, 127, 50'
}

const tone = computed(() => TONES[props.row.position] ?? 'var(--ds-primary-rgb)')
const isMe = computed(() => !!props.highlightId && props.row.player.id === props.highlightId)

function close () {
  modelValue.value = false
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.dboard-row-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(12, 15, 30, 0.72);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .dboard-row-dialog__prize {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .dboard-row-dialog__prize-label {
    font-size: 12px;
    color: var(--ds-text-muted);
  }

  .dboard-row-dialog__head {
    --tile-tone: var(--ds-primary-rgb);

    display: flex;
    align-items: center;
    gap: 14px;
    padding-right: 28px;
  }

  .dboard-row-dialog__pos {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 22px;
    padding: 0 6px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.3);
    font-family: var(--ds-font-mono);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ds-text-muted);

    &.is-top {
      border-color: rgba(var(--tile-tone), 0.5);
      background: rgba(var(--tile-tone), 0.12);
      color: rgb(var(--tile-tone));
      box-shadow: 0 0 10px rgba(var(--tile-tone), 0.3);
    }
  }

  .dboard-row-dialog__avatar {
    --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

    flex-shrink: 0;
    width: 52px;
    height: 52px;
    font-size: 18px;
    box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.5), 0 0 16px rgba(var(--tile-tone), 0.25);
  }

  .dboard-row-dialog__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-family: var(--ds-font-display);
    font-size: 18px;
    line-height: 1.2;
    color: var(--ds-text-strong);
    overflow-wrap: anywhere;
  }

  .dboard-row-dialog__me {
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid rgba(var(--ds-primary-rgb), 0.45);
    background: rgba(var(--ds-primary-rgb), 0.1);
    font-family: var(--ds-font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ds-primary);
  }

  .dboard-row-dialog__handle {
    font-size: 12px;
    color: var(--ds-text-faint);
  }

  .dboard-row-dialog__rating {
    display: flex;
    justify-content: center;
    padding: 4px 0;
  }

  .dboard-row-dialog__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }

  .dboard-row-dialog__stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);

    &--wide {
      grid-column: 1 / -1;
    }

    dt {
      font-family: var(--ds-font-mono);
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ds-text-faint);
    }

    dd {
      margin: 0;
      font-family: var(--ds-font-mono);
      font-size: 16px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--ds-text-strong);
    }
  }

  .dboard-row-dialog__loss {
    color: #fb7185;
  }

  @media (prefers-reduced-motion: no-preference) {
    .dboard-row-dialog__stat {
      animation: dboard-row-stat-in 320ms var(--ds-ease-out) both;
      animation-delay: calc(80ms + var(--i, 0) * 45ms);
    }
  }
}

@keyframes dboard-row-stat-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
