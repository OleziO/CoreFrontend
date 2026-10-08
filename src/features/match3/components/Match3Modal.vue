<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="m3-dialog"
    width="980"
    :fullscreen="isNarrow"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="m3-dialog__head">
        <span class="m3-dialog__glyph" aria-hidden="true">
          <PhGameController :size="22" weight="fill" />
        </span>
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Міні-гра</span>
          <h2 class="m3-dialog__title">Три в ряд</h2>
          <p class="m3-dialog__subtitle">
            Збирайте героїв по троє, поки шукаємо суперника. Раунд — {{ roundSeconds }} секунд, великі
            збіги додають час.
          </p>
        </div>
      </div>
    </template>

    <div class="m3-dialog__layout">
      <!-- ─── Гра ─────────────────────────────────────────────────────── -->
      <div class="m3-dialog__game">
        <div class="m3-hud">
          <div class="m3-hud__stat">
            <span class="m3-hud__label">Очки</span>
            <span class="m3-hud__value m3-hud__value--score">{{ formatMatch3Score(displayScore) }}</span>
          </div>
          <Transition name="m3-chain">
            <span v-if="chain >= 2" :key="chain" class="m3-hud__chain">Каскад ×{{ chain }}</span>
          </Transition>
          <div class="m3-hud__stat m3-hud__stat--time" :class="{ 'is-low': isLowTime }">
            <span class="m3-hud__label">Час</span>
            <span class="m3-hud__value" role="timer" :aria-label="`Лишилось ${formatMatch3Clock(timeLeftMs)}`">
              {{ formatMatch3Clock(timeLeftMs) }}
            </span>
            <Transition name="m3-bonus">
              <span v-if="timeBonus" :key="timeBonus.id" class="m3-hud__bonus" aria-hidden="true">
                +{{ Math.round(timeBonus.ms / 1000) }} с
              </span>
            </Transition>
          </div>
        </div>

        <!-- Смуга часу: 100% = базовий раунд; бонуси можуть «переповнити» її — тоді вона просто повна -->
        <div class="m3-timebar" :class="{ 'is-low': isLowTime }" aria-hidden="true">
          <span class="m3-timebar__fill" :style="{ transform: `scaleX(${timeFraction})` }" />
        </div>

        <Match3Board
          :board="board"
          :skins="skins"
          :phase="phase"
          :clearing="clearing"
          :created="created"
          :drops="drops"
          :selected="selected"
          :hint="hint"
          :skill-mode="skillMode"
          :popups="popups"
          :disabled="!isPlaying || busy"
          @tap="tap"
          @swap="swap"
        >
          <div v-if="status === 'starting' || status === 'idle'" class="m3-overlay">
            <span class="m3-overlay__spinner" aria-hidden="true" />
            <span class="m3-overlay__text">Роздаємо героїв…</span>
          </div>

          <Transition name="m3-over">
            <div v-if="status === 'over'" class="m3-overlay m3-overlay--over" role="status">
              <span class="sys-label sys-label--muted">// {{ endTitle }}</span>
              <span class="m3-overlay__score">{{ formatMatch3Score(result?.score ?? score) }}</span>
              <span class="m3-overlay__meta">
                {{ pluralizeMatch3Moves(result?.moves ?? movesMade) }}
                · найдовший каскад ×{{ result?.bestChain ?? bestChain }}
              </span>

              <span v-if="submitting" class="m3-overlay__text">Записуємо результат…</span>
              <template v-else-if="result">
                <span v-if="result.isRecord" class="m3-overlay__record">
                  <PhTrophy :size="14" weight="fill" aria-hidden="true" />
                  Новий рекорд!
                </span>
                <span class="m3-overlay__text">
                  Рекорд: {{ formatMatch3Score(result.best) }}
                  <template v-if="result.position"> · місце #{{ result.position }}</template>
                </span>
              </template>
              <span v-else-if="submitError" class="m3-overlay__text text-error">{{ submitError }}</span>
              <span v-else-if="offline" class="m3-overlay__text">
                {{ offlineText }}
              </span>

              <el-button type="primary" class="m3-overlay__again" @click="start">
                <PhPlay :size="16" weight="fill" class="mr-6" />
                Грати ще
              </el-button>
            </div>
          </Transition>
        </Match3Board>

        <p class="m3-dialog__status" :class="{ 'is-alert': isStuck }" aria-live="polite">{{ statusText }}</p>

        <Match3SkillBar :mana="mana" :active="skillMode" :available="skillsAvailable" @toggle="toggleSkill" />

        <div class="m3-dialog__actions">
          <span class="m3-dialog__note">
            {{ heroesNote }}
          </span>
          <el-button v-if="isPlaying" :disabled="busy" @click="finish('manual')">
            <PhFlagCheckered :size="16" weight="bold" class="mr-6" />
            Завершити гру
          </el-button>
        </div>
      </div>

      <!-- ─── Таблиця + правила ───────────────────────────────────────── -->
      <aside class="m3-dialog__aside">
        <Match3Leaderboard :viewer-id="viewerId" />

        <section class="m3-rules" aria-labelledby="m3-rules-title">
          <h3 id="m3-rules-title" class="sys-label sys-label--muted">// Правила</h3>
          <ul class="m3-rules__list">
            <li><b>3 в ряд</b> — {{ MATCH3_TILE_POINTS }} очок за героя.</li>
            <li><b>Час</b> — {{ roundSeconds }} с на раунд; бонуси подовжують його максимум до {{ maxSeconds }} с.</li>
            <li><b>4 в ряд</b> — лінія: спалює колонку чи рядок. +1 с.</li>
            <li><b>L / T</b> — бомба 3×3. +2 с.</li>
            <li><b>5 в ряд</b> — Aegis: обміняйте з героєм, щоб прибрати всіх таких. +3 с.</li>
            <li><b>Дві спецфішки</b> поруч — обміняйте їх для комбо.</li>
            <li><b>Каскади</b> множать очки (×2, ×3…), третя хвиля дає +2 с.</li>
            <li><b>Мана</b> — +1 за кожного прибраного героя, витрачається на навички.</li>
          </ul>
        </section>
      </aside>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhFlagCheckered, PhGameController, PhPlay, PhTrophy } from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/modules/auth'
