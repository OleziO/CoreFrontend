<template>
  <div class="player-team-tag-wrap" :class="{ 'player-team-tag-wrap--stretch': stretchInGrid }">
    <el-tooltip :content="tooltipText" placement="top">
      <div :class="stretchInGrid ? 'flex w-full min-w-0' : 'inline-flex min-w-0 max-w-full'">
        <el-tag
          effect="plain"
          disable-transitions
          class="player-team-tag tag-dot"
          :class="[
            hasTeam ? 'player-team-tag--in' : 'player-team-tag--out',
            stretchInGrid && 'player-team-tag--stretch'
          ]"
        >
          {{ badgeText }}
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
    /** Колонка 50% у grid: тег займає всю ширину своєї половини. */
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

/* Мова тегів — element-reset/_tag.scss; тут лише тон і крапка статусу. */
.player-team-tag {
  @apply m-0 shrink-0 max-w-full min-w-0;
}

.player-team-tag--stretch {
  @apply w-full;
}

.player-team-tag :deep(.el-tag__content) {
  @apply min-w-0 truncate;
}

/*
 * Тони мають перебити глобальне `.el-tag.el-tag--plain.el-tag--primary` з element-reset/_tag.scss
 * (EP за замовчуванням ставить type="primary" → бірюзовий), тому селектори навмисно з трьома класами.
 */

/* В команді — зелений */
.el-tag.player-team-tag.player-team-tag--in {
  --el-tag-bg-color: rgba(34, 197, 94, 0.18);
  --el-tag-border-color: rgba(34, 197, 94, 0.32);
  --el-tag-text-color: #86efac;
  --el-tag-hover-color: rgba(34, 197, 94, 0.32);
  --tag-dot-color: #22c55e;
}

/* Вільний гравець — сірий */
.el-tag.player-team-tag.player-team-tag--out {
  --el-tag-bg-color: rgba(255, 255, 255, 0.08);
  --el-tag-border-color: rgba(255, 255, 255, 0.16);
  --el-tag-text-color: var(--ds-text-muted);
  --el-tag-hover-color: rgba(255, 255, 255, 0.16);
  --tag-dot-color: rgba(255, 255, 255, 0.4);
}
</style>
