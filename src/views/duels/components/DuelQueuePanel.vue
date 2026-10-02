<template>
  <section
    class="queue-panel neon-card hud-corners rounded-2xl"
    :class="{ 'is-searching': inQueue }"
    aria-labelledby="duel-queue-title"
  >
    <header class="queue-panel__head">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label sys-label--muted">// Черга</span>
        <h2 id="duel-queue-title" class="queue-panel__title">
          {{ inQueue ? 'Шукаємо суперника' : 'Пошук суперника' }}
        </h2>
      </div>
      <div class="flex shrink-0 items-center gap-8">
        <!-- Звук «Матч знайдено»: вмикання одразу програє сигнал, щоб було чути, наскільки він гучний -->
        <button
          v-if="isLoggedIn"
          type="button"
          class="queue-panel__sound"
          :class="{ 'is-muted': muted }"
          :aria-label="muted ? 'Увімкнути звук «Матч знайдено»' : 'Вимкнути звук «Матч знайдено»'"
          :aria-pressed="!muted"
          :title="soundTitle"
          @click="toggleMuted"
        >
          <PhSpeakerSlash v-if="muted" :size="15" weight="bold" />
          <PhSpeakerHigh v-else :size="15" weight="bold" />
        </button>
        <DuelQueueCountBadge v-if="status" :count="status.playersInQueue" />
      </div>
    </header>

    <!-- Правила в одному місці: герой випадковий, ставка, час на прийняття -->
    <ul class="queue-panel__rules" aria-label="Правила дуелі">
      <li class="queue-panel__rule">
        <PhShuffle :size="12" weight="bold" aria-hidden="true" />
        випадковий герой
      </li>
      <li class="queue-panel__rule">
        <span class="text-success">+{{ DUEL_RATING_DELTA }}</span>
        <span class="text-white/30">/</span>
        <span class="text-error">−{{ DUEL_RATING_DELTA }}</span>
      </li>
      <li class="queue-panel__rule">
        <PhTimer :size="12" weight="bold" aria-hidden="true" />
        {{ DUEL_ACCEPT_WINDOW_SECONDS }} с на прийняття
      </li>
    </ul>

    <Transition name="queue-state" mode="out-in">
      <!-- Не залогінений -->
      <div v-if="!isLoggedIn" key="guest" class="queue-panel__body">
        <p class="queue-panel__text">
          Увійдіть, щоб стати в чергу. Дуелі Solo Mid хостить бот ліги — усе, що треба, це прив’язаний Steam-акаунт.
        </p>
        <el-button type="primary" size="large" class="w-full" @click="emit('login')">
          <PhDiscordLogo :size="18" weight="bold" class="mr-8" />
          Увійти через Discord
        </el-button>
      </div>

      <!-- Завантаження -->
      <div v-else-if="isPending && !status" key="loading" class="queue-panel__body">
        <span class="skeleton-bone block h-[44px] !rounded-xl" />
        <span class="skeleton-bone block h-[20px] w-2/3 !rounded-lg" />
      </div>

      <!-- У черзі -->
      <div v-else-if="status?.queue" key="queue" class="queue-panel__body">
        <div class="queue-panel__search">
          <span class="queue-panel__scan" aria-hidden="true" />
          <span class="queue-panel__radar" aria-hidden="true">
            <PhSword :size="12" weight="fill" />
          </span>
          <div class="flex min-w-0 flex-col gap-4">
            <span class="queue-panel__search-title">Шукаємо суперника<span class="queue-panel__dots" /></span>
            <!-- Черга турніру: суперник — будь-який учасник, вікна рейтингу немає -->
            <span v-if="status.queue.tournament" class="truncate text-xs text-white/60">
              Турнір «{{ status.queue.tournament.name }}» · у черзі
              {{ pluralizeDuelPlayers(status.queue.playersInQueue) }}
            </span>
            <span v-else class="text-xs text-white/60">
              Вікно рейтингу ±{{ liveWindow }} · у черзі {{ pluralizeDuelPlayers(status.queue.playersInQueue) }}
            </span>
            <span
              class="queue-panel__live"
              :class="realtime ? 'queue-panel__live--on' : 'queue-panel__live--off'"
              :title="liveTitle"
            >
              <span class="queue-panel__live-dot" aria-hidden="true" />
              {{ realtime ? 'live' : 'polling' }}
            </span>
          </div>
          <span class="queue-panel__timer">{{ formatDuelCountdown(liveWaitSeconds) }}</span>
        </div>
        <p v-if="status.queue.tournament" class="queue-panel__text">
          Підбираємо суперника серед учасників турніру. Не закривайте сторінку — так ми знаємо, що ви ще тут.
        </p>
        <p v-else class="queue-panel__text">
          Вікно розширюється на 50 очок кожні 30 секунд. Не закривайте сторінку — так ми знаємо, що ви ще тут.
        </p>
        <el-button size="large" class="w-full" :loading="leaving" @click="emit('leave')">
          Вийти з черги
        </el-button>
      </div>

      <!-- Жоден бот не онлайн — черга закрита, навіть якщо бекенд ще не оновив canQueue -->
      <div v-else-if="botsOffline" key="offline" class="queue-panel__body">
        <div class="queue-panel__blocked queue-panel__blocked--danger">
          <PhWarningCircle :size="20" weight="duotone" class="shrink-0 text-error" />
          <span>{{ duelQueueBlockedLabels.no_bots_online }}</span>
        </div>
        <el-button type="primary" size="large" class="w-full" disabled>
          <PhSword :size="18" weight="fill" class="mr-8" />
          Шукати суперника
        </el-button>
      </div>

      <!-- Може стати в чергу -->
      <div v-else-if="status?.canQueue" key="ready" class="queue-panel__body">
        <p class="queue-panel__text">
          Підбираємо суперника з рейтингом ±50 — вікно росте щопівхвилини, поки ви чекаєте. Старт з нуля.
        </p>
        <el-button
          type="primary"
          size="large"
          class="w-full queue-panel__cta"
          :loading="joining"
          @click="emit('join')"
        >
          <PhSword :size="18" weight="fill" class="mr-8" />
          Шукати суперника
        </el-button>
      </div>

      <!-- Заблоковано -->
      <div v-else-if="status" key="blocked" class="queue-panel__body">
        <div class="queue-panel__blocked">
          <PhWarningCircle :size="20" weight="duotone" class="shrink-0 text-warning" />
          <span>{{ blockedText }}</span>
        </div>
        <RouterLink
          v-if="status.queueBlockedReason === 'steam_not_linked'"
          :to="{ name: routeNames.profile }"
          class="no-underline"
        >
          <el-button type="primary" size="large" class="w-full">
            <PhSteamLogo :size="18" weight="bold" class="mr-8" />
            Прив’язати Steam у профілі
          </el-button>
        </RouterLink>
      </div>

      <p v-else-if="isError" key="error" class="queue-panel__text text-error">
        Не вдалося завантажити статус. Спробуйте оновити сторінку.
      </p>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import {
  PhDiscordLogo,
  PhShuffle,
  PhSpeakerHigh,
  PhSpeakerSlash,
  PhSteamLogo,
  PhSword,
  PhTimer,
  PhWarningCircle
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useDuelSounds } from '@/views/duels/composables/use-duel-sounds'
import {
  DUEL_ACCEPT_WINDOW_SECONDS,
  DUEL_RATING_DELTA,
  duelQueueBlockedLabels,
  formatDuelCountdown,
  pluralizeDuelPlayers,
  secondsUntil
} from '@/views/duels/duels.utils'
import DuelQueueCountBadge from '@/views/duels/components/DuelQueueCountBadge.vue'
import type { TDuelStatus } from '@/api/types/api.types'

