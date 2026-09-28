<template>
  <div class="stacked-bar">
    <div
      v-if="total > 0"
      class="stacked-bar__track"
      role="img"
      :aria-label="ariaLabel"
    >
      <template v-for="(segment, index) in visibleSegments" :key="segment.key">
        <el-tooltip :content="tooltipFor(segment)" placement="top" :show-after="80">
          <span
            class="stacked-bar__segment"
            :style="{
              width: `${(segment.value / total) * 100}%`,
              background: segment.color,
              color: getAnalyticsInkOnFill(segment.color),
              '--i': index
            }"
            tabindex="0"
          >
            <span v-if="segment.value / total >= 0.12" class="stacked-bar__inline">
              {{ formatAnalyticsPercent(segment.value, total) }}
            </span>
          </span>
        </el-tooltip>
      </template>
    </div>
    <p v-else class="stacked-bar__empty">
      Даних ще немає
    </p>

    <!-- Легенда обов'язкова: ідентичність сегмента ніколи не тримається лише на кольорі. -->
    <ul class="stacked-bar__legend">
      <li
        v-for="segment in segments"
        :key="segment.key"
        class="stacked-bar__legend-item"
      >
        <span class="stacked-bar__swatch" :style="{ background: segment.color }" aria-hidden="true" />
        <span class="stacked-bar__legend-label">{{ segment.label }}</span>
        <span class="stacked-bar__legend-value">
          {{ formatAnalyticsNumber(segment.value) }}
          <span class="stacked-bar__legend-share">· {{ formatAnalyticsPercent(segment.value, total) }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { formatAnalyticsNumber, formatAnalyticsPercent, getAnalyticsInkOnFill } from '../analytics.utils'

const props = defineProps<{
  segments: TAnalyticsStackedSegment[]
}>()

const total = computed(() => props.segments.reduce((sum, s) => sum + s.value, 0))
const visibleSegments = computed(() => props.segments.filter(s => s.value > 0))

const ariaLabel = computed(() =>
  props.segments
    .map(s => `${s.label}: ${formatAnalyticsNumber(s.value)} (${formatAnalyticsPercent(s.value, total.value)})`)
    .join(', ')
)

function tooltipFor (segment: TAnalyticsStackedSegment): string {
  return `${segment.label}: ${formatAnalyticsNumber(segment.value)} · ${formatAnalyticsPercent(segment.value, total.value)}`
}
</script>

<style scoped>
.stacked-bar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Проміжки 2px у кольорі підкладки відділяють сегменти — без обведень. */
.stacked-bar__track {
  display: flex;
  gap: 2px;
  height: 18px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
}

.stacked-bar__segment {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2px;
  height: 100%;
  outline: none;
  transition: filter var(--ds-duration-base) ease;
}

.stacked-bar__segment:hover,
.stacked-bar__segment:focus-visible {
  filter: brightness(1.15);
}

.stacked-bar__inline {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.stacked-bar__empty {
  padding: 8px 0;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.stacked-bar__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.stacked-bar__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ds-text-muted);
}

.stacked-bar__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.stacked-bar__legend-value {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}

.stacked-bar__legend-share {
  color: var(--ds-text-faint);
}

@media (prefers-reduced-motion: no-preference) {
  .stacked-bar__track {
    animation: stacked-reveal 900ms var(--ds-ease-out) both;
    animation-delay: 160ms;
  }

  .stacked-bar__inline {
    animation: stacked-fade 400ms ease both;
    animation-delay: 900ms;
  }

  @keyframes stacked-reveal {
    from {
      clip-path: inset(0 100% 0 0 round 9999px);
    }

    to {
      clip-path: inset(0 0 0 0 round 9999px);
    }
  }

  @keyframes stacked-fade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
}
</style>
