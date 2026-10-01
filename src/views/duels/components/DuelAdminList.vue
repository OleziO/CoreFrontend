<template>
  <div class="dadmin flex h-full min-h-0 flex-col gap-12">
    <!-- Toolbar: фільтр стану, оновлення, вибір і масове видалення -->
    <div class="dadmin__toolbar">
      <div class="flex min-w-0 flex-wrap items-center gap-8">
        <el-select v-model="stateFilter" class="w-[200px]" aria-label="Стан дуелі" @change="loadDuels">
          <el-option label="Усі стани" :value="''" />
          <el-option v-for="(label, state) in duelStateLabels" :key="state" :label="label" :value="state" />
        </el-select>
        <el-button :loading="store.duelsLoading" title="Оновити" aria-label="Оновити" @click="loadDuels">
          <PhArrowsClockwise v-if="!store.duelsLoading" :size="14" weight="bold" />
        </el-button>
        <span v-if="processingCount" class="dadmin__hint" :class="{ 'is-warn': stuckCount }">
          в обробці: {{ processingCount }}<template v-if="stuckCount"> · зависло: {{ stuckCount }}</template>
        </span>
      </div>

      <div v-if="store.duels.length" class="flex flex-wrap items-center gap-10">
        <el-checkbox
          :model-value="allSelected"
          :indeterminate="!allSelected && selectedIds.size > 0"
          :disabled="!!deletingIds.size"
          class="!mr-0"
          @change="toggleAll($event as boolean)"
        >
          Вибрати всі ({{ store.duels.length }})
        </el-checkbox>
        <el-button
          type="danger"
          plain
          :disabled="!selectedIds.size || !!deletingIds.size"
          :loading="bulkDeleting"
          @click="removeSelected"
        >
          <PhTrash v-if="!bulkDeleting" :size="14" weight="bold" class="mr-6" />
          Видалити вибрані{{ selectedIds.size ? ` (${selectedIds.size})` : '' }}
        </el-button>
      </div>
    </div>

    <!-- Контейнер прокрутки: колонки вмикаються за його шириною, а не за viewport -->
    <div v-loading="store.duelsLoading" class="dadmin__scroll custom-scroll min-h-0 flex-1 overflow-y-auto">
      <template v-if="store.duels.length">
        <!-- Шапка колонок — лише на широкому контейнері, та сама сітка, що й у рядках -->
        <div class="duel-row duel-row--header" aria-hidden="true">
          <span />
          <span>Дуель</span>
          <span>Стан</span>
          <span>Гравці</span>
          <span>Деталі</span>
          <span class="text-right">Дії</span>
        </div>

        <ul class="dadmin__list">
          <li
            v-for="duel in store.duels"
            :key="duel.id"
            class="duel-row hud-panel"
            :class="{ 'is-selected': selectedIds.has(duel.id), 'is-stuck': !!stuckReasonOf(duel) }"
          >
            <div class="duel-row__select">
              <el-checkbox
                :model-value="selectedIds.has(duel.id)"
                :disabled="!!deletingIds.size"
                :aria-label="`Вибрати дуель #${duel.number}`"
                class="!mr-0 !h-auto"
                @change="toggleOne(duel.id, $event as boolean)"
              />
            </div>

            <div class="duel-row__id">
              <span class="duel-row__number">#{{ duel.number }}</span>
              <span class="duel-row__date">{{ formatDate(duel.createdAt) }}</span>
            </div>

            <div class="duel-row__state">
              <StatusBadge size="sm" :tone="toneOf(duel.state)" :label="duelStateLabels[duel.state]" />
              <span v-if="duel.adminReviewRequired" class="duel-row__flag">потребує перегляду</span>
              <span v-if="isFriendDuel(duel)" class="duel-row__flag duel-row__flag--muted">дружня</span>
            </div>

            <div class="duel-row__versus">
              <RouterLink
                v-if="duel.player1"
                :to="{ name: routeNames.player, params: { id: duel.player1.id } }"
                class="duel-row__player no-underline"
                :class="outcomeClassOf(duel, duel.player1)"
                :title="duelPlayerName(duel.player1)"
              >
                <span class="duel-row__name">{{ duelPlayerName(duel.player1) }}</span>
                <span class="duel-row__rating">{{ duel.player1Rating }}</span>
              </RouterLink>
              <span v-else class="duel-row__player text-white/40">—</span>
              <span class="duel-row__vs">vs</span>
              <RouterLink
                v-if="duel.player2"
                :to="{ name: routeNames.player, params: { id: duel.player2.id } }"
                class="duel-row__player no-underline"
                :class="outcomeClassOf(duel, duel.player2)"
                :title="duelPlayerName(duel.player2)"
              >
                <span class="duel-row__name">{{ duelPlayerName(duel.player2) }}</span>
                <span class="duel-row__rating">{{ duel.player2Rating }}</span>
              </RouterLink>
              <span v-else class="duel-row__player text-white/40">—</span>
            </div>

            <div class="duel-row__meta">
              <span class="duel-row__meta-item" :title="duel.lobbyName">{{ duel.lobbyName }}</span>
              <span v-if="duel.dotaMatchId" class="duel-row__meta-item">матч {{ duel.dotaMatchId }}</span>
              <span v-if="duelEndReasonLabel(duel)" class="duel-row__meta-item">{{ duelEndReasonLabel(duel) }}</span>
              <span v-if="duel.ratingDelta != null" class="duel-row__meta-item">±{{ duel.ratingDelta }}</span>
            </div>

            <!-- Дії: одна основна кнопка (скасувати / меню «вирішити») + видалення — колонка фіксованої ширини -->
            <div class="duel-row__actions">
              <el-button
                v-if="isDuelActive(duel)"
                type="danger"
                size="small"
                plain
                :loading="processingId === duel.id"
                :disabled="isBusyExcept(duel.id)"
                @click="cancel(duel)"
              >
                Скасувати
              </el-button>
              <el-dropdown
                v-else-if="resolveOptionsOf(duel).length"
                trigger="click"
                placement="bottom-end"
                :disabled="isBusyExcept(duel.id) || processingId === duel.id"
                @command="runResolve(duel, $event)"
              >
                <el-button
                  type="primary"
                  size="small"
                  plain
                  :loading="processingId === duel.id"
                  :disabled="isBusyExcept(duel.id)"
                  title="Вирішити дуель вручну"
                >
                  Вирішити
                  <PhCaretDown v-if="processingId !== duel.id" :size="12" weight="bold" class="ml-4" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="option in resolveOptionsOf(duel)"
                      :key="option.action"
                      :command="option.action"
                      :divided="option.divided"
                      :title="option.title"
                    >
                      <span class="inline-flex items-center gap-8">
                        <component :is="option.icon" :size="14" weight="bold" class="shrink-0" />
                        <span>{{ option.label }}</span>
                      </span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                type="danger"
                size="small"
                plain
                class="duel-row__delete"
                :loading="deletingIds.has(duel.id)"
                :disabled="isBusyExcept(duel.id)"
                title="Видалити дуель назавжди"
                aria-label="Видалити дуель"
                @click="removeOne(duel)"
              >
                <PhTrash v-if="!deletingIds.has(duel.id)" :size="14" weight="bold" />
              </el-button>
            </div>

            <!-- Обробка результату: що саме платформа зараз робить із цією дуеллю -->
            <div v-if="duel.state === 'PROCESSING' || duel.error" class="duel-row__process">
              <template v-if="duel.state === 'PROCESSING'">
                <span class="duel-row__process-title">
                  <PhSpinnerGap :size="12" weight="bold" class="dadmin__spin shrink-0" />
                  Збираємо результат {{ processingFor(duel) }}
                </span>
                <span v-if="stuckReasonOf(duel)" class="duel-row__process-stuck">
                  <PhWarning :size="12" weight="bold" class="shrink-0" />
                  Зависла: {{ stuckReasonOf(duel) }}
                </span>
                <span class="duel-row__process-line">
                  <span>бот: {{ botLabel(duel) }}</span>
                  <span>сервер: {{ duel.serverSteamId ?? '—' }}</span>
                  <span>лобі: {{ duel.lobbyId ?? '—' }}</span>
                  <span>match id: {{ duel.dotaMatchId ?? '—' }}</span>
                  <span>результат: {{ outcomeLabel(duel.matchOutcome) }}</span>
                </span>
              </template>
              <span v-if="duel.error" class="duel-row__process-error" :title="duel.error">
                {{ duel.error }}
              </span>
            </div>
          </li>
        </ul>
      </template>

      <div v-else-if="!store.duelsLoading" class="dadmin__empty hud-panel">
        <el-empty :image-size="120">
          <template #description>
            <span class="sys-label !text-[9px]">// Порожньо</span>
            <p class="dadmin__empty-text">Дуелей із таким станом немає.</p>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import {
  PhArrowsClockwise,
  PhCaretDown,
  PhCloudArrowDown,
  PhProhibit,
  PhSpinnerGap,
  PhTrash,
  PhTrophy,
  PhWarning
} from '@phosphor-icons/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { routeNames } from '@/router/route-names'
import {
  DUEL_GAME_TIMEOUT_SECONDS,
  duelEndReasonLabel,
  duelPlayerName,
  duelStateLabels,
  isDuelActive,
  isFriendDuel,
  pluralizeDuels
} from '@/views/duels/duels.utils'
import type { TStatusTone } from '@/components/status/status.presets'
import type { TAdminDuel, TDuelPlayer, TDuelState, THostBot } from '@/api/types/api.types'