const props = defineProps<{
  status: TDuelStatus | null
  isLoggedIn: boolean
  isPending: boolean
  isError: boolean
  joining: boolean
  leaving: boolean
  /** Жоден бот-хост не онлайн — кнопка черги вимкнена. */
  botsOffline?: boolean
  /** Сокет підключений — статус приходить миттєво, без полінгу. */
  realtime?: boolean
}>()

const emit = defineEmits<{
  join: []
  leave: []
  login: []
}>()

const now = useNow({ interval: 1000 })
const { muted, toggleMuted } = useDuelSounds()

const inQueue = computed(() => !!props.status?.queue)
const liveTitle = computed(() => (
  props.realtime
    ? 'Статус оновлюється миттєво'
    : 'Немає живого з’єднання — оновлюємо кожні кілька секунд'
))
const soundTitle = computed(() => (
  muted.value
    ? 'Звук вимкнено — натисніть, щоб увімкнути й прослухати'
    : 'Звук увімкнено — натисніть, щоб вимкнути'
))

/**
 * Секунди в черзі: беремо `waitSeconds` бекенду і дораховуємо локально час від
 * моменту, коли отримали відповідь. Так лічильник не завмирає між полінгами і
 * не залежить від розбіжності годинників клієнта й сервера (порівняння
 * `joinedAt` з локальним `Date.now()` давало вічний «0», коли сервер попереду).
 */
const waitBase = ref<{ seconds: number; receivedAt: number } | null>(null)
watch(
  () => props.status?.queue ?? null,
  (queue) => {
    waitBase.value = queue ? { seconds: queue.waitSeconds, receivedAt: Date.now() } : null
  },
  { immediate: true }
)
const liveWaitSeconds = computed(() => {
  const base = waitBase.value
  if (!base) return 0
  return Math.max(0, base.seconds + Math.floor((now.value.getTime() - base.receivedAt) / 1000))
})

/** Дзеркало формули бекенду: ±50 на старті, +50 кожні 30 с. */
const liveWindow = computed(() => 50 + 50 * Math.floor(liveWaitSeconds.value / 30))

