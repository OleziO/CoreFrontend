<template>
  <el-drawer
    v-model="open"
    direction="rtl"
    :size="520"
    class="verification-day-drawer"
    destroy-on-close
    :close-on-click-modal="true"
  >
    <template #header>
      <div class="flex flex-col gap-12 pb-4 pr-8">
        <div
          class="h-[3px] w-48 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500
                 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        />
        <div>
          <h2 class="text-xl font-bold tracking-tight text-white">Верифікація</h2>
          <p class="mt-6 text-[13px] leading-snug text-gray-500">
            {{ headerDate }} · час показано у вашому часовому поясі (24 год)
          </p>
        </div>
      </div>
    </template>

    <div class="custom-scroll vd-scroll h-full overflow-y-auto pb-12">
      <el-tabs v-model="activeTab" class="vd-tabs">
        <!-- Заявки -->
        <el-tab-pane name="requests">
          <template #label>
            <span class="vd-tab-label">Заявки <span class="vd-tab-count">{{ requests.length }}</span></span>
          </template>

          <div v-if="loading" class="vd-empty">Завантаження…</div>
          <div v-else-if="!requests.length" class="vd-empty">Немає заявок на цей день</div>
          <div v-else class="flex flex-col gap-12">
            <article v-for="r in requests" :key="r.id" class="vd-card">
              <header class="flex items-start justify-between gap-8">
                <div class="min-w-0">
                  <h3 class="truncate text-[15px] font-semibold text-white">
                    {{ r.teamName || 'Без назви' }}
                  </h3>
                  <p class="mt-2 text-[12px] text-gray-500">
                    {{ r.slot ? formatTimeRange(r.slot.startsAt, r.slot.endsAt) : 'слот не призначено' }}
                  </p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-6">
                  <span class="vd-pill" :class="requestStatusMeta[r.status].class">
                    {{ requestStatusMeta[r.status].label }}
                  </span>
                  <span class="vd-pill" :class="typeMeta[r.type].class">{{ typeMeta[r.type].label }}</span>
                </div>
              </header>

              <div class="mt-10 border-t border-white/8 pt-10">
                <p class="text-[12px] text-gray-400">Гравців: {{ r.players.length }}</p>
                <div v-if="hasResults(r)" class="mt-6 flex flex-wrap gap-6">
                  <span v-for="p in r.players" :key="p.id" class="vd-mmr-chip">
                    {{ p.resultMmr != null ? `${p.resultMmr} MMR` : '—' }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </el-tab-pane>

        <!-- Слоти -->
        <el-tab-pane name="slots">
          <template #label>
            <span class="vd-tab-label">Слоти <span class="vd-tab-count">{{ slotRows.length }}</span></span>
          </template>

          <div v-if="loading" class="vd-empty">Завантаження…</div>
          <div v-else-if="!slotRows.length" class="vd-empty">Немає слотів на цей день</div>
          <div v-else class="flex flex-col gap-8">
            <div v-for="s in slotRows" :key="s.id" class="vd-slot-row">
              <div class="flex items-center gap-10">
                <span class="font-mono text-[14px] text-white/90">{{ formatTimeRange(s.startsAt, s.endsAt) }}</span>
                <span v-if="s.booked && s.teamName" class="truncate text-[12px] text-gray-400">{{ s.teamName }}</span>
              </div>
              <span class="vd-pill" :class="s.booked ? 'vd-pill--booked' : 'vd-pill--free'">
                {{ s.booked ? 'Заброньовано' : 'Вільно' }}
              </span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type {
  IVerificationDayData,
  TVerificationRequest,
  TVerificationRequestStatus,
  TVerificationType
} from '@/services/verification.types'

const props = defineProps<{
  date: string | null
  data: IVerificationDayData | null
  loading?: boolean
}>()

const open = defineModel<boolean>()

const activeTab = ref<'requests' | 'slots'>('requests')

const headerDate = computed(() => (props.date ? dayjs(props.date).format('DD.MM.YYYY') : ''))

const requests = computed(() => props.data?.requests ?? [])

interface ISlotRow {
  id: string
  startsAt: string
  endsAt: string
  booked: boolean
  teamName: string | null
}

// Free slots come from `/slots`; booked slots are derived from each active request's slot.
const slotRows = computed<ISlotRow[]>(() => {
  const data = props.data
  if (!data) return []
  const free: ISlotRow[] = data.slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    booked: false,
    teamName: null
  }))
  const booked: ISlotRow[] = data.requests.flatMap((r) => {
    if (!r.slot || r.status === 'cancelled') return []
    return [{ id: r.slot.id, startsAt: r.slot.startsAt, endsAt: r.slot.endsAt, booked: true, teamName: r.teamName }]
  })
  return [...free, ...booked].sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
})

