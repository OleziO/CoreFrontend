<template>
  <section class="challenges neon-card hud-corners rounded-2xl" aria-labelledby="duel-challenges-title">
    <header class="flex flex-wrap items-start justify-between gap-12">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label sys-label--muted">// Дружні дуелі</span>
        <h2 id="duel-challenges-title" class="challenges__title">Виклик другу</h2>
      </div>
      <span class="challenges__meta" :title="`Прийнятих дружніх дуелей сьогодні: ${challenges.acceptedToday}`">
        {{ challenges.acceptedToday }}/{{ challenges.dailyLimit }} сьогодні · ±{{ challenges.ratingDelta }}
      </span>
    </header>

    <!-- Вхідні виклики -->
    <ul v-if="challenges.incoming.length" class="challenges__list" aria-label="Вхідні виклики">
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
    </ul>

    <!-- Мій відкритий виклик -->
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

    <!-- Кнопка виклику -->
    <template v-else>
      <p class="challenges__text">
        Зіграйте з другом поза чергою: той самий бот, лобі та випадкові герої, але на кону
        <span class="text-success">+{{ challenges.ratingDelta }}</span> /
        <span class="text-error">−{{ challenges.ratingDelta }}</span>.
        До {{ challenges.dailyLimit }} прийнятих дружніх дуелей на день.
      </p>
      <el-button
        type="primary"
        plain
        class="w-full"
        :disabled="!canChallenge"
        @click="emit('open')"
      >
        <PhUsersThree :size="16" weight="bold" class="mr-8" />
        {{ challengeLabel }}
      </el-button>
    </template>
  </section>
</template>

<script setup lang="ts">
import { PhCheck, PhUsersThree } from '@phosphor-icons/vue'
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

const challengeLabel = computed(() => {
  if (props.activeDuel) return 'Спочатку завершіть активну дуель'
  if (limitReached.value) return 'Ліміт дружніх дуелей на сьогодні вичерпано'
  if (props.botsOffline) return 'Боти офлайн — виклики недоступні'
  return 'Викликати друга'
})
</script>

<style scoped>
.challenges {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.challenges__title {
  font-family: var(--ds-font-display);
  font-size: 18px;
  line-height: 1.2;
  color: var(--ds-text-strong);
}

.challenges__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.challenges__text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
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

@keyframes challenges-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .challenges__radar {
    animation: none;
  }
}
</style>
