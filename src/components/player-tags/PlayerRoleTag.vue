<template>
  <div :class="rowClass">
    <template v-for="(role, roleIndex) in visibleRoles" :key="role.id">
      <div :class="visibleRoleCellClass(roleIndex)">
        <el-tooltip
          placement="top"
          effect="dark"
          :show-arrow="false"
          :disabled="!roleTooltipContent(role)"
          :content="roleTooltipContent(role)"
        >
          <div :class="tooltipTriggerStretchClass('primary')">
            <el-tag
              effect="plain"
              disable-transitions
              class="role-tag-pill"
              :class="{ 'role-tag-pill--fill': rolePillStretchFill(roleIndex) }"
              :style="getRoleTagCssVars(role)"
            >
              {{ displayLabel(role) }}
            </el-tag>
          </div>
        </el-tooltip>
      </div>
    </template>

    <div v-if="overflowRoles.length" :class="moreChipCellClass">
      <el-tooltip
        placement="top"
        effect="dark"
        :show-arrow="false"
        popper-class="role-tag-tooltip-popper"
      >
        <div :class="tooltipTriggerStretchClass('more')">
          <el-tag
            effect="plain"
            disable-transitions
            class="role-tag-pill role-tag-pill--more"
          >
            +{{ overflowRoles.length }}
          </el-tag>
        </div>

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
              {{ displayLabel(role) }}
            </el-tag>
          </div>
        </template>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TPlayer, TUserRole, TCurrentPlayerRole } from '@/api/types/api.types'
import { getRoleTagCssVars } from '@/utils/role-tag-styles'
import { resolveRoleDisplayLabel } from '@/components/player-tags/player.constants'

export type TAnyRoleForTag = TUserRole | TCurrentPlayerRole

const props = withDefaults(
  defineProps<{
    user?: TPlayer
    roles?: TAnyRoleForTag[]
    max?: number
    /** Один рядок; якщо багато видимих тегів — горизонтальний скрол (ProfileRoles тощо). */
    noWrap?: boolean
    /** Колонка 50% у grid: займає всю ширину клітинки, теги по центру. */
    stretchInGrid?: boolean
  }>(),
  { max: 1, noWrap: false, stretchInGrid: false }
)

const cap = computed(() => Math.max(1, props.max ?? 1))

const rowClass = computed(() => {
  const flow = props.noWrap
    ? 'flex flex-nowrap items-center gap-6 min-w-0 overflow-x-auto'
    : 'flex flex-nowrap items-center gap-6 min-w-0'
  if (!props.stretchInGrid) return flow
  return `${flow} w-full items-stretch justify-start`
})

/** У grid-колонці основний тег тягнеться, +N лише під контент */
function visibleRoleCellClass (index: number): string {
  if (!props.stretchInGrid) return 'contents'
  if (!overflowRoles.value.length) {
    return 'flex min-w-0 flex-1'
  }
  return index === 0 ? 'flex min-w-0 flex-1' : 'contents'
}

const moreChipCellClass = computed(() =>
  props.stretchInGrid ? 'flex shrink-0 basis-auto justify-center self-stretch' : 'contents'
)

function tooltipTriggerStretchClass (kind: 'primary' | 'more'): string {
  if (!props.stretchInGrid) {
    return 'inline-flex max-w-full'
  }
  if (kind === 'more') {
    return 'inline-flex shrink-0 max-w-full'
  }
  return 'block w-full min-w-0'
}

function rolePillStretchFill (index: number): boolean {
  if (!props.stretchInGrid) return false
  if (!overflowRoles.value.length) {
    return true
  }
  return index === 0
}

const allRoles = computed((): TAnyRoleForTag[] => {
  if (props.roles?.length) return props.roles
  if (props.user?.roles?.length) return props.user.roles as TAnyRoleForTag[]
  return []
})

const sortedRoles = computed(() => {
  const list = [...allRoles.value]
  list.sort((a, b) => {
    const la = resolveRoleDisplayLabel(a).length
    const lb = resolveRoleDisplayLabel(b).length
    if (la !== lb) return la - lb
    return resolveRoleDisplayLabel(a).localeCompare(resolveRoleDisplayLabel(b), 'uk')
  })
  return list
})

function displayLabel (role: TAnyRoleForTag): string {
  return resolveRoleDisplayLabel(role)
}

function roleTooltipContent (role: TAnyRoleForTag): string {
  const shown = resolveRoleDisplayLabel(role)
  if (!role.name || shown === role.name) return ''
  return role.name
}

const visibleRoles = computed(() => {
  const list = sortedRoles.value
  if (!list.length) return []
  return list.slice(0, Math.min(cap.value, list.length))
})

const overflowRoles = computed(() => {
  const list = sortedRoles.value
  if (list.length <= cap.value) return []
  return list.slice(cap.value)
})
</script>

<style scoped>
.role-tag-pill {
  @apply m-0 shrink-0 w-max max-w-full min-w-0 !box-border !inline-flex !h-28 !min-h-28 !max-h-28;
  @apply !items-center !justify-center !rounded-lg !border !px-10 !py-0;
  @apply !text-[12px] !font-semibold !leading-tight !shadow-none;

  --rt-bo: 0.38;
  --rt-bg: 0.12;

  border-color: rgb(var(--rt-r) var(--rt-g) var(--rt-b) / var(--rt-bo)) !important;
  background-color: rgb(var(--rt-r) var(--rt-g) var(--rt-b) / var(--rt-bg)) !important;
  color: color-mix(
    in srgb,
    #f8fafc 90%,
    rgb(var(--rt-r) var(--rt-g) var(--rt-b)) 10%
  ) !important;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.role-tag-pill--fill {
  width: 100% !important;
  max-width: none !important;
  @apply min-w-0 !shrink justify-center;
}

.role-tag-pill :deep(.el-tag__content) {
  @apply inline-flex min-h-0 max-w-full min-w-0 items-center justify-center !p-0 !leading-tight;
}

.role-tag-pill--fill :deep(.el-tag__content) {
  @apply w-full justify-center;
}

.role-tag-pill:hover {
  --rt-bo: 0.52;
  --rt-bg: 0.2;
  box-shadow: 0 0 20px rgb(var(--rt-r) var(--rt-g) var(--rt-b) / 0.22) !important;
}

.role-tag-pill--more {
  width: fit-content !important;
  max-width: none !important;
  @apply shrink-0 !px-8 !tabular-nums;
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
  gap: 0.5rem;
  max-width: min(100vw, 280px);
  padding: 0.6rem;
  border-radius: 0.75rem;
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
