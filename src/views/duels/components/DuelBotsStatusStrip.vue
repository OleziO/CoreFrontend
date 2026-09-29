<template>
  <div
    class="bots-strip"
    :class="{ 'is-offline': isOffline, 'is-compact': compact }"
    role="status"
    :aria-label="ariaLabel"
  >
    <span class="bots-strip__dot" aria-hidden="true" />
    <span class="bots-strip__title">
      <PhRobot :size="14" weight="bold" class="shrink-0" />
      Боти-хости
    </span>

    <template v-if="bots">
      <span class="bots-strip__state">{{ isOffline ? 'офлайн' : 'онлайн' }}</span>
      <span class="bots-strip__stats">
        <span class="bots-strip__stat" title="Онлайн">
          <span class="bots-strip__stat-value">{{ bots.online }}</span>/{{ bots.total }}
        </span>
        <span class="bots-strip__stat bots-strip__stat--free" title="Вільні">
          <span class="bots-strip__stat-value">{{ bots.free }}</span> вільн.
        </span>
        <span class="bots-strip__stat bots-strip__stat--busy" title="У грі">
          <span class="bots-strip__stat-value">{{ bots.busy }}</span> у грі
        </span>
      </span>
    </template>
    <span v-else-if="isError" class="bots-strip__state">статус недоступний</span>
    <span v-else class="skeleton-bone inline-block h-[14px] w-[120px] !rounded-md" />
  </div>
</template>

<script setup lang="ts">
import { PhRobot } from '@phosphor-icons/vue'
import type { TDuelBotsStatus } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  bots: TDuelBotsStatus | null
  isError?: boolean
  /** Щільніший варіант для шапок/тулбарів. */
  compact?: boolean
}>(), {
  isError: false,
  compact: false
})

const isOffline = computed(() => !!props.bots && props.bots.online === 0)

const ariaLabel = computed(() => {
  if (!props.bots) return 'Стан ботів-хостів завантажується'
  if (isOffline.value) return 'Жоден бот-хост не онлайн'
  return `Ботів онлайн: ${props.bots.online} з ${props.bots.total}, вільних ${props.bots.free}, у грі ${props.bots.busy}`
})
</script>

<style scoped>
.bots-strip {
  --tone: 34, 197, 94;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--tone), 0.35);
  background: rgba(var(--tone), 0.07);
  font-size: 12px;
  color: var(--ds-text);
}

.bots-strip.is-compact {
  padding: 6px 12px;
  border-radius: 9999px;
}

.bots-strip.is-offline {
  --tone: 244, 63, 94;
}

.bots-strip__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgb(var(--tone));
  box-shadow: 0 0 8px rgba(var(--tone), 0.9);
}

.bots-strip__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.bots-strip__state {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  color: rgb(var(--tone));
}

.bots-strip__stats {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-left: auto;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.bots-strip__stat-value {
  font-weight: 700;
  color: var(--ds-text-strong);
}

.bots-strip__stat--free .bots-strip__stat-value {
  color: #22c55e;
}

.bots-strip__stat--busy .bots-strip__stat-value {
  color: var(--ds-gold);
}

.is-offline .bots-strip__stat--free .bots-strip__stat-value {
  color: var(--ds-text-faint);
}

@media (prefers-reduced-motion: no-preference) {
  .bots-strip.is-offline .bots-strip__dot {
    animation: bots-blink 1.2s ease-in-out infinite;
  }

  @keyframes bots-blink {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.3;
    }
  }
}
</style>
