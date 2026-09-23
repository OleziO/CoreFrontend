<template>
  <el-tooltip :content="team.name" placement="top" :show-after="180" effect="dark">
    <div
      class="qual-matrix-thumb shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
      :class="boxClass"
    >
      <img
        v-if="resolvedLogo"
        :src="resolvedLogo"
        alt=""
        class="h-full w-full object-cover object-center select-none pointer-events-none"
        loading="lazy"
        decoding="async"
      >
      <PhUsersThree v-else :size="iconSize" weight="duotone" class="qual-matrix-thumb__fallback" />
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { PhUsersThree } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'

const props = withDefaults(
  defineProps<{
    team: TTeam
    boxClass?: string
    iconSize?: number
  }>(),
  {
    boxClass: '',
    iconSize: 28
  }
)

const resolvedLogo = computed(() => resolvePublicOrApiUrl(props.team.logoUrl))
</script>

<style scoped>
/*
 * Рамка й сяйво читаються з кастомних властивостей, щоб матриця могла
 * підсвітити мініатюру на перетині «прицілу», не заглядаючи в цей компонент.
 */
.qual-matrix-thumb {
  width: 3rem;
  height: 3rem;
  border: 1px solid var(--qual-thumb-border, rgba(255, 255, 255, 0.14));
  background: var(--ds-overlay);
  box-shadow: var(--qual-thumb-glow, inset 0 1px 0 rgba(255, 255, 255, 0.04));
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.qual-matrix-thumb__fallback {
  color: rgba(var(--ds-primary-rgb), 0.35);
}

@media (min-width: 640px) {
  .qual-matrix-thumb {
    width: 3.5rem;
    height: 3.5rem;
  }
}

@media (min-width: 768px) {
  .qual-matrix-thumb {
    width: 4rem;
    height: 4rem;
  }
}
</style>
