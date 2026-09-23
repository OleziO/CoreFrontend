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
      <div class="vd-head">
        <span class="sys-label !text-[9px]">// День верифікації</span>
        <h2 class="vd-head__title">{{ headerDate }}</h2>
        <p class="vd-head__meta">
          <span class="vd-head__weekday">{{ weekdayLabel }}</span>
          <span class="vd-head__sep" aria-hidden="true" />
          час у вашому часовому поясі · 24 год
        </p>
      </div>
    </template>

    <div class="custom-scroll vd-scroll h-full overflow-y-auto pb-12">
      <el-tabs v-model="activeTab" class="vd-tabs">
        <!-- Заявки -->
        <el-tab-pane name="requests">
          <template #label>
            <span class="vd-tab-label">
              Заявки
              <span class="vd-tab-count" :class="{ 'is-lit': requests.length }">{{ requests.length }}</span>
            </span>
          </template>

          <div v-if="loading" class="vd-empty">Завантаження…</div>
          <div v-else-if="!requests.length" class="vd-empty">Немає заявок на цей день</div>
          <div v-else class="flex flex-col gap-12">
            <article
              v-for="r in requests"
              :key="r.id"
              class="vd-card hud-panel"
              :style="{ '--vd-accent': statusAccent[r.status] }"
            >
              <header class="flex items-start justify-between gap-10">
                <div class="flex min-w-0 items-center gap-10">
                  <span class="vd-team-logo">
                    <el-image
                      v-if="r.team?.logoUrl"
                      class="size-full"
                      :src="resolvePublicOrApiUrl(r.team.logoUrl)"
                      fit="cover"
                    />
                    <PhUsersThree v-else :size="16" weight="bold" />
                  </span>
                  <div class="min-w-0">
                    <h3 class="vd-team-name">{{ r.team?.name || 'Без назви' }}</h3>
                    <p class="vd-time">
                      <PhClock :size="11" weight="bold" class="shrink-0" />
                      <span v-if="r.slot">{{ formatTimeRange(r.slot.startsAt, r.slot.endsAt) }}</span>
                      <span v-else class="vd-time--none">слот не призначено</span>
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 flex-wrap items-center justify-end gap-4">
                  <span class="vd-pill" :class="requestStatusMeta[r.status].class">
                    {{ requestStatusMeta[r.status].label }}
                  </span>
                  <span class="vd-pill" :class="typeMeta[r.type].class">{{ typeMeta[r.type].label }}</span>
                </div>
              </header>

              <div class="vd-card__section">
                <p class="vd-section-label">
                  Гравці <span class="vd-section-label__count">{{ String(r.players.length).padStart(2, '0') }}</span>
                </p>

                <div class="mt-8 flex flex-col gap-6">
                  <div v-for="p in r.players" :key="p.id" class="vd-player-row">
                    <!-- Identity opens the profile in a new tab so in-progress MMR drafts survive. -->
                    <RouterLink
                      :to="{ name: routeNames.player, params: { id: p.player.id } }"
                      target="_blank"
                      class="vd-player group"
                    >
                      <div class="relative shrink-0">
                        <!-- Own tile instead of el-avatar: an explicit fallback icon for a
                             missing or dead avatar URL, and the same ring as the other tiles. -->
                        <span class="vd-player__avatar">
                          <el-image
                            v-if="resolvePublicOrApiUrl(p.player.avatarUrl)"
                            class="size-full"
                            :src="resolvePublicOrApiUrl(p.player.avatarUrl)"
                            fit="cover"
                          >
                            <template #error>
                              <PhUser :size="16" weight="bold" />
                            </template>
                          </el-image>
                          <PhUser v-else :size="16" weight="bold" />
                        </span>
                        <el-tooltip
                          :content="isPlayerVerified(p.player) ? 'Верифікований' : 'Не верифікований'"
                          placement="top"
                          effect="dark"
                        >
                          <StatusBadge
                            :preset="isPlayerVerified(p.player) ? 'verified' : 'unverified'"
                            size="xs"
                            icon-only
                            class="absolute -bottom-2 -right-2"
                          />
                        </el-tooltip>
                      </div>
                      <div class="flex min-w-0 flex-col gap-3">
                        <span class="vd-player__name">
                          {{ p.player.discordName || p.player.discordUsername || 'Без імені' }}
                        </span>
                        <span class="vd-player__meta">
                          <span class="truncate">
                            {{ p.player.discordUsername ? `@${p.player.discordUsername}` : '—' }}
                          </span>
                          <span class="vd-player__mmr">{{ formatPlayerRatingMmr(p.player.rating) }}</span>
                          <span v-if="playerPositionsLabel(p.player)" class="shrink-0">
                            · {{ playerPositionsLabel(p.player) }}
                          </span>
                        </span>
                      </div>
                    </RouterLink>

                    <!-- processing: new-MMR entry (placeholder = current rating); otherwise result chip -->
                    <div class="vd-player__side">
                      <template v-if="r.status === 'processing'">
                        <el-input-number
                          v-model="mmrDrafts[r.id][p.player.id]"
                          :min="0"
                          :max="20000"
                          :step="100"
                          :controls="false"
                          size="small"
                          :placeholder="String(p.player.rating)"
                          class="vd-mmr-input"
                        />
                        <span
                          v-if="draftDelta(r, p) !== null"
                          class="vd-delta"
                          :class="(draftDelta(r, p) as number) > 0 ? 'is-up' : 'is-down'"
                        >
                          {{ formatDelta(draftDelta(r, p) as number) }}
                        </span>
                      </template>
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
                class="vd-card__foot"
              >
                <p
                  class="vd-foot-hint"
                  :class="{ 'is-ready': r.status === 'processing' && canComplete(r) }"
                >
                  <template v-if="r.status === 'pending'">Заявка чекає на обробку</template>
                  <template v-else-if="canComplete(r)">Готово до завершення</template>
                  <template v-else>Вкажіть новий MMR кожному гравцю</template>
                </p>
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
            <span class="vd-tab-label">
              Слоти
              <span class="vd-tab-count" :class="{ 'is-lit': slotRows.length }">{{ slotRows.length }}</span>
            </span>
          </template>

          <!-- Генерація слотів -->
          <section class="vd-gen hud-panel">
            <div class="vd-gen__head">
              <PhClock :size="14" weight="bold" class="text-primary" />
              <span class="vd-gen__title">// Згенерувати слоти</span>
            </div>
            <div class="vd-gen__body">
              <div class="flex items-end gap-8">
                <div class="min-w-0 flex-1">
                  <label class="vd-gen__label">Часові вікна · по 30 хв</label>
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
                  <PhPlus v-if="!generating" :size="14" weight="bold" class="mr-6 shrink-0" />
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
          <div v-else class="flex flex-col gap-6">
            <div
              v-for="s in slotRows"
              :key="s.id"
              class="vd-slot-row"
              :class="s.booked ? 'vd-slot-row--booked' : 'vd-slot-row--free'"
            >
              <div class="flex min-w-0 items-center gap-10">
                <i class="vd-slot-dot" aria-hidden="true" />
                <span class="vd-slot-time">{{ formatTimeRange(s.startsAt, s.endsAt) }}</span>
                <span v-if="s.booked && s.teamName" class="vd-slot-team">{{ s.teamName }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-8">
                <span class="vd-pill" :class="s.booked ? 'vd-pill--booked' : 'vd-pill--free'">
                  {{ s.booked ? 'Заброньовано' : 'Вільно' }}
                </span>
                <el-button
                  type="danger"
                  size="small"
                  class="btn-icon"
                  :disabled="deletingId === s.id"
                  :title="s.booked ? 'Скасувати бронювання' : 'Видалити слот'"
                  :aria-label="s.booked ? 'Скасувати бронювання' : 'Видалити слот'"
                  @click="handleDeleteSlot(s)"
                >
                  <PhTrash :size="15" weight="bold" />
                </el-button>
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
import { PhClock, PhPlus, PhTrash, PhUser, PhUsersThree } from '@phosphor-icons/vue'
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
const verificationStore = useVerificationStore()

const activeTab = ref<'requests' | 'slots'>('requests')

const headerDate = computed(() => (props.date ? dayjs(props.date).format('DD.MM.YYYY') : ''))

const weekdayFormat = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' })
const weekdayLabel = computed(() => (props.date ? weekdayFormat.format(dayjs(props.date).toDate()) : ''))

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

// Left accent bar of a request card — same hue family as its status pill.
const statusAccent: Record<TVerificationRequestStatus, string> = {
  pending: '245, 158, 11',
  processing: 'var(--ds-primary-rgb)',
  completed: '34, 197, 94',
  cancelled: '239, 68, 68'
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
}, { immediate: true })

