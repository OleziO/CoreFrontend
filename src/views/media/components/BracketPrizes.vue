<template>
  <section class="bprize" aria-labelledby="bprize-title">
    <header class="flex items-center justify-between gap-10">
      <h2 id="bprize-title" class="bprize__title">
        <PhGift :size="16" weight="bold" aria-hidden="true" />
        Призи
      </h2>
      <span class="bprize__status">{{ statusLabel }}</span>
    </header>

    <ol class="bprize__list">
      <li v-for="prize in sorted" :key="prize.place" class="bprize__row" :class="`tier-${tierOf(prize.place)}`">
        <span class="bprize__place">
          <PhMedal v-if="prize.place <= 3" :size="18" weight="fill" aria-hidden="true" />
          <span>{{ prize.place }}</span>
        </span>
        <DuelPrizeTile :prize="prize" class="bprize__tile" />
        <span v-if="winnerOf(prize)" class="bprize__winner">
          <el-avatar :src="resolvePublicOrApiUrl(winnerOf(prize)?.avatarUrl)" :size="20">
            {{ duelPlayerInitial(winnerOf(prize)) }}
          </el-avatar>
          <span class="truncate">{{ duelPlayerName(winnerOf(prize)) }}</span>
        </span>
      </li>
    </ol>

    <p class="bprize__hint">
      Призи отримують гравці, що посіли місця після фіналу та матчу за 3 місце.
      <template v-if="hasVip">VIP нараховується автоматично.</template>
      <template v-if="hasCustom">Власні призи видає стрімер.</template>
    </p>
  </section>
</template>

<script setup lang="ts">
import { PhGift, PhMedal } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import DuelPrizeTile from '@/views/duels/components/DuelPrizeTile.vue'
import { duelPlayerInitial, duelPlayerName } from '@/views/duels/duels.utils'
import type { TDuelBracketParticipant, TDuelBracketStatus, TDuelTournamentPrize } from '@/api/types/api.types'

const props = defineProps<{
  prizes: TDuelTournamentPrize[]
  participants: TDuelBracketParticipant[]
  status: TDuelBracketStatus
  settled: boolean
}>()

const sorted = computed(() => [...props.prizes].sort((a, b) => a.place - b.place))
const hasVip = computed(() => props.prizes.some(p => p.kind === 'vip'))
const hasCustom = computed(() => props.prizes.some(p => p.kind === 'custom'))

const playerById = computed(() => new Map(props.participants.map(p => [p.player.id, p.player])))

/** Хто забрав приз: зафіксований бекендом після фіналу. */
function winnerOf (prize: TDuelTournamentPrize) {
  return prize.awardedPlayerId ? (playerById.value.get(prize.awardedPlayerId) ?? null) : null
}

const statusLabel = computed(() => {
  if (props.settled) return 'Розіграно'
  if (props.status === 'CANCELLED') return 'Не розіграно'
  if (props.status === 'FINISHED') return 'Видаємо…'
  return 'На кону'
})

const tierOf = (place: number) => (place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : 'plain')
</script>

<style scoped>
.bprize {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bprize__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-display);
  font-size: 16px;
  color: var(--ds-text-strong);
}

.bprize__status {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.12);
}

.bprize__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bprize__row {
  --medal: 148, 163, 184;

  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 8px 10px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--medal), 0.28);
  background: linear-gradient(100deg, rgba(var(--medal), 0.12), transparent 70%);
}

.bprize__row.tier-gold {
  --medal: var(--ds-gold-rgb);
}

.bprize__row.tier-silver {
  --medal: 203, 213, 225;
}

.bprize__row.tier-bronze {
  --medal: 205, 127, 50;
}

.bprize__place {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: var(--ds-font-display);
  font-size: 16px;
  color: rgb(var(--medal));
  filter: drop-shadow(0 0 6px rgba(var(--medal), 0.5));
}

.bprize__tile {
  min-width: 0;
}

.bprize__winner {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-gold);
}

.bprize__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}
</style>
