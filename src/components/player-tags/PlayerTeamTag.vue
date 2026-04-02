<template>
  <el-tag
    class="px-10 py-4 w-full rounded-lg text-[12px] font-medium tracking-wide"
    :class="roleClass"
    disable-transitions
  >
    {{ roleLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { EUserIsTeam, hasTeamClassMap, hasTeamLabelMap } from './player.constants'

const props = defineProps<{ user: TPlayer | TPlayer}>()

const hasTeam = computed<EUserIsTeam>(() => {
  return Number(!!props.user?.team_id || 0)
})

const roleLabel = computed(() => hasTeamLabelMap[hasTeam.value])
const roleClass = computed(() => hasTeamClassMap[hasTeam.value])
</script>
