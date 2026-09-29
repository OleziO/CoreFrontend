<template>
  <div class="flex h-full flex-col gap-12 overflow-hidden">
    <!-- Toolbar: розділ + фільтр стану -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-16 gap-y-8">
      <div class="duels-filters" role="group" aria-label="Розділ">
        <button
          v-for="s in sections"
          :key="s.value"
          type="button"
          class="duels-filter"
          :class="{ 'is-active': section === s.value }"
          :aria-pressed="section === s.value"
          @click="section = s.value"
        >
          <component :is="s.icon" :size="14" weight="bold" class="shrink-0" />
          {{ s.label }}
        </button>
      </div>

      <div v-if="section === 'duels'" class="flex flex-wrap items-center gap-8">
        <el-select v-model="stateFilter" class="w-[190px]" aria-label="Стан дуелі" @change="loadDuels">
          <el-option label="Усі стани" :value="''" />
          <el-option v-for="(label, state) in duelStateLabels" :key="state" :label="label" :value="state" />
        </el-select>
        <el-button :loading="store.duelsLoading" @click="loadDuels">
          <PhArrowsClockwise v-if="!store.duelsLoading" :size="14" weight="bold" />
        </el-button>
      </div>

      <div v-else class="flex flex-wrap items-center gap-8">
        <DuelBotsStatusStrip :bots="bots" :is-error="botsError" compact />
        <el-button :loading="reloadingAll" @click="reloadAllBots">
          <PhArrowsClockwise v-if="!reloadingAll" :size="14" weight="bold" class="mr-6" />
          Перезапустити всіх
        </el-button>
      </div>
    </div>

    <!-- ─── Дуелі ──────────────────────────────────────────────────────── -->
    <div
      v-if="section === 'duels'"
      v-loading="store.duelsLoading"
      class="custom-scroll min-h-0 flex-1 overflow-y-auto"
    >
      <ul v-if="store.duels.length" class="duels-list">
        <li v-for="duel in store.duels" :key="duel.id" class="duel-row hud-panel">
          <div class="duel-row__head">
            <StatusBadge size="sm" :tone="toneOf(duel.state)" :label="duelStateLabels[duel.state]" />
            <span v-if="duel.adminReviewRequired" class="duel-row__flag">потребує перегляду</span>
            <span class="duel-row__date">{{ formatDate(duel.createdAt) }}</span>
          </div>

          <div class="duel-row__versus">
            <RouterLink
              v-if="duel.player1"
              :to="{ name: routeNames.player, params: { id: duel.player1.id } }"
              class="duel-row__player no-underline"
              :class="{ 'is-winner': duel.winnerId === duel.player1.id, 'is-loser': duel.loserId === duel.player1.id }"
            >
              {{ duelPlayerName(duel.player1) }}
              <span class="duel-row__rating">{{ duel.player1Rating }}</span>
            </RouterLink>
            <span v-else class="duel-row__player text-white/40">—</span>
            <span class="duel-row__vs">vs</span>
            <RouterLink
              v-if="duel.player2"
              :to="{ name: routeNames.player, params: { id: duel.player2.id } }"
              class="duel-row__player no-underline"
              :class="{ 'is-winner': duel.winnerId === duel.player2.id, 'is-loser': duel.loserId === duel.player2.id }"
            >
              {{ duelPlayerName(duel.player2) }}
              <span class="duel-row__rating">{{ duel.player2Rating }}</span>
            </RouterLink>
            <span v-else class="duel-row__player text-white/40">—</span>
          </div>

          <div class="duel-row__meta">
            <span>{{ duel.lobbyName }}</span>
            <span v-if="duel.dotaMatchId">матч {{ duel.dotaMatchId }}</span>
            <span v-if="duelEndReasonLabel(duel)">{{ duelEndReasonLabel(duel) }}</span>
            <span v-if="duel.ratingDelta != null">±{{ duel.ratingDelta }}</span>
          </div>

          <div class="duel-row__actions">
            <el-button
              v-if="isDuelActive(duel)"
              type="danger"
              size="small"
              plain
              :loading="processingId === duel.id"
              :disabled="!!processingId && processingId !== duel.id"
              @click="cancel(duel)"
            >
              Скасувати
            </el-button>
            <template v-else-if="duel.state === 'FAILED' || duel.state === 'CANCELLED'">
              <el-button
                v-if="duel.player1"
                type="success"
                size="small"
                plain
                :loading="processingId === duel.id"
                :disabled="!!processingId && processingId !== duel.id"
                @click="resolve(duel, duel.player1)"
              >
                Перемога: {{ duelPlayerName(duel.player1) }}
              </el-button>
              <el-button
                v-if="duel.player2"
                type="success"
                size="small"
                plain
                :loading="processingId === duel.id"
                :disabled="!!processingId && processingId !== duel.id"
                @click="resolve(duel, duel.player2)"
              >
                Перемога: {{ duelPlayerName(duel.player2) }}
              </el-button>
              <el-button
                v-if="duel.adminReviewRequired"
                size="small"
                :loading="processingId === duel.id"
                :disabled="!!processingId && processingId !== duel.id"
                @click="resolve(duel, null)"
              >
                Анулювати
              </el-button>
            </template>
          </div>
        </li>
      </ul>

      <div v-else-if="!store.duelsLoading" class="duels-empty hud-panel">
        <el-empty :image-size="120">
          <template #description>
            <span class="sys-label !text-[9px]">// Порожньо</span>
            <p class="duels-empty__text">Дуелей із таким станом немає.</p>
          </template>
        </el-empty>
      </div>
    </div>

    <!-- ─── Боти ───────────────────────────────────────────────────────── -->
    <div
      v-else
      v-loading="store.botsLoading"
      class="custom-scroll min-h-0 flex-1 overflow-y-auto"
    >
      <div class="flex flex-col gap-12">
        <!-- Додати бота -->
        <form class="bot-form hud-panel" @submit.prevent="addBot">
          <span class="sys-label sys-label--muted !text-[9px]">// Додати бота-хоста</span>
          <div class="bot-form__fields">
            <el-input v-model="newBot.accountName" placeholder="Steam-логін" clearable aria-label="Steam-логін" />
            <el-input
              v-model="newBot.password"
              type="password"
              show-password
              placeholder="Пароль"
              aria-label="Пароль"
            />
            <el-input-number v-model="newBot.region" :min="0" :max="50" aria-label="Регіон (3 = EU West)" />
            <el-button type="primary" native-type="submit" :loading="addingBot" :disabled="!canAddBot">
              <PhPlus v-if="!addingBot" :size="14" weight="bold" class="mr-6" />
              Додати
            </el-button>
          </div>
          <span class="text-[11px] text-white/45">
            Пароль шифрується на бекенді. Steam Guard на акаунті має бути вимкнений. Регіон 3 — EU West.
          </span>
        </form>

        <ul v-if="store.bots.length" class="duels-list">
          <li
            v-for="bot in store.bots"
            :key="bot.id"
            class="bot-row hud-panel"
            :class="{ 'is-disabled': !bot.enabled }"
          >
            <div class="bot-row__who">
              <span class="bot-row__dot" :class="botDotClass(bot)" aria-hidden="true" />
              <span class="flex min-w-0 flex-col gap-3">
                <span class="bot-row__name">{{ bot.accountName }}</span>
                <span class="bot-row__meta">
                  <span>#{{ bot.id }}</span>
                  <span v-if="bot.steamId64">· {{ bot.steamId64 }}</span>
                  <span>· регіон {{ bot.region }}</span>
                </span>
              </span>
            </div>

            <div class="bot-row__status">
              <StatusBadge size="sm" :tone="botTone(bot)" :label="botStatusLabel(bot)" />
              <span v-if="bot.currentDuelId" class="bot-row__meta">дуель {{ bot.currentDuelId.slice(0, 8) }}…</span>
              <span v-if="bot.lastHeartbeatAt" class="bot-row__meta">пінг {{ formatTime(bot.lastHeartbeatAt) }}</span>
              <span v-if="bot.lastError" class="bot-row__error" :title="bot.lastError">{{ bot.lastError }}</span>
            </div>

            <div class="bot-row__actions">
              <el-switch
                :model-value="bot.enabled"
                :loading="processingBotId === bot.id"
                inline-prompt
                active-text="on"
                inactive-text="off"
                @change="toggleBot(bot, $event as boolean)"
              />
              <el-button
                size="small"
                plain
                :loading="processingBotId === bot.id"
                title="Перезапустити бота"
                aria-label="Перезапустити бота"
                @click="reloadBot(bot)"
              >
                <PhArrowsClockwise :size="14" weight="bold" />
              </el-button>
              <el-button
                type="danger"
                size="small"
                plain
                :loading="processingBotId === bot.id"
                :disabled="bot.status === 'BUSY'"
                @click="removeBot(bot)"
              >
                <PhTrash :size="14" weight="bold" />
              </el-button>
            </div>
          </li>
        </ul>

        <div v-else-if="!store.botsLoading" class="duels-empty hud-panel">
          <el-empty :image-size="120">
            <template #description>
              <span class="sys-label !text-[9px]">// Пул порожній</span>
              <p class="duels-empty__text">Жодного бота-хоста. Додайте акаунт вище або через seed-файл на сервері.</p>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhArrowsClockwise, PhPlus, PhRobot, PhSword, PhTrash } from '@phosphor-icons/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { routeNames } from '@/router/route-names'
