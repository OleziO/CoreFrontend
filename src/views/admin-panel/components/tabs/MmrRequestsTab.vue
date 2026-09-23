<template>
  <div class="flex h-full flex-col gap-12 overflow-hidden">
    <!-- Toolbar: status filter + summary -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-16 gap-y-8">
      <div class="mmr-filters" role="group" aria-label="Статус запитів">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="mmr-filter"
          :class="{ 'is-active': activeFilter === f.value }"
          :aria-pressed="activeFilter === f.value"
          @click="setFilter(f.value)"
        >
          <component :is="f.icon" :size="14" weight="bold" class="shrink-0" />
          {{ f.label }}
          <span
            v-if="f.value === 'pending' && mmrStore.pendingCount"
            class="mmr-filter__count"
          >
            {{ mmrStore.pendingCount }}
          </span>
        </button>
      </div>

      <span class="sys-label sys-label--muted !text-[9px]" aria-live="polite">
        {{ summaryLabel }}
      </span>
    </div>

    <!-- Queue -->
    <div
      v-loading="isLoading"
      class="custom-scroll mmr-queue min-h-0 flex-1 overflow-y-auto"
    >
      <transition-group
        v-if="mmrStore.requests.length"
        name="mmr-row"
        tag="ul"
        class="mmr-list"
      >
        <li
          v-for="(row, index) in mmrStore.requests"
          :key="row.id"
          class="mmr-row hud-panel"
          :class="`is-${row.status}`"
        >
          <!-- 01 · identity -->
          <div class="mmr-row__who">
            <span class="mmr-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <RouterLink
              :to="{ name: routeNames.player, params: { id: row.playerId } }"
              class="mmr-player no-underline"
            >
              <span class="mmr-player__avatar">
                <el-image
                  v-if="row.player?.avatarUrl"
                  class="size-full"
                  :src="row.player.avatarUrl"
                  fit="cover"
                >
                  <template #error>
                    <PhUser :size="16" weight="bold" />
                  </template>
                </el-image>
                <PhUser v-else :size="16" weight="bold" />
              </span>
              <span class="flex min-w-0 flex-col gap-3">
                <span class="mmr-player__name">
                  {{ row.player?.discordName || row.player?.discordUsername || row.playerId }}
                </span>
                <span class="mmr-player__meta">
                  <span v-if="row.player?.discordUsername" class="truncate">@{{ row.player.discordUsername }}</span>
                  <span v-if="row.team" class="mmr-player__team">
                    <PhUsersThree :size="11" weight="bold" class="shrink-0" />
                    <span class="truncate">{{ row.team.name }}</span>
                  </span>
                  <span v-else class="mmr-player__team mmr-player__team--none">без команди</span>
                </span>
              </span>
            </RouterLink>
          </div>

          <!-- 02 · readout -->
          <div class="mmr-readout">
            <div class="mmr-readout__values">
              <span class="mmr-readout__old">{{ formatMmr(row.oldMmr) }}</span>
              <PhArrowRight :size="12" weight="bold" class="mmr-readout__arrow shrink-0" />
              <span class="mmr-readout__new">{{ formatMmr(row.newMmr) }}</span>
              <span class="mmr-readout__chip" :class="deltaClass(row)">{{ deltaLabel(row) }}</span>
            </div>
            <span class="mmr-readout__date">
              <PhClock :size="10" weight="bold" class="shrink-0" />
              {{ formatCreatedAt(row.createdAt) }}
              <span class="mmr-readout__time">{{ formatCreatedTime(row.createdAt) }}</span>
            </span>
          </div>

          <!-- 03 · proofs -->
          <div class="mmr-proofs" :aria-label="`Докази: ${row.proofs?.length ?? 0}`">
            <button
              v-for="(proof, idx) in row.proofs"
              :key="proof.id"
              type="button"
              class="mmr-proof"
              :aria-label="`Скріншот ${idx + 1}`"
              @click="openCarousel(row, idx as number)"
            >
              <img :src="proof.url" alt="" class="size-full object-cover">
              <span class="mmr-proof__index">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="mmr-proof__zoom" aria-hidden="true">
                <PhMagnifyingGlassPlus :size="14" weight="bold" />
              </span>
            </button>
            <span v-if="!row.proofs?.length" class="mmr-proof mmr-proof--none">
              <PhImageBroken :size="14" weight="bold" />
              немає
            </span>
          </div>

          <!-- 04 · actions -->
          <div class="mmr-actions">
            <template v-if="row.status === 'pending'">
              <el-button
                type="success"
                size="small"
                :loading="processingId === row.id"
                :disabled="!!processingId && processingId !== row.id"
                @click="approve(row)"
              >
                <PhCheck v-if="processingId !== row.id" :size="14" weight="bold" class="mr-6 shrink-0" />
                Схвалити
              </el-button>
              <el-button
                type="danger"
                size="small"
                plain
                :loading="processingId === row.id"
                :disabled="!!processingId && processingId !== row.id"
                @click="reject(row)"
              >
                <PhX v-if="processingId !== row.id" :size="14" weight="bold" class="mr-6 shrink-0" />
                Відхилити
              </el-button>
            </template>
            <StatusBadge
              v-else
              size="sm"
              :tone="row.status === 'approved' ? 'success' : 'error'"
              :icon="row.status === 'approved' ? PhCheckCircle : PhXCircle"
              :label="statusLabel(row.status)"
            />
          </div>
        </li>
      </transition-group>

      <!-- Empty -->
      <div v-else-if="!isLoading" class="mmr-empty hud-panel">
        <el-empty :image-size="120" :description="emptyDescription">
          <template #description>
            <span class="sys-label !text-[9px]">// Черга порожня</span>
            <p class="mmr-empty__text">{{ emptyDescription }}</p>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import {
  PhUser, PhUsersThree, PhArrowRight, PhCheck, PhX, PhCheckCircle, PhXCircle, PhHourglass, PhClock,
  PhMagnifyingGlassPlus, PhImageBroken
} from '@phosphor-icons/vue'
import { ElMessage } from 'element-plus'
import { routeNames } from '@/router/route-names'
import type { TMmrUpdateRequest } from '@/views/players/mmr-requests.service'

