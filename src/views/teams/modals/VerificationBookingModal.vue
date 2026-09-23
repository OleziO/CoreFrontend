<template>
  <el-dialog
    v-model="open"
    class="vb-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :show-close="false"
    :close-on-click-modal="!submitting"
    @closed="reset"
  >
    <!-- Header -->
    <template #header="{ close }">
      <div class="vb-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Верифікація</span>
          <h2 class="vb-dialog__title">Подати заявку на верифікацію</h2>
        </div>
        <button
          type="button"
          class="vb-dialog__close"
          aria-label="Закрити"
          :disabled="submitting"
          @click="close"
        >
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-22">
      <!-- 01 · Players -->
      <section class="vb-step">
        <div class="vb-step__head">
          <span class="vb-step__num" :class="{ 'is-on': selectedPlayerIds.length > 0 }">01</span>
          <label for="vb-players" class="sys-label !text-[10px]">Гравці</label>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="vb-step__count" :class="{ 'is-on': meetsMinPlayers }">
            {{ pad(selectedPlayerIds.length) }}<span class="vb-step__of">/{{ pad(minPlayers) }}</span>
          </span>
        </div>

        <div v-if="!rosterPlayers.length" class="vb-empty">
          <PhUsersThree :size="22" weight="duotone" class="text-primary/50" />
          <span>У команді немає гравців</span>
        </div>
        <el-select
          v-else
          id="vb-players"
          v-model="selectedPlayerIds"
          multiple
          filterable
          placeholder="Оберіть гравців"
          popper-class="vb-players-popper"
          class="w-full"
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="2"
        >
          <template #prefix>
            <PhUsersThree :size="16" weight="bold" class="text-primary" />
          </template>
          <el-option
            v-for="p in rosterPlayers"
            :key="p.id"
            :value="p.id"
            :label="p.discordName || '—'"
          >
            <div class="flex w-full items-center gap-8">
              <el-avatar :size="16" :src="avatarOf(p)" class="shrink-0 bg-white/[0.06]">
                <template #default>
                  <PhUser :size="9" weight="bold" class="text-white/70" />
                </template>
              </el-avatar>
              <span class="min-w-0 flex-1 truncate text-[13px]">{{ p.discordName || '—' }}</span>
              <span
                class="vb-pill"
                :class="isVerified(p) ? 'vb-pill--verified' : 'vb-pill--unverified'"
              >
                {{ isVerified(p) ? 'Верифікований' : 'Не верифікований' }}
              </span>
            </div>
          </el-option>
        </el-select>

        <p class="vb-note" :class="{ 'is-ok': meetsMinPlayers }">
          <component :is="meetsMinPlayers ? PhCheckCircle : PhInfo" :size="13" weight="bold" class="shrink-0" />
          <span>{{ guidanceText }}</span>
        </p>
      </section>

      <!-- 02 · Date -->
      <section class="vb-step">
        <div class="vb-step__head">
          <span class="vb-step__num" :class="{ 'is-on': !!selectedDate }">02</span>
          <span class="sys-label !text-[10px]">Дата</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="vb-step__count" :class="{ 'is-on': !!selectedDate }">{{ dateLabel }}</span>
        </div>

        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="DD.MM.YYYY"
          placeholder="Оберіть дату"
          :disabled-date="disabledDate"
          class="vb-date"
        />
      </section>

      <!-- 03 · Slot: locked until a date is picked -->
      <section class="vb-step" :class="{ 'is-locked': !selectedDate }">
        <div class="vb-step__head">
          <span class="vb-step__num" :class="{ 'is-on': !!selectedSlotId }">03</span>
          <span class="sys-label !text-[10px]">Вільні слоти</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="vb-step__count" :class="{ 'is-on': slotOptions.length > 0 }">
            <template v-if="loadingSlots">…</template>
            <template v-else-if="selectedDate">{{ pad(slotOptions.length) }}</template>
            <template v-else>—</template>
          </span>
        </div>

        <el-select
          v-model="selectedSlotId"
          filterable
          :disabled="!selectedDate || loadingSlots"
          :loading="loadingSlots"
          :placeholder="slotPlaceholder"
          no-data-text="Немає вільних слотів на цю дату"
          popper-class="vb-slots-popper"
          class="w-full"
        >
          <template #prefix>
            <PhClock :size="16" weight="bold" class="text-primary" />
          </template>
          <el-option
            v-for="o in slotOptions"
            :key="o.value"
            :value="o.value"
            :label="o.label"
          />
        </el-select>
      </section>
    </div>

    <template #footer>
      <div class="vb-dialog__foot">
        <el-button :disabled="submitting" @click="open = false">Скасувати</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          <PhCalendarCheck :size="16" weight="fill" />
          <span>Забронювати</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import {
  PhCalendarCheck,
  PhCheckCircle,
  PhClock,
  PhInfo,
  PhUser,
  PhUsersThree,
  PhX
} from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl, isPlayerVerified } from '@/core/helpers'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type { TCreateRequestPayload, TVerificationSlot } from '@/services/verification.types'

