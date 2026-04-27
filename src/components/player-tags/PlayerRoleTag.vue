<template>
  <div class="flex flex-wrap items-center gap-6">
    <el-tag
      v-for="role in visibleRoles"
      :key="role.id"
      disable-transitions
      effect="plain"
      class="role-tag-pill"
      :style="getRoleTagCssVars(role)"
    >
      {{ role.name }}
    </el-tag>

    <el-tooltip
      v-if="overflowRoles.length"
      placement="top"
      effect="dark"
      :show-arrow="false"
      popper-class="role-tag-tooltip-popper"
    >
      <el-tag
        effect="plain"
        disable-transitions
        class="role-tag-pill role-tag-pill--more"
      >
        +{{ overflowRoles.length }}
      </el-tag>

      <template #content>
        <div class="role-tag-tooltip__inner">
          <el-tag
            v-for="role in overflowRoles"
            :key="role.id"
            effect="plain"
            disable-transitions
            class="role-tag-pill"
            :style="getRoleTagCssVars(role)"
          >
            {{ role.name }}
          </el-tag>
        </div>
      </template>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import type { TPlayer, TUserRole, TCurrentPlayerRole } from '@/api/types/api.types'
import { getRoleTagCssVars } from '@/utils/role-tag-styles'

export type TAnyRoleForTag = TUserRole | TCurrentPlayerRole

const props = withDefaults(
  defineProps<{
    user?: TPlayer
    /** Якщо задано (наприклад, з /auth/me), ігнорується `user` для списку ролей. */
    roles?: TAnyRoleForTag[]
    max?: number
  }>(),
  { max: 1 }
)

const allRoles = computed((): TAnyRoleForTag[] => {
  if (props.roles && props.roles.length) return props.roles
  if (props.user?.roles?.length) return props.user.roles as TAnyRoleForTag[]
  return []
})

const cap = computed(() => Math.max(1, props.max ?? 1))

const visibleRoles = computed(() => {
  const list = allRoles.value
  if (!list.length) return []
  return list.slice(0, Math.min(cap.value, list.length))
})

const overflowRoles = computed(() => {
  const list = allRoles.value
  if (list.length <= cap.value) return []
  return list.slice(cap.value)
})
</script>

<style scoped>
.role-tag-pill {
  @apply m-0 shrink-0;

  /* База кольору — з JS. Фон/рамка/текст/ховер уніфіковані */
  --rt-bo: 0.38;
  --rt-bg: 0.12;

  border: 1px solid rgb(var(--rt-r) var(--rt-g) var(--rt-b) / var(--rt-bo)) !important;
  background-color: rgb(var(--rt-r) var(--rt-g) var(--rt-b) / var(--rt-bg)) !important;
  color: color-mix(
    in srgb,
    #f8fafc 90%,
    rgb(var(--rt-r) var(--rt-g) var(--rt-b)) 10%
  ) !important;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.25;
  border-radius: 0.5rem;
  padding: 0.35rem 0.65rem;
  box-shadow: none !important;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.role-tag-pill:hover {
  --rt-bo: 0.52;
  --rt-bg: 0.2;
  box-shadow: 0 0 20px rgb(var(--rt-r) var(--rt-g) var(--rt-b) / 0.22) !important;
}

/* +N: нейтральний фіолет, без color з API */
.role-tag-pill--more {
  --rt-r: 99;
  --rt-g: 102;
  --rt-b: 241;
  --rt-bo: 0.4;
  --rt-bg: 0.1;
  cursor: pointer;
}

.role-tag-pill--more:hover {
  --rt-bo: 0.55;
  --rt-bg: 0.16;
  box-shadow: 0 0 18px rgb(var(--rt-r) var(--rt-g) var(--rt-b) / 0.25) !important;
}
</style>

<style>
/* Попер/панель тултіпа — «скляна»; без @apply, щоб не ламався з Tailwind-утиллями. */
.role-tag-tooltip-popper {
  min-width: 0 !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.role-tag-tooltip__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* 8px */
  max-width: min(100vw, 280px);
  padding: 0.6rem; /* ≈p-2.5 */
  border-radius: 0.75rem; /* ≈ rounded-xl */
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgb(17 24 39 / 0.96),
    rgb(31 41 55 / 0.92) 50%,
    rgb(3 7 18 / 0.96)
  );
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(12px);
}
</style>