type TFilter = 'pending' | 'approved' | 'rejected'

const filters: { value: TFilter; label: string; icon: Component }[] = [
  { value: 'pending', label: 'Очікують', icon: PhHourglass },
  { value: 'approved', label: 'Схвалені', icon: PhCheckCircle },
  { value: 'rejected', label: 'Відхилені', icon: PhXCircle }
]

const mmrStore = useMmrRequestsStore()

const activeFilter = ref<TFilter>('pending')
const isLoading = ref(false)
const processingId = ref<string | null>(null)

const { open: openAppModal } = useAppModals()

const mmrFormat = new Intl.NumberFormat('uk-UA')

function formatMmr (value: number | null | undefined): string {
  return typeof value === 'number' ? mmrFormat.format(value) : '—'
}

function deltaOf (row: TMmrUpdateRequest): number {
  return row.newMmr - row.oldMmr
}

function deltaLabel (row: TMmrUpdateRequest): string {
  const d = deltaOf(row)
  if (d === 0) return '0'
  return `${d > 0 ? '+' : '−'}${mmrFormat.format(Math.abs(d))}`
}

function deltaClass (row: TMmrUpdateRequest): string {
  const d = deltaOf(row)
  if (d > 0) return 'is-up'
  if (d < 0) return 'is-down'
  return ''
}