import { MATCH3_MAX_ROUND_MS, MATCH3_ROUND_MS, MATCH3_TILE_POINTS } from '@/features/match3/match3-engine.utils'
import type { TMatch3Skill } from '@/features/match3/match3-engine.utils'
import {
  MATCH3_SKILL_BY_ID,
  formatMatch3Clock,
  formatMatch3Score,
  pluralizeMatch3Moves
} from '@/features/match3/match3.utils'
import { useMatch3Game } from '@/features/match3/composables/use-match3-game'
import { useMatch3Heroes } from '@/features/match3/composables/use-match3-heroes'
import Match3Board from '@/features/match3/components/Match3Board.vue'
import Match3Leaderboard from '@/features/match3/components/Match3Leaderboard.vue'
import Match3SkillBar from '@/features/match3/components/Match3SkillBar.vue'

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const viewerId = computed(() => authStore.user?.id ?? null)
const isNarrow = useMediaQuery('(max-width: 640px)')

const { skins: heroSkins, isPersonal } = useMatch3Heroes()
const {
  status,
  phase,
  board,
  skins,
  clearing,
  created,
  drops,
  busy,
  selected,
  skillMode,
  hint,
  popups,
  chain,
  score,
  mana,
  bestChain,
  movesMade,
  timeLeftMs,
  timeBonus,
  isPlaying,
  isStuck,
  offline,
  submitting,
  result,
  submitError,
  endReason,
  start,
  tap,
  swap,
  toggleSkill,
  canUseSkill,
  finish,
  leave
} = useMatch3Game(() => heroSkins.value)

const displayScore = useTransition(score, { duration: 600 })

