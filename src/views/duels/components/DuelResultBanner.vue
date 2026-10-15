<template>
  <section class="result-banner neon-card hud-corners rounded-2xl" :class="`is-${outcome}`" role="status">
    <!-- Одноразовий відблиск по картці після появи — перемога сяє золотом, поразка не сяє -->
    <span v-if="outcome === 'win'" class="result-banner__shine" aria-hidden="true" />
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
  duelStakeOf,
  formatDuelDelta,
  isBracketDuel
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

/** Матч сітки медіа-турніру: рейтинг не рухається — кажемо, що далі в сітці. */
const bracketMeta = computed(() => {
  const ref = props.duel.bracket
  const name = ref ? `«${ref.name}»` : 'турніру'
  const iLost = props.duel.loserId === props.meId
  // Програш у півфіналі — ще не кінець: далі матч за 3 місце.
  const toThirdPlace = !!ref && !ref.isThirdPlace && ref.rounds >= 2 && ref.round === ref.rounds - 1
  if (outcome.value === 'processing') return 'Обробляємо результат — сітка турніру оновиться автоматично.'
  if (outcome.value === 'failed') return 'Результат вирішить організатор турніру.'
  if (outcome.value === 'win') return `Ви проходите далі в сітці ${name}.`
  if (props.duel.state === 'CANCELLED' && props.duel.cancelReason === 'player_cancelled') {
    return iLost
      ? 'Ви відмовилися від матчу — технічна поразка в сітці.'
      : 'Суперник відмовився від матчу — ви проходите далі.'
  }
  if (props.duel.cancelReason === 'players_no_show' && props.duel.loserId && !iLost) {
    return 'Суперник не зайшов у лобі — технічна перемога, ви проходите далі.'
  }
  if (outcome.value === 'loss') {
    const lead = props.duel.cancelReason === 'players_no_show' ? 'Неявка в лобі — технічна поразка. ' : ''
    return toThirdPlace ? `${lead}Попереду матч за 3 місце.` : `${lead}Ви вибули з турніру ${name}. Дякуємо за гру!`
  }
  return 'Матч переграють або його вирішить організатор турніру.'
})

const meta = computed(() => {
  if (isBracketDuel(props.duel)) return bracketMeta.value
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
    return `Неявка в лобі: −${duelStakeOf(props.duel)} і коротка пауза перед наступною чергою.`
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
  overflow: hidden;
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

.result-banner__shine {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(var(--tone), 0.18) 45%,
    rgba(255, 255, 255, 0.22) 50%,
    rgba(var(--tone), 0.18) 55%,
    transparent 70%
  );
  transform: translateX(-120%);
}

.result-banner__spin {
  animation: result-banner-flip 2.4s ease-in-out infinite;
}

@keyframes result-banner-flip {
  0%, 40% { transform: rotate(0deg); }
  60%, 100% { transform: rotate(180deg); }
}

.result-banner__icon {
  position: relative;
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
  position: relative;
  font-size: 15px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.result-banner__meta {
  position: relative;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

.result-banner__delta {
  position: relative;
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tone));
  text-shadow: 0 0 10px rgba(var(--tone), 0.5);
}

@media (prefers-reduced-motion: no-preference) {
  .result-banner__icon {
    animation: result-icon-pop 520ms var(--ds-ease-out) 120ms both;
  }

  .result-banner__delta {
    animation: result-delta-pop 560ms var(--ds-ease-out) 260ms both;
  }

  .result-banner__shine {
    animation: result-shine 1.1s var(--ds-ease-in-out) 380ms both;
  }

  @keyframes result-icon-pop {
    from {
      opacity: 0;
      transform: scale(0.6) rotate(-12deg);
    }

    60% {
      transform: scale(1.08) rotate(2deg);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes result-delta-pop {
    from {
      opacity: 0;
      transform: scale(1.6);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes result-shine {
    from {
      transform: translateX(-120%);
    }

    to {
      transform: translateX(120%);
    }
  }
}
</style>
