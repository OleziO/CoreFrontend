<template>
  <div class="player-team-tag-wrap" :class="{ 'player-team-tag-wrap--stretch': stretchInGrid }">
    <el-tooltip :content="tooltipText" placement="top">
      <div
        class="min-w-0"
        :class="stretchInGrid ? 'block w-full' : 'inline-block max-w-full'"
      >
        <el-tag
          effect="plain"
          disable-transitions
          :class="[
            'player-team-tag',
            stretchInGrid && 'player-team-tag--stretch',
            hasTeam ? 'player-team-tag--in' : 'player-team-tag--out'
          ]"
        >
          <span class="player-team-tag__inner">
            <span class="player-team-tag__status" aria-hidden="true" />
            
            <span class="player-team-tag__text">{{ badgeText }}</span>
          </span>
        </el-tag>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { EUserIsTeam, hasTeamBadgeLabelMap, hasTeamLabelMap } from '@/components/player-tags/player.enums'

const props = withDefaults(
  defineProps<{
    user: TPlayer
    /** Колонка 50% у grid: розтягнути пілюлю на всю ширину клітинки. */
    stretchInGrid?: boolean
  }>(),
  { stretchInGrid: false }
)

const hasTeam = computed(() => {
  return !!(props.user as any)?.teamId || false
})

const teamFlag = computed((): EUserIsTeam =>
  hasTeam.value ? EUserIsTeam.HAS_TEAM : EUserIsTeam.NO_TEAM
)

const badgeText = computed(() => hasTeamBadgeLabelMap[teamFlag.value])

const tooltipText = computed(() => hasTeamLabelMap[teamFlag.value])
</script>

<style scoped>
.player-team-tag-wrap {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
}

.player-team-tag-wrap--stretch {
  display: flex;
  width: 100%;
}

/* Без el-type: кастомні стани, щоб виглядало цільно з role-tag / карткою */
.player-team-tag {
  @apply !m-0 !box-border !h-28 !min-h-28 !max-h-28 shrink-0;
  @apply !inline-flex !w-max !max-w-full !min-w-0 !items-center !justify-center !rounded-lg !border !px-10 !py-0
    !text-[12px] !font-semibold !leading-tight !shadow-none;
  letter-spacing: 0.04em;
}

/* Після базових правил: у grid-колонці тягнеться на всю доступну ширину */
.player-team-tag--stretch {
  width: 100% !important;
  max-width: none !important;
  @apply !inline-flex !min-w-0 !justify-center;
}

.player-team-tag--stretch :deep(.el-tag__content) {
  @apply inline-flex max-w-full w-full min-h-0 !p-0 justify-center;
}

.player-team-tag :deep(.el-tag__content) {
  @apply inline-flex max-w-full min-h-0 !p-0 !leading-none;
}

.player-team-tag__inner {
  @apply inline-flex max-w-full min-h-0 items-center justify-center gap-6 leading-tight;
}

.player-team-tag--stretch .player-team-tag__inner {
  @apply w-full;
}

.player-team-tag__status {
  @apply h-6 w-6 shrink-0 rounded-full;
}

.player-team-tag__text {
  @apply whitespace-nowrap;
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