import { useDuelBotsStatus } from '@/views/duels/composables/use-duel-bots-status'
import {
  duelEndReasonLabel,
  duelPlayerName,
  duelStateLabels,
  hostBotStatusLabels,
  isDuelActive
} from '@/views/duels/duels.utils'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'
import type { TStatusTone } from '@/components/status/status.presets'
import type { TDuel, TDuelPlayer, TDuelState, THostBot } from '@/api/types/api.types'

type TSection = 'duels' | 'bots'

const sections: { value: TSection; label: string; icon: Component }[] = [
  { value: 'duels', label: 'Дуелі', icon: PhSword },
  { value: 'bots', label: 'Боти', icon: PhRobot }
]

const store = useDuelsAdminStore()
const { bots, isError: botsError } = useDuelBotsStatus()

const section = ref<TSection>('duels')
const stateFilter = ref<TDuelState | ''>('')
const processingId = ref<string | null>(null)
const processingBotId = ref<number | null>(null)
const reloadingAll = ref(false)
const addingBot = ref(false)

const newBot = reactive({ accountName: '', password: '', region: 3 })
const canAddBot = computed(() => !!newBot.accountName.trim() && !!newBot.password)

async function loadDuels () {
  try {
    await store.fetchDuels(stateFilter.value || undefined)
  } catch {
    ElMessage.error('Не вдалося завантажити дуелі')
  }
}

