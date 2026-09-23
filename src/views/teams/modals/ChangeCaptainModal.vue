<template>
  <el-dialog
    v-model="modelValue"
    class="captain-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :show-close="false"
  >
    <!-- Header -->
    <template #header="{ close }">
      <div class="captain-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Команда</span>
          <h2 class="captain-dialog__title">Передати капітанство</h2>
        </div>
        <button type="button" class="captain-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="captain-dialog__stack">
      <!-- What happens -->
      <p class="captain-notice">
        <span class="captain-notice__well"><PhCrown :size="16" weight="fill" /></span>
        <span>
          Новий капітан отримає керування складом, заявками та профілем команди.
          Ви залишитесь у складі як гравець.
        </span>
      </p>

      <!-- Roster as a radio list -->
      <div class="flex items-center gap-12">
        <span class="sys-label !text-[10px]">// Хто стане капітаном</span>
        <span class="hud-line h-px flex-1 min-w-12" aria-hidden="true" />
        <span class="captain-count">{{ pad(candidates.length) }}</span>
      </div>

      <div v-if="!candidates.length" class="captain-empty">
        У складі немає інших гравців — спершу додайте когось до команди.
      </div>

      <div v-else role="radiogroup" aria-label="Новий капітан" class="captain-list">
        <!-- Current captain, for orientation only -->
        <div v-if="team?.captain" class="captain-row is-current" aria-disabled="true">
          <span class="captain-row__avatar">
            <el-avatar :src="avatarOf(team.captain)" :size="36">
              <template #default><PhUser :size="16" weight="bold" class="text-white/70" /></template>
            </el-avatar>
          </span>
          <span class="flex min-w-0 flex-col gap-2">
            <span class="captain-row__name truncate">
              <PhCrown :size="12" weight="fill" class="text-accent-gold" />
              {{ nameOf(team.captain) }}
            </span>
            <span class="captain-row__handle truncate">{{ handleOf(team.captain) }}</span>
          </span>
          <span class="captain-row__tag">Поточний капітан</span>
        </div>

        <button
          v-for="c in candidates"
          :key="c.player.id"
          type="button"
          role="radio"
          class="captain-row"
          :class="{ 'is-selected': selectedPlayerId === c.player.id }"
          :aria-checked="selectedPlayerId === c.player.id"
          @click="selectedPlayerId = c.player.id"
        >
          <span class="captain-row__avatar">
            <el-avatar :src="avatarOf(c.player)" :size="36">
              <template #default><PhUser :size="16" weight="bold" class="text-white/70" /></template>
            </el-avatar>
          </span>
          <span class="flex min-w-0 flex-col gap-2 text-left">
            <span class="captain-row__name truncate">{{ nameOf(c.player) }}</span>
            <span class="captain-row__handle truncate">{{ handleOf(c.player) }}</span>
          </span>
          <span v-if="c.reserve" class="captain-row__tag is-muted">Запас</span>
          <span class="captain-row__rank">
            <img
              v-if="rankOf(c.player)"
              :src="rankOf(c.player)"
              alt=""
              class="h-28 w-auto object-contain"
              draggable="false"
            >
            <span class="captain-row__mmr">{{ c.player.rating ?? '—' }}</span>
          </span>
          <span class="captain-row__radio" aria-hidden="true" />
        </button>
      </div>
    </div>

    <template #footer>
      <div class="captain-dialog__foot">
        <el-button @click="modelValue = false">Скасувати</el-button>
        <el-button
          type="primary"
          :disabled="!selectedPlayerId || loading"
          :loading="loading"
          @click="transferCaptaincy()"
        >
          <PhCrown :size="16" weight="fill" />
          <span>Передати капітанство</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhCrown, PhUser, PhX } from '@phosphor-icons/vue'
import { getPlayerRankImageSrcFromPlayerRank, resolvePublicOrApiUrl } from '@/core/helpers'

const props = defineProps<{
  team: TTeam | undefined
  teamId: string
  onUpdated?: (team: TTeam) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const teamsStore = useTeamsStore()

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 480))

const selectedPlayerId = ref<string | null>(null)
const loading = ref(false)

watch(modelValue, (open) => {
  if (open) selectedPlayerId.value = null
})

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

type TRosterPlayer = TTeam['mainPlayers'][number]

const nameOf = (p: TRosterPlayer) => p.discordName || p.discordUsername || `Гравець #${p.id}`
const handleOf = (p: TRosterPlayer) => (p.discordUsername ? `@${p.discordUsername}` : '—')
const avatarOf = (p: TRosterPlayer) => resolvePublicOrApiUrl(p.avatarUrl)
const rankOf = (p: TRosterPlayer) => getPlayerRankImageSrcFromPlayerRank(p.rank)

