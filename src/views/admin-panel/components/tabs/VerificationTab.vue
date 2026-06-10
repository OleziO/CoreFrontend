<template>
  <div class="h-full flex flex-col">
    <div
      class="flex-1 min-h-0 rounded-xl border border-white/10 bg-dark-navy/50 shadow-xl
             overflow-auto p-16 verification-calendar"
    >
      <el-config-provider :locale="elementPlusUk">
        <el-calendar v-model="selectedDate">
          <template #date-cell="{ data }">
            <div
              class="cal-cell"
              :class="{ 'cal-cell--clickable': data.type === 'current-month' }"
              @click="onCellClick(data)"
            >
              <span class="cal-cell__day">{{ dayNumber(data.day) }}</span>
              <div v-if="countsFor(data.day)" class="cal-cell__badges">
                <span
                  v-if="countsFor(data.day)!.free"
                  class="cal-badge cal-badge--free"
                  :title="`${countsFor(data.day)!.free} вільних слотів`"
                >
                  {{ countsFor(data.day)!.free }}
                </span>
                <span
                  v-if="countsFor(data.day)!.booked"
                  class="cal-badge cal-badge--booked"
                  :title="`${countsFor(data.day)!.booked} заброньовано`"
                >
                  {{ countsFor(data.day)!.booked }}
                </span>
              </div>
            </div>
          </template>
        </el-calendar>
      </el-config-provider>
    </div>

    <VerificationDayDrawer
      v-model="drawerOpen"
      :date="drawerDate"
      :data="drawerDate ? cache[drawerDate] ?? null : null"
      :loading="!!drawerDate && loadingDates.has(drawerDate)"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import uk from 'element-plus/es/locale/lang/uk'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type { IVerificationDayData } from '@/services/verification.types'

// Shape of the el-calendar `date-cell` slot scope (EP types `type` loosely as a string:
// 'prev-month' | 'current-month' | 'next-month').
interface ICalendarCellData {
  type: string
  day: string // 'YYYY-MM-DD' (local calendar day)
  date: Date
  isSelected: boolean
}

const elementPlusUk = uk

// el-calendar derives the visible month from its model; navigating months updates it too.
const selectedDate = ref(dayjs().toDate())

// Day data cached by `YYYY-MM-DD`. Endpoints are per-day only, so the month view fans out
// one slots + one requests fetch per day (acceptable for a low-traffic admin tool).
// TODO(be): a date-range endpoint would replace this fan-out with a single request.
const cache = reactive<Record<string, IVerificationDayData>>({})
const loadingDates = reactive(new Set<string>())

// The `?date=` param is the locally displayed calendar day, sent verbatim as YYYY-MM-DD so the
// fetched UTC day aligns with the cell. Slots near UTC midnight may surface on the adjacent
// local day — acceptable here; the future range endpoint removes the ambiguity.
async function loadDay (date: string, opts?: { silent?: boolean }): Promise<void> {
  loadingDates.add(date)
  try {
    const [slots, requests] = await Promise.all([
      verificationService.fetchSlots(date),
      verificationService.fetchRequests(date)
    ])
    cache[date] = { slots, requests }
  } catch (e) {
    if (!opts?.silent) ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити дані дня'))
    throw e
  } finally {
    loadingDates.delete(date)
  }
}

async function loadMonth (anchor: Date): Promise<void> {
  const start = dayjs(anchor).startOf('month')
  const dates = Array.from({ length: start.daysInMonth() }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'))
  const results = await Promise.allSettled(dates.map((d) => loadDay(d, { silent: true })))
  if (results.length && results.every((r) => r.status === 'rejected')) {
    ElMessage.error('Не вдалося завантажити дані верифікації')
  }
}

// Refetch whenever the visible month changes (initial load + month navigation).
// loadMonth swallows per-day failures (allSettled), so awaiting it never rejects.
watch(
  () => dayjs(selectedDate.value).format('YYYY-MM'),
  async () => { await loadMonth(selectedDate.value) },
  { immediate: true }
)

function dayNumber (day: string): number {
  return dayjs(day).date()
}

// Booked = active bookings (a cancelled request frees its slot, so it is excluded).
function countsFor (day: string): { free: number; booked: number } | null {
  const data = cache[day]
  if (!data) return null
  const free = data.slots.length
  const booked = data.requests.filter((r) => r.status !== 'cancelled').length
  if (!free && !booked) return null
  return { free, booked }
}

const drawerOpen = ref(false)
const drawerDate = ref<string | null>(null)

async function onCellClick (data: ICalendarCellData): Promise<void> {
  // Overflow (prev/next-month) cells let el-calendar navigate instead of opening the drawer.
  if (data.type !== 'current-month') return
  drawerDate.value = data.day
  drawerOpen.value = true
  // Refresh the opened day so the drawer shows current data; the toast is shown on failure.
  try {
    await loadDay(data.day)
  } catch {
    // already surfaced via toast in loadDay
  }
}
</script>

<style scoped>
/* Dark-surface skin for Element Plus' light calendar. */
.verification-calendar :deep(.el-calendar) {
  background: transparent;
  --el-calendar-border: 1px solid rgb(255 255 255 / 0.08);
  --el-calendar-cell-width: auto;
  /* Hover + selected cell fills derive from these EP vars — keep them dark/translucent
     so the (light) day number stays readable instead of going white-on-white. */
  --el-fill-color-light: rgb(67 191 238 / 0.1);
  --el-color-primary-light-9: rgb(67 191 238 / 0.18);
}

.verification-calendar :deep(.el-calendar__header),
.verification-calendar :deep(.el-calendar-table thead th),
.verification-calendar :deep(.el-calendar-table td) {
  color: rgb(255 255 255 / 0.7);
  border-color: rgb(255 255 255 / 0.08);
}

.verification-calendar :deep(.el-calendar__title) {
  color: rgb(255 255 255 / 0.9);
}

/* The day cell content lives in `.el-calendar-day`; keep it light in every state. */
.verification-calendar :deep(.el-calendar-day) {
  color: rgb(255 255 255 / 0.85);
  transition: background-color 0.15s ease;
  padding: 6px;
}

.verification-calendar :deep(.el-calendar-day:hover) {
  background: rgb(67 191 238 / 0.1);
  color: #fff;
}

.verification-calendar :deep(.el-calendar-table td.is-selected .el-calendar-day) {
  background: rgb(67 191 238 / 0.18);
  color: #fff;
}

.verification-calendar :deep(.el-calendar-table td.is-today .el-calendar-day) {
  color: var(--el-color-primary, #43bfee);
  font-weight: 600;
}

.cal-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 56px;
  height: 100%;
}

.cal-cell--clickable {
  cursor: pointer;
}

.cal-cell__day {
  font-size: 13px;
  line-height: 1;
}

.cal-cell__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  border: 1px solid transparent;
}

/* Free slots — cyan (primary). Booked — emerald. */
.cal-badge--free {
  background: rgb(67 191 238 / 0.16);
  border-color: rgb(67 191 238 / 0.35);
  color: #7dd3fc;
}

.cal-badge--booked {
  background: rgb(16 185 129 / 0.16);
  border-color: rgb(16 185 129 / 0.35);
  color: #6ee7b7;
}
</style>