// Signed difference between the drafted MMR and the player's current rating; null while
// the field is empty or equals the current value (nothing worth highlighting).
function draftDelta (r: TVerificationRequest, p: TVerificationRequestPlayer): number | null {
  const v = mmrDrafts[r.id]?.[p.player.id]
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const delta = v - p.player.rating
  return delta === 0 ? null : delta
}

const mmrFormat = new Intl.NumberFormat('uk-UA')

function formatDelta (delta: number): string {
  return `${delta > 0 ? '+' : '−'}${mmrFormat.format(Math.abs(delta))}`
}

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
  const day = props.date
  if (!day) return
  actioningId.value = r.id
  try {
    await verificationStore.processRequest(day, r.id)
    ElMessage.success('Заявку взято в обробку')
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити заявку'))
  } finally {
    actioningId.value = ''
  }
}

async function handleComplete (r: TVerificationRequest): Promise<void> {
  const day = props.date
  if (!day) return
  if (!canComplete(r)) return
  const draft = mmrDrafts[r.id]
  const payload: TCompleteRequestPayload = {
    results: r.players.map((p) => ({ playerId: p.player.id, mmr: draft[p.player.id] as number }))
  }
  actioningId.value = r.id
  try {
    await verificationStore.completeRequest(day, r.id, payload)
    ElMessage.success('Заявку завершено')
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
  const day = props.date
  if (!day) return
  actioningId.value = r.id
  try {
    await verificationStore.cancelRequest(day, r.id)
    ElMessage.success('Заявку скасовано')
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
    const created = await verificationStore.createSlots(date, starts)
    ElMessage.success(`Створено слотів: ${created}`)
    selectedWindows.value = []
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
  const day = props.date
  if (!day) return
  deletingId.value = slot.id
  try {
    await verificationStore.deleteSlot(day, slot.id)
    ElMessage.success(slot.booked ? 'Бронювання скасовано' : 'Слот видалено')
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
/* ─── Head ───────────────────────────────────────────────────────────────── */
.vd-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 8px;
}

.vd-head__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 26px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
  font-variant-numeric: tabular-nums;
}

.vd-head__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 1.3;
  color: var(--ds-text-faint);
}

.vd-head__weekday {
  text-transform: capitalize;
  color: var(--ds-text-muted);
}

.vd-head__sep {
  width: 1px;
  height: 10px;
  background: rgba(var(--ds-primary-rgb), 0.35);
}

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
.vd-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.vd-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.05);
  text-shadow: none;
  font-variant-numeric: tabular-nums;
}

