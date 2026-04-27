<template>
  <div class="w-full min-w-0">
    <el-tag
      effect="plain"
      disable-transitions
      :class="[
        'player-team-tag',
        hasTeam ? 'player-team-tag--in' : 'player-team-tag--out'
      ]"
    >
      <span class="player-team-tag__inner">
        <span
          class="player-team-tag__status"
          aria-hidden="true"
        />
        <el-tooltip :content="hasTeam ? 'В команді' : 'Без команди'" placement="top">
          <span class="player-team-tag__text">
            {{ hasTeam ? 'В команді' : 'Без команди' }}
          </span>
        </el-tooltip>
      </span>
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import type { TPlayer } from '@/api/types/api.types'

const props = defineProps<{ user: TPlayer }>()

const hasTeam = computed(() => {
  return !!(props.user as any)?.teamId || false
})
</script>

<style scoped>
/* Без el-type: кастомні стани, щоб виглядало цільно з role-tag / карткою */
.player-team-tag {
  @apply !m-0 !h-auto;
  @apply !w-full !min-w-0;
  @apply !flex !items-center !justify-center;
  @apply !box-border;
  @apply !rounded-lg;
  @apply !border;
  @apply !px-10 !py-5;
  @apply !text-[12px] !font-semibold;
  @apply !leading-tight;
  @apply !shadow-none;
  letter-spacing: 0.04em;
}

.player-team-tag :deep(.el-tag__content) {
  @apply w-full;
}

.player-team-tag__inner {
  @apply flex w-full min-w-0 items-center justify-center gap-6;
}

.player-team-tag__status {
  @apply h-6 w-6 shrink-0 rounded-full;
}

.player-team-tag__text {
  @apply truncate;
}

/* У складі: зелений акцент; градієнти — звичайний CSS (Tailwind from-color/opacity у @apply не підходить) */
.player-team-tag--in {
  border-color: color-mix(in srgb, rgb(34 197 94) 40%, transparent) !important;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, rgb(34 197 94) 12%, transparent),
    color-mix(in srgb, rgb(5 46 22) 40%, transparent)
  ) !important;
  @apply !text-green-100;
}
.player-team-tag--in .player-team-tag__status {
  @apply bg-green-400/90;
  box-shadow:
    0 0 0 2px color-mix(in srgb, rgb(187 247 208) 30%, transparent),
    0 0 10px color-mix(in srgb, rgb(34 197 94) 35%, transparent);
}

/* Вільний гравець */
.player-team-tag--out {
  border-color: color-mix(in srgb, rgb(255 255 255) 12%, transparent) !important;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.06),
    color-mix(in srgb, rgb(17 24 39) 50%, transparent)
  ) !important;
  @apply !text-gray-300;
}
.player-team-tag--out .player-team-tag__status {
  @apply bg-gray-500/50 ring-2;
  --tw-ring-color: color-mix(in srgb, rgb(255 255 255) 10%, transparent);
  box-shadow: none;
}
</style>
