<template>
  <span
    class="vip-badge"
    :class="[`vip-badge--${size}`, { 'vip-badge--static': static }]"
    role="img"
    aria-label="VIP"
  >
    <PhCrown class="vip-badge__icon" weight="fill" :size="iconSize" aria-hidden="true" />
    <span class="vip-badge__text">VIP</span>
  </span>
</template>

<script setup lang="ts">
import { PhCrown } from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md'
  /** Без відблиску, що пробігає (для щільних списків). */
  static?: boolean
}>(), {
  size: 'sm',
  static: false
})

const iconSize = computed(() => ({ xs: 10, sm: 12, md: 15 })[props.size])
</script>

<style scoped lang="scss">
// VIP mark: gold → pink foil (the header hairline's warm end) rather than the
// flat admin gold, so it never reads as a staff frame. A slow sheen sweeps
// across it; reduced motion keeps it still.
.vip-badge {
  --vip-gold: 255, 206, 84;
  --vip-rose: 255, 94, 170;

  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgba(var(--vip-gold), 0.65);
  background: linear-gradient(120deg, rgba(var(--vip-gold), 0.24), rgba(var(--vip-rose), 0.22));
  box-shadow: 0 0 10px rgba(var(--vip-gold), 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  color: rgb(255, 226, 150);
  font-family: var(--ds-font-display);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.12em;
  text-shadow: 0 0 8px rgba(var(--vip-gold), 0.55);
  user-select: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.45) 50%, transparent 70%);
    transform: translateX(-120%);
    animation: vip-badge-sheen 3.6s ease-in-out infinite;
    pointer-events: none;
  }

  &--static::after {
    display: none;
  }

  &--xs {
    padding: 2px 6px 2px 5px;
    font-size: 9px;
  }

  &--sm {
    padding: 3px 8px 3px 6px;
    font-size: 10px;
  }

  &--md {
    padding: 5px 12px 5px 9px;
    font-size: 13px;
    gap: 6px;
  }
}

.vip-badge__icon {
  color: rgb(255, 206, 84);
  filter: drop-shadow(0 0 4px rgba(255, 206, 84, 0.7));
}

@keyframes vip-badge-sheen {
  0%,
  55% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(120%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vip-badge::after {
    display: none;
  }
}
</style>
