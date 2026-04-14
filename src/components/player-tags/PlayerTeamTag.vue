<template>
  <el-tag
    class="px-10 py-4 w-full rounded-lg text-[12px] font-medium tracking-wide"
    :type="hasTeam ? 'success' : 'info'"
    disable-transitions
  >
    {{ hasTeam ? 'В команді' : 'Без команди' }}
  </el-tag>
</template>

<script setup lang="ts">
import type { TPlayer as Player } from '@/api/types/api.types'

const props = defineProps<{ user: Player }>()

const hasTeam = computed(() => {
  return !!(props.user as any)?.teamId || false
})
</script>
