<template>
  <section class="bpart" aria-labelledby="bpart-title">
    <header class="bpart__head">
      <h2 id="bpart-title" class="bpart__title">
        <PhUsers :size="16" weight="bold" aria-hidden="true" />
        Учасники
      </h2>
      <span class="bpart__count">{{ participants.length }} / {{ maxParticipants }}</span>
    </header>

    <p v-if="!participants.length" class="bpart__empty">
      Ще ніхто не зареєструвався — будьте першим.
    </p>

    <ol v-else class="bpart__list">
      <li
        v-for="p in participants"
        :key="p.player.id"
        class="bpart__row"
        :class="{ 'is-out': p.eliminated, 'is-me': p.player.id === meId, 'is-champion': p.place === 1 }"
      >
        <span class="bpart__seed" :title="p.seed ? `Посів ${p.seed}` : undefined">{{ p.seed ?? '·' }}</span>
        <el-avatar :src="resolvePublicOrApiUrl(p.player.avatarUrl)" :size="26" class="shrink-0">
          {{ duelPlayerInitial(p.player) }}
        </el-avatar>
        <RouterLink
          :to="{ name: routeNames.player, params: { id: p.player.id } }"
          class="bpart__name no-underline"
        >
          {{ duelPlayerName(p.player) }}
        </RouterLink>
        <span class="bpart__state" :class="stateOf(p).tone">
          <PhCrown v-if="p.place === 1" :size="12" weight="fill" aria-hidden="true" />
          {{ stateOf(p).label }}
        </span>
        <el-button
          v-if="canManage && status === 'REGISTRATION'"
          text
          size="small"
          class="btn-icon bpart__remove"
          :aria-label="`Прибрати ${duelPlayerName(p.player)}`"
          @click="emit('remove', p.player)"
        >
          <PhX :size="13" weight="bold" />
        </el-button>
      </li>
    </ol>

    <p v-if="status === 'REGISTRATION' && freeSlots > 0" class="bpart__free">
      Вільних місць: {{ freeSlots }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { PhCrown, PhUsers, PhX } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { duelPlayerInitial, duelPlayerName } from '@/views/duels/duels.utils'
import { bracketPlaceLabel } from '@/views/media/media.utils'
import type { TDuelBracketParticipant, TDuelBracketStatus, TDuelPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  participants: TDuelBracketParticipant[]
  status: TDuelBracketStatus
  maxParticipants: number
  canManage?: boolean
  meId?: string | null
}>(), {
  canManage: false,
  meId: null
})

const emit = defineEmits<{ remove: [player: TDuelPlayer] }>()

const freeSlots = computed(() => Math.max(0, props.maxParticipants - props.participants.length))

function stateOf (p: TDuelBracketParticipant): { label: string; tone: string } {
  if (props.status === 'REGISTRATION') return { label: 'Зареєстрований', tone: 'is-neutral' }
  if (p.place === 1) return { label: 'Чемпіон', tone: 'is-gold' }
  if (p.place != null) return { label: `${bracketPlaceLabel(p.place)} місце`, tone: p.place <= 4 ? 'is-medal' : 'is-out' }
  if (props.status === 'CANCELLED') return { label: '—', tone: 'is-neutral' }
  return { label: 'У сітці', tone: 'is-in' }
}
</script>

<style scoped>
.bpart {
  --tw: 145, 70, 255;

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bpart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bpart__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-display);
  font-size: 16px;
  color: var(--ds-text-strong);
}

.bpart__count {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  color: var(--ds-text-muted);
}

.bpart__empty,
.bpart__free {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.bpart__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 520px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
}

.bpart__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 10px;
  transition: background-color var(--ds-duration-fast) ease;
}

.bpart__row.is-me {
  background: rgba(var(--ds-gold-rgb), 0.08);
}

.bpart__row.is-champion {
  background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.16), transparent);
}

.bpart__row.is-out .bpart__name {
  color: var(--ds-text-faint);
  text-decoration: line-through;
  text-decoration-color: rgba(255, 255, 255, 0.2);
}

.bpart__seed {
  width: 22px;
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  text-align: center;
  color: var(--ds-text-faint);
}

.bpart__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.bpart__state {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.bpart__state.is-in {
  color: rgb(200, 175, 255);
}

.bpart__state.is-gold {
  font-weight: 700;
  color: var(--ds-gold);
}

.bpart__state.is-medal {
  color: rgb(222, 160, 100);
}

.bpart__remove {
  flex-shrink: 0;
  opacity: 0.6;
}

@media (hover: hover) and (pointer: fine) {
  .bpart__row:hover {
    background: rgba(var(--tw), 0.08);
  }

  .bpart__remove:hover {
    opacity: 1;
    color: var(--ds-error);
  }
}
</style>
