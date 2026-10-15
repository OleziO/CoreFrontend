<template>
  <button
    type="button"
    class="bnode"
    :class="[`is-${tone}`, { 'is-selected': selected, 'is-mine': mine }]"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    @click="emit('select', match.id)"
  >
    <span class="bnode__ribbon">
      <span v-if="tone === 'live'" class="bnode__live-dot" aria-hidden="true" />
      <span class="truncate">{{ ribbon }}</span>
      <span v-if="match.duel" class="bnode__num">#{{ match.duel.number }}</span>
    </span>

    <span
      v-for="slot in slots"
      :key="slot.key"
      class="bnode__row"
      :class="{ 'is-winner': slot.winner, 'is-loser': slot.loser, 'is-me': slot.isMe, 'is-bye': slot.bye }"
    >
      <span class="bnode__seed">{{ slot.seed ?? '' }}</span>
      <img
        v-if="slot.heroUrl"
        :src="slot.heroUrl"
        :alt="slot.heroName"
        :title="slot.heroName"
        class="bnode__hero"
        loading="lazy"
      >
      <el-avatar
        v-else-if="slot.player"
        :src="resolvePublicOrApiUrl(slot.player.avatarUrl)"
        :size="18"
        class="bnode__avatar"
      >
        {{ duelPlayerInitial(slot.player) }}
      </el-avatar>
      <span v-else-if="slot.bye" class="bnode__bye-icon" aria-hidden="true">
        <PhUserMinus :size="11" weight="bold" />
      </span>
      <span v-else class="bnode__empty-avatar" aria-hidden="true" />
      <span v-if="slot.bye" class="bnode__bye">{{ slot.label }}</span>
      <span v-else class="bnode__name" :class="{ 'is-placeholder': !slot.player }">{{ slot.label }}</span>
      <PhCrown v-if="slot.winner" :size="12" weight="fill" class="bnode__crown" aria-hidden="true" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { PhCrown, PhUserMinus } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelHeroFor, duelHeroImageUrl, duelPlayerInitial, duelPlayerName, duelStateLabels } from '@/views/duels/duels.utils'
import { DUEL_BRACKET_BYE_LABEL, duelBracketResultLabels } from '@/views/media/media.utils'
import type { TDuelBracketMatch, TDuelPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  match: TDuelBracketMatch
  selected?: boolean
  meId?: string | null
  /** Слоти ще чекають на попередній раунд — підписи «Переможець 1/4» тощо. */
  waitingLabels?: [string, string]
}>(), {
  selected: false,
  meId: null,
  waitingLabels: () => ['Очікуємо', 'Очікуємо']
})

const emit = defineEmits<{ select: [matchId: string] }>()

type TTone = 'live' | 'ready' | 'decision' | 'done' | 'waiting'

const tone = computed<TTone>(() => {
  switch (props.match.status) {
    case 'LIVE': return 'live'
    case 'READY': return 'ready'
    case 'NEEDS_DECISION': return 'decision'
    case 'DONE': return 'done'
    default: return 'waiting'
  }
})

const mine = computed(() =>
  !!props.meId && (props.match.player1?.id === props.meId || props.match.player2?.id === props.meId)
)

const ribbon = computed(() => {
  const m = props.match
  if (m.status === 'LIVE' && m.duel) return duelStateLabels[m.duel.state]
  if (m.status === 'READY') return m.note ? 'Чекаємо гравця' : 'Готуємо лобі'
  if (m.status === 'NEEDS_DECISION') return 'Рішення організатора'
  if (m.status === 'DONE') return m.result ? duelBracketResultLabels[m.result] : 'Завершено'
  return 'Очікує суперників'
})