const props = defineProps<{
  team: TTeam | null
  onBooked?: () => void
}>()

const open = defineModel<boolean>({ default: false })

// Only main + reserved players can be submitted for verification (coaches excluded).
const rosterPlayers = computed(() => [
  ...(props.team?.mainPlayers ?? []),
  ...(props.team?.reservedPlayers ?? [])
])

// Verified mains drive the player-count guidance: a team with ≥ 3 verified mains is
// "established" and may submit as few as 1 player; otherwise first verification needs ≥ 3.
// The backend is the source of truth — this is guidance only.
const verifiedMainsCount = computed(
  () => (props.team?.mainPlayers ?? []).filter((p) => isPlayerVerified(p)).length
)
const isEstablished = computed(() => verifiedMainsCount.value >= 3)
const minPlayers = computed(() => (isEstablished.value ? 1 : 3))

const guidanceText = computed(() =>
  isEstablished.value
    ? `Команда вже має 3+ верифікованих гравців основи — можна подати від ${minPlayers.value} гравця.`
    : `Перша верифікація: потрібно подати щонайменше ${minPlayers.value} гравців.`
)

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 520))

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

const selectedPlayerIds = ref<string[]>([])
const selectedDate = ref<string>('')
const slots = ref<TVerificationSlot[]>([])
const selectedSlotId = ref<string>('')
const loadingSlots = ref(false)
const submitting = ref(false)

// Only the backend's free slots are selectable, each labelled "HH:mm-HH:mm" (a window that
// ends at midnight reads as "24:00", not "00:00"), sorted chronologically.
const slotOptions = computed(() =>
  [...slots.value]
    .sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
    .map((s) => ({ value: s.id, label: formatSlotRange(s) }))
)

const meetsMinPlayers = computed(() => selectedPlayerIds.value.length >= minPlayers.value)

/** Обрана дата у лічильнику кроку: DD.MM або «—» */
const dateLabel = computed(() => (selectedDate.value ? dayjs(selectedDate.value).format('DD.MM') : '—'))

const slotPlaceholder = computed(() => {
  if (!selectedDate.value) return 'Спочатку оберіть дату'
  if (loadingSlots.value) return 'Завантаження…'
  return 'Оберіть слот'
})

// Basic sanity gate only (≥ 1 player + a slot). The min-count rule is shown as guidance and
// enforced by the backend, so violations surface as a toast without blocking the round trip.
const canSubmit = computed(() => !!selectedSlotId.value && selectedPlayerIds.value.length > 0)

function avatarOf (player: { avatarUrl?: string | null }): string {
  return resolvePublicOrApiUrl(player.avatarUrl) ?? ''
}

function isVerified (player: Parameters<typeof isPlayerVerified>[0]): boolean {
  return isPlayerVerified(player)
}

// "HH:mm-HH:mm" for a slot; a window ending at midnight reads as "24:00" rather than "00:00".
function formatSlotRange (slot: TVerificationSlot): string {
  const start = dayjs(slot.startsAt).format('HH:mm')
  const end = dayjs(slot.endsAt).format('HH:mm')
  return `${start}-${end === '00:00' ? '24:00' : end}`
}

// Past days can't be booked. The picked local YYYY-MM-DD becomes a `from`/`to` day range,
// matching the admin calendar's convention so a booked slot lands on the admin's same day.
function disabledDate (date: Date): boolean {
  return dayjs(date).isBefore(dayjs(), 'day')
}

// Load that date's free slots whenever the picked date changes; clear any prior slot pick.
watch(selectedDate, async (date) => {
  selectedSlotId.value = ''
  slots.value = []
  if (!date) return
  loadingSlots.value = true
  try {
    slots.value = await verificationService.fetchSlotsForDay(date)
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити слоти'))
  } finally {
    loadingSlots.value = false
  }
})