/**
 * Список усіх дуелей для адміна: фільтр за станом, статус обробки результату
 * (який бот веде, звідки читається результат, чи зависла), дії cancel / recover / resolve
 * і вибіркове видалення — поштучне або кількох одразу. Живе на сторі `useDuelsAdminStore`,
 * тож той самий компонент працює і на вкладці адмінки, і в модалці на сторінці дуелей.
 */
const emit = defineEmits<{
  /** Хоча б одну дуель видалено — сторінка може перечитати «мої дуелі» / статус. */
  deleted: [ids: string[]]
}>()

/** Пункти меню «Вирішити» для дуелі зі збоєм / скасованої. */
type TResolveAction = 'recover' | 'winner1' | 'winner2' | 'void'

interface IResolveOption {
  action: TResolveAction
  label: string
  icon: Component
  title?: string
  divided?: boolean
}

const store = useDuelsAdminStore()

const stateFilter = ref<TDuelState | ''>('')
const processingId = ref<string | null>(null)
const deletingIds = ref(new Set<string>())
const bulkDeleting = ref(false)
const selectedIds = ref(new Set<string>())

// «Обробка вже N хв» тікає без перезапиту.
const now = useNow({ interval: 15_000 })

async function loadDuels () {
  selectedIds.value = new Set()
  try {
    await store.fetchDuels(stateFilter.value || undefined)
  } catch {
    ElMessage.error('Не вдалося завантажити дуелі')
  }
}

