<template>
  <div
    class="column-chart"
    :class="{ 'column-chart--dense': dense }"
    :style="{ '--n': items.length }"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Сітка: рецесивні суцільні волосяні лінії з поділками ліворуч; нуль — базова лінія. -->
    <div class="column-chart__grid" aria-hidden="true">
      <span
        v-for="tick in scale.ticks"
        :key="tick"
        class="column-chart__gridline"
        :class="{ 'is-baseline': tick === 0 }"
        :style="{ bottom: `${(tick / scale.max) * 100}%` }"
      >
        <span class="column-chart__tick">{{ formatTick(tick) }}</span>
      </span>
    </div>

    <ul class="column-chart__columns">
      <li
        v-for="(item, index) in items"
        :key="item.key"
        class="column-chart__slot"
        :style="{ '--i': index }"
      >
        <el-tooltip :content="tooltipFor(item)" placement="top" :show-after="80">
          <div class="column-chart__hit" tabindex="0">
            <span v-if="!dense" class="column-chart__value">{{ format(item.value) }}</span>
            <span
              class="column-chart__bar"
              :style="{
                height: `${(item.value / scale.max) * 100}%`,
                background: item.color ?? fallbackColor
              }"
            />
          </div>
        </el-tooltip>

        <span class="column-chart__axis">
          <img
            v-if="item.image"
            :src="item.image"
            alt=""
            class="column-chart__medal"
            loading="lazy"
            decoding="async"
          >
          <span v-if="axisLabel(item, index)" class="column-chart__label">{{ axisLabel(item, index) }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  ANALYTICS_SERIES,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  getAnalyticsNiceScale
} from '../analytics.utils'

const props = withDefaults(defineProps<{
  items: TAnalyticsChartItem[]
  /** Підпис величини для тултипа й aria, напр. «гравців». */
  unit?: string
  fallbackColor?: string
  /** Форматер значень (тултип, підпис над стовпчиком); за замовчуванням — число з роздільниками. */
  formatValue?: (value: number) => string
  /** Компактна шкала для поділок осі (напр. «₴12,4 тис.»); за замовчуванням — `formatValue`. */
  formatTickValue?: (value: number) => string
  /** Щільний ряд (30 днів): без цифр над стовпчиками, підпис осі — кожен `labelEvery`-й. */
  dense?: boolean
  labelEvery?: number
}>(), {
  unit: '',
  fallbackColor: ANALYTICS_SERIES.primary,
  formatValue: undefined,
  formatTickValue: undefined,
  dense: false,
  labelEvery: 5
})

const format = (value: number) => (props.formatValue ?? formatAnalyticsNumber)(value)
const formatTick = (value: number) => (props.formatTickValue ?? format)(value)

/** У щільному ряді підписуємо кожен N-й стовпчик, рахуючи від останнього (сьогодні завжди видно). */
function axisLabel (item: TAnalyticsChartItem, index: number): string {
  if (!props.dense) return item.label
  return (props.items.length - 1 - index) % props.labelEvery === 0 ? item.label : ''
}

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))
const scale = computed(() => getAnalyticsNiceScale(Math.max(0, ...props.items.map(i => i.value))))

const ariaLabel = computed(() =>
  props.items.map(i => `${i.label}: ${format(i.value)}`).join(', ')
)

function tooltipFor (item: TAnalyticsChartItem): string {
  const unit = props.unit ? ` ${props.unit}` : ''
  const share = total.value ? ` · ${formatAnalyticsPercent(item.value, total.value)}` : ''
  const hint = item.hint ? ` · ${item.hint}` : ''
  return `${item.label}: ${format(item.value)}${unit}${share}${hint}`
}
</script>

<style scoped>
.column-chart {
  --plot-height: 200px;
  --axis-gutter: 44px;

  position: relative;
  padding-left: var(--axis-gutter);
}

.column-chart__grid {
  position: absolute;
  top: 0;
  right: 0;
  left: var(--axis-gutter);
  height: var(--plot-height);
  pointer-events: none;
}

.column-chart__gridline {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
}

.column-chart__gridline.is-baseline {
  background: rgba(var(--ds-primary-rgb), 0.35);
}

.column-chart__tick {
  position: absolute;
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.column-chart__columns {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  column-gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.column-chart__slot {
  display: contents;
}

/* Плот: стовпчик росте від базової лінії. */
.column-chart__hit {
  grid-row: 1;
  grid-column: calc(var(--i) + 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: var(--plot-height);
  border-radius: 6px;
  cursor: default;
  outline: none;
}

.column-chart__hit:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.5);
}

.column-chart__value {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-base) ease;
}

.column-chart__hit:hover .column-chart__value,
.column-chart__hit:focus-visible .column-chart__value {
  color: var(--ds-text-strong);
}

.column-chart__bar {
  width: 24px;
  max-width: 70%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  transform-origin: bottom;
  transition: filter var(--ds-duration-base) ease;
}

.column-chart__hit:hover .column-chart__bar,
.column-chart__hit:focus-visible .column-chart__bar {
  filter: brightness(1.15) drop-shadow(0 0 8px rgba(var(--ds-primary-rgb), 0.45));
}

/* Вісь: медаль рангу + підпис. */
.column-chart__axis {
  grid-row: 2;
  grid-column: calc(var(--i) + 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding-top: 10px;
}

.column-chart__medal {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
}

.column-chart__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  color: var(--ds-text-muted);
}

/* Щільний ряд: вужчі проміжки, підписи осі можуть виходити за свою колонку. */
.column-chart--dense .column-chart__columns {
  column-gap: 2px;
}

.column-chart--dense .column-chart__bar {
  width: 14px;
  max-width: 80%;
}

.column-chart--dense .column-chart__axis {
  overflow: visible;
}

.column-chart--dense .column-chart__label {
  max-width: none;
  overflow: visible;
  font-size: 10px;
}

@media (max-width: 640px) {
  .column-chart {
    --plot-height: 160px;
    --axis-gutter: 36px;
  }

  .column-chart__medal {
    width: 30px;
    height: 30px;
  }

  .column-chart__label {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .column-chart__bar {
    animation: column-grow 720ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i) * 60ms + 120ms);
  }

  .column-chart__value,
  .column-chart__medal {
    animation: column-fade 480ms ease both;
    animation-delay: calc(var(--i) * 60ms + 480ms);
  }

  @keyframes column-grow {
    from {
      transform: scaleY(0);
    }

    to {
      transform: scaleY(1);
    }
  }

  @keyframes column-fade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
}
</style>
