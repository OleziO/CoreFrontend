<template>
  <el-dialog
    v-model="modelValue"
    class="add-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :show-close="false"
    @close="close"
  >
    <!-- Header -->
    <template #header>
      <div class="add-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Склад · {{ slotTitle }}</span>
          <h2 class="add-dialog__title">{{ isCoach ? 'Додати тренера' : 'Додати гравців до команди' }}</h2>
        </div>
        <div class="flex shrink-0 items-center gap-10">
          <span
            class="add-dialog__counter"
            :class="{ 'is-on': selectedIds.length > 0, 'is-full': isFull }"
            :aria-label="`Обрано ${selectedIds.length} з ${maxSelectable}`"
          >
            {{ pad(selectedIds.length) }}<span class="add-dialog__counter-of">/{{ pad(maxSelectable) }}</span>
          </span>
          <button type="button" class="add-dialog__close" aria-label="Закрити" @click="close">
            <PhX :size="16" weight="bold" />
          </button>
        </div>
      </div>
    </template>

    <div v-loading="playerStore.loading || submitLoading" class="flex flex-col gap-12">
      <!-- Rules line -->
      <p v-if="maxSelectable > 0" class="add-dialog__rule">
        <PhSealCheck :size="14" weight="fill" class="text-primary" />
        <span>
          Вільних місць: <b>{{ maxSelectable }}</b> {{ slotLabel }}. Лише <b>верифіковані</b> гравці без іншої команди.
        </span>
      </p>
      <p v-else class="add-dialog__rule is-warn">
        <PhWarning :size="14" weight="fill" />
        <span>У цьому слоті немає вільних місць.</span>
      </p>

      <el-input
        v-model="search"
        placeholder="Пошук за ніком або Discord"
        clearable
        size="large"
        :disabled="maxSelectable === 0"
      >
        <template #prefix>
          <PhMagnifyingGlass :size="16" />
        </template>
      </el-input>

      <!-- List -->
      <div class="add-list" role="listbox" :aria-multiselectable="!isCoach">
        <RecycleScroller
          v-if="eligiblePlayers.length"
          :items="eligiblePlayers"
          key-field="id"
          :buffer="600"
          :item-size="ROW_SIZE"
          class="add-list__scroller"
        >
          <template #default="{ item: row }">
            <div class="add-list__cell" :style="{ height: `${ROW_SIZE}px` }">
              <button
                type="button"
                role="option"
                class="add-row"
                :class="{ 'is-selected': isRowSelected(row.id) }"
                :aria-selected="isRowSelected(row.id)"
                :disabled="maxSelectable === 0"
                @click="togglePlayer(row.id)"
              >
                <span class="add-row__check" aria-hidden="true">
                  <PhCheck :size="12" weight="bold" />
                </span>
                <el-avatar :src="getAvatarUrl(row.avatarUrl)" :size="40" class="add-row__avatar">
                  <template #default><PhUser :size="16" weight="bold" class="text-white/70" /></template>
                </el-avatar>
                <span class="flex min-w-0 flex-col gap-2 text-left">
                  <span class="add-row__name truncate">{{ row.discordName || '—' }}</span>
                  <span class="add-row__handle truncate">
                    {{ row.discordUsername ? `@${row.discordUsername}` : '—' }}
                  </span>
                </span>
                <span class="add-row__rank">
                  <img
                    v-if="rankOf(row)"
                    :src="rankOf(row)"
                    alt=""
                    class="h-28 w-auto object-contain"
                    draggable="false"
                  >
                  <span class="add-row__mmr">{{ row.rating ?? '—' }}</span>
                </span>
              </button>
            </div>
          </template>
        </RecycleScroller>

        <div v-else class="add-list__empty">
          <PhUsersThree :size="22" weight="duotone" class="text-white/40" />
          <span>{{ maxSelectable > 0 ? 'Гравців не знайдено' : 'Звільніть місце у складі, щоб додати гравця' }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="add-dialog__foot">
        <el-button @click="close">Скасувати</el-button>
        <el-button
          type="primary"
          class="flex-1"
          :disabled="!selectedIds.length || submitLoading || maxSelectable === 0"
          :loading="submitLoading"
          @click="submitAdd"
        >
          <PhPlus :size="16" weight="bold" />
          <span>
            {{ isCoach ? 'Призначити тренера' : 'Додати обраних' }}
            <template v-if="selectedIds.length && !isCoach">({{ selectedIds.length }})</template>
          </span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getPlayerRankImageSrcFromPlayerRank, isPlayerVerified, searchPlayer } from '@/core/helpers'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import {
  PhCheck, PhMagnifyingGlass, PhPlus, PhSealCheck, PhUser, PhUsersThree, PhWarning, PhX
} from '@phosphor-icons/vue'