.vd-tab-count.is-lit {
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.1);
}

:deep(.vd-tabs .el-tabs__content) {
  padding-top: 14px;
}

/* ─── Request card ───────────────────────────────────────────────────────── */
.vd-card {
  --vd-accent: var(--ds-primary-rgb);

  border-radius: 12px;
  padding: 14px 16px;
  overflow: hidden;
}

/* Status accent: a 2px neon bar on the left edge. */
.vd-card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgba(var(--vd-accent), 0.9);
  box-shadow: 0 0 10px rgba(var(--vd-accent), 0.6);
  pointer-events: none;
}

.vd-card__section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--ds-primary-rgb), 0.1);
}

.vd-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--ds-primary-rgb), 0.1);
}

.vd-team-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
}

.vd-team-name {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
}

.vd-time {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 4px 0 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ds-text-muted);
  font-variant-numeric: tabular-nums;
}

.vd-time--none {
  color: var(--ds-text-faint);
  letter-spacing: 0.02em;
  text-transform: none;
}

.vd-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.vd-section-label__count {
  color: var(--ds-primary);
}

/* ─── Player rows ────────────────────────────────────────────────────────── */
.vd-player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(7, 8, 15, 0.35);
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.vd-player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.vd-player:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: 2px;
  border-radius: 8px;
}

.vd-player__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border-radius: 9999px;
  color: var(--ds-text-faint);
  background: var(--ds-elevated-surface);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.vd-player__avatar :deep(.el-image__error),
.vd-player__avatar :deep(.el-image__placeholder) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--ds-text-faint);
}

.vd-player__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.1;
  color: #fff;
  transition: color var(--ds-duration-fast) ease;
}

.vd-player__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 11px;
  line-height: 1.1;
  color: var(--ds-text-faint);
}