async function loadBots () {
  try {
    await store.fetchBots()
  } catch {
    ElMessage.error('Не вдалося завантажити ботів')
  }
}

onMounted(() => {
  loadDuels()
  loadBots()
})

// ─── Дуелі ────────────────────────────────────────────────────────────────

function toneOf (state: TDuelState): TStatusTone {
  switch (state) {
    case 'LIVE': return 'success'
    case 'RESOLVED': return 'primary'
    case 'CANCELLED': return 'warning'
    case 'FAILED': return 'error'
    default: return 'neutral'
  }
}

function formatDate (iso: string): string {
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD.MM.YYYY HH:mm') : ''
}

function formatTime (iso: string): string {
  const d = dayjs(iso)
  return d.isValid() ? d.format('HH:mm:ss') : ''
}

async function cancel (duel: TDuel) {
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

async function resolve (duel: TDuel, winner: TDuelPlayer | null) {
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

// ─── Боти ─────────────────────────────────────────────────────────────────

function botTone (bot: THostBot): TStatusTone {
  if (!bot.enabled) return 'neutral'
  if (bot.status === 'BANNED') return 'error'
  if (!bot.alive || bot.status === 'OFFLINE') return 'warning'
  return bot.status === 'BUSY' ? 'primary' : 'success'
}

function botStatusLabel (bot: THostBot): string {
  if (!bot.enabled) return 'Вимкнений'
  if (bot.status !== 'BANNED' && !bot.alive) return 'Немає зв’язку'
  return hostBotStatusLabels[bot.status]
}

function botDotClass (bot: THostBot): string {
  const tone = botTone(bot)
  return tone === 'success' || tone === 'primary' ? 'is-on' : tone === 'error' ? 'is-error' : ''
}

async function addBot () {
  if (!canAddBot.value || addingBot.value) return
  addingBot.value = true
  try {
    await store.addBot({
      accountName: newBot.accountName.trim(),
      password: newBot.password,
      region: newBot.region
    })
    newBot.accountName = ''
    newBot.password = ''
    ElMessage.success('Бота додано — воркер підхопить його протягом 30 с')
  } catch { /* тост показав сервіс */ } finally {
    addingBot.value = false
  }
}

async function reloadAllBots () {
  reloadingAll.value = true
  try {
    const count = await store.reloadBots()
    ElMessage.success(`Перезапуск запитано для ${count} ботів — воркер перелогінить їх протягом ~30 с`)
  } catch { /* тост показав сервіс */ } finally {
    reloadingAll.value = false
  }
}

async function reloadBot (bot: THostBot) {
  processingBotId.value = bot.id
  try {
    await store.reloadBots(bot.id)
    ElMessage.success(`Бот ${bot.accountName} перезапуститься протягом ~30 с`)
  } catch { /* тост показав сервіс */ } finally {
    processingBotId.value = null
  }
}

async function toggleBot (bot: THostBot, enabled: boolean) {
  processingBotId.value = bot.id
  try {
    await store.setBotEnabled(bot.id, enabled)
  } catch { /* тост показав сервіс */ } finally {
    processingBotId.value = null
  }
}

async function removeBot (bot: THostBot) {
  try {
    await ElMessageBox.confirm(
      `Видалити бота ${bot.accountName}? Воркер розлогінить його на наступному перечитуванні пулу.`,
      'Видалити бота?',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Ні', type: 'warning' }
    )
  } catch {
    return
  }
  processingBotId.value = bot.id
  try {
    await store.removeBot(bot.id)
    ElMessage.success('Бота видалено')
  } catch { /* тост показав сервіс */ } finally {
    processingBotId.value = null
  }
}
</script>

<style scoped lang="scss">
.duels-filters {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(7, 8, 15, 0.45);
}

.duels-filter {
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
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &.is-active {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.1);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35);
  }
}

