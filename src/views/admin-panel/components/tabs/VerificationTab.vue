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
                  {{ ukPlural(countsFor(data.day)!.free, 'слот', 'слоти', 'слотів') }}
                </span>
                <span
                  v-if="countsFor(data.day)!.booked"
                  class="cal-badge cal-badge--booked"
                  :title="`${countsFor(data.day)!.booked} заброньовано`"
                >
                  {{ countsFor(data.day)!.booked }}
                  {{ ukPlural(countsFor(data.day)!.booked, 'запис', 'записи', 'записів') }}
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
      @refresh="onDrawerRefresh"
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

// Day data cached by `YYYY-MM-DD`. The list endpoints filter by an inclusive date-only
// `from`/`to` range, so a whole month is one slots + one requests fetch, bucketed by day.
const cache = reactive<Record<string, IVerificationDayData>>({})
const loadingDates = reactive(new Set<string>())

// Fetch the whole month containing `anchor` in one round trip. The backend range is in
// UTC days while cells are local days, so the request is padded ±1 day and each result
// is rebucketed by its local start day (out-of-month days drop via the `?.` push).
// Every refresh (month switch, cell click, drawer mutation) reloads the month so the
// calendar and drawer stay in sync.
async function loadMonth (anchor: string | Date, opts?: { silent?: boolean }): Promise<void> {
  const start = dayjs(anchor).startOf('month')
  const days = Array.from({ length: start.daysInMonth() }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'))
  days.forEach((d) => loadingDates.add(d))
  try {
    const range = {
      from: start.subtract(1, 'day').format('YYYY-MM-DD'),
      to: start.endOf('month').add(1, 'day').format('YYYY-MM-DD')
    }
    const [slots, requests] = await Promise.all([
      verificationService.fetchSlots(range),
      verificationService.fetchRequests(range)
    ])
    const buckets: Record<string, IVerificationDayData> = {}
    days.forEach((d) => { buckets[d] = { slots: [], requests: [] } })
    for (const s of slots) {
      buckets[dayjs(s.startsAt).format('YYYY-MM-DD')]?.slots.push(s)
    }
    for (const r of requests) {
      // A request without a slot (shown as «слот не призначено») lands on its creation day.
      buckets[dayjs(r.slot?.startsAt ?? r.createdAt).format('YYYY-MM-DD')]?.requests.push(r)
    }
    Object.assign(cache, buckets)
  } catch (e) {
    if (!opts?.silent) ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити дані верифікації'))
    throw e
  } finally {
    days.forEach((d) => loadingDates.delete(d))
  }
}

// Refetch whenever the visible month changes (initial load + month navigation).
watch(
  () => dayjs(selectedDate.value).format('YYYY-MM'),
  async () => {
    try {
      await loadMonth(selectedDate.value)
    } catch {
      // already surfaced via toast in loadMonth
    }
  },
  { immediate: true }
)

function dayNumber (day: string): number {
  return dayjs(day).date()
}

// Ukrainian plural form: 1 слот / 2–4 слоти / 5+ слотів (with the 11–14 exception).
function ukPlural (n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
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
  // Refresh the month so the drawer shows current data; the toast is shown on failure.
  try {
    await loadMonth(data.day)
  } catch {
    // already surfaced via toast in loadMonth
  }
}

// After a mutation in the drawer, reload the month so the drawer rows and the calendar
// badges all update from the refreshed cache entries.
async function onDrawerRefresh (): Promise<void> {
  if (!drawerDate.value) return
  try {
    await loadMonth(drawerDate.value)
  } catch {
    // already surfaced via toast in loadMonth
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

/* Month-nav buttons: flatter corners (the var keeps the group's outer-corner-only
   rounding intact), larger hit area, dark skin instead of EP's light default. */
.verification-calendar :deep(.el-calendar__button-group) {
  --el-border-radius-base: 5px;
}

.verification-calendar :deep(.el-calendar__button-group .el-button) {
  height: 36px;
  padding: 0 18px;
  font-size: 13px;
  background: rgb(255 255 255 / 0.04);
  border-color: rgb(255 255 255 / 0.15);
  color: rgb(255 255 255 / 0.85);
}

.verification-calendar :deep(.el-calendar__button-group .el-button:hover),
.verification-calendar :deep(.el-calendar__button-group .el-button:focus-visible) {
  background: rgb(67 191 238 / 0.15);
  border-color: rgb(67 191 238 / 0.4);
  color: #fff;
  z-index: 1;
}

.verification-calendar :deep(.el-calendar__button-group .el-button:active) {
  background: rgb(67 191 238 / 0.25);
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

/* Badges sit at the cell bottom and split the row evenly (1 badge = full width, 2 = 50/50). */
.cal-cell__badges {
  display: flex;
  gap: 4px;
  margin-top: auto;
}

.cal-badge {
  flex: 1 1 0;
  min-width: 0;
  display: inline-block;
  height: 22px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid transparent;
}

/* Free slots — emerald. Bookings — amber. */
.cal-badge--free {
  background: rgb(16 185 129 / 0.16);
  border-color: rgb(16 185 129 / 0.35);
  color: #6ee7b7;
}

.cal-badge--booked {
  background: rgb(245 158 11 / 0.16);
  border-color: rgb(245 158 11 / 0.35);
  color: #fcd34d;
}
</style>