const props = defineProps<{
  team: TTeam | undefined
  isMain: boolean
  isCoach?: boolean
  onAdded?: () => void | Promise<void>
}>()

const modelValue = defineModel<boolean>({ default: false })

const ROW_SIZE = 64

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 480))

const pad = (n: number) => String(Math.min(Math.max(n, 0), 99)).padStart(2, '0')

const selectedIds = ref<string[]>([])
const search = ref('')
const submitLoading = ref(false)
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const playerStore = usePlayersStore()
const teamsStore = useTeamsStore()

const slotTitle = computed(() => {
  if (props.isCoach) return 'Тренер'
  return props.isMain ? 'Основа' : 'Запас'
})

const slotLabel = computed(() => {
  if (props.isCoach) return 'для тренера'
  return props.isMain ? 'в основі' : 'у запасі'
})

/** Скільки ще можна додати в цей слот (ліміт бекенду / UI). Тренер — один. */
const maxSelectable = computed(() => {
  const t = props.team
  if (!t) return 0
  if (props.isCoach) return t.coach ? 0 : 1
  if (props.isMain) {
    return Math.max(0, 5 - (t.mainPlayers?.length ?? 0))
  }
  return Math.max(0, 3 - (t.reservedPlayers?.length ?? 0))
})

const isFull = computed(() => maxSelectable.value > 0 && selectedIds.value.length >= maxSelectable.value)

const rosterPlayerIds = computed(() => {
  const t = props.team
  const ids = new Set<string>()
  if (!t) return ids
  if (t.captain?.id) ids.add(t.captain.id)
  if (t.coach?.id) ids.add(t.coach.id)
  for (const p of t.mainPlayers ?? []) ids.add(p.id)
  for (const p of t.reservedPlayers ?? []) ids.add(p.id)
  return ids
})

/** Гравці, яких ще нема в цьому рості, без іншої команди (або вже в цій — тільки якщо не в списку). */
const eligiblePlayers = computed(() => {
  if (!playerStore.players?.length || !props.team?.id || maxSelectable.value === 0) return []
  const teamId = props.team.id
  return playerStore.players.filter((player) => {
    if (!isPlayerVerified(player)) return false
    if (rosterPlayerIds.value.has(player.id)) return false
    const otherTeam = player.teamId && String(player.teamId) !== String(teamId)
    if (otherTeam) return false
    return searchPlayer(player, search.value.trim())
  })
})

type TEligiblePlayer = (typeof eligiblePlayers.value)[number]

const rankOf = (p: TEligiblePlayer) => getPlayerRankImageSrcFromPlayerRank(p.rank)

const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

function isRowSelected (id: string) {
  return selectedIds.value.includes(id)
}

function togglePlayer (id: string) {
  if (maxSelectable.value === 0) return

  // Тренер — один: повторний клік знімає, інший гравець замінює вибір.
  if (props.isCoach) {
    selectedIds.value = isRowSelected(id) ? [] : [id]
    return
  }

  const i = selectedIds.value.indexOf(id)
  if (i >= 0) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
    return
  }

  if (selectedIds.value.length >= maxSelectable.value) {
    ElMessage.warning(`Можна обрати щонайбільше ${maxSelectable.value} гравців для цього слоту.`)
    return
  }

  selectedIds.value = [...selectedIds.value, id]
}

function close () {
  modelValue.value = false
  selectedIds.value = []
  search.value = ''
}

watch(maxSelectable, (cap) => {
  if (selectedIds.value.length > cap) {
    selectedIds.value = selectedIds.value.slice(0, cap)
  }
})