.vd-player__mmr {
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ds-text-muted);
  font-variant-numeric: tabular-nums;
}

.vd-player__mmr::before {
  content: '·';
  margin-right: 5px;
  color: var(--ds-text-faint);
}

.vd-player__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

/* Drafted change vs the current rating. */
.vd-delta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.vd-delta.is-up {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.vd-delta.is-down {
  color: var(--ds-pink);
}

.vd-mmr-input {
  width: 104px;
}

.vd-mmr-input :deep(.el-input__inner) {
  text-align: left;
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.vd-mmr-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.05);
  font-variant-numeric: tabular-nums;
}

.vd-mmr-chip--result {
  color: #6ee7b7;
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
}

/* Footer hint — says what the card is waiting for; lights up when complete is possible. */
.vd-foot-hint {
  margin: 0;
  min-width: 0;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;
}

.vd-foot-hint.is-ready {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

/* ─── Empty ──────────────────────────────────────────────────────────────── */
.vd-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

/* ─── Slot generator ─────────────────────────────────────────────────────── */
.vd-gen {
  margin-bottom: 14px;
  border-radius: 12px;
  overflow: hidden;
}

.vd-gen__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.1);
}

.vd-gen__title {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.vd-gen__body {
  padding: 14px;
}

.vd-gen__label {
  display: block;
  margin-bottom: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.vd-gen__hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

/* ─── Slot rows ──────────────────────────────────────────────────────────── */
.vd-slot-row {
  --vd-slot-rgb: 34, 197, 94;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(7, 8, 15, 0.35);
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.vd-slot-row--booked {
  --vd-slot-rgb: 245, 158, 11;
}

.vd-slot-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 2px;
  background: rgb(var(--vd-slot-rgb));
  box-shadow: 0 0 8px rgba(var(--vd-slot-rgb), 0.6);
}

.vd-slot-time {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
}

.vd-slot-team {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ds-text-muted);
}

/* ─── Pills — mono status chips, tokenized ───────────────────────────────── */
.vd-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 5px;
  border: 1px solid transparent;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.vd-pill--pending {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fcd34d;
}

.vd-pill--processing {
  background: rgba(var(--ds-primary-rgb), 0.12);
  border-color: rgba(var(--ds-primary-rgb), 0.4);
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.vd-pill--completed {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.35);
  color: #6ee7b7;
}

.vd-pill--cancelled {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

/* Slots follow the calendar legend: free = green, booked = amber. */
.vd-pill--free {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.35);
  color: #6ee7b7;
}

.vd-pill--booked {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fcd34d;
}

.vd-pill--type-first {
  background: rgba(var(--ds-secondary-rgb), 0.14);
  border-color: rgba(var(--ds-secondary-rgb), 0.35);
  color: #c4b5fd;
}

.vd-pill--type-mmr {
  background: rgba(56, 189, 248, 0.14);
  border-color: rgba(56, 189, 248, 0.35);
  color: #93c5fd;
}

/* ─── Scrollbar ──────────────────────────────────────────────────────────── */
.vd-scroll::-webkit-scrollbar {
  width: 6px;
}

.vd-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.vd-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 3px;
}

.vd-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--ds-primary-rgb), 0.4);
}

/* ─── Drawer shell ───────────────────────────────────────────────────────── */
:deep(.verification-day-drawer.el-drawer) {
  background: linear-gradient(
    180deg,
    var(--ds-elevated-surface) 0%,
    var(--ds-surface) 40%,
    var(--ds-background) 100%
  ) !important;
}

:deep(.verification-day-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 14px 24px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

:deep(.verification-day-drawer .el-drawer__body) {
  padding: 4px 20px 24px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

:deep(.verification-day-drawer .el-drawer__close-btn) {
  color: var(--ds-text-faint);
  font-size: 18px;
  transition: color var(--ds-duration-fast) ease;
}

/* ─── Pointer-only hover ─────────────────────────────────────────────────── */
@media (hover: hover) and (pointer: fine) {
  .vd-player-row:hover,
  .vd-slot-row:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.25);
    background: rgba(var(--ds-primary-rgb), 0.04);
  }

  .vd-player:hover .vd-player__name {
    color: var(--ds-primary);
  }

  :deep(.verification-day-drawer .el-drawer__close-btn:hover) {
    color: #fff;
  }
}
</style>