const roundSeconds = MATCH3_ROUND_MS / 1000
const maxSeconds = MATCH3_MAX_ROUND_MS / 1000
/** Останні 10 секунд — таймер червоніє й пульсує. */
const isLowTime = computed(() => isPlaying.value && timeLeftMs.value <= 10_000)
const timeFraction = computed(() => Math.min(1, timeLeftMs.value / MATCH3_ROUND_MS))

const skillsAvailable = computed<Record<TMatch3Skill, boolean>>(() => ({
  blink: canUseSkill('blink'),
  laguna: canUseSkill('laguna'),
  refresher: canUseSkill('refresher')
}))

const offlineText = computed(() => (
  isLoggedIn.value ? 'Результат не записано — не було зв’язку із сервером.' : 'Увійдіть, щоб потрапити в таблицю.'
))

const heroesNote = computed(() => (
  isPersonal.value
    ? 'На фішках — ваші улюблені герої з OpenDota.'
    : 'Прив’яжіть Steam — і на фішках будуть ваші улюблені герої.'
))

const endTitle = computed(() => {
  if (endReason.value === 'time') return 'Час вийшов'
  if (endReason.value === 'board') return 'Ходів на полі немає'
  return 'Гру завершено'
})

const statusText = computed(() => {
  if (skillMode.value) return MATCH3_SKILL_BY_ID[skillMode.value].targetHint
  if (isStuck.value) return 'Ходів на полі немає — застосуйте навичку, щоб продовжити.'
  if (status.value !== 'playing') return ''
  if (offline.value) {
    return isLoggedIn.value
      ? 'Немає зв’язку із сервером — ця гра не потрапить у таблицю.'
      : 'Гостьова гра — увійдіть, щоб потрапити в таблицю.'
  }
  return 'Міняйте сусідніх героїв місцями (свайп або два кліки), щоб зібрати 3+ в ряд.'
})