async function submit (): Promise<void> {
  if (!canSubmit.value) return
  const payload: TCreateRequestPayload = {
    slotId: selectedSlotId.value,
    playerIds: [...selectedPlayerIds.value]
  }
  submitting.value = true
  try {
    await verificationService.createRequest(payload)
    ElMessage.success('Заявку на верифікацію створено')
    props.onBooked?.()
    open.value = false
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити заявку'))
  } finally {
    submitting.value = false
  }
}

function reset (): void {
  selectedPlayerIds.value = []
  selectedDate.value = ''
  slots.value = []
  selectedSlotId.value = ''
}
</script>

<style scoped lang="scss">
.vb-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.vb-dialog__title {
  @apply m-0 font-display text-xl uppercase leading-none tracking-wide text-white;
  overflow-wrap: anywhere;
}

.vb-dialog__close {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.vb-dialog__foot {
  @apply flex items-center justify-end gap-10;

  :deep(.el-button) {
    margin-left: 0 !important;
  }

  :deep(.el-button > span) {
    @apply inline-flex items-center gap-8;
  }
}

// ─── Steps ──────────────────────────────────────────────────────────────────
.vb-step {
  @apply flex flex-col gap-10;
  transition: opacity var(--ds-duration-base) ease;

  &.is-locked {
    opacity: 0.55;
  }
}

.vb-step__head {
  @apply flex items-center gap-10;
}

// Step index: a small mono seal that lights up once the step has a value.
.vb-step__num {
  @apply inline-flex h-20 min-w-24 items-center justify-center rounded-md border px-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  color: var(--ds-text-faint);
  border-color: var(--ds-border);
  background: rgba(0, 0, 0, 0.3);
  font-variant-numeric: tabular-nums;
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: var(--ds-glow-primary-soft);
  }
}

.vb-step__count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
  transition: color var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.vb-step__of {
  color: var(--ds-text-faint);
  text-shadow: none;
}

.vb-note {
  @apply m-0 flex items-start gap-6 text-xs leading-relaxed;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  svg {
    margin-top: 2px;
  }

  &.is-ok {
    color: #86efac;
  }
}

.vb-empty {
  @apply flex flex-col items-center gap-6 rounded-xl border border-dashed px-16 py-16 text-center text-[13px];
  color: var(--ds-text-faint);
  border-color: rgba(var(--ds-primary-rgb), 0.2);
  background: rgba(0, 0, 0, 0.2);
}

// EP pins the date editor to --el-date-editor-width (220px) and renders it
// inline-flex, which leaks line-height below the field; stretch it to the step
// and make it a block so the gap to the next step is the real 22px.
:deep(.vb-date.el-date-editor),
:deep(.vb-date.el-date-editor.el-input) {
  display: flex;
  width: 100%;
}

.vb-pill {
  @apply inline-flex items-center whitespace-nowrap rounded-full border px-7 py-1;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
  border-color: transparent;
}

.vb-pill--verified {
  background: rgb(16 185 129 / 0.14);
  border-color: rgb(16 185 129 / 0.35);
  color: #6ee7b7;
}

.vb-pill--unverified {
  background: rgb(255 255 255 / 0.06);
  border-color: rgb(255 255 255 / 0.12);
  color: rgb(156 163 175);
}

@media (hover: hover) and (pointer: fine) {
  .vb-dialog__close:not(:disabled):hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.vb-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  max-height: calc(100vh - 32px);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .vb-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}
</style>

<!--
  The select options popper is teleported to <body>, so scoped styles can't reach it.
  EP fixes `.el-select-dropdown__item` at 34px height/line-height which clips the 28px
  avatar + verified pill; this non-scoped rule (keyed to the select's popper-class) lets
  the option rows grow to fit their content.
-->
<style>
.vb-players-popper .el-select-dropdown__item {
  height: auto;
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
  line-height: 1.4;
  overflow: visible;
}

/* Global .el-avatar rules override the inline :size prop, so pin the size here. */
.vb-players-popper .el-select-dropdown__item .el-avatar {
  width: 24px;
  height: 24px;
  min-width: 24px;
  line-height: 24px;
  font-size: 12px;
}

.vb-players-popper .el-select-dropdown__item .el-avatar img {
  width: 100%;
  height: 100%;
}

/* Slot options are monospace so the HH:mm-HH:mm ranges align. */
.vb-slots-popper .el-select-dropdown__item {
  font-family: theme('fontFamily.mono', monospace);
}
</style>