onMounted(() => {
  loadDuels()
  // Пул ботів потрібен, щоб сказати, хто веде дуель в обробці; вкладка ботів могла його вже підтягнути.
  if (!store.bots.length) {
    store.fetchBots().catch(() => { /* статус бота покажемо як невідомий */ })
  }
})

// ─── Вибір ────────────────────────────────────────────────────────────────

const allSelected = computed(
  () => store.duels.length > 0 && store.duels.every((d) => selectedIds.value.has(d.id))
)

function toggleOne (id: string, checked: boolean) {
  const next = new Set(selectedIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedIds.value = next
}

function toggleAll (checked: boolean) {
  selectedIds.value = checked ? new Set(store.duels.map((d) => d.id)) : new Set()
}

function isBusyExcept (id: string): boolean {
  if (deletingIds.value.size) return !deletingIds.value.has(id)
  return !!processingId.value && processingId.value !== id
}

// ─── Статус обробки ───────────────────────────────────────────────────────

function toneOf (state: TDuelState): TStatusTone {
  switch (state) {
    case 'LIVE': return 'success'
    case 'PROCESSING': return 'info'
    case 'RESOLVED': return 'primary'
    case 'CANCELLED': return 'warning'
    case 'FAILED': return 'error'
    default: return 'neutral'
  }
}

/** Підсвічування переможця / того, хто програв, у колонці гравців. */
function outcomeClassOf (duel: TAdminDuel, player: TDuelPlayer): Record<string, boolean> {
  return { 'is-winner': duel.winnerId === player.id, 'is-loser': duel.loserId === player.id }
}

function formatDate (iso: string): string {
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD.MM.YYYY HH:mm') : ''
}

function botOf (duel: TAdminDuel): THostBot | null {
  if (duel.hostBotId == null) return null
  return store.bots.find((b) => b.id === duel.hostBotId) ?? null
}

function botLabel (duel: TAdminDuel): string {
  if (duel.hostBotId == null) return 'немає'
  const bot = botOf(duel)
  if (!bot) return `#${duel.hostBotId} (не в пулі)`
  const state = !bot.alive ? 'немає зв’язку' : bot.currentDuelId === duel.id ? 'веде' : 'відпустив'
  return `${bot.accountName} · ${state}`
}

/** Скільки триває обробка: від кінця гри (finishedAt), або від запуску, якщо кінець не зафіксовано. */
function processingFor (duel: TAdminDuel): string {
  const since = duel.finishedAt ?? duel.liveAt
  if (!since) return ''
  const minutes = Math.max(0, Math.floor((now.value.getTime() - new Date(since).getTime()) / 60_000))
  return minutes < 1 ? 'менше хвилини' : `вже ${minutes} хв`
}

/**
 * Чому обробка не завершиться сама: результат читає лише живий бот, що досі тримає цю дуель,
 * і лише до ліміту гри — інакше дуель треба видалити або чекати FAILED (game_timeout).
 */
function stuckReasonOf (duel: TAdminDuel): string | null {
  if (duel.state !== 'PROCESSING') return null
  if (duel.liveAt) {
    const liveAt = new Date(duel.liveAt).getTime()
    if (!Number.isNaN(liveAt) && now.value.getTime() - liveAt > DUEL_GAME_TIMEOUT_SECONDS * 1000) {
      return 'перевищено ліміт очікування результату'
    }
  }
  if (duel.hostBotId == null) return 'жоден бот не веде дуель'
  const bot = botOf(duel)
  if (!bot) return 'бота вже немає в пулі'
  if (!bot.alive) return 'воркер бота не відповідає'
  if (bot.currentDuelId !== duel.id) return 'бот перейшов до іншої дуелі'
  return null
}

function outcomeLabel (outcome: number | null): string {
  if (outcome === 2) return 'Radiant'
  if (outcome === 3) return 'Dire'
  return outcome == null ? 'ще немає' : `код ${outcome}`
}

const processingCount = computed(() => store.duels.filter((d) => d.state === 'PROCESSING').length)
const stuckCount = computed(() => store.duels.filter((d) => !!stuckReasonOf(d)).length)

// ─── Дії ──────────────────────────────────────────────────────────────────

/**
 * Що можна зробити з дуеллю зі збоєм / скасованою: усі варіанти зібрано в одне меню,
 * щоб колонка дій мала сталу ширину незалежно від довжини ніків.
 */
function resolveOptionsOf (duel: TAdminDuel): IResolveOption[] {
  if (duel.state !== 'FAILED' && duel.state !== 'CANCELLED') return []
  const options: IResolveOption[] = []
  if (duel.state === 'FAILED' && duel.dotaMatchId) {
    options.push({
      action: 'recover',
      label: 'Результат з Web API',
      icon: PhCloudArrowDown,
      title: 'Запитати результат матчу у Valve за match id'
    })
  }
  if (duel.player1) {
    options.push({
      action: 'winner1',
      label: `Перемога: ${duelPlayerName(duel.player1)}`,
      icon: PhTrophy,
      divided: options.length > 0
    })
  }
  if (duel.player2) {
    options.push({ action: 'winner2', label: `Перемога: ${duelPlayerName(duel.player2)}`, icon: PhTrophy })
  }
  if (duel.adminReviewRequired) {
    options.push({ action: 'void', label: 'Анулювати', icon: PhProhibit, divided: options.length > 0 })
  }
  return options
}

/** `command` з el-dropdown приходить нетипізованим — звужуємо до наших дій. */
function runResolve (duel: TAdminDuel, command: unknown) {
  switch (command as TResolveAction) {
    case 'recover': return recover(duel)
    case 'winner1': return resolve(duel, duel.player1 ?? null)
    case 'winner2': return resolve(duel, duel.player2 ?? null)
    case 'void': return resolve(duel, null)
    default: return undefined
  }
}

async function cancel (duel: TAdminDuel) {
  try {
    await ElMessageBox.confirm(
      'Дуель буде скасовано без зміни рейтингу. Бот вийде з лобі на наступному тику.',
      'Скасувати дуель?',
      { confirmButtonText: 'Скасувати', cancelButtonText: 'Ні', type: 'warning' }
    )
  } catch {
    return
  }
  processingId.value = duel.id
  try {
    await store.cancelDuel(duel.id)
    ElMessage.success('Дуель скасовано')
  } catch { /* тост показав сервіс */ } finally {
    processingId.value = null
  }
}

async function recover (duel: TAdminDuel) {
  processingId.value = duel.id
  try {
    await store.recoverDuel(duel.id)
    ElMessage.success('Результат отримано від Valve і зараховано')
  } catch { /* тост показав сервіс */ } finally {
    processingId.value = null
  }
}

async function resolve (duel: TAdminDuel, winner: TDuelPlayer | null) {
  const text = winner
    ? `Зарахувати перемогу гравцю ${duelPlayerName(winner)} (±25)?`
    : 'Анулювати дуель без зміни рейтингу?'
  try {
    await ElMessageBox.confirm(text, 'Вирішити дуель', {
      confirmButtonText: 'Підтвердити',
      cancelButtonText: 'Ні',
      type: 'info'
    })
  } catch {
    return
  }
  processingId.value = duel.id
  try {
    await store.resolveDuel(duel.id, winner?.id ?? null)
    ElMessage.success('Дуель вирішено')
  } catch { /* тост показав сервіс */ } finally {
    processingId.value = null
  }
}

/** Попередження перед видаленням: незворотно, рейтинг не відкочується, активну дуель бот покине. */
function deleteWarning (duels: readonly TAdminDuel[]): string {
  const lines = ['Це незворотно. Уже зарахований рейтинг не відкотиться.']
  if (duels.some((d) => isDuelActive(d) || d.state === 'PROCESSING')) {
    lines.push('Серед них є незавершені — бот вийде з лобі на наступному тику, а результат не зарахується.')
  }
  return lines.join(' ')
}

async function confirmDelete (title: string, duels: readonly TAdminDuel[]): Promise<boolean> {
  try {
    await ElMessageBox.confirm(deleteWarning(duels), title, {
      confirmButtonText: 'Видалити',
      cancelButtonText: 'Ні',
      type: 'error'
    })
    return true
  } catch {
    return false
  }
}

async function removeOne (duel: TAdminDuel) {
  if (!await confirmDelete(`Видалити дуель #${duel.number}?`, [duel])) return
  deletingIds.value = new Set([duel.id])
  try {
    await store.deleteDuel(duel.id)
    toggleOne(duel.id, false)
    ElMessage.success(`Дуель #${duel.number} видалено`)
    emit('deleted', [duel.id])
  } catch { /* тост показав сервіс */ } finally {
    deletingIds.value = new Set()
  }
}

async function removeSelected () {
  const ids = store.duels.filter((d) => selectedIds.value.has(d.id)).map((d) => d.id)
  if (!ids.length) return
  const duels = store.duels.filter((d) => selectedIds.value.has(d.id))
  if (!await confirmDelete(`Видалити ${pluralizeDuels(ids.length)}?`, duels)) return
  bulkDeleting.value = true
  deletingIds.value = new Set(ids)
  const done: string[] = []
  try {
    for (const id of ids) {
      await store.deleteDuel(id)
      done.push(id)
    }
    ElMessage.success(`Видалено ${pluralizeDuels(done.length)}`)
  } catch {
    // Тост показав сервіс; що встигли видалити — уже зникло зі списку.
    if (done.length) ElMessage.warning(`Видалено лише ${pluralizeDuels(done.length)} — далі сталася помилка`)
  } finally {
    bulkDeleting.value = false
    deletingIds.value = new Set()
    selectedIds.value = new Set([...selectedIds.value].filter((id) => !done.includes(id)))
    if (done.length) emit('deleted', done)
  }
}
</script>

<style scoped lang="scss">
.dadmin__toolbar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.dadmin__hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  &.is-warn {
    color: var(--ds-gold);
  }
}

