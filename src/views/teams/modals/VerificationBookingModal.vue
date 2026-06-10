<template>
  <el-dialog
    v-model="open"
    width="520"
    class="verification-booking-modal"
    header-class="hidden"
    destroy-on-close
    :close-on-click-modal="!submitting"
    @closed="reset"
  >
    <div class="flex flex-col gap-20">
      <!-- Header -->
      <div class="flex flex-col gap-12 border-b border-white/8 pb-16">
        <div
          class="h-[3px] w-48 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500
                 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        />
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white">Верифікація гравців</h2>
          <p class="mt-6 text-[13px] leading-snug text-gray-500">
            Оберіть гравців, дату та вільний слот. Час показано у вашому часовому поясі (24 год).
          </p>
        </div>
      </div>

      <!-- Players -->
      <section class="flex flex-col gap-10">
        <label class="vb-label">Гравці</label>
        <div v-if="!rosterPlayers.length" class="vb-empty">У команді немає гравців</div>
        <el-select
          v-else
          v-model="selectedPlayerIds"
          multiple
          filterable
          placeholder="Оберіть гравців"
          popper-class="vb-players-popper"
          class="w-full"
        >
          <el-option
            v-for="p in rosterPlayers"
            :key="p.id"
            :value="p.id"
            :label="p.discordName || '—'"
          >
            <div class="flex w-full items-center gap-10">
              <el-avatar :size="28" :src="avatarOf(p)" class="shrink-0 bg-white/[0.06]">
                <template #default>
                  <PhUser :size="14" weight="bold" class="text-white/70" />
                </template>
              </el-avatar>
              <span class="min-w-0 flex-1 truncate text-[14px]">{{ p.discordName || '—' }}</span>
              <span
                class="vb-pill"
                :class="isVerified(p) ? 'vb-pill--verified' : 'vb-pill--unverified'"
              >
                {{ isVerified(p) ? 'Верифікований' : 'Не верифікований' }}
              </span>
            </div>
          </el-option>
        </el-select>
        <p class="vb-hint">
          {{ guidanceText }}
        </p>
      </section>

      <!-- Date -->
      <section class="flex flex-col gap-10">
        <label class="vb-label">Дата</label>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="DD.MM.YYYY"
          placeholder="Оберіть дату"
          :disabled-date="disabledDate"
          class="w-full"
        />
      </section>

      <!-- Slots -->
      <section v-if="selectedDate" class="flex flex-col gap-10">
        <label class="vb-label">Вільні слоти</label>
        <div v-if="loadingSlots" class="vb-empty">Завантаження…</div>
        <div v-else-if="!sortedSlots.length" class="vb-empty">Немає вільних слотів на цю дату</div>
        <div v-else class="flex flex-wrap gap-8">
          <button
            v-for="s in sortedSlots"
            :key="s.id"
            type="button"
            class="vb-slot"
            :class="{ 'vb-slot--active': selectedSlotId === s.id }"
            @click="selectedSlotId = s.id"
          >
            {{ formatTimeRange(s.startsAt, s.endsAt) }}
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10 border-t border-white/8 pt-16">
        <el-button :disabled="submitting" @click="open = false">
          Скасувати
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          Забронювати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { PhUser } from '@phosphor-icons/vue'
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

const selectedPlayerIds = ref<string[]>([])
const selectedDate = ref<string>('')
const slots = ref<TVerificationSlot[]>([])
const selectedSlotId = ref<string>('')
const loadingSlots = ref(false)
const submitting = ref(false)

const sortedSlots = computed(() =>
  [...slots.value].sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
)

// Basic sanity gate only (≥ 1 player + a slot). The min-count rule is shown as guidance and
// enforced by the backend, so violations surface as a toast without blocking the round trip.
const canSubmit = computed(() => !!selectedSlotId.value && selectedPlayerIds.value.length > 0)

function avatarOf (player: { avatarUrl?: string | null }): string {
  return resolvePublicOrApiUrl(player.avatarUrl) ?? ''
}

function isVerified (player: Parameters<typeof isPlayerVerified>[0]): boolean {
  return isPlayerVerified(player)
}

function formatTimeRange (startsAt: string, endsAt: string): string {
  return `${dayjs(startsAt).format('HH:mm')}–${dayjs(endsAt).format('HH:mm')}`
}

// Past days can't be booked. `?date=` is sent as the locally displayed YYYY-MM-DD, matching
// the admin calendar's convention so a booked slot lands on the admin's same day.
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
    slots.value = await verificationService.fetchSlots(date)
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

<style scoped>
.vb-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(156 163 175);
}

.vb-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(107 114 128);
}

.vb-empty {
  padding: 20px 16px;
  text-align: center;
  font-size: 13px;
  color: rgb(107 114 128);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.vb-slot {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-family: theme('fontFamily.mono', monospace);
  font-size: 13px;
  color: rgb(255 255 255 / 0.9);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.vb-slot:hover {
  border-color: rgba(34, 211, 238, 0.35);
}

.vb-slot--active {
  border-color: rgba(34, 211, 238, 0.7);
  background: rgba(34, 211, 238, 0.16);
  color: #7dd3fc;
}

.vb-pill {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 2px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  border: 1px solid transparent;
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

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none !important;
  border-radius: 10px;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(34, 211, 238, 0.25);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(34, 211, 238, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2) !important;
}

:deep(.el-input__inner) {
  color: white;
}

:deep(.el-select__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none !important;
  border-radius: 10px;
  min-height: 42px;
}

:deep(.el-select__wrapper:hover) {
  border-color: rgba(34, 211, 238, 0.25);
}

:deep(.el-select__wrapper.is-focused) {
  border-color: rgba(34, 211, 238, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2) !important;
}

:deep(.el-select__placeholder) {
  color: theme('colors.gray.500');
}

/* Only the gradient/border vibe is overridden here — sizing, the 70vh cap, flex-column
   layout, body scroll and padding all come from the global `.el-dialog` reset (_dialog.scss). */
:deep(.verification-booking-modal.el-dialog) {
  --el-dialog-bg-color: theme('colors.dark.navy');
  background: linear-gradient(180deg, #0f172a 0%, theme('colors.dark.navy') 45%, #080c16 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  min-height: 44px;
  line-height: 1.4;
  overflow: visible;
}
</style>
