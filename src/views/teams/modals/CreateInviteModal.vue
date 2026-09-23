<template>
  <el-dialog
    v-model="modelValue"
    class="invite-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :show-close="false"
    @closed="reset"
  >
    <!-- Header -->
    <template #header="{ close }">
      <div class="invite-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Команда</span>
          <h2 class="invite-dialog__title">Запросити гравця</h2>
        </div>
        <button type="button" class="invite-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-16">
      <!-- Slot picker -->
      <div class="flex items-center gap-12">
        <span class="sys-label !text-[10px]">// Роль у команді</span>
        <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
      </div>

      <div role="radiogroup" aria-label="Роль у команді" class="slot-grid" :class="{ 'is-locked': !!inviteLink }">
        <button
          v-for="option in SLOT_OPTIONS"
          :key="option.value"
          type="button"
          role="radio"
          class="slot-pick"
          :class="{ 'is-selected': selectedSlot === option.value }"
          :aria-checked="selectedSlot === option.value"
          :disabled="!!inviteLink"
          @click="selectedSlot = option.value"
        >
          <span class="slot-pick__well">
            <component :is="option.icon" :size="18" weight="fill" />
          </span>
          <span class="slot-pick__label">{{ option.label }}</span>
          <span class="slot-pick__hint">{{ option.hint }}</span>
        </button>
      </div>

      <!-- Before the link exists: what the user is about to get -->
      <p v-if="!inviteLink" class="invite-hint">
        <PhLink :size="16" weight="bold" class="shrink-0" />
        <span>
          Ви отримаєте одноразове посилання. Гравець відкриє його, увійде через Discord і одразу потрапить
          у склад на обрану роль.
        </span>
      </p>

      <!-- Generated link -->
      <div v-else class="link-well">
        <div class="flex items-center gap-12">
          <span class="sys-label sys-label--gold !text-[10px]">// Посилання готове</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span v-if="countdown" class="link-well__timer" role="timer">
            <PhClock :size="11" weight="bold" />
            {{ countdown }}
          </span>
        </div>

        <div class="link-well__row">
          <span class="link-well__url" :title="inviteLink">{{ inviteLinkDisplay }}</span>
          <el-button class="link-well__copy" :class="{ 'is-copied': copied }" @click="copyLink">
            <PhCheck v-if="copied" :size="16" weight="bold" />
            <PhCopy v-else :size="16" weight="bold" />
            <span>{{ copied ? 'Скопійовано' : 'Копіювати' }}</span>
          </el-button>
        </div>

        <p class="link-well__meta">
          Дійсне до <b>{{ expiresAtFormatted }}</b>. Одноразове — після переходу за ним воно стане недійсним.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="invite-dialog__foot">
        <el-button @click="modelValue = false">Закрити</el-button>
        <el-button v-if="inviteLink" plain @click="resetLink">
          <PhArrowCounterClockwise :size="16" weight="bold" />
          <span>Нове посилання</span>
        </el-button>
        <el-button v-else type="primary" :loading="loading" @click="generate">
          <PhLink :size="16" weight="bold" />
          <span>Згенерувати посилання</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  PhArrowCounterClockwise, PhCheck, PhClock, PhCopy, PhLink, PhStrategy, PhUser, PhUsersThree, PhX
} from '@phosphor-icons/vue'
import { invitesService } from '@/views/invites/invites.service'
import { formatCopiedMessage } from '@/core/helpers'

type TInviteSlot = 'main' | 'reserved' | 'coach'

interface ISlotOption {
  value: TInviteSlot
  label: string
  hint: string
  icon: Component
}

const SLOT_OPTIONS: ISlotOption[] = [
  { value: 'main', label: 'Основний', hint: 'Стартовий склад', icon: PhUser },
  { value: 'reserved', label: 'Запасний', hint: 'Підміна на матчі', icon: PhUsersThree },
  { value: 'coach', label: 'Тренер', hint: 'Штаб команди', icon: PhStrategy }
]

const props = defineProps<{
  teamId: string
  slot?: TInviteSlot
}>()

const modelValue = defineModel<boolean>({ default: false })

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 480))

const selectedSlot = ref<TInviteSlot>(props.slot ?? 'main')
const loading = ref(false)
const inviteLink = ref<string | null>(null)
const expiresAt = ref<string | null>(null)

const { copy, copied } = useClipboard({ legacy: true, copiedDuring: 1600 })

// Ticks once a second; drives the "valid for" countdown.
const now = useNow({ interval: 1000 })