// Ukrainian plural form: 1 запит / 2–4 запити / 5+ запитів (with the 11–14 exception).
function ukPlural (n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const activeFilterLabel = computed(
  () => filters.find((f) => f.value === activeFilter.value)?.label.toLowerCase() ?? ''
)

const summaryLabel = computed(() => {
  if (isLoading.value) return 'Завантаження…'
  const n = mmrStore.requests.length
  if (!n) return `Немає запитів · ${activeFilterLabel.value}`
  return `${n} ${ukPlural(n, 'запит', 'запити', 'запитів')} · ${activeFilterLabel.value}`
})

const emptyDescription = computed(() => {
  if (activeFilter.value === 'pending') return 'Усі запити на зміну MMR розглянуто'
  return `Немає запитів зі статусом «${activeFilterLabel.value}»`
})

async function fetchRequests () {
  isLoading.value = true
  try {
    await mmrStore.fetchRequests(activeFilter.value)
  } catch {
    ElMessage.error('Не вдалося завантажити запити')
  } finally {
    isLoading.value = false
  }
}

async function setFilter (filter: TFilter) {
  if (activeFilter.value === filter) return
  activeFilter.value = filter
  await fetchRequests()
}

async function approve (row: TMmrUpdateRequest) {
  if (processingId.value) return
  processingId.value = row.id
  try {
    await mmrStore.approve(row.id)
    ElMessage.success('Запит схвалено')
  } catch {
    ElMessage.error('Не вдалося схвалити запит')
  } finally {
    processingId.value = null
  }
}

async function reject (row: TMmrUpdateRequest) {
  if (processingId.value) return
  processingId.value = row.id
  try {
    await mmrStore.reject(row.id)
    ElMessage.success('Запит відхилено')
  } catch {
    ElMessage.error('Не вдалося відхилити запит')
  } finally {
    processingId.value = null
  }
}

function openCarousel (row: TMmrUpdateRequest, idx: number) {
  openAppModal('MmrProofsLightboxModal', { proofs: row.proofs, initialIndex: idx })
}

function formatCreatedAt (dateStr: string): string {
  if (!dateStr) return '—'
  return dayjs(dateStr).format('DD.MM.YYYY')
}

function formatCreatedTime (dateStr: string): string {
  if (!dateStr) return ''
  return dayjs(dateStr).format('HH:mm')
}

function statusLabel (status: string): string {
  if (status === 'approved') return 'Схвалено'
  if (status === 'rejected') return 'Відхилено'
  return status
}

onMounted(fetchRequests)
</script>

<style scoped lang="scss">
// ─── Status filter chips ────────────────────────────────────────────────────
.mmr-filters {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(7, 8, 15, 0.45);
}

.mmr-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease;

  &.is-active {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.1);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35), var(--ds-glow-primary-soft);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 1px;
  }
}

.mmr-filter__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-pink-rgb), 0.4);
  background: rgba(var(--ds-pink-rgb), 0.14);
  font-size: 9px;
  letter-spacing: 0;
  color: var(--ds-pink);
  text-shadow: none;
  font-variant-numeric: tabular-nums;
}

// ─── Queue list ─────────────────────────────────────────────────────────────
.mmr-queue {
  // room for the neon halo of the last card and the scrollbar
  padding: 2px 6px 12px 2px;
}

.mmr-list {
  @apply m-0 flex list-none flex-col gap-10 p-0;
}

// One request = one card. Four zones on a grid; below md they stack.
.mmr-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 12px 16px 12px 14px;
  border-radius: 12px;
  overflow: hidden;

  // Status accent bar on the left edge.
  --mmr-accent: var(--ds-primary-rgb);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 2px;
    border-radius: 0 2px 2px 0;
    background: rgba(var(--mmr-accent), 0.9);
    box-shadow: 0 0 10px rgba(var(--mmr-accent), 0.6);
    pointer-events: none;
  }

  &.is-pending {
    --mmr-accent: 245, 158, 11;
  }

  &.is-approved {
    --mmr-accent: 34, 197, 94;
  }

  &.is-rejected {
    --mmr-accent: 239, 68, 68;
  }
}

