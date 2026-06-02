<template>
  <el-tooltip :content="team.name" placement="top" :show-after="180" effect="dark">
    <div
      class="qual-matrix-thumb shrink-0 rounded-lg border border-white/15 bg-[#1a2235] overflow-hidden
        flex items-center justify-center shadow-inner"
      :class="boxClass"
    >
      <img
        v-if="resolvedLogo"
        :src="resolvedLogo"
        alt=""
        class="h-full w-full object-contain p-1.5 sm:p-2 select-none pointer-events-none"
        loading="lazy"
        decoding="async"
      >
      <PhUsersThree v-else :size="iconSize" weight="duotone" class="text-white/35" />
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
.qual-matrix-thumb {
  width: 3rem;
  height: 3rem;
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
