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
import type { TUserRole, TCurrentPlayerRole } from '@/api/types/api.types'
import { getRoleTagCssVars } from '@/core/utils/role-tag-styles'
import { resolveRoleDisplayLabel } from '@/components/player-tags/player.enums'

export type TAnyRoleForTag = TUserRole | TCurrentPlayerRole

const props = withDefaults(
  defineProps<{
    user?: TPlayer
    roles?: TAnyRoleForTag[]
    max?: number
    noWrap?: boolean
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
  return `${flow} w-full justify-start`
})

// У картці (stretchInGrid) роль займає всю ширину своєї половини, «+N» стоїть
// поруч і не стискається.
function visibleRoleCellClass (index: number): string {
  if (!props.stretchInGrid) return 'contents'
  if (!overflowRoles.value.length) return 'flex min-w-0 flex-1'
  return index === 0 ? 'flex min-w-0 flex-1' : 'contents'
}

const moreChipCellClass = computed(() =>
  props.stretchInGrid ? 'flex shrink-0' : 'contents'
)

function tooltipTriggerStretchClass (kind: 'primary' | 'more'): string {
  if (!props.stretchInGrid) {
    return 'inline-flex max-w-full'
  }
  if (kind === 'more') {
    return 'inline-flex shrink-0'
  }
  return 'flex w-full min-w-0'
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
/* Мова тегів — element-reset/_tag.scss. Тут лише колір ролі (RGB-змінні з
   getRoleTagCssVars) і поведінка в сітці. Тег — ярлик, він обіймає текст і
   ніколи не розтягується на ширину клітинки, інакше читається як кнопка.
   Селектори складені з .el-tag: глобальний reset пише білий тон на
   `.el-tag.el-tag--plain`, і при рівній специфічності він перекривав колір
   ролі (App.vue підключається раніше за main.scss). */
.el-tag.role-tag-pill {
  @apply m-0 shrink-0 max-w-full min-w-0;
  --rt: rgb(var(--rt-r) var(--rt-g) var(--rt-b));
  --el-tag-bg-color: rgb(var(--rt-r) var(--rt-g) var(--rt-b) / 0.2);
  --el-tag-border-color: rgb(var(--rt-r) var(--rt-g) var(--rt-b) / 0.4);
  --el-tag-text-color: color-mix(in srgb, #f8fafc 70%, var(--rt) 30%);
}

/* Колір ролі задає адмін і він буває будь-яким (темно-бордовий, navy…). Щоб
   тег читався незалежно від відтінку, нормалізуємо його в OKLCH: беремо лише
   hue, а світлоту й насиченість фіксуємо — фон і рамка помітні, текст світлий. */
@supports (color: oklch(from red l c h)) {
  .el-tag.role-tag-pill {
    --el-tag-bg-color: oklch(from var(--rt) 0.62 min(c, 0.16) h / 0.3);
    --el-tag-border-color: oklch(from var(--rt) 0.7 min(c, 0.16) h / 0.55);
    --el-tag-text-color: oklch(from var(--rt) 0.88 min(c, 0.12) h);
  }
}

/* У картці: пілюля на всю половину, довга назва — з трикрапкою */
.role-tag-pill--fill {
  @apply w-full;
}

.role-tag-pill--fill :deep(.el-tag__content) {
  @apply block min-w-0 flex-1 truncate text-center;
}

/* «+N» відкриває тултіп — єдиний інтерактивний тег, тож має курсор і hover */
.el-tag.role-tag-pill--more {
  @apply shrink-0 tabular-nums;
  --el-tag-bg-color: rgba(255, 255, 255, 0.08);
  --el-tag-border-color: rgba(255, 255, 255, 0.16);
  --el-tag-text-color: var(--ds-text-muted);
  cursor: pointer;
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

@media (hover: hover) and (pointer: fine) {
  .el-tag.role-tag-pill--more:hover {
    --el-tag-bg-color: rgba(255, 255, 255, 0.14);
    --el-tag-text-color: var(--ds-text-strong);
  }
}
</style>

<style>
/* Popper-обгортка прозора — поверхню малює .role-tag-tooltip__inner */
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
  gap: 6px;
  max-width: min(100vw, 280px);
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--ds-border);
  background: var(--ds-overlay);
  box-shadow: var(--ds-elevation-3);
}
</style>