@media (max-width: 1100px) {
  .mmr-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'who readout'
      'proofs actions';
    row-gap: 12px;
  }

  .mmr-row__who { grid-area: who; }
  .mmr-readout { grid-area: readout; }
  .mmr-proofs { grid-area: proofs; }
  .mmr-actions { grid-area: actions; }
}

// Row enter / leave (approve or reject removes the card).
.mmr-row-enter-active {
  transition: opacity var(--ds-duration-base) var(--ds-ease-out), transform var(--ds-duration-base) var(--ds-ease-out);
}

.mmr-row-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.mmr-row-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.mmr-row-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.mmr-row-move {
  transition: transform var(--ds-duration-base) var(--ds-ease-in-out);
}

// ─── 01 · identity ──────────────────────────────────────────────────────────
.mmr-row__who {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mmr-row__index {
  flex-shrink: 0;
  width: 18px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
}

.mmr-player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: inherit;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
    border-radius: 6px;
  }
}

.mmr-player__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10px;
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
  transition: box-shadow var(--ds-duration-fast) ease;

  :deep(.el-image__error) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--ds-text-faint);
  }
}

.mmr-player__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.92);
  transition: color var(--ds-duration-fast) ease;
}

.mmr-player__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  line-height: 1.1;
  color: var(--ds-text-faint);
}

.mmr-player__team {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: var(--ds-text-muted);

  &--none {
    color: rgba(255, 255, 255, 0.3);
  }
}

// ─── 02 · readout ───────────────────────────────────────────────────────────
.mmr-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  white-space: nowrap;
}

.mmr-readout__values {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.mmr-readout__old {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  color: var(--ds-text-faint);
}

.mmr-readout__arrow {
  color: rgba(var(--ds-primary-rgb), 0.55);
}

.mmr-readout__new {
  font-family: var(--ds-font-display);
  font-size: 18px;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #fff;
}

.mmr-readout__chip {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--ds-text-muted);

  &.is-up {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.35);
    background: rgba(var(--ds-primary-rgb), 0.08);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &.is-down {
    color: var(--ds-pink);
    border-color: rgba(var(--ds-pink-rgb), 0.35);
    background: rgba(var(--ds-pink-rgb), 0.08);
  }
}

.mmr-readout__date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
}

.mmr-readout__time {
  color: rgba(255, 255, 255, 0.3);
}

// ─── 03 · proofs ────────────────────────────────────────────────────────────
.mmr-proofs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.mmr-proof {
  position: relative;
  display: inline-flex;
  width: 96px;
  height: 54px;
  flex-shrink: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 8px;
  background: rgba(7, 8, 15, 0.45);
  cursor: zoom-in;
  transition: border-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 1px;
  }

  &--none {
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.1);
    background: transparent;
    cursor: default;
    font-family: var(--ds-font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
  }
}

.mmr-proof__index {
  position: absolute;
  left: 6px;
  bottom: 4px;
  font-family: var(--ds-font-mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  color: var(--ds-primary);
  text-shadow: 0 0 6px rgba(7, 8, 15, 0.95), var(--ds-neon-text-subtle);
}

// Zoom hint — fades in over the thumb on pointer hover.
.mmr-proof__zoom {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(7, 8, 15, 0.45);
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease;
}

// ─── 04 · actions ───────────────────────────────────────────────────────────
.mmr-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

// ─── Empty ──────────────────────────────────────────────────────────────────
.mmr-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  border-radius: 12px;
}

.mmr-empty__text {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .mmr-filter:not(.is-active):hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.05);
  }

  .mmr-player:hover .mmr-player__name {
    color: var(--ds-primary);
  }

  .mmr-player:hover .mmr-player__avatar {
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.6), var(--ds-glow-primary-soft);
  }

  .mmr-proof:not(.mmr-proof--none):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    box-shadow: var(--ds-glow-primary-soft);

    .mmr-proof__zoom {
      opacity: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .mmr-row-enter-active,
  .mmr-row-leave-active,
  .mmr-row-move {
    transition: none;
  }
}
</style>
