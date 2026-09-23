<template>
  <div class="flex h-full flex-col gap-12">
    <!-- Toolbar: register label + legend -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-16 gap-y-8">
      <span class="sys-label !text-[9px]">// Календар верифікацій</span>

      <div class="verif-legend" aria-label="Легенда">
        <span class="verif-legend__item">
          <i class="verif-legend__dot verif-legend__dot--free" aria-hidden="true" />
          Вільні слоти
        </span>
        <span class="verif-legend__item">
          <i class="verif-legend__dot verif-legend__dot--booked" aria-hidden="true" />
          Бронювання
        </span>
      </div>
    </div>

    <div
      class="verification-calendar hud-panel min-h-0 flex-1 overflow-auto rounded-2xl p-16"
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
      :data="drawerDate ? verificationStore.cache[drawerDate] ?? null : null"
      :loading="!!drawerDate && verificationStore.loadingDates.has(drawerDate)"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import uk from 'element-plus/es/locale/lang/uk'
// Shape of the el-calendar `date-cell` slot scope (EP types `type` loosely as a string:
// 'prev-month' | 'current-month' | 'next-month').
interface ICalendarCellData {
  type: string
  day: string // 'YYYY-MM-DD' (local calendar day)
  date: Date
  isSelected: boolean
}

const elementPlusUk = uk
const verificationStore = useVerificationStore()

// el-calendar derives the visible month from its model; navigating months updates it too.
const selectedDate = ref(dayjs().toDate())

// Refetch whenever the visible month changes (initial load + month navigation).
watch(
  () => dayjs(selectedDate.value).format('YYYY-MM'),
  async () => {
    try {
      await verificationStore.loadMonth(selectedDate.value)
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
  const data = verificationStore.cache[day]
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
    await verificationStore.loadMonth(data.day)
  } catch {
    // already surfaced via toast in loadMonth
  }
}
</script>

<style scoped>
/* ─── Legend ─────────────────────────────────────────────────────────────── */
.verif-legend {
  display: flex;
  align-items: center;
  gap: 14px;
}

.verif-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.verif-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.verif-legend__dot--free {
  background: var(--ds-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.verif-legend__dot--booked {
  background: var(--ds-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

/* ─── Calendar skin (Element Plus is light by default) ───────────────────── */
.verification-calendar :deep(.el-calendar) {
  background: transparent;
  --el-calendar-border: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  --el-calendar-cell-width: auto;
  /* Hover + selected fills derive from these EP vars — keep them translucent cyan
     so the day number stays readable. */
  --el-fill-color-light: rgba(var(--ds-primary-rgb), 0.08);
  --el-color-primary-light-9: rgba(var(--ds-primary-rgb), 0.14);
}

.verification-calendar :deep(.el-calendar__header) {
  padding: 4px 4px 14px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

.verification-calendar :deep(.el-calendar__title) {
  font-family: var(--ds-font-display);
  font-size: 15px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
}

.verification-calendar :deep(.el-calendar__body) {
  padding: 12px 0 0;
}

/* Weekday row in the mono system register. */
.verification-calendar :deep(.el-calendar-table thead th) {
  padding: 8px 0 10px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  border-color: rgba(var(--ds-primary-rgb), 0.1);
}

.verification-calendar :deep(.el-calendar-table td) {
  border-color: rgba(var(--ds-primary-rgb), 0.1);
}

/* Month-nav buttons: compact ghost group in the mono register. */
.verification-calendar :deep(.el-calendar__button-group) {
  --el-border-radius-base: 6px;
}

.verification-calendar :deep(.el-calendar__button-group .el-button) {
  height: 32px;
  padding: 0 14px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(var(--ds-primary-rgb), 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.verification-calendar :deep(.el-calendar__button-group .el-button:hover),
.verification-calendar :deep(.el-calendar__button-group .el-button:focus-visible) {
  background: rgba(var(--ds-primary-rgb), 0.12);
  border-color: rgba(var(--ds-primary-rgb), 0.45);
  color: #fff;
  z-index: 1;
}

.verification-calendar :deep(.el-calendar__button-group .el-button:active) {
  background: rgba(var(--ds-primary-rgb), 0.2);
}

/* Day cell content lives in `.el-calendar-day`; keep it light in every state. */
.verification-calendar :deep(.el-calendar-day) {
  min-height: 84px;
  padding: 8px;
  color: rgba(255, 255, 255, 0.85);
  transition: background-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;
}

.verification-calendar :deep(.el-calendar-day:hover) {
  background: rgba(var(--ds-primary-rgb), 0.08);
  color: #fff;
}

.verification-calendar :deep(.el-calendar-table td.is-selected .el-calendar-day) {
  background: rgba(var(--ds-primary-rgb), 0.12);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.45), var(--ds-glow-primary-soft);
  color: #fff;
}

.verification-calendar :deep(.el-calendar-table td.is-today .cal-cell__day) {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.verification-calendar :deep(.el-calendar-table td.is-today .cal-cell__day::after) {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-left: 6px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.9);
  vertical-align: 2px;
}

/* Overflow days from the neighbouring months step back. */
.verification-calendar :deep(.el-calendar-table td.prev .cal-cell__day),
.verification-calendar :deep(.el-calendar-table td.next .cal-cell__day) {
  color: rgba(255, 255, 255, 0.28);
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
  display: inline-flex;
  align-items: center;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
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
  border: 1px solid transparent;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 20px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

/* Free slots — success green. Bookings — warning amber. */
.cal-badge--free {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.35);
  color: #6ee7b7;
}

.cal-badge--booked {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fcd34d;
}
</style>
