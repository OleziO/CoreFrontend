<template>
  <section class="queue-panel neon-card hud-corners rounded-2xl" aria-labelledby="duel-queue-title">
    <header class="flex flex-wrap items-start justify-between gap-12">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label sys-label--muted">// Черга</span>
        <h2 id="duel-queue-title" class="queue-panel__title">Пошук суперника</h2>
      </div>
      <DuelRatingBadge
        v-if="status"
        :rating="status.rating.rating"
        :streak="status.rating.streak"
        size="lg"
      />
    </header>

    <!-- Не залогінений -->
    <div v-if="!isLoggedIn" class="queue-panel__body">
      <p class="queue-panel__text">
        Увійдіть, щоб стати в чергу. Матчі 1v1 Solo Mid хостить бот ліги — усе, що треба, це
        прив’язаний Steam-акаунт.
      </p>
      <el-button type="primary" size="large" class="w-full" @click="emit('login')">
        <PhDiscordLogo :size="18" weight="bold" class="mr-8" />
        Увійти через Discord
      </el-button>
    </div>

    <!-- Завантаження -->
    <div v-else-if="isPending && !status" class="queue-panel__body">
      <span class="skeleton-bone block h-[44px] !rounded-xl" />
      <span class="skeleton-bone block h-[20px] w-2/3 !rounded-lg" />
    </div>

    <!-- У черзі -->
    <div v-else-if="status?.queue" class="queue-panel__body">
      <div class="queue-panel__search">
        <span class="queue-panel__radar" aria-hidden="true" />
        <div class="flex min-w-0 flex-col gap-4">
          <span class="text-sm font-semibold text-white">Шукаємо суперника…</span>
          <span class="text-xs text-white/60">
            Вікно рейтингу ±{{ liveWindow }} · у черзі {{ pluralizeDuelPlayers(status.queue.playersInQueue) }}
          </span>
        </div>
        <span class="queue-panel__timer">{{ formatDuelCountdown(liveWaitSeconds) }}</span>
      </div>
      <p class="queue-panel__text">
        Вікно розширюється на 50 очок кожні 30 секунд. Не закривайте сторінку — так ми знаємо, що ви ще тут.
      </p>
      <el-button size="large" class="w-full" :loading="leaving" @click="emit('leave')">
        Вийти з черги
      </el-button>
    </div>

    <!-- Може стати в чергу -->
    <div v-else-if="status?.canQueue" class="queue-panel__body">
      <p class="queue-panel__text">
        Суперника підбираємо за рейтингом. Перемога <span class="text-success">+{{ DUEL_RATING_DELTA }}</span>,
        поразка <span class="text-error">−{{ DUEL_RATING_DELTA }}</span>, старт з нуля.
      </p>
      <el-button type="primary" size="large" class="w-full" :loading="joining" @click="emit('join')">
        <PhSword :size="18" weight="fill" class="mr-8" />
        Шукати суперника
      </el-button>
    </div>

    <!-- Заблоковано -->
    <div v-else-if="status" class="queue-panel__body">
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

    <p v-else-if="isError" class="queue-panel__text text-error">
      Не вдалося завантажити статус. Спробуйте оновити сторінку.
    </p>
  </section>
</template>

<script setup lang="ts">
import { PhDiscordLogo, PhSteamLogo, PhSword, PhWarningCircle } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import {
  DUEL_RATING_DELTA,
  duelQueueBlockedLabels,
  formatDuelCountdown,
  pluralizeDuelPlayers,
  secondsUntil
} from '@/views/duels/duels.utils'
import DuelRatingBadge from '@/views/duels/components/DuelRatingBadge.vue'
import type { TDuelStatus } from '@/api/types/api.types'

const props = defineProps<{
  status: TDuelStatus | null
  isLoggedIn: boolean
  isPending: boolean
  isError: boolean
  joining: boolean
  leaving: boolean
}>()

const emit = defineEmits<{
  join: []
  leave: []
  login: []
}>()

const now = useNow({ interval: 1000 })

/** Секунди в черзі з локального годинника — між полінгами лічильник не завмирає. */
const liveWaitSeconds = computed(() => {
  const joinedAt = props.status?.queue?.joinedAt
  if (!joinedAt) return 0
  const at = new Date(joinedAt).getTime()
  if (Number.isNaN(at)) return props.status?.queue?.waitSeconds ?? 0
  return Math.max(0, Math.floor((now.value.getTime() - at) / 1000))
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
}

@media (min-width: 768px) {
  .queue-panel {
    padding: 24px;
  }
}

.queue-panel__title {
  font-family: var(--ds-font-display);
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
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
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(var(--ds-primary-rgb), 0.06);
}

.queue-panel__timer {
  margin-left: auto;
  font-family: var(--ds-font-mono);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.queue-panel__radar {
  position: relative;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 2px solid rgba(var(--ds-primary-rgb), 0.5);
}

.queue-panel__radar::before,
.queue-panel__radar::after {
  content: '';
  position: absolute;
  inset: 0;
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

@media (prefers-reduced-motion: no-preference) {
  .queue-panel__radar::before {
    animation: duel-radar 2s ease-out infinite;
  }

  .queue-panel__radar::after {
    animation: duel-radar 2s ease-out 1s infinite;
  }

  @keyframes duel-radar {
    0% {
      transform: scale(0.6);
      opacity: 0.9;
    }

    100% {
      transform: scale(1.6);
      opacity: 0;
    }
  }
}
</style>