const blockedText = computed(() => {
  const reason = props.status?.queueBlockedReason
  if (!reason) return ''
  if (reason === 'cooldown') {
    const left = secondsUntil(props.status?.rating.cooldownUntil, now.value)
    return left > 0
      ? `Пауза після неявки — черга відкриється через ${formatDuelCountdown(left)}`
      : duelQueueBlockedLabels.cooldown
  }
  return duelQueueBlockedLabels[reason]
})
</script>

<style scoped>
.queue-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;
}

@media (min-width: 768px) {
  .queue-panel {
    padding: 24px;
  }
}

/* Поки шукаємо — рамка картки «дихає» основним кольором */
.queue-panel.is-searching {
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.9);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));

  border-color: rgba(var(--ds-primary-rgb), 0.45);
}

.queue-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.queue-panel__title {
  font-family: var(--ds-font-display);
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
}

.queue-panel__sound {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-height-sm);
  height: var(--ds-control-height-sm);
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  border-radius: 9999px;
  background: rgba(var(--ds-primary-rgb), 0.06);
  color: var(--ds-primary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.queue-panel__sound:hover {
  border-color: rgba(var(--ds-primary-rgb), 0.6);
  background: rgba(var(--ds-primary-rgb), 0.12);
}

.queue-panel__sound:active {
  transform: scale(0.92);
}

.queue-panel__sound.is-muted {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: var(--ds-text-faint);
}

.queue-panel__rules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.queue-panel__rule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
  white-space: nowrap;
}

.queue-panel__rule svg {
  color: var(--ds-gold);
}

.queue-panel__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.queue-panel__text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.queue-panel__search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.06);
}

/* Промінь сканера — пробігає картку пошуку зліва направо */
.queue-panel__scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 0%,
    transparent 40%,
    rgba(var(--ds-primary-rgb), 0.14) 50%,
    transparent 60%,
    transparent 100%
  );
  transform: translateX(-100%);
}

.queue-panel__search-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.queue-panel__dots::after {
  content: '…';
  display: inline-block;
  width: 1.2em;
  text-align: left;
}

.queue-panel__timer {
  margin-left: auto;
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.queue-panel__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.queue-panel__live--on {
  color: var(--ds-success, #22c55e);
}

.queue-panel__live--off {
  color: var(--ds-text-faint);
}

.queue-panel__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: currentcolor;
  box-shadow: 0 0 6px currentcolor;
}

.queue-panel__radar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 2px solid rgba(var(--ds-primary-rgb), 0.5);
  color: var(--ds-primary);
}

.queue-panel__radar::before,
.queue-panel__radar::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  border: 2px solid var(--ds-primary);
  opacity: 0;
}

.queue-panel__blocked {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.25);
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text);
}

.queue-panel__blocked--danger {
  border-style: solid;
  border-color: rgba(244, 63, 94, 0.45);
  background: rgba(244, 63, 94, 0.08);
}

/* Перемикання станів (гість → черга → активна) — м'який зсув */
.queue-state-enter-active,
.queue-state-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

.queue-state-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.queue-state-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: no-preference) {
  .queue-panel__radar::before {
    animation: duel-radar 2s ease-out infinite;
  }

  .queue-panel__radar::after {
    animation: duel-radar 2s ease-out 1s infinite;
  }

  .queue-panel__scan {
    animation: duel-scan 2.8s var(--ds-ease-in-out) infinite;
  }

  .queue-panel.is-searching {
    animation: duel-search-breathe 3.2s ease-in-out infinite;
  }

  .queue-panel__dots::after {
    animation: duel-dots 1.5s steps(4, end) infinite;
  }

  .queue-panel__cta:not(.is-loading) {
    animation: duel-cta-glow 2.4s ease-in-out infinite;
  }

  @keyframes duel-radar {
    0% {
      transform: scale(0.6);
      opacity: 0.9;
    }

    100% {
      transform: scale(1.7);
      opacity: 0;
    }
  }

  @keyframes duel-scan {
    0%,
    15% {
      transform: translateX(-100%);
    }

    85%,
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes duel-search-breathe {
    0%,
    100% {
      box-shadow: var(--ds-elevation-3), 0 0 14px rgba(var(--ds-primary-rgb), 0.12);
    }

    50% {
      box-shadow: var(--ds-elevation-3), 0 0 28px rgba(var(--ds-primary-rgb), 0.28);
    }
  }

  @keyframes duel-dots {
    0% {
      content: '';
    }

    25% {
      content: '.';
    }

    50% {
      content: '..';
    }

    75%,
    100% {
      content: '…';
    }
  }

  @keyframes duel-cta-glow {
    0%,
    100% {
      box-shadow: 0 0 0 rgba(var(--ds-primary-rgb), 0);
    }

    50% {
      box-shadow: 0 0 22px rgba(var(--ds-primary-rgb), 0.35);
    }
  }
}
</style>