.duels-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0 2px 8px 0;
  list-style: none;
}

.duel-row,
.bot-row,
.bot-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
}

@media (min-width: 1024px) {
  .duel-row {
    display: grid;
    grid-template-columns: 200px minmax(0, 1.4fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px 16px;
  }

  .bot-row {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) auto;
    align-items: center;
    gap: 12px 16px;
  }
}

.duel-row__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.duel-row__flag {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-gold);
}

.duel-row__date,
.duel-row__meta,
.bot-row__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  color: var(--ds-text-faint);
}

.duel-row__versus {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.duel-row__player {
  display: inline-flex;
  align-items: center;
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

.duel-row__rating {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  color: var(--ds-text-faint);
}

.duel-row__vs {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.duel-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.duel-row__actions,
.bot-row__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.bot-row.is-disabled {
  opacity: 0.55;
}

.bot-row__who {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.bot-row__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);

  &.is-on {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
  }

  &.is-error {
    background: #f43f5e;
    box-shadow: 0 0 8px rgba(244, 63, 94, 0.8);
  }
}

.bot-row__name {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.bot-row__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
}

.bot-row__error {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #fb7185;
}

.bot-form__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

@media (min-width: 768px) {
  .bot-form__fields {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 140px auto;
  }
}

.duels-empty {
  padding: 24px;
  border-radius: 12px;
}

.duels-empty__text {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-muted);
}
</style>
