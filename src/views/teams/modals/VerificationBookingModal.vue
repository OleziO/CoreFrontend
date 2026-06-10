<template>
  <el-dialog
    v-model="open"
    width="500"
    title="Верифікація гравців"
    destroy-on-close
    :close-on-click-modal="!submitting"
    @closed="reset"
  >
    <el-form
      label-position="top"
      class="flex flex-col"
    >
      <!-- Players -->
      <el-form-item label="Гравці">
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
        <p class="vb-hint">
          {{ guidanceText }}
        </p>
      </el-form-item>

      <!-- Date -->
      <el-form-item label="Дата" class="vb-date-item">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          format="DD.MM.YYYY"
          placeholder="Оберіть дату"
          :disabled-date="disabledDate"
          class="w-full"
        />
      </el-form-item>

      <!-- Slots -->
      <el-form-item label="Вільні слоти">
        <el-select
          v-model="selectedSlotId"
          filterable
          :disabled="!selectedDate || loadingSlots"
          :placeholder="slotPlaceholder"
          popper-class="vb-slots-popper"
          class="w-full"
        >
          <el-option
            v-for="o in slotOptions"
            :key="o.value"
            :value="o.value"
            :label="o.label"
          />
        </el-select>

        <p v-if="selectedDate && !loadingSlots && !slotOptions.length" class="vb-hint">
          Немає вільних слотів на цю дату
        </p>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button :disabled="submitting" @click="open = false">
          <span class="text-sm font-medium">Скасувати</span>
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          <span class="text-sm font-medium">Забронювати</span>
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

// Only the backend's free slots are selectable, each labelled "HH:mm-HH:mm" (a window that
// ends at midnight reads as "24:00", not "00:00"), sorted chronologically.
const slotOptions = computed(() =>
  [...slots.value]
    .sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
    .map((s) => ({ value: s.id, label: formatSlotRange(s) }))
)

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

/* EP fixes the date editor to --el-date-editor-width (220px), overriding Tailwind w-full. */
.vb-date-item :deep(.el-date-editor.el-input) {
  width: 100%;
  margin-bottom: 18px;
}

.vb-pill {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 1px 7px;
  border-radius: 9999px;
  font-size: 10px;
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
