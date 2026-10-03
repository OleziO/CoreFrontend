<template>
  <div class="flex h-full flex-col gap-12 overflow-hidden">
    <!-- Toolbar: розділ + дії пулу ботів (фільтри дуелей живуть у самому списку) -->
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

      <div v-if="section === 'bots'" class="flex flex-wrap items-center gap-8">
        <DuelBotsStatusStrip :bots="bots" :is-error="botsError" compact />
        <el-button :loading="reloadingAll" @click="reloadAllBots">
          <PhArrowsClockwise v-if="!reloadingAll" :size="14" weight="bold" class="mr-6" />
          Перезапустити всіх
        </el-button>
      </div>
    </div>

    <!-- ─── Дуелі: статус обробки, дії адміна, вибіркове видалення ───────── -->
    <DuelAdminList v-if="section === 'duels'" class="min-h-0 flex-1" />

    <!-- ─── Стрім-турніри: перегляд і видалення ────────────────────────── -->
    <DuelTournamentAdminList v-else-if="section === 'tournaments'" class="min-h-0 flex-1" />

    <!-- ─── Сезони: призи поточного, переможці й видача призів минулих ──── -->
    <DuelSeasonAdminPanel v-else-if="section === 'seasons'" class="min-h-0 flex-1" />

    <!-- ─── Боти ───────────────────────────────────────────────────────── -->
    <div
      v-else
      v-loading="store.botsLoading"
      class="custom-scroll min-h-0 flex-1 overflow-y-auto"
    >
      <div class="flex flex-col gap-12">
        <!-- Додати бота -->
        <form class="bot-form hud-panel" @submit.prevent="addBot">
          <header class="bot-form__head">
            <span class="bot-form__icon" aria-hidden="true">
              <PhRobot :size="20" weight="duotone" />
            </span>
            <span class="flex min-w-0 flex-col gap-3">
              <span class="bot-form__title">Додати бота-хоста</span>
              <span class="bot-form__lead">Steam-акаунт, який створює лобі й веде дуелі</span>
            </span>
          </header>

          <div class="bot-form__fields">
            <label class="bot-field">
              <span class="bot-field__label">Steam-логін</span>
              <el-input v-model="newBot.accountName" placeholder="login" clearable autocomplete="off">
                <template #prefix>
                  <PhUser :size="16" />
                </template>
              </el-input>
            </label>
            <label class="bot-field">
              <span class="bot-field__label">Пароль</span>
              <el-input
                v-model="newBot.password"
                type="password"
                show-password
                placeholder="••••••••"
                autocomplete="new-password"
              >
                <template #prefix>
                  <PhLockSimple :size="16" />
                </template>
              </el-input>
            </label>
            <label class="bot-field">
              <span class="bot-field__label">
                Регіон
                <span v-if="regionName" class="bot-field__hint">{{ regionName }}</span>
              </span>
              <el-input-number v-model="newBot.region" :min="0" :max="50" class="!w-full" />
            </label>
            <el-button
              type="primary"
              native-type="submit"
              class="bot-form__submit"
              :loading="addingBot"
              :disabled="!canAddBot"
            >
              <PhPlus v-if="!addingBot" :size="16" weight="bold" class="mr-6" />
              Додати бота
            </el-button>
          </div>

          <ul class="bot-form__notes">
            <li><PhShieldCheck :size="14" weight="fill" /> Пароль шифрується на бекенді</li>
            <li class="is-warn"><PhWarning :size="14" weight="fill" /> Steam Guard на акаунті має бути вимкнений</li>
            <li><PhGlobe :size="14" weight="bold" /> Регіон 3 — EU West</li>
          </ul>
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
                active-text="ON"
                inactive-text="OFF"
                :aria-label="bot.enabled ? 'Вимкнути бота' : 'Увімкнути бота'"
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
import {
  PhArrowsClockwise,
  PhBroadcast,
  PhGlobe,
  PhLockSimple,
  PhPlus,
  PhRobot,
  PhShieldCheck,
  PhSword,
  PhTrash,
  PhTrophy,
  PhUser,
  PhWarning
} from '@phosphor-icons/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDuelBotsStatus } from '@/views/duels/composables/use-duel-bots-status'
import { hostBotStatusLabels } from '@/views/duels/duels.utils'
import DuelAdminList from '@/views/duels/components/DuelAdminList.vue'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'
import DuelSeasonAdminPanel from '@/views/duels/components/DuelSeasonAdminPanel.vue'
import DuelTournamentAdminList from '@/views/duels/components/DuelTournamentAdminList.vue'
import type { TStatusTone } from '@/components/status/status.presets'
import type { THostBot } from '@/api/types/api.types'

type TSection = 'duels' | 'tournaments' | 'seasons' | 'bots'

const sections: { value: TSection; label: string; icon: Component }[] = [
  { value: 'duels', label: 'Дуелі', icon: PhSword },
  { value: 'tournaments', label: 'Стрім-турніри', icon: PhBroadcast },
  { value: 'seasons', label: 'Сезони', icon: PhTrophy },
  { value: 'bots', label: 'Боти', icon: PhRobot }
]

const store = useDuelsAdminStore()
const { bots, isError: botsError } = useDuelBotsStatus()

const section = ref<TSection>('duels')
const processingBotId = ref<number | null>(null)
const reloadingAll = ref(false)
const addingBot = ref(false)

const newBot = reactive({ accountName: '', password: '', region: 3 })
const canAddBot = computed(() => !!newBot.accountName.trim() && !!newBot.password)

/** Назви регіонів Steam/Dota для підказки біля поля (відомі напевно — решта без назви). */
const BOT_REGION_NAMES: Record<number, string> = { 3: 'EU West' }
const regionName = computed(() => BOT_REGION_NAMES[newBot.region] ?? '')

async function loadBots () {
  try {
    await store.fetchBots()
  } catch {
    ElMessage.error('Не вдалося завантажити ботів')
  }
}

// Дуелі підтягує сам DuelAdminList; пул ботів потрібен і йому (хто веде дуель), і вкладці ботів.
onMounted(() => {
  loadBots()
})

// ─── Боти ─────────────────────────────────────────────────────────────────

function formatTime (iso: string): string {
  const d = dayjs(iso)
  return d.isValid() ? d.format('HH:mm:ss') : ''
}

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

.bot-row,
// Add-bot form: an icon + title header, labelled fields on one row (the submit
// sits on the inputs' baseline), and the account rules as small icon notes.
.bot-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 14px;
}

.bot-form__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-form__icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.1);
  color: var(--ds-primary);
  box-shadow: var(--ds-glow-primary-soft);
}

.bot-form__title {
  font-family: var(--ds-font-display);
  font-size: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
}

.bot-form__lead {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.bot-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.bot-field__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.bot-field__hint {
  border-radius: 999px;
  padding: 1px 7px;
  background: rgba(var(--ds-primary-rgb), 0.12);
  color: var(--ds-primary);
  letter-spacing: 0.06em;
  text-transform: none;
}

.bot-form__submit {
  min-width: 150px;
}

.bot-form__notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 12px 0 0;
  list-style: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: var(--ds-text-muted);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  :deep(svg) {
    color: var(--ds-primary);
  }

  .is-warn :deep(svg) {
    color: rgb(245, 158, 11);
  }
}

@media (min-width: 1024px) {
  .bot-row {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) auto;
    align-items: center;
    gap: 12px 16px;
  }
}

.bot-row__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  color: var(--ds-text-faint);
}

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
  align-items: end;
  gap: 12px;
}

@media (min-width: 768px) {
  .bot-form__fields {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 160px auto;
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