/*
 * Список живе і в модалці (~1000px), і на вкладці адмінки, тому колонки вмикаємо
 * за шириною контейнера, а не за viewport-брейкпоінтами.
 */
.dadmin__scroll {
  container-type: inline-size;
  padding-right: 2px;
}

.dadmin__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0 0 8px;
  list-style: none;
}

/* ─── Рядок: вузький контейнер — картка з блоками один під одним ───────────── */

.duel-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'select id state'
    'versus versus versus'
    'meta meta meta'
    'actions actions actions'
    'process process process';
  align-items: center;
  gap: 10px 12px;
  padding: 12px 14px;
  border-radius: 12px;
  transition: box-shadow var(--ds-duration-fast) ease;

  &.is-selected {
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.45);
  }

  &.is-stuck {
    box-shadow: inset 0 0 0 1px rgba(var(--ds-gold-rgb), 0.35);
  }

  &.is-selected.is-stuck {
    box-shadow:
      inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.45),
      0 0 12px rgba(var(--ds-gold-rgb), 0.2);
  }
}

.duel-row--header {
  display: none;
}

.duel-row__select {
  grid-area: select;
  display: flex;
  align-items: center;
}

.duel-row__id {
  grid-area: id;
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
}

.duel-row__state {
  grid-area: state;
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px 8px;
}