const slots = computed(() => {
  const m = props.match
  const make = (key: 'p1' | 'p2', player: TDuelPlayer | null, seed: number | null, fallback: string) => {
    const hero = m.duel && player ? duelHeroFor(m.duel, player.id) : null
    // Порожній слот у завершеному матчі — це bye, а не «очікуємо».
    const bye = !player && (m.status === 'DONE' || m.round === 1)
    const label = player ? duelPlayerName(player) : (bye ? DUEL_BRACKET_BYE_LABEL : fallback)
    return {
      key,
      player,
      seed,
      label,
      bye,
      heroUrl: hero ? duelHeroImageUrl(hero) : '',
      heroName: hero?.localizedName ?? '',
      winner: !!player && m.winnerId === player.id,
      loser: !!player && m.status === 'DONE' && m.winnerId !== player.id,
      isMe: !!player && player.id === props.meId
    }
  }
  return [
    make('p1', m.player1, m.seed1, props.waitingLabels[0]),
    make('p2', m.player2, m.seed2, props.waitingLabels[1])
  ]
})

const ariaLabel = computed(() => `${slots.value[0].label} проти ${slots.value[1].label}: ${ribbon.value}`)
</script>

<style scoped>
.bnode {
  --tw: 145, 70, 255;
  --tone: 148, 163, 184;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(var(--tone), 0.25);
  background: linear-gradient(160deg, rgba(24, 27, 48, 0.96), rgba(13, 15, 28, 0.98));
  box-shadow: var(--ds-elevation-2);
  text-align: left;
  color: var(--ds-text);
  cursor: pointer;
  transition:
    border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.bnode.is-live {
  --tone: var(--tw);

  box-shadow: var(--ds-elevation-2), 0 0 16px rgba(var(--tw), 0.35);
}

.bnode.is-ready {
  --tone: var(--ds-primary-rgb);
}

.bnode.is-decision {
  --tone: 245, 158, 11;
}

.bnode.is-done {
  --tone: 100, 116, 139;
}

.bnode.is-selected {
  border-color: rgba(var(--tone), 0.9);
  box-shadow: 0 0 0 1px rgba(var(--tone), 0.6), 0 0 20px rgba(var(--tone), 0.35);
}

.bnode.is-mine::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--ds-gold);
  box-shadow: 0 0 8px rgba(var(--ds-gold-rgb), 0.8);
}

.bnode:focus-visible {
  outline: 2px solid rgba(var(--tw), 0.8);
  outline-offset: 2px;
}

.bnode:active {
  transform: scale(0.98);
}

.bnode__ribbon {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--tone), 1);
  background: rgba(var(--tone), 0.1);
  border-bottom: 1px solid rgba(var(--tone), 0.15);
}

.bnode.is-done .bnode__ribbon {
  color: var(--ds-text-faint);
}

.bnode__num {
  margin-left: auto;
  color: var(--ds-text-faint);
  letter-spacing: 0.06em;
}

.bnode__live-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgb(var(--tw));
  box-shadow: 0 0 6px rgba(var(--tw), 0.9);
  animation: bnode-pulse 1.3s ease-in-out infinite;
}

.bnode__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
}

.bnode__row + .bnode__row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.bnode__row.is-winner {
  background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.12), transparent 80%);
}

.bnode__row.is-loser {
  opacity: 0.5;
}

.bnode__row.is-me .bnode__name {
  color: var(--ds-gold);
}

.bnode__seed {
  width: 16px;
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  text-align: right;
  color: var(--ds-text-faint);
}

.bnode__hero {
  width: 32px;
  height: 18px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

/* Глобальний .el-avatar фіксує 56px і кільце — у вузлі сітки потрібна мініатюра */
.bnode__avatar {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 9px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.bnode__empty-avatar {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

/* Bye: слот свідомо порожній — штрихуємо рядок, щоб він не читався як «гравця ще немає» */
.bnode__row.is-bye {
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.025) 0 6px,
    transparent 6px 12px
  );
}

.bnode__bye-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  color: var(--ds-text-faint);
}

.bnode__bye {
  display: inline-flex;
  align-items: center;
  height: 18px;
  min-width: 0;
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 999px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.bnode__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.bnode__name.is-placeholder {
  font-weight: 400;
  font-style: italic;
  color: var(--ds-text-faint);
}

.bnode__crown {
  flex-shrink: 0;
  color: var(--ds-gold);
}

@media (hover: hover) and (pointer: fine) {
  .bnode:hover {
    border-color: rgba(var(--tone), 0.7);
  }
}

@keyframes bnode-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .bnode__live-dot {
    animation: none;
  }
}
</style>
