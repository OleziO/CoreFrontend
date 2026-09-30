<template>
  <section
    class="challenges neon-card hud-corners rounded-2xl"
    :class="{ 'has-incoming': challenges.incoming.length > 0 }"
    aria-labelledby="duel-challenges-title"
  >
    <!-- Тихий стан — один рядок: заголовок, ліміт на день і кнопка виклику -->
    <header class="challenges__head">
      <div class="flex min-w-0 flex-col gap-4">
        <span id="duel-challenges-title" class="sys-label sys-label--muted">// Дружні дуелі</span>
        <span class="challenges__lead">
          Виклик другу поза чергою
          <span class="challenges__meta">
            · ±{{ challenges.ratingDelta }}
            · <span :title="`Прийнятих дружніх дуелей сьогодні: ${challenges.acceptedToday}`">
              {{ challenges.acceptedToday }}/{{ challenges.dailyLimit }} сьогодні
            </span>
          </span>
        </span>
        <span v-if="blockedReason" class="challenges__blocked">{{ blockedReason }}</span>
      </div>
      <!-- Вимкнена кнопка — не «вицвіла» основна, а нейтральна пігулка із замком: причина під заголовком -->
      <el-button
        v-if="!challenges.outgoing"
        type="primary"
        plain
        class="challenges__cta"
        :class="{ 'is-locked': !canChallenge }"
        :disabled="!canChallenge"
        :title="blockedReason || undefined"
        @click="emit('open')"
      >
        <PhLock v-if="!canChallenge" :size="15" weight="bold" class="mr-6" />
        <PhUsersThree v-else :size="16" weight="bold" class="mr-6" />
        Викликати друга
      </el-button>
    </header>

    <!-- Вхідні виклики -->
    <TransitionGroup
      v-if="challenges.incoming.length"
      name="challenges-row"
      tag="ul"
      class="challenges__list"
      aria-label="Вхідні виклики"
    >
      <li v-for="item in challenges.incoming" :key="item.id" class="challenges__row is-incoming">
        <el-avatar :src="resolvePublicOrApiUrl(item.challenger.avatarUrl)" :size="36" class="challenges__avatar">
          {{ duelPlayerInitial(item.challenger) }}
        </el-avatar>
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <span class="challenges__name">
            <RouterLink
              :to="{ name: routeNames.player, params: { id: item.challenger.id } }"
              class="no-underline text-inherit"
            >
              {{ duelPlayerName(item.challenger) }}
            </RouterLink>
            <span class="challenges__rating">{{ item.challenger.rating }}</span>
          </span>
          <span class="challenges__hint">
            викликає вас на дуель · ще {{ formatDuelCountdown(secondsUntil(item.expiresAt, now)) }}
          </span>
        </div>
        <div class="flex shrink-0 items-center gap-6">
          <el-button
            type="success"
            size="small"
            :loading="isBusy(item.id)"
            :disabled="isBusy(item.id) || !!activeDuel"
            @click="emit('accept', item.id)"
          >
            <PhCheck v-if="!isBusy(item.id)" :size="14" weight="bold" class="mr-4" />
            Прийняти
          </el-button>
          <el-button
            size="small"
            plain
            :disabled="isBusy(item.id)"
            @click="emit('decline', item.id)"
          >
            Відхилити
          </el-button>
        </div>
      </li>
    </TransitionGroup>

    <!-- Мій відкритий виклик -->
    <Transition name="challenges-row">
      <div v-if="challenges.outgoing" class="challenges__row is-outgoing">
        <span class="challenges__radar" aria-hidden="true" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <span class="challenges__name">
            Чекаємо на {{ duelPlayerName(challenges.outgoing.challenged) }}
          </span>
          <span class="challenges__hint">
            виклик згорить за {{ formatDuelCountdown(secondsUntil(challenges.outgoing.expiresAt, now)) }}
          </span>
        </div>
        <el-button
          size="small"
          plain
          :loading="isBusy(challenges.outgoing.id)"
          :disabled="isBusy(challenges.outgoing.id)"
          @click="emit('cancel', challenges.outgoing.id)"
        >
          Скасувати
        </el-button>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { PhCheck, PhLock, PhUsersThree } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelPlayerInitial, duelPlayerName, formatDuelCountdown, secondsUntil } from '@/views/duels/duels.utils'
import type { TDuel, TDuelChallengesState } from '@/api/types/api.types'

const props = defineProps<{
  challenges: TDuelChallengesState
  /** Активна дуель блокує і виклик, і прийняття. */
  activeDuel: TDuel | null
  /** Гравець у черзі — можна викликати, при прийнятті обидва виходять із черги. */
  isBusy: (id: string) => boolean
  /** Жоден бот не онлайн — виклики не мають сенсу. */
  botsOffline: boolean
}>()

const emit = defineEmits<{
  open: []
  accept: [id: string]
  decline: [id: string]
  cancel: [id: string]
}>()

const now = useNow({ interval: 1000 })

const limitReached = computed(() => props.challenges.acceptedToday >= props.challenges.dailyLimit)
const canChallenge = computed(() => !props.activeDuel && !limitReached.value && !props.botsOffline)

/** Чому кнопка вимкнена — коротко, під заголовком, а не на самій кнопці. */
const blockedReason = computed(() => {
  if (props.challenges.outgoing) return ''
  if (props.activeDuel) return 'Спочатку завершіть активну дуель'
  if (limitReached.value) return 'Ліміт дружніх дуелей на сьогодні вичерпано'
  if (props.botsOffline) return 'Боти офлайн — виклики недоступні'
  return ''
})
</script>

<style scoped>
.challenges {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  transition: border-color var(--ds-duration-base) ease;
}

.challenges.has-incoming {
  border-color: rgba(34, 197, 94, 0.4);
}

.challenges__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.challenges__lead {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.challenges__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.challenges__blocked {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.challenges__cta {
  flex-shrink: 0;
}

/*
 * Element Plus для `primary plain + disabled` ставить кольори напряму (світла заливка light-9),
 * а не через змінні — тому перекриваємо самі властивості. Вимкнена кнопка — той самий контур,
 * лише пригашений: прозора заливка, ціан на чверть яскравості, без світіння.
 */
.challenges .challenges__cta.is-locked,
.challenges .challenges__cta.is-locked:hover,
.challenges .challenges__cta.is-locked:focus,
.challenges .challenges__cta.is-locked:active {
  color: rgba(var(--ds-primary-rgb), 0.45);
  background-color: rgba(var(--ds-primary-rgb), 0.04);
  border-color: rgba(var(--ds-primary-rgb), 0.22);
  opacity: 1;
  box-shadow: none;
  cursor: not-allowed;
}

.challenges__blocked {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.challenges__blocked::before {
  content: '';
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--ds-gold);
  box-shadow: 0 0 6px rgba(var(--ds-gold-rgb), 0.7);
}

@media (max-width: 480px) {
  .challenges__cta {
    width: 100%;
  }
}

.challenges__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.challenges__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.challenges__row.is-incoming {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}

.challenges__avatar {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
}

.challenges__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.challenges__rating {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}

.challenges__hint {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.challenges__radar {
  position: relative;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: rgba(var(--ds-primary-rgb), 0.9);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.8);
  animation: challenges-pulse 1.6s ease-in-out infinite;
}

/* Рядки викликів з'являються/зникають з висоти, не стрибаючи */
.challenges-row-enter-active,
.challenges-row-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform 260ms var(--ds-ease-out);
}

.challenges-row-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.challenges-row-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.challenges-row-move {
  transition: transform 260ms var(--ds-ease-in-out);
}

@keyframes challenges-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}
</style>
