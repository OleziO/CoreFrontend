<template>
  <div class="flex flex-wrap items-center gap-8">
    <el-tag
      v-for="role in mappedRoles.slice(0, max)"
      :key="role.id"
      disable-transitions
      effect="plain"
      class="
        shrink-0 rounded-xl p-10 text-[12px] font-semibold tracking-wide
        !border !shadow-none transition-all duration-300
        backdrop-blur-sm
      "
      :class="rolePillClass(role)"
    >
      {{ role.name }}
    </el-tag>

    <el-tooltip
      v-if="mappedRoles.length > max"
      placement="top"
      effect="dark"
      :show-arrow="false"
      popper-class="!bg-transparent !p-0 !border-none !rounded-2xl !shadow-none !min-w-0"
    >
      <el-tag
        effect="plain"
        disable-transitions
        class="
          shrink-0 cursor-pointer rounded-xl p-10 text-[12px] font-semibold tracking-wide
          !border !shadow-none transition-all duration-300 backdrop-blur-sm
          !border-violet-500/30 !bg-violet-500/10 !text-violet-100
          hover:!border-violet-400/50 hover:!bg-violet-500/15
          hover:shadow-[0_0_12px_rgba(139,92,246,0.18)]
        "
      >
        +{{ mappedRoles.length - max }}
      </el-tag>

      <template #content>
        <div
          class="
            flex max-w-[280px] flex-wrap gap-8 rounded-2xl border border-white/10
            bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 p-12
            shadow-[0_12px_40px_rgba(0,0,0,0.55)]
            backdrop-blur-md
          "
        >
          <el-tag
            v-for="role in mappedRoles.slice(max)"
            :key="role.id"
            effect="plain"
            disable-transitions
            class="
              rounded-xl px-10 py-4 text-[12px] font-semibold tracking-wide
              !border !shadow-none transition-all duration-300 backdrop-blur-sm
            "
            :class="rolePillClass(role)"
          >
            {{ role.name }}
          </el-tag>
        </div>
      </template>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import type { TPlayer, TUserRole } from '@/api/types/api.types'

const props = withDefaults(
  defineProps<{ user: TPlayer; max?: number }>(),
  { max: 1 }
)

const mappedRoles = computed(() => {
  return props.user?.roles || []
})

const max = computed(() => Math.min(props.max || 1, mappedRoles.value.length))

function rolePillClass (role: TUserRole) {
  if (role.isAdminRole) {
    return `
      !border-amber-500/30 !bg-amber-500/10 !text-amber-100
      hover:!border-amber-400/45 hover:!bg-amber-500/16
      hover:shadow-[0_0_12px_rgba(245,158,11,0.18)]
    `
  }

  return `
    !border-white/10 !bg-white/[0.04] !text-slate-200
    hover:!border-white/20 hover:!bg-white/[0.07]
    hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]
  `
}
</script>