function formatTimeRange (startsAt: string, endsAt: string): string {
  return `${dayjs(startsAt).format('HH:mm')}–${dayjs(endsAt).format('HH:mm')}`
}

function hasResults (r: TVerificationRequest): boolean {
  return r.players.some((p) => p.resultMmr != null)
}

const requestStatusMeta: Record<TVerificationRequestStatus, { label: string; class: string }> = {
  pending: { label: 'Очікує', class: 'vd-pill--pending' },
  processing: { label: 'В обробці', class: 'vd-pill--processing' },
  completed: { label: 'Завершено', class: 'vd-pill--completed' },
  cancelled: { label: 'Скасовано', class: 'vd-pill--cancelled' }
}

const typeMeta: Record<TVerificationType, { label: string; class: string }> = {
  FIRST: { label: 'Перша', class: 'vd-pill--type-first' },
  MMR_UPDATE: { label: 'Оновлення MMR', class: 'vd-pill--type-mmr' }
}

// Reset to the first tab each time the drawer opens so the day always lands on Заявки.
watch(open, (isOpen) => {
  if (isOpen) activeTab.value = 'requests'
})
</script>

<style scoped>
.vd-card {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.045) 0%, rgba(0, 0, 0, 0.22) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  padding: 14px 16px;
}

.vd-slot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.vd-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: rgb(107 114 128);
}

.vd-mmr-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(209 213 219);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.vd-pill {
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

.vd-pill--pending {
  background: rgb(245 158 11 / 0.14);
  border-color: rgb(245 158 11 / 0.35);
  color: #fcd34d;
}

.vd-pill--processing {
  background: rgb(67 191 238 / 0.14);
  border-color: rgb(67 191 238 / 0.35);
  color: #7dd3fc;
}

.vd-pill--completed,
.vd-pill--booked {
  background: rgb(16 185 129 / 0.14);
  border-color: rgb(16 185 129 / 0.35);
  color: #6ee7b7;
}

.vd-pill--cancelled {
  background: rgb(248 113 113 / 0.14);
  border-color: rgb(248 113 113 / 0.35);
  color: #fca5a5;
}

.vd-pill--free {
  background: rgb(67 191 238 / 0.14);
  border-color: rgb(67 191 238 / 0.35);
  color: #7dd3fc;
}

.vd-pill--type-first {
  background: rgb(139 92 246 / 0.14);
  border-color: rgb(139 92 246 / 0.35);
  color: #c4b5fd;
}

.vd-pill--type-mmr {
  background: rgb(59 130 246 / 0.14);
  border-color: rgb(59 130 246 / 0.35);
  color: #93c5fd;
}

.vd-tab-label {
  font-size: 14px;
}

.vd-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: 4px;
  padding: 0 5px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(209 213 219);
  background: rgba(255, 255, 255, 0.08);
}

.vd-scroll::-webkit-scrollbar {
  width: 6px;
}
.vd-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.vd-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
.vd-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

:deep(.verification-day-drawer.el-drawer) {
  --el-drawer-bg-color: theme('colors.dark.navy');
  background: linear-gradient(180deg, #0f172a 0%, theme('colors.dark.navy') 40%, #080c16 100%) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -16px 0 48px rgba(0, 0, 0, 0.45);
}

:deep(.verification-day-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 8px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(.verification-day-drawer .el-drawer__body) {
  padding: 16px 20px 24px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

:deep(.verification-day-drawer .el-drawer__close-btn) {
  color: theme('colors.gray.400');
  font-size: 18px;
}

:deep(.verification-day-drawer .el-drawer__close-btn:hover) {
  color: white;
}

:deep(.vd-tabs .el-tabs__item) {
  color: rgb(255 255 255 / 0.6);
}

:deep(.vd-tabs .el-tabs__item.is-active) {
  color: var(--el-color-primary, #43bfee);
}

:deep(.vd-tabs .el-tabs__nav-wrap::after) {
  background-color: rgba(255, 255, 255, 0.08);
}

:deep(.vd-tabs .el-tabs__active-bar) {
  background-color: var(--el-color-primary, #43bfee);
}
</style>