// Модалки з useAppModals монтуються вже відкритими — тому watch з immediate, а не @open.
// Закриття (зокрема коли знайшовся матч) зараховує зігране.
watch(modelValue, (open) => {
  if (open) start()
  else leave()
}, { immediate: true })
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.m3-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(12, 15, 30, 0.82);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  // Глобальний діалог обмежено 70vh — гра має вміщатися цілком
  max-height: calc(100dvh - 24px);

  &.is-fullscreen {
    max-width: none;
    max-height: none;
    overflow-y: auto;
  }

  .el-dialog__header {
    padding-bottom: 12px !important;
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 14px;
  }

  .m3-dialog__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-right: 28px;
  }

  .m3-dialog__glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    border: 1px solid rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(var(--ds-primary-rgb), 0.1);
    color: var(--ds-primary);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.25);
  }

  .m3-dialog__title {
    font-family: var(--ds-font-display);
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: 0.02em;
    color: var(--ds-text-strong);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .m3-dialog__subtitle {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }

  .m3-dialog__layout {
    display: grid;
    gap: 20px;
    align-items: start;
  }

  @media (min-width: 860px) {
    .m3-dialog__layout {
      grid-template-columns: minmax(0, 540px) minmax(0, 1fr);
    }
  }

  .m3-dialog__game {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 540px;
    margin: 0 auto;
  }

  // На десктопі поле підлаштовується під висоту вікна: шапка, HUD і навички займають ~440px
  &:not(.is-fullscreen) .m3-dialog__game {
    max-width: clamp(340px, calc(100dvh - 440px), 540px);
  }

  .m3-dialog__aside {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 18px;
  }

  .m3-dialog__status {
    min-height: 18px;
    font-size: 12.5px;
    line-height: 1.45;
    text-align: center;
    color: var(--ds-text-muted);

    &.is-alert {
      color: var(--ds-warning, #fbbf24);
    }
  }

  .m3-dialog__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }

  .m3-dialog__note {
    flex: 1 1 200px;
    font-size: 11.5px;
    line-height: 1.45;
    color: var(--ds-text-faint);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────
  .m3-hud {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .m3-hud__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .m3-hud__stat--time {
    position: relative;
    align-items: flex-end;

    &.is-low .m3-hud__value {
      color: #f43f5e;
      text-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
    }
  }

  .m3-hud__bonus {
    position: absolute;
    right: 0;
    bottom: 100%;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(52, 211, 153, 0.16);
    font-family: var(--ds-font-mono);
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    color: #34d399;
  }

  .m3-bonus-enter-active {
    transition: opacity 260ms ease, transform 420ms cubic-bezier(0.2, 0.7, 0.3, 1);
  }

  .m3-bonus-leave-active {
    transition: opacity 400ms ease, transform 400ms ease;
  }

  .m3-bonus-enter-from {
    opacity: 0;
    transform: translateY(6px);
  }

  .m3-bonus-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  // ─── Смуга часу ────────────────────────────────────────────────────────
  .m3-timebar {
    position: relative;
    height: 6px;
    overflow: hidden;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.06);
  }

  .m3-timebar__fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--ds-primary), #34d399);
    box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.6);
    transform-origin: left center;
    transition: transform 120ms linear, background 400ms ease;
  }

  .m3-timebar.is-low .m3-timebar__fill {
    background: linear-gradient(90deg, #f43f5e, #fb923c);
    box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
  }

  @media (prefers-reduced-motion: no-preference) {
    .m3-hud__stat--time.is-low .m3-hud__value {
      animation: m3-tick 1s ease-in-out infinite;
    }
  }

  .m3-hud__label {
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .m3-hud__value {
    font-family: var(--ds-font-mono);
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ds-text-strong);
    transition: color var(--ds-duration-base) ease;
  }

  .m3-hud__value--score {
    font-size: 28px;
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .m3-hud__chain {
    position: absolute;
    left: 50%;
    bottom: 2px;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid rgba(var(--ds-gold-rgb), 0.5);
    background: rgba(var(--ds-gold-rgb), 0.12);
    font-family: var(--ds-font-mono);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ds-gold);
    transform: translateX(-50%);
  }

  .m3-chain-enter-active {
    transition: opacity 240ms ease, transform 420ms cubic-bezier(0.3, 1.35, 0.5, 1);
  }

  .m3-chain-leave-active {
    transition: opacity 320ms ease;
  }

  .m3-chain-enter-from {
    opacity: 0;
    transform: translateX(-50%) scale(0.6);
  }

  .m3-chain-leave-to {
    opacity: 0;
  }

  // ─── Оверлеї поля ──────────────────────────────────────────────────────
  .m3-overlay {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
    background: rgba(6, 8, 18, 0.55);
  }

  .m3-overlay--over {
    background: rgba(6, 8, 18, 0.8);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .m3-overlay__spinner {
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    border: 3px solid rgba(var(--ds-primary-rgb), 0.25);
    border-top-color: var(--ds-primary);
    animation: m3-spin 800ms linear infinite;
  }

  .m3-overlay__score {
    font-family: var(--ds-font-mono);
    font-size: 44px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .m3-overlay__meta,
  .m3-overlay__text {
    font-size: 13px;
    color: var(--ds-text-muted);
  }

  .m3-overlay__record {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid rgba(var(--ds-gold-rgb), 0.6);
    background: rgba(var(--ds-gold-rgb), 0.14);
    font-family: var(--ds-font-mono);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ds-gold);
  }

  .m3-overlay__again {
    margin-top: 6px;
  }

  .m3-over-enter-active {
    transition: opacity 500ms ease;
  }

  .m3-over-enter-from {
    opacity: 0;
  }

  // ─── Правила ───────────────────────────────────────────────────────────
  .m3-rules {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  .m3-rules__list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 12px;
    line-height: 1.45;
    color: var(--ds-text-muted);

    b {
      color: var(--ds-text-strong);
    }
  }
}

@keyframes m3-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

@keyframes m3-tick {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.12);
  }
}
