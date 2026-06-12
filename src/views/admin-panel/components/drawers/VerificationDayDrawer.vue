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
                <div class="flex min-w-0 items-center gap-10">
                  <el-avatar
                    :size="34"
                    shape="square"
                    :src="resolvePublicOrApiUrl(r.team?.logoUrl)"
                    class="shrink-0 rounded-lg border border-white/10 bg-gray-800"
                  >
                    <template #default>
                      <PhUsersThree :size="16" weight="bold" class="text-white/70" />
                    </template>
                  </el-avatar>
                  <div class="min-w-0">
                    <h3 class="truncate text-[15px] font-semibold text-white">
                      {{ r.team?.name || 'Без назви' }}
                    </h3>
                    <p class="mt-2 text-[12px] text-gray-500">
                      {{ r.slot ? formatTimeRange(r.slot.startsAt, r.slot.endsAt) : 'слот не призначено' }}
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-6">
                  <span class="vd-pill" :class="requestStatusMeta[r.status].class">
                    {{ requestStatusMeta[r.status].label }}
                  </span>
                  <span class="vd-pill" :class="typeMeta[r.type].class">{{ typeMeta[r.type].label }}</span>
                </div>
              </header>

              <div class="mt-10 border-t border-white/8 pt-10">
                <p class="vd-section-label">Гравці · {{ r.players.length }}</p>

                <div class="mt-8 flex flex-col gap-6">
                  <div v-for="p in r.players" :key="p.id" class="vd-player-row">
                    <!-- Identity opens the profile in a new tab so in-progress MMR drafts survive. -->
                    <RouterLink
                      :to="{ name: routeNames.player, params: { id: p.player.id } }"
                      target="_blank"
                      class="group flex min-w-0 flex-1 items-center gap-10"
                    >
                      <div class="relative shrink-0">
                        <el-avatar
                          :size="36"
                          :src="resolvePublicOrApiUrl(p.player.avatarUrl)"
                          class="border border-white/10 bg-gray-800"
                        >
                          <template #default>
                            <PhUser :size="16" weight="bold" class="text-white/70" />
                          </template>
                        </el-avatar>
                        <el-tooltip
                          :content="isPlayerVerified(p.player) ? 'Верифікований' : 'Не верифікований'"
                          placement="top"
                          effect="dark"
                        >
                          <StatusBadge
                            :preset="isPlayerVerified(p.player) ? 'verified' : 'unverified'"
                            size="xs"
                            icon-only
                            class="absolute -bottom-2 -right-2 ring-2 ring-gray-900"
                          />
                        </el-tooltip>
                      </div>
                      <div class="flex min-w-0 flex-col">
                        <span
                          class="truncate text-[13px] font-semibold text-white
                                 transition-colors group-hover:text-primary"
                        >
                          {{ p.player.discordName || p.player.discordUsername || 'Без імені' }}
                        </span>
                        <span class="flex items-center gap-4 text-[11px] text-gray-500">
                          <span class="truncate">
                            {{ p.player.discordUsername ? `@${p.player.discordUsername}` : '—' }}
                          </span>
                          <span class="shrink-0 text-gray-400">· {{ formatPlayerRatingMmr(p.player.rating) }}</span>
                          <span v-if="playerPositionsLabel(p.player)" class="shrink-0">
                            · {{ playerPositionsLabel(p.player) }}
                          </span>
                        </span>
                      </div>
                    </RouterLink>

                    <!-- processing: new-MMR entry (placeholder = current rating); otherwise result chip -->
                    <div class="shrink-0">
                      <el-input-number
                        v-if="r.status === 'processing'"
                        v-model="mmrDrafts[r.id][p.player.id]"
                        :min="0"
                        :max="20000"
                        :step="100"
                        :controls="false"
                        size="small"
                        :placeholder="String(p.player.rating)"
                        class="vd-mmr-input"
                      />
                      <span v-else-if="p.resultMmr != null" class="vd-mmr-chip vd-mmr-chip--result">
                        {{ p.resultMmr }} MMR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- lifecycle actions (read-only once completed/cancelled) -->
              <footer
                v-if="r.status !== 'completed' && r.status !== 'cancelled'"
                class="mt-10 flex items-center justify-between gap-8 border-t border-white/8 pt-10"
              >
                <p
                  v-if="r.status === 'processing' && !canComplete(r)"
                  class="min-w-0 text-[11px] leading-snug text-gray-500"
                >
                  Вкажіть новий MMR кожному гравцю, щоб завершити
                </p>
                <span v-else />
                <div class="flex shrink-0 items-center gap-8">
                  <el-button
                    v-if="r.status === 'pending'"
                    type="primary"
                    size="small"
                    :loading="actioningId === r.id"
                    @click="handleProcess(r)"
                  >
                    Взяти в обробку
                  </el-button>
                  <el-button
                    v-if="r.status === 'processing'"
                    type="success"
                    size="small"
                    :loading="actioningId === r.id"
                    :disabled="!canComplete(r)"
                    @click="handleComplete(r)"
                  >
                    Завершити
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    :disabled="actioningId === r.id"
                    @click="handleCancel(r)"
                  >
                    Скасувати
                  </el-button>
                </div>
              </footer>
            </article>
          </div>
        </el-tab-pane>

        <!-- Слоти -->
        <el-tab-pane name="slots">
          <template #label>
            <span class="vd-tab-label">Слоти <span class="vd-tab-count">{{ slotRows.length }}</span></span>
          </template>

          <!-- Генерація слотів -->
          <section class="vd-gen">
            <div class="vd-gen__head">
              <PhClock :size="16" weight="duotone" class="text-primary" />
              <span class="vd-gen__title">Згенерувати слоти</span>
            </div>
            <div class="vd-gen__body">
              <div class="flex items-end gap-8">
                <div class="min-w-0 flex-1">
                  <label class="vd-gen__label">Часові вікна (по 30 хв)</label>
                  <el-select
                    v-model="selectedWindows"
                    multiple
                    filterable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="Оберіть слоти"
                    class="w-full"
                  >
                    <el-option
                      v-for="w in windowOptions"
                      :key="w.value"
                      :value="w.value"
                      :label="w.label"
                      :disabled="existingStarts.has(w.value)"
                    />
                  </el-select>
                </div>
                <el-button
                  type="primary"
                  :loading="generating"
                  :disabled="!canGenerate"
                  @click="handleGenerate"
                >
                  Створити
                </el-button>
              </div>
              <p class="vd-gen__hint">
                Оберіть одне або кілька 30-хвилинних вікон (у вашому часовому поясі). Наявні слоти вимкнені.
              </p>
            </div>
          </section>

          <div v-if="loading" class="vd-empty">Завантаження…</div>
          <div v-else-if="!slotRows.length" class="vd-empty">Немає слотів на цей день</div>
          <div v-else class="flex flex-col gap-8">
            <div v-for="s in slotRows" :key="s.id" class="vd-slot-row">
              <div class="flex min-w-0 items-center gap-10">
                <span class="font-mono text-[14px] text-white/90">{{ formatTimeRange(s.startsAt, s.endsAt) }}</span>
                <span v-if="s.booked && s.teamName" class="truncate text-[12px] text-gray-400">{{ s.teamName }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-8">
                <span class="vd-pill" :class="s.booked ? 'vd-pill--booked' : 'vd-pill--free'">
                  {{ s.booked ? 'Заброньовано' : 'Вільно' }}
                </span>
                <button
                  type="button"
                  class="vd-del"
                  :disabled="deletingId === s.id"
                  :title="s.booked ? 'Скасувати бронювання' : 'Видалити слот'"
                  @click="handleDeleteSlot(s)"
                >
                  <PhTrash :size="15" weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PhClock, PhTrash, PhUser, PhUsersThree } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import {
  formatPlayerRatingMmr,
  getPlayerDotaPositions,
  isPlayerVerified,
  resolvePublicOrApiUrl
} from '@/core/helpers'
import type {
  IVerificationDayData,
  TCompleteRequestPayload,
  TVerificationRequest,
  TVerificationRequestPlayer,
  TVerificationRequestStatus,
  TVerificationType
} from '@/services/verification.types'

