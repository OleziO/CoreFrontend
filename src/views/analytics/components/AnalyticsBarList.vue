<template>
  <ul v-if="items.length" class="bar-list">
    <li
      v-for="(item, index) in items"
      :key="item.key"
      class="bar-list__row"
      :style="{ '--i': index }"
    >
      <span class="bar-list__label" :title="item.label">
        <span class="bar-list__name">{{ item.label }}</span>
        <span v-if="item.hint" class="bar-list__hint">{{ item.hint }}</span>
      </span>

      <el-tooltip :content="tooltipFor(item)" placement="top" :show-after="80">
        <div class="bar-list__track" tabindex="0">
          <span
            class="bar-list__fill"
            :class="{ 'is-over': isOverCapacity(item) }"
            :style="{
              width: `${ratio(item) * 100}%`,
              background: item.color ?? fallbackColor
            }"
          />
        </div>
      </el-tooltip>

      <span class="bar-list__value">
        {{ formatAnalyticsNumber(item.value) }}<span
          v-if="item.capacity != null"
          class="bar-list__capacity"
        > / {{ formatAnalyticsNumber(item.capacity) }}</span>
      </span>
    </li>
  </ul>
  <p v-else class="bar-list__empty">
    {{ emptyText }}
  </p>
</template>

<script setup lang="ts">
import { ANALYTICS_SERIES, formatAnalyticsNumber, formatAnalyticsPercent } from '../analytics.utils'

const props = withDefaults(defineProps<{
  items: TAnalyticsChartItem[]
  /** Підпис величини для тултипа, напр. «команд». */
  unit?: string
  emptyText?: string
  fallbackColor?: string
}>(), {
  unit: '',
  emptyText: 'Даних ще немає',
  fallbackColor: ANALYTICS_SERIES.primary
})

const max = computed(() => Math.max(1, ...props.items.map(i => i.value)))
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))

/** Частка смужки: від місткості, якщо вона задана (слоти турніру), інакше — від максимуму списку. */
function ratio (item: TAnalyticsChartItem): number {
  if (item.capacity != null && item.capacity > 0) return Math.min(1, item.value / item.capacity)
  return item.value / max.value
}

function isOverCapacity (item: TAnalyticsChartItem): boolean {
  return item.capacity != null && item.capacity > 0 && item.value > item.capacity
}

function tooltipFor (item: TAnalyticsChartItem): string {
  const unit = props.unit ? ` ${props.unit}` : ''
  if (item.capacity != null && item.capacity > 0) {
    return `${item.label}: ${formatAnalyticsNumber(item.value)} з ${formatAnalyticsNumber(item.capacity)}` +
      ` слотів · ${formatAnalyticsPercent(item.value, item.capacity)}`
  }
  const share = total.value ? ` · ${formatAnalyticsPercent(item.value, total.value)}` : ''
  return `${item.label}: ${formatAnalyticsNumber(item.value)}${unit}${share}`
}
</script>

<style scoped>
.bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.bar-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
  row-gap: 6px;
}

.bar-list__label {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.bar-list__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.3;
  color: var(--ds-text);
}

.bar-list__hint {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--ds-border-neutral);
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.bar-list__track {
  position: relative;
  height: 10px;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(var(--ds-primary-rgb), 0.08);
  cursor: default;
  outline: none;
}

.bar-list__track:focus-visible {
  box-shadow: 0 0 0 1px rgba(var(--ds-primary-rgb), 0.5);
}

.bar-list__fill {
  display: block;
  height: 100%;
  border-radius: 0 4px 4px 0;
  transform-origin: left;
  transition: filter var(--ds-duration-base) ease;
}

.bar-list__fill.is-over {
  box-shadow: 0 0 10px rgba(var(--ds-pink-rgb), 0.55);
}

.bar-list__track:hover .bar-list__fill,
.bar-list__track:focus-visible .bar-list__fill {
  filter: brightness(1.15);
}

.bar-list__value {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-strong);
}

.bar-list__capacity {
  color: var(--ds-text-faint);
}

.bar-list__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

@media (min-width: 768px) {
  .bar-list__row {
    grid-template-columns: minmax(0, 200px) minmax(0, 1fr) 84px;
    row-gap: 0;
  }

  .bar-list__label {
    grid-column: auto;
  }

  .bar-list__value {
    text-align: right;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .bar-list__fill {
    animation: bar-grow 680ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i) * 45ms + 120ms);
  }

  @keyframes bar-grow {
    from {
      transform: scaleX(0);
    }

    to {
      transform: scaleX(1);
    }
  }
}
</style>