// Everyone but the current captain; main roster first, reserve flagged.
const candidates = computed(() => {
  const captainId = props.team?.captain?.id
  const main = (props.team?.mainPlayers ?? []).map(player => ({ player, reserve: false }))
  const reserve = (props.team?.reservedPlayers ?? []).map(player => ({ player, reserve: true }))
  return [...main, ...reserve].filter(c => c.player.id !== captainId)
})

async function transferCaptaincy () {
  if (!selectedPlayerId.value || !props.teamId) return

  loading.value = true
  try {
    const updated = await teamsStore.transferCaptaincy(props.teamId, selectedPlayerId.value)
    ElMessage.success('Капітанство успішно передано')
    props.onUpdated?.(updated)
    modelValue.value = false
  } catch {
    ElMessage.error('Помилка при передачі капітанства')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.captain-notice {
  @apply m-0 flex items-start gap-12 rounded-xl border p-12 text-sm leading-relaxed;
  color: rgba(255, 255, 255, 0.72);
  border-color: rgba(var(--ds-gold-rgb), 0.3);
  background: linear-gradient(135deg, rgba(var(--ds-gold-rgb), 0.1), transparent 70%), rgba(7, 8, 15, 0.45);
}

.captain-notice__well {
  @apply inline-flex size-32 shrink-0 items-center justify-center rounded-lg;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.12);
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
}

.captain-count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.captain-empty {
  @apply rounded-xl border px-16 py-20 text-center text-sm;
  color: var(--ds-text-faint);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);
}

// ─── Roster rows ────────────────────────────────────────────────────────────
// The dialog caps at 70vh: the list takes whatever is left and scrolls,
// so the footer never falls outside the dialog.
.captain-list {
  @apply flex min-h-[120px] max-h-[340px] flex-1 flex-col gap-8 overflow-y-auto pr-2;
}

.captain-row {
  @apply relative grid w-full items-center gap-12 overflow-hidden rounded-xl border py-8 pl-14 pr-12;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  color: inherit;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
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

  &:active:not(.is-current) {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: 2px;
  }

  &.is-selected {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.07);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.14);

    &::before {
      opacity: 1;
    }
  }

  &.is-current {
    cursor: default;
    border-color: rgba(var(--ds-gold-rgb), 0.25);
    background: rgba(7, 8, 15, 0.3);

    &::before {
      opacity: 1;
      background: var(--ds-gold);
      box-shadow: 0 0 8px rgba(var(--ds-gold-rgb), 0.8);
    }
  }
}

// Candidates carry rank + radio; the current captain only a tag.
.captain-row:not(.is-current) {
  grid-template-columns: 36px minmax(0, 1fr) auto auto 18px;
}

.captain-row__avatar {
  @apply block size-36 shrink-0 overflow-hidden rounded-full;
  box-shadow: 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);

  // The avatar reset hard-codes 56px; pin it to the well.
  :deep(.el-avatar) {
    width: 36px !important;
    height: 36px !important;
  }
}

.captain-row__name {
  @apply flex items-center gap-6 font-display text-[13px] uppercase leading-tight tracking-wide text-white;
}

.captain-row__handle {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}

.captain-row__tag {
  @apply inline-flex shrink-0 items-center rounded-md border px-8 py-3;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-gold);
  border-color: rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.08);

  &.is-muted {
    color: var(--ds-text-faint);
    border-color: var(--ds-border);
    background: transparent;
  }
}

.captain-row__rank {
  @apply flex shrink-0 flex-col items-center gap-1;
  min-width: 44px;
}

.captain-row__mmr {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--ds-primary);
  font-variant-numeric: tabular-nums;
}

.captain-row__radio {
  @apply relative block size-18 rounded-full border-2;
  border-color: rgba(255, 255, 255, 0.25);
  transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--ds-primary);
    transform: scale(0);
    transition: transform var(--ds-duration-base) var(--ds-ease-out);
  }
}

.is-selected .captain-row__radio {
  border-color: var(--ds-primary);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.6);

  &::after {
    transform: scale(1);
  }
}

@media (hover: hover) and (pointer: fine) {
  .captain-row:not(.is-current):not(.is-selected):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(255, 255, 255, 0.03);

    .captain-row__radio {
      border-color: rgba(var(--ds-primary-rgb), 0.6);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .captain-row,
  .captain-row__radio,
  .captain-row__radio::after {
    transition: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.captain-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    @apply flex min-h-0 flex-col;
    overflow: hidden !important;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .captain-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.captain-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.captain-dialog__stack {
  @apply flex min-h-0 flex-1 flex-col gap-16;
}

.captain-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.captain-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.captain-dialog__foot {
  @apply flex items-center justify-end gap-10;

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

@media (hover: hover) and (pointer: fine) {
  .captain-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