const props = defineProps<{
  date: string | null
  data: IVerificationDayData | null
  loading?: boolean
}>()

const open = defineModel<boolean>()

// Emitted after a successful create/delete so the parent reloads the day (refreshing the
// drawer's `:data` and the calendar badge from a single source of truth).
const emit = defineEmits<{ refresh: [] }>()

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
    return [{
      id: r.slot.id,
      startsAt: r.slot.startsAt,
      endsAt: r.slot.endsAt,
      booked: true,
      teamName: r.team?.name ?? null
    }]
  })
  return [...free, ...booked].sort((a, b) => dayjs(a.startsAt).valueOf() - dayjs(b.startsAt).valueOf())
})

function formatTimeRange (startsAt: string, endsAt: string): string {
  return `${dayjs(startsAt).format('HH:mm')}–${dayjs(endsAt).format('HH:mm')}`
}

// «поз. 1, 2» suffix for the player meta line; empty when the player has no positions set.
function playerPositionsLabel (player: TVerificationRequestPlayer['player']): string {
  const positions = getPlayerDotaPositions(player)
  return positions.length ? `поз. ${positions.join(', ')}` : ''
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

// --- Request lifecycle (process / complete / cancel) -------------------------------------

// Id of the request whose action is in flight (drives per-row button loading/disabled state).
const actioningId = ref('')

// Per-player MMR drafts for `processing` requests, keyed `requestId -> playerId -> mmr`.
// Seeded (and pruned) from the day's requests so an `el-input-number` always has a live
// model object to bind to before the row renders.
const mmrDrafts = reactive<Record<string, Record<string, number | undefined>>>({})

watch(requests, (list) => {
  const activeIds = new Set<string>()
  for (const r of list) {
    if (r.status !== 'processing') continue
    activeIds.add(r.id)
    const existing = mmrDrafts[r.id] ?? {}
    const next: Record<string, number | undefined> = {}
    for (const p of r.players) {
      // Preserve an in-progress edit; otherwise seed from any MMR the BE already recorded.
      next[p.player.id] = p.player.id in existing ? existing[p.player.id] : (p.resultMmr ?? undefined)
    }
    mmrDrafts[r.id] = next
  }
  for (const id of Object.keys(mmrDrafts)) {
    if (!activeIds.has(id)) delete mmrDrafts[id]
  }

  console.log(mmrDrafts)
}, { immediate: true })

// Complete is blocked until every player of the request has a valid (finite, ≥ 0) MMR.
function canComplete (r: TVerificationRequest): boolean {
  const draft = mmrDrafts[r.id]
  if (!draft) return false
  return r.players.every((p) => {
    const v = draft[p.player.id]
    return typeof v === 'number' && Number.isFinite(v) && v >= 0
  })
}

async function handleProcess (r: TVerificationRequest): Promise<void> {
  actioningId.value = r.id
  try {
    await verificationService.processRequest(r.id)
    ElMessage.success('Заявку взято в обробку')
    emit('refresh')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити заявку'))
  } finally {
    actioningId.value = ''
  }
}

async function handleComplete (r: TVerificationRequest): Promise<void> {
  if (!canComplete(r)) return
  const draft = mmrDrafts[r.id]
  const payload: TCompleteRequestPayload = {
    results: r.players.map((p) => ({ playerId: p.player.id, mmr: draft[p.player.id] as number }))
  }
  actioningId.value = r.id
  try {
    await verificationService.completeRequest(r.id, payload)
    ElMessage.success('Заявку завершено')
    emit('refresh')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося завершити заявку'))
  } finally {
    actioningId.value = ''
  }
}

async function handleCancel (r: TVerificationRequest): Promise<void> {
  try {
    await ElMessageBox.confirm(
      'Скасувати цю заявку? Слот буде звільнено.',
      'Скасування заявки',
      { type: 'warning', confirmButtonText: 'Так, скасувати', cancelButtonText: 'Назад' }
    )
  } catch {
    return // user dismissed the confirm
  }
  actioningId.value = r.id
  try {
    await verificationService.cancelRequest(r.id)
    ElMessage.success('Заявку скасовано')
    emit('refresh')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати заявку'))
  } finally {
    actioningId.value = ''
  }
}

// --- Slot management (generate / delete) -------------------------------------------------

// The 48 half-hour windows of a day, as local `HH:mm` options: 00:00–00:30 … 23:30–00:00.
const windowOptions = Array.from({ length: 48 }, (_, i) => {
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const start = fmt(i * 30)
  return { value: start, label: `${start}–${fmt(i * 30 + 30)}` }
})

const selectedWindows = ref<string[]>([])
const generating = ref(false)
const deletingId = ref('')

// Start times (local `HH:mm`) of slots that already exist this day — disabled in the picker
// so the admin can't create duplicates.
const existingStarts = computed(() => new Set(slotRows.value.map((s) => dayjs(s.startsAt).format('HH:mm'))))

const canGenerate = computed(() => !!props.date && selectedWindows.value.length > 0)

async function handleGenerate (): Promise<void> {
  if (!props.date || !canGenerate.value) return
  const date = props.date
  // One call for all windows: each selected local HH:mm becomes an ISO start, and the
  // backend publishes a 30-min slot per start.
  const starts = selectedWindows.value.map(
    (start) => dayjs(`${date} ${start}`, 'YYYY-MM-DD HH:mm').toISOString()
  )
  generating.value = true
  try {
    const created = await verificationService.createSlots({ starts })
    ElMessage.success(`Створено слотів: ${created.length}`)
    selectedWindows.value = []
    emit('refresh')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити слоти'))
  } finally {
    generating.value = false
  }
}

async function handleDeleteSlot (slot: ISlotRow): Promise<void> {
  if (slot.booked) {
    try {
      await ElMessageBox.confirm(
        'Цей слот заброньовано. Видалення також скасує заявку команди. Продовжити?',
        'Скасувати бронювання',
        { type: 'warning', confirmButtonText: 'Так, скасувати', cancelButtonText: 'Назад' }
      )
    } catch {
      return // user dismissed the confirm
    }
  }
  deletingId.value = slot.id
  try {
    await verificationService.deleteSlot(slot.id)
    ElMessage.success(slot.booked ? 'Бронювання скасовано' : 'Слот видалено')
    emit('refresh')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити слот'))
  } finally {
    deletingId.value = ''
  }
}

// Reset to the first tab and clear the generate form each time the drawer opens.
watch(open, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'requests'
    selectedWindows.value = []
  }
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

.vd-player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.vd-player-row:hover {
  border-color: rgba(34, 211, 238, 0.25);
  background: rgba(255, 255, 255, 0.05);
}

.vd-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(107 114 128);
}

.vd-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: rgb(107 114 128);
}

.vd-gen {
  margin-bottom: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.045) 0%, rgba(0, 0, 0, 0.22) 100%);
}

.vd-gen__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.vd-gen__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(209 213 219);
}

.vd-gen__body {
  padding: 14px;
}

.vd-gen__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(156 163 175);
}

.vd-gen__hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(107 114 128);
}

.vd-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgb(248 113 113 / 0.85);
  border: 1px solid rgba(248, 113, 113, 0.25);
  background: rgba(248, 113, 113, 0.08);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.vd-del:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
}

.vd-del:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dark theming for the el-time-select inputs (the popper is teleported and keeps EP defaults). */
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

:deep(.el-input__inner::placeholder) {
  color: theme('colors.gray.500');
}

:deep(.el-select__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none !important;
  border-radius: 10px;
  min-height: 40px;
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

:deep(.el-select__selected-item) {
  color: white;
}

.vd-mmr-input {
  width: 104px;
}

.vd-mmr-input :deep(.el-input__inner) {
  text-align: left;
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

.vd-mmr-chip--result {
  color: #6ee7b7;
  background: rgb(16 185 129 / 0.12);
  border-color: rgb(16 185 129 / 0.3);
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
