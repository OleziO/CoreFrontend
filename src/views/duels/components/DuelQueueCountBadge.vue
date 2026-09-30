<template>
  <span
    class="queue-count"
    :class="{ 'queue-count--active': count > 0, 'queue-count--lg': size === 'lg' }"
    :title="`Зараз у черзі: ${pluralizeDuelPlayers(count)}`"
    aria-live="polite"
  >
    <PhUsersThree :size="size === 'lg' ? 18 : 14" weight="fill" class="queue-count__icon shrink-0" />
    <!-- Число «перекочується», як одометр, коли хтось стає в чергу чи виходить -->
    <span class="queue-count__value">
      <Transition name="queue-count-roll" mode="out-in">
        <span :key="count" class="queue-count__digits">{{ count }}</span>
      </Transition>
    </span>
    <span class="queue-count__label">у черзі</span>
  </span>
</template>

<script setup lang="ts">
import { PhUsersThree } from '@phosphor-icons/vue'
import { pluralizeDuelPlayers } from '@/views/duels/duels.utils'

withDefaults(defineProps<{
  /** Скільки гравців зараз у черзі дуелей (разом зі мною, якщо я в ній). Оновлюється сокетом. */
  count: number
  size?: 'sm' | 'lg'
}>(), {
  size: 'sm'
})
</script>

<style scoped>
.queue-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--ds-control-height-sm);
  padding: 0 12px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(var(--ds-primary-rgb), 0.06);
  font-family: var(--ds-font-mono);
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
  white-space: nowrap;
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;
}

.queue-count--lg {
  gap: 8px;
  height: auto;
  padding: 6px 16px;
  font-size: 18px;
}

.queue-count--active {
  border-color: rgba(var(--ds-primary-rgb), 0.45);
  background: rgba(var(--ds-primary-rgb), 0.1);
}

.queue-count__icon {
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-fast) ease, filter var(--ds-duration-fast) ease;
}

.queue-count--active .queue-count__icon {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));
}

.queue-count__value {
  display: inline-grid;
  min-width: 1ch;
  overflow: hidden;
  line-height: 1;
}

.queue-count__digits {
  display: inline-block;
}

.queue-count__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.queue-count-roll-enter-active,
.queue-count-roll-leave-active {
  transition: transform var(--ds-duration-base) var(--ds-ease-out), opacity var(--ds-duration-base) ease;
}

.queue-count-roll-enter-from {
  opacity: 0;
  transform: translateY(-0.7em);
}

.queue-count-roll-leave-to {
  opacity: 0;
  transform: translateY(0.7em);
}
</style>
