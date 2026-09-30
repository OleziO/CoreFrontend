<template>
  <span
    class="queue-count"
    :class="{ 'queue-count--active': count > 0 }"
    :title="`Зараз у черзі: ${pluralizeDuelPlayers(count)}`"
    aria-live="polite"
  >
    <PhUsersThree :size="18" weight="fill" class="queue-count__icon shrink-0" />
    <span class="queue-count__value">{{ count }}</span>
    <span class="queue-count__label">у черзі</span>
  </span>
</template>

<script setup lang="ts">
import { PhUsersThree } from '@phosphor-icons/vue'
import { pluralizeDuelPlayers } from '@/views/duels/duels.utils'

defineProps<{
  /** Скільки гравців зараз у черзі дуелей (разом зі мною, якщо я в ній). Оновлюється сокетом. */
  count: number
}>()
</script>

<style scoped>
.queue-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.08);
  font-family: var(--ds-font-mono);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
  white-space: nowrap;
}

.queue-count__icon {
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-fast) ease, filter var(--ds-duration-fast) ease;
}

.queue-count--active .queue-count__icon {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));
}

.queue-count__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}
</style>
