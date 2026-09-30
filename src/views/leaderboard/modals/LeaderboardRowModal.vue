<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="board-row-dialog"
    width="440"
    destroy-on-close
  >
    <template #header>
      <div class="board-row-dialog__head" :style="{ '--tile-tone': tone }">
        <span class="board-row-dialog__pos" :class="{ 'is-top': row.position <= 3 }">
          <PhCrown v-if="row.position === 1" :size="14" weight="fill" />
          <template v-else>#{{ row.position }}</template>
        </span>
        <el-avatar :src="resolvePublicOrApiUrl(row.avatarUrl)" :size="52" class="board-row-dialog__avatar">
          {{ initial }}
        </el-avatar>
        <div class="flex min-w-0 flex-col gap-2">
          <span class="sys-label sys-label--gold">// Рейтинг платформи</span>
          <h2 class="board-row-dialog__name">
            <span class="min-w-0 break-words">{{ displayName }}</span>
            <StatusBadge v-if="row.verified" preset="verified" size="xs" icon-only class="shrink-0" />
            <span v-if="isMe" class="board-row-dialog__me">це ви</span>
          </h2>
          <span v-if="row.discordUsername" class="board-row-dialog__handle">@{{ row.discordUsername }}</span>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-12">
      <!-- Головне число — рахунок; поруч ранг і MMR для довідки -->
      <div class="board-row-dialog__hero" style="--i: 0">
        <div class="flex min-w-0 flex-col gap-2">
          <span class="board-row-dialog__label">Рахунок</span>
          <span class="board-row-dialog__score">{{ formatLeaderboardNumber(row.score) }}</span>
        </div>
        <div class="board-row-dialog__rank">
          <img
            v-if="rankImage"
            :src="rankImage"
            alt=""
            width="40"
            height="32"
            draggable="false"
            class="h-32 w-auto max-w-[40px] select-none object-contain"
          >
          <span class="flex min-w-0 flex-col gap-1">
            <span class="board-row-dialog__rank-name">{{ row.rank.nameUk }}</span>
            <span class="board-row-dialog__mmr">{{ formatLeaderboardNumber(row.rating) }} MMR</span>
          </span>
        </div>
      </div>

      <dl class="board-row-dialog__stats">
        <div class="board-row-dialog__stat" style="--i: 1">
          <dt>Матчі</dt>
          <dd>
            <span class="text-success">{{ row.wins }}</span>
            <span class="board-row-dialog__sep">–</span>
            <span class="board-row-dialog__loss">{{ row.losses }}</span>
          </dd>
        </div>
        <div class="board-row-dialog__stat" style="--i: 2">
          <dt>Вінрейт</dt>
          <dd>{{ formatLeaderboardPercent(row.winrate) }}</dd>
        </div>
        <div class="board-row-dialog__stat" style="--i: 3">
          <dt>Трофеї</dt>
          <dd>{{ formatLeaderboardNumber(row.achievements) }}</dd>
        </div>
        <div class="board-row-dialog__stat" style="--i: 4">
          <dt>Очки турнірів</dt>
          <dd>{{ formatLeaderboardNumber(row.tournamentPoints) }}</dd>
        </div>
        <div class="board-row-dialog__stat" style="--i: 5">
          <dt>K / D / A</dt>
          <dd class="board-row-dialog__kda">{{ row.kills }} / {{ row.deaths }} / {{ row.assists }}</dd>
        </div>
        <div class="board-row-dialog__stat" style="--i: 6">
          <dt>Турніри · карти</dt>
          <dd>{{ row.tournaments }} <span class="board-row-dialog__sep">·</span> {{ row.maps }}</dd>
        </div>
        <div class="board-row-dialog__stat board-row-dialog__stat--wide" style="--i: 7">
          <dt>П’єдестал</dt>
          <dd class="board-row-dialog__podium">
            <span
              class="board-row-dialog__medal board-row-dialog__medal--gold"
              :class="{ 'is-empty': !row.podium.first }"
            >
              <PhTrophy :size="12" weight="fill" />{{ row.podium.first }}
            </span>
            <span
              class="board-row-dialog__medal board-row-dialog__medal--silver"
              :class="{ 'is-empty': !row.podium.second }"
            >
              <PhMedal :size="12" weight="fill" />{{ row.podium.second }}
            </span>
            <span
              class="board-row-dialog__medal board-row-dialog__medal--bronze"
              :class="{ 'is-empty': !row.podium.third }"
            >
              <PhMedalMilitary :size="12" weight="fill" />{{ row.podium.third }}
            </span>
          </dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-8">
        <el-button @click="close">Закрити</el-button>
        <RouterLink :to="{ name: routeNames.player, params: { id: row.playerId } }" class="no-underline">
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
import { PhCrown, PhMedal, PhMedalMilitary, PhTrophy, PhUser } from '@phosphor-icons/vue'
import { getPlayerRankImageSrc, resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { formatLeaderboardNumber, formatLeaderboardPercent } from '@/views/leaderboard/leaderboard.utils'

const props = withDefaults(defineProps<{
  row: TLeaderboardRow
  /** id залогіненого гравця — його рядок позначається «це ви». */
  highlightId?: string | null
}>(), {
  highlightId: null
})

const modelValue = defineModel<boolean>({ default: false })

const TONES: Record<number, string> = {
  1: 'var(--ds-gold-rgb)',
  2: '198, 205, 220',
  3: '205, 127, 50'
}

const tone = computed(() => TONES[props.row.position] ?? 'var(--ds-primary-rgb)')
const isMe = computed(() => !!props.highlightId && props.row.playerId === props.highlightId)
const displayName = computed(() => props.row.discordName || props.row.discordUsername || 'Гравець')
const initial = computed(() => displayName.value.charAt(0).toUpperCase())
const rankImage = computed(() => getPlayerRankImageSrc(props.row.rank?.numericName))

function close () {
  modelValue.value = false
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.board-row-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(12, 15, 30, 0.72);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .board-row-dialog__head {
    --tile-tone: var(--ds-primary-rgb);

    display: flex;
    align-items: center;
    gap: 14px;
    padding-right: 28px;
  }

  .board-row-dialog__pos {
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

  .board-row-dialog__avatar {
    --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

    flex-shrink: 0;
    width: 52px;
    height: 52px;
    font-size: 18px;
    box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.5), 0 0 16px rgba(var(--tile-tone), 0.25);
  }

  .board-row-dialog__name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-family: var(--ds-font-display);
    font-size: 18px;
    line-height: 1.2;
    color: var(--ds-text-strong);
  }

  .board-row-dialog__me {
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

  .board-row-dialog__handle {
    font-size: 12px;
    color: var(--ds-text-faint);
  }

  .board-row-dialog__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
    background: rgba(var(--ds-gold-rgb), 0.07);
  }

  .board-row-dialog__label {
    font-family: var(--ds-font-mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .board-row-dialog__score {
    font-family: var(--ds-font-mono);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ds-gold);
    text-shadow: var(--ds-neon-text-gold);
  }

  .board-row-dialog__rank {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .board-row-dialog__rank-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--ds-text-strong);
  }

  .board-row-dialog__mmr {
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--ds-text-faint);
  }

  .board-row-dialog__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }

  .board-row-dialog__stat {
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

  .board-row-dialog__sep {
    color: var(--ds-text-faint);
  }

  .board-row-dialog__loss {
    color: var(--ds-text-muted);
  }

  .board-row-dialog__kda {
    font-size: 14px;
    color: var(--ds-text-muted);
  }

  .board-row-dialog__podium {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .board-row-dialog__medal {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(var(--medal-rgb), 0.4);
    background: rgba(var(--medal-rgb), 0.1);
    font-size: 12px;
    color: rgb(var(--medal-rgb));

    &.is-empty {
      opacity: 0.35;
    }

    &--gold {
      --medal-rgb: var(--ds-gold-rgb);
    }

    &--silver {
      --medal-rgb: 198, 205, 220;
    }

    &--bronze {
      --medal-rgb: 205, 127, 50;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .board-row-dialog__hero,
    .board-row-dialog__stat {
      animation: board-row-stat-in 320ms var(--ds-ease-out) both;
      animation-delay: calc(80ms + var(--i, 0) * 40ms);
    }
  }
}

@keyframes board-row-stat-in {
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
