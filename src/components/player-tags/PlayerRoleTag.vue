<template>
  <!-- Основні теги -->
  <el-tag
    v-for="role in mappedRoles.slice(0, max)"
    :key="role.id"
    disable-transitions
    class="px-10 py-4 w-full rounded-lg text-[12px] font-medium tracking-wide"
  >
    {{ role.name }}
  </el-tag>

  <!-- Додатковий тег, якщо ролей більше, ніж max -->
  <el-tooltip
    v-if="mappedRoles.length > max"
    placement="top"
    effect="dark"
    :show-arrow="false"
    popper-class="!bg-transparent !p-0 !border-none !rounded-lg !shadow-none !min-w-0"
  >
    <el-tag
      class="px-10 py-4 rounded-lg text-[12px] font-medium tracking-wide cursor-pointer"
      disable-transitions
    >
      +{{ mappedRoles.length - max }}
    </el-tag>

    <template #content>
      <div
        class="py-15 px-10 flex flex-wrap gap-10 rounded-lg border border-white/20
      bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950"
      >
        <el-tag
          v-for="role in mappedRoles.slice(max)"
          :key="role.id"
          class="h-full text-xs rounded-lg px-12 py-5 font-semibold transition-all duration-300 tracking-wide border"
        >
          {{ role.name }}
        </el-tag>
      </div>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import type { TPlayer as Player } from '@/api/types/api.types'

const props = withDefaults(
  defineProps<{ user: Player; max?: number }>(),
  { max: 1 }
)

const mappedRoles = computed(() => {
  return props.user?.roles || []
})

const max = computed(() => Math.min(props.max || 1, mappedRoles.value.length))
</script>
