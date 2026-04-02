<template>
  <!-- Основні теги -->
  <el-tag
    v-for="role in mappedRoles.value.slice(0, max)"
    :key="role.id"
    disable-transitions
    class="px-10 py-4 w-full rounded-lg text-[12px] font-medium tracking-wide"
    :class="roleClassMap[role.type_name as ERole]"
  >
    {{ roleLabelMap[role.type_name as ERole] }}
  </el-tag>

  <!-- Додатковий тег, якщо ролей більше, ніж max -->
  <el-tooltip
    v-if="mappedRoles.value.length > max"
    placement="top"
    effect="dark"
    :show-arrow="false"
    popper-class="!bg-transparent !p-0 !border-none !rounded-lg !shadow-none !min-w-0"
  >
    <el-tag
      class="px-10 py-4 rounded-lg text-[12px] font-medium tracking-wide cursor-pointer"
      :class="roleClassMap[mappedRoles.value[max]?.type_name as ERole] ?? roleClassMap[ERole.DEFAULT]"
      disable-transitions
    >
      +{{ mappedRoles.value.length - max }}
    </el-tag>

    <template #content>
      <div
        class="py-15 px-10 flex flex-wrap gap-10 rounded-lg border border-white/20
      bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950"
      >
        <el-tag
          v-for="role in mappedRoles.value.slice(max)"
          :key="role.id"
          class="h-full text-xs rounded-lg px-12 py-5 font-semibold transition-all duration-300 tracking-wide border"
          :class="roleClassMap[role.type_name as ERole] ?? roleClassMap[ERole.DEFAULT]"
        >
          {{ roleLabelMap[role.type_name as ERole] ?? roleLabelMap[ERole.DEFAULT] }}
        </el-tag>
      </div>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useSorted } from '@vueuse/core'
import { roleClassMap, roleLabelMap, ROLES_ORDER } from './player.constants'
import { ERole } from '@/types/general.types'

const props = withDefaults(
  defineProps<{ user: TPlayer | TPlayer; max?: number }>(),
  { max: 1 }
)

const mappedRoles = computed(() => {
  const roles = props.user?.roles?.filter(role => role?.type_name) || []

  if (props.user?.is_cap) {
    roles.push({
      type_name: 'cap',
      is_active: false,
      is_visible: false,
      id: 0
    })
  }

  return useSorted(roles, (a, b) => {
    return ROLES_ORDER.indexOf(a.type_name as ERole) - ROLES_ORDER.indexOf(b.type_name as ERole)
  })
})

// Додатково обмежимо max, щоб не було виходу за межі
const max = computed(() => Math.min(props.max || 1, mappedRoles.value.value.length))
</script>