.duel-row__versus {
  grid-area: versus;
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 13px;
}

.duel-row__meta {
  grid-area: meta;
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.duel-row__actions {
  grid-area: actions;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;

  :deep(.el-button + .el-button),
  :deep(.el-dropdown + .el-button) {
    margin-left: 0;
  }
}

.duel-row__process {
  grid-area: process;
}

/* ─── Рядок: широкий контейнер — таблична сітка, однакова для шапки й рядків ── */

@container (min-width: 860px) {
  .duel-row {
    grid-template-columns: 18px 104px 150px minmax(0, 1.35fr) minmax(0, 1fr) auto;
    grid-template-areas:
      'select id state versus meta actions'
      'process process process process process process';
    gap: 10px 14px;
    padding: 10px 14px;
  }

  .duel-row--header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    margin-bottom: 4px;
    padding: 4px 14px 8px;
    border-radius: 0;
    border-bottom: 1px solid var(--ds-border);
    background: rgba(12, 15, 30, 0.96);
    font-family: var(--ds-font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .duel-row__id {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }

  .duel-row__state {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
  }

  /* Кожен гравець отримує половину колонки — «vs» стоїть на одній вертикалі в усіх рядках */
  .duel-row__versus {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .duel-row__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .duel-row__meta-item {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.duel-row__number {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}

.duel-row__flag {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-gold);

  &--muted {
    color: var(--ds-text-faint);
  }
}

.duel-row__date {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-faint);
}

.duel-row__player {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: baseline;
  gap: 6px;
  font-weight: 600;
  color: var(--ds-text-strong);

  &:hover {
    color: var(--ds-primary);
  }

  &.is-winner {
    color: #22c55e;
  }

  &.is-loser {
    color: var(--ds-text-muted);
  }
}

.duel-row__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duel-row__rating {
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.duel-row__vs {
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.duel-row__delete {
  flex-shrink: 0;
}

/* Панель обробки: окремий рядок під картою, монопростір як у мета-даних */
.duel-row__process {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px dashed rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(var(--ds-primary-rgb), 0.04);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  color: var(--ds-text-muted);
}

.duel-row.is-stuck .duel-row__process {
  border-color: rgba(var(--ds-gold-rgb), 0.4);
  background: rgba(var(--ds-gold-rgb), 0.05);
}

.duel-row__process-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-primary);
}

.duel-row__process-stuck {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--ds-gold);
}

.duel-row__process-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--ds-text-faint);
}

.duel-row__process-error {
  flex-basis: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fb7185;
}

.dadmin__spin {
  animation: dadmin-spin 1.2s linear infinite;
}

@keyframes dadmin-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dadmin__spin {
    animation: none;
  }
}

.dadmin__empty {
  padding: 24px;
  border-radius: 12px;
}

.dadmin__empty-text {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-muted);
}
</style>
