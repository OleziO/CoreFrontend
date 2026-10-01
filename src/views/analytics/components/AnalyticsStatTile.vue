<template>
  <article
    class="stat-tile neon-card rounded-2xl"
    :class="`stat-tile--${accent}`"
    :style="{ '--tile-delay': `${delay}ms` }"
  >
    <span class="stat-tile__icon" aria-hidden="true">
      <component :is="icon" :size="18" weight="duotone" />
    </span>
    <span class="stat-tile__label">{{ label }}</span>
    <span class="stat-tile__value">{{ display }}</span>
    <span v-if="hint" class="stat-tile__hint">{{ hint }}</span>
    <span class="stat-tile__glow" aria-hidden="true" />
  </article>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { formatAnalyticsNumber } from '../analytics.utils'

const props = withDefaults(defineProps<{
  label: string
  value: number | null
  icon: Component
  accent?: 'primary' | 'gold' | 'violet' | 'pink'
  /** Другий рядок — частка, порівняння тощо. */
  hint?: string
  delay?: number
  /** Форматер значення (напр. гривні з копійок); за замовчуванням — число з роздільниками. */
  formatValue?: (value: number) => string
}>(), {
  accent: 'primary',
  hint: '',
  delay: 0,
  formatValue: undefined
})

// Лічильник «докручується» до значення; під reduced-motion VueUse сам вимикає перехід.
const source = computed(() => props.value ?? 0)
const animated = useTransition(source, {
  duration: 1100,
  transition: [0.16, 1, 0.3, 1]
})
const display = computed(() =>
  props.value == null ? '—' : (props.formatValue ?? formatAnalyticsNumber)(animated.value)
)
</script>

<style scoped>
.stat-tile {
  --tile-accent-rgb: var(--ds-primary-rgb);

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 128px;
  padding: 16px 18px;
  overflow: hidden;
}

.stat-tile--gold {
  --tile-accent-rgb: var(--ds-gold-rgb);
}

.stat-tile--violet {
  --tile-accent-rgb: var(--ds-secondary-rgb);
}

.stat-tile--pink {
  --tile-accent-rgb: var(--ds-pink-rgb);
}

.stat-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
  border-radius: 8px;
  border: 1px solid rgba(var(--tile-accent-rgb), 0.3);
  background: rgba(var(--tile-accent-rgb), 0.1);
  color: rgb(var(--tile-accent-rgb));
}

.stat-tile__label {
  font-size: 12px;
  line-height: 1.3;
  letter-spacing: 0.04em;
  color: var(--ds-text-muted);
}

.stat-tile__value {
  font-family: var(--ds-font-body);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.05;
  color: var(--ds-text-strong);
}

.stat-tile__hint {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgb(var(--tile-accent-rgb));
}

/* Лампа в правому верхньому куті — колір акценту плитки. */
.stat-tile__glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(var(--tile-accent-rgb), 0.22), transparent 65%);
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .stat-tile {
    animation: stat-tile-in 560ms var(--ds-ease-out) both;
    animation-delay: var(--tile-delay);
  }

  @keyframes stat-tile-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
