<template>
  <section class="result-banner neon-card hud-corners rounded-2xl" :class="`is-${outcome}`" role="status">
    <span class="result-banner__icon" aria-hidden="true">
      <PhTrophy v-if="outcome === 'win'" :size="26" weight="duotone" />
      <PhSkull v-else-if="outcome === 'loss'" :size="26" weight="duotone" />
      <PhHourglassHigh v-else-if="outcome === 'processing'" :size="26" weight="duotone" class="result-banner__spin" />
      <PhWarningOctagon v-else :size="26" weight="duotone" />
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <span class="result-banner__title">{{ title }}</span>
      <span class="result-banner__meta">{{ meta }}</span>
    </div>
    <span v-if="delta != null" class="result-banner__delta">{{ formatDuelDelta(delta) }}</span>
    <!-- Гра ще триває («обробка»): голосовий канал дуелі досі живий -->
    <a
      v-if="outcome === 'processing' && duel.discordVoiceChannelUrl"
      :href="duel.discordVoiceChannelUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="no-underline"
    >
      <el-button size="small" plain>
        <PhDiscordLogo :size="14" weight="fill" class="mr-6" />
        Голосовий канал
      </el-button>
    </a>
    <el-button text size="small" class="btn-icon" aria-label="Закрити" @click="emit('dismiss')">
      <PhX :size="14" weight="bold" />
    </el-button>
  </section>
</template>

<script setup lang="ts">
import { PhDiscordLogo, PhHourglassHigh, PhSkull, PhTrophy, PhWarningOctagon, PhX } from '@phosphor-icons/vue'
import {
  duelDeltaFor,
  duelEndReasonLabel,
  duelOpponentOf,
  duelOutcomeFor,
  duelPlayerName,
  formatDuelDelta
} from '@/views/duels/duels.utils'
import type { TDuel } from '@/api/types/api.types'

const props = defineProps<{
  duel: TDuel
  meId: string | null
}>()

const emit = defineEmits<{ dismiss: [] }>()

const outcome = computed(() => duelOutcomeFor(props.duel, props.meId))
const delta = computed(() => duelDeltaFor(props.duel, props.meId))
const opponentName = computed(() => duelPlayerName(duelOpponentOf(props.duel, props.meId)))

const title = computed(() => {
  switch (outcome.value) {
    case 'win': return `Перемога над ${opponentName.value}!`
    case 'loss': return `Поразка від ${opponentName.value}`
    case 'processing': return `Матч із ${opponentName.value} зіграно`
    case 'failed': return 'Дуель завершилась збоєм'
    default: return 'Дуель скасовано'
  }
})

const meta = computed(() => {
  const reason = duelEndReasonLabel(props.duel)
  if (outcome.value === 'processing') {
    return 'Обробляємо результат — рейтинг оновиться автоматично. Уже можна шукати наступного суперника.'
  }
  if (outcome.value === 'failed') return `${reason}. Адміністрація перегляне результат.`
  if (outcome.value === 'cancelled') {
    if (delta.value != null && delta.value < 0) {
      return props.duel.cancelReason === 'accept_timeout'
        ? `Ви не прийняли матч вчасно: ${formatDuelDelta(delta.value)} і коротка пауза перед наступною чергою.`
        : `Ви скасували матч: ${formatDuelDelta(delta.value)}.`
    }
    if (props.duel.cancelReason === 'player_cancelled') return 'Суперник скасував матч. Ваш рейтинг не змінився.'
    if (props.duel.cancelReason === 'accept_timeout') return 'Суперник не прийняв матч. Ваш рейтинг не змінився.'
    if (props.duel.cancelReason === 'game_aborted') {
      return 'Гра так і не стартувала: гравець не завантажився в матч навіть після перезапуску лобі. ' +
        'Рейтинг не змінився — можна ставати в чергу знову.'
    }
    return reason || 'Рейтинг не змінився.'
  }
  if (outcome.value === 'loss' && props.duel.cancelReason === 'players_no_show') {
    return 'Неявка в лобі: −25 і коротка пауза перед наступною чергою.'
  }
  return props.duel.dotaMatchId ? `Матч ${props.duel.dotaMatchId}` : 'Результат зараховано.'
})
</script>

<style scoped>
.result-banner {
  --tone: var(--ds-primary-rgb);
  --hud-corner-inset: 6px;

  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-color: rgba(var(--tone), 0.4);
}

.result-banner.is-win {
  --tone: 34, 197, 94;
}

.result-banner.is-loss {
  --tone: 244, 63, 94;
}

.result-banner.is-cancelled,
.result-banner.is-failed {
  --tone: 245, 158, 11;
}

.result-banner.is-processing {
  --tone: var(--ds-primary-rgb);
}

.result-banner__spin {
  animation: result-banner-flip 2.4s ease-in-out infinite;
}

@keyframes result-banner-flip {
  0%, 40% { transform: rotate(0deg); }
  60%, 100% { transform: rotate(180deg); }
}

@media (prefers-reduced-motion: reduce) {
  .result-banner__spin {
    animation: none;
  }
}

.result-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(var(--tone), 0.12);
  color: rgb(var(--tone));
}

.result-banner__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.result-banner__meta {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

.result-banner__delta {
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tone));
  text-shadow: 0 0 10px rgba(var(--tone), 0.5);
}
</style>