async function submitAdd () {
  const tid = props.team?.id
  const ids = [...selectedIds.value]
  if (!tid || !ids.length) {
    ElMessage.warning('Оберіть гравців')
    return
  }
  if (ids.length > maxSelectable.value) {
    ElMessage.warning('Занадто багато обраних для вільних слотів')
    return
  }

  submitLoading.value = true
  try {
    if (props.isCoach) {
      const coachId = ids[0]
      try {
        // Стор патчить команду та teamId тренера в players / /me сам.
        await teamsStore.updateTeam(tid, { coachId })
      } catch (e: unknown) {
        ElMessage.error(getApiErrorMessage(e, 'Не вдалося призначити тренера'))
        return
      }
      await props.onAdded?.()
      ElMessage.success('Тренера призначено')
      close()
      return
    }

    const slot = props.isMain ? 'main' : 'reserved'
    let added = 0
    for (const pid of ids) {
      try {
        await teamsStore.addPlayerToTeam(tid, { playerId: pid, slot })
        added++
      } catch (e: unknown) {
        ElMessage.error(getApiErrorMessage(e, 'Не вдалося додати гравця'))
        break
      }
    }

    if (added > 0) {
      await props.onAdded?.()
    }

    if (added === ids.length) {
      ElMessage.success(added === 1 ? 'Гравця додано до команди' : `Додано гравців: ${added}`)
      close()
    } else if (added > 0) {
      ElMessage.warning(`Додано гравців: ${added} з ${ids.length}`)
      close()
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  playerStore.getPlayers()
})
</script>

<style scoped lang="scss">
.add-dialog__rule {
  @apply m-0 flex items-start gap-8 rounded-lg border px-12 py-8 text-[13px] leading-relaxed;
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.4);

  b {
    color: #fff;
    font-weight: 600;
  }

  svg {
    @apply mt-2 shrink-0;
  }

  &.is-warn {
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.35);
    background: rgba(245, 158, 11, 0.08);
  }
}

// ─── List ───────────────────────────────────────────────────────────────────
.add-list {
  @apply overflow-hidden rounded-xl border;
  // Only the list scrolls: keep it inside the dialog's 70vh cap on short screens.
  height: clamp(160px, calc(70vh - 300px), 320px);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);
}

.add-list__scroller {
  @apply h-full overflow-auto p-8;
}

.add-list__cell {
  @apply flex items-center;
}

.add-list__empty {
  @apply flex h-full flex-col items-center justify-center gap-8 px-16 text-center text-sm;
  color: var(--ds-text-faint);
}

.add-row {
  @apply relative grid w-full items-center gap-12 overflow-hidden rounded-lg border py-6 pl-12 pr-10;
  grid-template-columns: 18px 40px minmax(0, 1fr) auto;
  height: 56px;
  color: inherit;
  border-color: transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-selected {
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    background: rgba(var(--ds-primary-rgb), 0.08);

    &::before {
      opacity: 1;
    }
  }
}

.add-row__check {
  @apply inline-flex size-18 items-center justify-center rounded-[5px] border;
  color: transparent;
  border-color: rgba(255, 255, 255, 0.25);
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease;
}

.is-selected .add-row__check {
  color: var(--ds-background);
  border-color: var(--ds-primary);
  background: var(--ds-primary);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.55);
}

// The avatar reset hard-codes 56px; pin the row size explicitly.
.add-row__avatar {
  @apply shrink-0;
  width: 40px !important;
  height: 40px !important;
  box-shadow: 0 0 0 1px rgba(var(--ds-primary-rgb), 0.25);
}

.add-row__name {
  @apply font-display text-[13px] uppercase leading-tight tracking-wide text-white;
}

.add-row__handle {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}

.add-row__rank {
  @apply flex shrink-0 flex-col items-center gap-1;
  min-width: 44px;
}

.add-row__mmr {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--ds-primary);
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) and (pointer: fine) {
  .add-row:not(.is-selected):not(:disabled):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.3);
    background: rgba(255, 255, 255, 0.03);

    .add-row__check {
      border-color: rgba(var(--ds-primary-rgb), 0.6);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .add-row,
  .add-row__check {
    transition: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.add-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  // No second scrollbar: the body fits, the player list scrolls on its own.
  .el-dialog__body {
    overflow: visible !important;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .add-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.add-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.add-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

// Two-digit «обрано / ліміт» readout.
.add-dialog__counter {
  @apply inline-flex h-28 items-center justify-center rounded-md border px-8;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(0, 0, 0, 0.3);
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: var(--ds-glow-primary-soft);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &.is-full {
    color: var(--ds-gold);
    border-color: rgba(var(--ds-gold-rgb), 0.5);
    box-shadow: var(--ds-glow-gold);
    text-shadow: none;
  }
}

.add-dialog__counter-of {
  color: rgba(255, 255, 255, 0.35);
  text-shadow: none;
}

.add-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.add-dialog__foot {
  @apply flex items-center gap-10;

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

@media (hover: hover) and (pointer: fine) {
  .add-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
