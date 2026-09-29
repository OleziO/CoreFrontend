<template>
  <span class="duel-rating" :class="`duel-rating--${size}`">
    <PhSword :size="size === 'lg' ? 18 : 13" weight="fill" class="duel-rating__icon shrink-0" />
    <span class="duel-rating__value">{{ formatDuelNumber(rating) }}</span>
    <span v-if="showStreak && streak" class="duel-rating__streak" :class="streak > 0 ? 'is-win' : 'is-loss'">
      {{ formatDuelStreak(streak) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { PhSword } from '@phosphor-icons/vue'
import { formatDuelNumber, formatDuelStreak } from '@/views/duels/duels.utils'

withDefaults(defineProps<{
  rating: number | null | undefined
  streak?: number | null
  showStreak?: boolean
  size?: 'sm' | 'lg'
}>(), {
  streak: 0,
  showStreak: true,
  size: 'sm'
})
</script>

<style scoped>
.duel-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.08);
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
  white-space: nowrap;
}

.duel-rating--lg {
  gap: 8px;
  padding: 6px 16px;
  font-size: 18px;
}

.duel-rating__icon {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));
}

.duel-rating__streak {
  font-size: 0.8em;
  font-weight: 600;
  opacity: 0.9;
}

.duel-rating__streak.is-win {
  color: var(--ds-success, #22c55e);
}

.duel-rating__streak.is-loss {
  color: var(--ds-error, #f43f5e);
}
</style>
