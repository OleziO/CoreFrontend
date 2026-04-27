<template>
  <el-tooltip
    :placement="placement"
    :show-arrow="false"
    popper-class="player-positions-tooltip-popper"
  >
    <slot />
    <template #content>
      <div
        class="player-positions-tooltip__inner"
        :class="{ 'is-empty': !summary.hasPositions }"
      >
        <div class="player-positions-tooltip__title">
          Позиції
        </div>

        <div
          v-if="summary.hasPositions"
          class="player-positions-tooltip__tags"
        >
          <el-tag
            v-for="row in summary.rows"
            :key="row.id"
            effect="plain"
            disable-transitions
            class="position-tag-pill"
          >
            <span class="position-tag-pill__num">
              <span class="position-tag-pill__num-in">{{ row.id }}</span>
            </span>
            <span class="position-tag-pill__label">{{ row.label }}</span>
          </el-tag>
        </div>

        <p
          v-else
          class="player-positions-tooltip__empty"
        >
          {{ summary.oneLine }}
        </p>
      </div>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import type { TPlayerPositionsSummary } from '@/core/helpers'

withDefaults(
  defineProps<{
    summary: TPlayerPositionsSummary
    placement?: 'top' | 'bottom' | 'left' | 'right'
  }>(),
  { placement: 'top' }
)
</script>

<style scoped>
/* el-tag: знімаємо типові EP line-height/щільність, збираємо все в flex по центру */
.position-tag-pill {
  @apply m-0 shrink-0;
  @apply !text-xs !font-semibold;
  @apply !rounded-lg;
  @apply !px-14 !py-7;
  @apply !h-auto;
  @apply !min-h-0;
  @apply !border;
  @apply !transition-all;
  @apply !duration-200;
  @apply !inline-flex !flex-nowrap !items-stretch;
  letter-spacing: 0.02em;
  line-height: 1 !important;

  border-color: color-mix(in srgb, var(--el-color-primary) 22%, rgba(255, 255, 255, 0.1)) !important;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--el-color-primary) 8%, rgb(15 23 42)) 0%,
    rgb(30 41 59 / 0.45) 50%,
    color-mix(in srgb, var(--el-color-primary) 5%, rgb(15 23 42 / 0.88)) 100%
  ) !important;
  color: rgb(243 244 246) !important;
  box-shadow:
    0 2px 10px -3px color-mix(in srgb, var(--el-color-primary) 12%, rgba(0, 0, 0, 0.35)),
    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
}

.position-tag-pill :deep(.el-tag__content) {
  @apply flex flex-nowrap items-stretch;
  min-height: 0;
  line-height: 1 !important;
  flex: 1 1 auto;
  align-items: stretch;
  gap: 0;
}

.position-tag-pill:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 42%, rgba(255, 255, 255, 0.14)) !important;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--el-color-primary) 14%, rgb(15 23 42)) 0%,
    color-mix(in srgb, var(--el-color-primary) 6%, rgb(30 41 59 / 0.6)) 100%
  ) !important;
  color: rgb(255 255 255) !important;
  box-shadow:
    0 4px 16px -4px color-mix(in srgb, var(--el-color-primary) 22%, rgba(0, 0, 0, 0.25)),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
  transform: none;
}

.position-tag-pill__num {
  @apply flex min-w-16 flex-col justify-center;
  @apply pr-8;
  @apply border-r;
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 18%, rgba(255, 255, 255, 0.1)) !important;
  text-shadow: none;
  align-self: stretch;
}

.position-tag-pill__num-in {
  @apply flex items-center justify-center;
  @apply text-[10px] font-bold tabular-nums;
  line-height: 1;
  /* відступ цифри до дивайдера = pl у лейбла після дивайдера */
}

.position-tag-pill__label {
  @apply text-gray-200;
  @apply flex items-center;
  @apply pl-8 self-center text-xs;
  line-height: 1.2;
}

.position-tag-pill:hover .position-tag-pill__label {
  @apply !text-white;
  text-shadow: none;
}
</style>

<style>
.player-positions-tooltip-popper {
  width: min(240px, calc(100vw - 20px)) !important;
  min-width: min(240px, calc(100vw - 20px)) !important;
  max-width: min(240px, calc(100vw - 20px)) !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
  box-sizing: border-box;
}

.player-positions-tooltip__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.8rem 0.85rem 0.85rem;
  border-radius: 1.1rem;
  border: 1px solid
    color-mix(in srgb, var(--el-color-primary) 20%, rgba(255, 255, 255, 0.12));
  background: linear-gradient(
    150deg,
    rgb(15 23 42 / 0.92) 0%,
    color-mix(in srgb, var(--el-color-primary) 6%, rgb(15 23 42)) 45%,
    rgb(8 10 20 / 0.94) 100%
  );
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 8%, rgba(255, 255, 255, 0.04)) inset,
    0 8px 32px -8px rgba(0, 0, 0, 0.4),
    0 2px 12px -2px color-mix(in srgb, var(--el-color-primary) 10%, rgba(0, 0, 0, 0.2));
  backdrop-filter: blur(18px) saturate(1.02);
}

.player-positions-tooltip__inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    100% 70% at 50% 0%,
    color-mix(in srgb, var(--el-color-primary) 7%, rgba(255, 255, 255, 0.03)) 0%,
    transparent 60%
  );
  opacity: 0.5;
  mix-blend-mode: normal;
}
.player-positions-tooltip__title {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 55%, rgb(186 201 220));
  text-shadow: none;
}
.player-positions-tooltip__tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.5rem;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.player-positions-tooltip__empty {
  position: relative;
  z-index: 1;
  margin: 0;
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, #94a3b8 92%, var(--el-color-primary) 8%);
  text-shadow: none;
}
.player-positions-tooltip__inner.is-empty {
  padding-bottom: 0.7rem;
}
</style>