// Show the link without its scheme so the token stays readable.
const inviteLinkDisplay = computed(() => (inviteLink.value ?? '').replace(/^https?:\/\//, ''))

// Date and time formatted apart: the locale would otherwise join them with "о".
const expiresAtFormatted = computed(() => {
  if (!expiresAt.value) return ''
  const at = new Date(expiresAt.value)
  const date = at.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
  const time = at.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
})

const countdown = computed(() => {
  if (!expiresAt.value) return ''
  const total = Math.floor((new Date(expiresAt.value).getTime() - now.value.getTime()) / 1000)
  if (Number.isNaN(total) || total <= 0) return ''
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  if (days) return `${days} дн ${hours} год`
  if (hours) return `${hours} год ${minutes} хв`
  return `${minutes} хв`
})

async function generate () {
  if (!props.teamId) return
  loading.value = true
  try {
    const result = await invitesService.createTeamInvite(props.teamId, selectedSlot.value)
    inviteLink.value = `${window.location.origin}/invites/${result.token}`
    expiresAt.value = result.expiresAt
  } catch {
    ElMessage.error('Не вдалося створити запрошення')
  } finally {
    loading.value = false
  }
}

function copyLink () {
  if (!inviteLink.value) return
  copy(inviteLink.value)
  ElMessage.success(formatCopiedMessage('Посилання'))
}

function resetLink () {
  inviteLink.value = null
  expiresAt.value = null
}

function reset () {
  resetLink()
  selectedSlot.value = props.slot ?? 'main'
}
</script>

<style scoped lang="scss">
// ─── Slot picker ────────────────────────────────────────────────────────────
.slot-grid {
  @apply grid gap-8;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }

  &.is-locked .slot-pick:not(.is-selected) {
    opacity: 0.4;
  }
}

.slot-pick {
  @apply relative flex flex-col items-center gap-6 overflow-hidden rounded-xl border px-8 py-12 text-center;
  color: inherit;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    opacity var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  // Top rail: lights when selected.
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: default;
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

    .slot-pick__well {
      color: var(--ds-primary);
      border-color: rgba(var(--ds-primary-rgb), 0.5);
      background: rgba(var(--ds-primary-rgb), 0.12);
      filter: drop-shadow(0 0 8px rgba(var(--ds-primary-rgb), 0.45));
    }

    .slot-pick__label {
      color: #fff;
    }
  }
}

.slot-pick__well {
  @apply inline-flex size-36 items-center justify-center rounded-lg border;
  color: var(--ds-text-muted);
  border-color: var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.04);
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    filter var(--ds-duration-base) ease;
}

.slot-pick__label {
  @apply font-display text-[12px] uppercase leading-tight tracking-wide;
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-base) ease;
}

.slot-pick__hint {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--ds-text-faint);
}

// ─── Hint before generation ─────────────────────────────────────────────────
.invite-hint {
  @apply m-0 flex items-start gap-10 rounded-xl border p-12 text-sm leading-relaxed;
  color: var(--ds-text-muted);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);

  svg {
    margin-top: 2px;
    color: var(--ds-primary);
  }
}

// ─── Generated link ─────────────────────────────────────────────────────────
.link-well {
  @apply flex flex-col gap-12 rounded-xl border p-14;
  border-color: rgba(var(--ds-gold-rgb), 0.3);
  background: linear-gradient(135deg, rgba(var(--ds-gold-rgb), 0.08), transparent 70%), rgba(7, 8, 15, 0.45);
  animation: link-in 320ms var(--ds-ease-out) both;
}

@keyframes link-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.link-well__timer {
  @apply inline-flex shrink-0 items-center gap-4;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ds-gold);
  font-variant-numeric: tabular-nums;
}

.link-well__row {
  @apply flex items-center gap-8;
}

.link-well__url {
  @apply min-w-0 flex-1 truncate rounded-lg border px-12;
  height: var(--ds-control-height);
  line-height: var(--ds-control-height);
  font-family: var(--ds-font-mono);
  font-size: 12px;
  letter-spacing: 0.01em;
  color: var(--ds-text);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.6);
  user-select: all;
  cursor: text;
}

.link-well__copy {
  @apply shrink-0;
  margin-left: 0 !important;
  min-width: 132px;

  :deep(> span) {
    @apply inline-flex items-center gap-6;
  }

  &.is-copied {
    --el-button-text-color: var(--ds-success);
    --el-button-border-color: rgba(34, 197, 94, 0.5);
    --el-button-hover-text-color: var(--ds-success);
    --el-button-hover-border-color: rgba(34, 197, 94, 0.6);
    --el-button-hover-bg-color: rgba(34, 197, 94, 0.1);
  }
}

.link-well__meta {
  @apply m-0 text-xs leading-relaxed;
  color: var(--ds-text-faint);

  b {
    font-weight: 600;
    color: var(--ds-text-muted);
  }
}

@media (hover: hover) and (pointer: fine) {
  .slot-pick:not(:disabled):not(.is-selected):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(255, 255, 255, 0.03);

    .slot-pick__well {
      color: var(--ds-text);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .slot-pick,
  .slot-pick__well,
  .link-well {
    transition: none;
    animation: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.invite-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    overflow: visible !important;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .invite-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.invite-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.invite-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.invite-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.invite-dialog__foot {
  @apply flex flex-wrap items-center justify-end gap-10;

  .el-button {
    margin-left: 0 !important;
  }

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

@media (hover: hover) and (pointer: fine) {
  .invite-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
