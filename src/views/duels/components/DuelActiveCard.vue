<template>
  <section class="active-card neon-card hud-corners rounded-2xl" aria-labelledby="duel-active-title">
    <header class="flex flex-wrap items-start justify-between gap-12">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label sys-label--gold">
          // Дуель #{{ duel.number }}
          <template v-if="isFriendDuel(duel)"> · дружня · ±{{ duelStakeOf(duel) }}</template>
        </span>
        <h2 id="duel-active-title" class="active-card__title">{{ duelStateLabels[duel.state] }}</h2>
      </div>
      <span v-if="duel.state === 'WAITING_PLAYERS' && joinLeft > 0" class="active-card__deadline">
        <PhTimer :size="14" weight="bold" />
        {{ formatDuelCountdown(joinLeft) }}
      </span>
      <span v-else-if="duel.state === 'LIVE'" class="active-card__deadline is-live">
        <span class="active-card__live-dot" aria-hidden="true" />
        LIVE
      </span>
    </header>

    <!-- Степпер -->
    <ol class="active-card__steps" aria-label="Етапи дуелі">
      <li
        v-for="(step, index) in duelSteps"
        :key="step.key"
        class="active-card__step"
        :class="{
          'is-done': index < currentStep,
          'is-current': index === currentStep
        }"
      >
        <span class="active-card__step-index">
          <PhCheck v-if="index < currentStep" :size="11" weight="bold" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="active-card__step-label">{{ step.label }}</span>
      </li>
    </ol>
    <p class="active-card__hint">{{ duelSteps[Math.min(currentStep, duelSteps.length - 1)].hint }}</p>

    <!-- Лобі перезапущено: гра не стартувала (гравець не завантажився), бот запускає матч заново -->
    <p v-if="lobbyRestarted" class="active-card__restart" role="status">
      <PhArrowsClockwise :size="14" weight="bold" class="shrink-0" />
      <span>
        Лобі перезапущено ({{ duel.lobbyRestarts }} з {{ DUEL_MAX_LOBBY_RESTARTS }}): один із гравців не
        завантажився в гру. Прийміть інвайт ще раз і станьте на свою сторону — матч стартує автоматично.
      </span>
    </p>

    <!-- Суперники -->
    <div class="active-card__versus">
      <DuelPlayerTile :player="me" :side="sideOf(me?.id)" label="Ви" />
      <span class="active-card__vs">VS</span>
      <DuelPlayerTile :player="opponent" :side="sideOf(opponent?.id)" label="Суперник" />
    </div>

    <!-- Випадкові герої: кожен грає рівно того, кого йому випало -->
    <div v-if="duel.heroes?.length" class="active-card__heroes">
      <DuelHeroTile :hero="myHero" label="Ваш герой" highlighted />
      <DuelHeroTile :hero="opponentHero" label="Герой суперника" />
      <p class="active-card__hint active-card__heroes-hint">
        Герої випадкові. Оберіть на стадії піку саме свого героя — інший герой означає технічну поразку.
      </p>
    </div>

    <!-- Голосовий канал у Discord: приватний «Duel #N», створюється щойно обидва прийняли матч -->
    <div v-if="duel.discordVoiceChannelUrl" class="active-card__voice">
      <span class="active-card__voice-icon" aria-hidden="true">
        <PhDiscordLogo :size="20" weight="fill" />
      </span>
      <span class="flex min-w-0 flex-col gap-2">
        <span class="active-card__voice-title">Голосовий канал Duel #{{ duel.number }}</span>
        <span class="active-card__voice-hint">Приватний канал у Discord лише для вас двох — на час дуелі.</span>
      </span>
      <a
        :href="duel.discordVoiceChannelUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="active-card__voice-link no-underline"
      >
        <el-button type="primary" size="small">
          <PhHeadset :size="14" weight="bold" class="mr-6" />
          Зайти в голосовий канал
        </el-button>
      </a>
    </div>

    <!-- Лобі -->
    <div v-if="duel.lobbyPassword" class="active-card__lobby">
      <div class="active-card__lobby-row">
        <span class="sys-label sys-label--muted !text-[9px]">Назва лобі</span>
        <span class="active-card__lobby-value">{{ duel.lobbyName }}</span>
        <el-button text size="small" class="btn-icon" aria-label="Скопіювати назву" @click="copyText(duel.lobbyName)">
          <PhCopy :size="14" weight="bold" />
        </el-button>
      </div>
      <div class="active-card__lobby-row">
        <span class="sys-label sys-label--muted !text-[9px]">Пароль</span>
        <span class="active-card__lobby-value active-card__lobby-value--pass">{{ duel.lobbyPassword }}</span>
        <el-button
          text
          size="small"
          class="btn-icon"
          aria-label="Скопіювати пароль"
          @click="copyText(duel.lobbyPassword)"
        >
          <PhCopy :size="14" weight="bold" />
        </el-button>
      </div>
      <p class="active-card__hint">
        Прийміть інвайт у Dota 2 (або знайдіть лобі за назвою і паролем) та станьте на сторону
        Radiant або Dire. Гра стартує автоматично, щойно обидва гравці на місцях.
      </p>
      <!-- Інвайти в Dota час від часу губляться: бот повторює їх сам, а тут можна попросити ще раз -->
      <div v-if="duel.state === 'WAITING_PLAYERS'" class="active-card__invite">
        <el-button
          size="small"
          plain
          :loading="inviting"
          :disabled="inviting || inviteCooldownLeft > 0"
          @click="askInvite"
        >
          <PhPaperPlaneTilt v-if="!inviting" :size="14" weight="bold" class="mr-6" />
          <template v-if="inviteCooldownLeft > 0">Інвайт надіслано · {{ inviteCooldownLeft }} с</template>
          <template v-else>Запросити мене в лобі</template>
        </el-button>
        <span class="active-card__invite-hint">
          Не прийшов інвайт? Бот надішле його ще раз — переконайтеся, що Dota 2 запущена.
        </span>
      </div>
    </div>

    <!-- Присутність -->
    <ul v-if="duel.lobbyPlayers?.length && duel.state === 'WAITING_PLAYERS'" class="active-card__presence">
      <li v-for="p in duel.lobbyPlayers" :key="p.playerId" class="active-card__presence-row">
        <span class="active-card__presence-dot" :class="{ 'is-on': p.present }" aria-hidden="true" />
        <span class="truncate">{{ nameOf(p.playerId) }}</span>
        <span class="active-card__presence-side" :class="p.side ? `is-${p.side}` : ''">
          {{ p.present ? duelSideLabels[p.side ?? 'unassigned'] : 'не в лобі' }}
        </span>
      </li>
    </ul>

    <!-- Скасування: гравець — зі штрафом −10 до старту гри; адмін — свій матч без штрафу -->
    <div v-if="canCancel" class="active-card__actions">
      <el-button
        type="danger"
        plain
        :loading="cancelling"
        :disabled="cancelling"
        @click="confirmCancel"
      >
        <PhXCircle v-if="!cancelling" :size="16" weight="bold" class="mr-6" />
        Скасувати матч (−{{ DUEL_CANCEL_PENALTY }})
      </el-button>
      <el-button
        v-if="isAdmin"
        plain
        :loading="cancelling"
        :disabled="cancelling"
        @click="confirmAdminCancel"
      >
        <PhShieldCheck v-if="!cancelling" :size="16" weight="bold" class="mr-6" />
        Скасувати без штрафу
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PhArrowsClockwise,
  PhCheck,
  PhCopy,
  PhDiscordLogo,
  PhHeadset,
  PhPaperPlaneTilt,
  PhShieldCheck,
  PhTimer,
  PhXCircle
} from '@phosphor-icons/vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DUEL_CANCEL_PENALTY,
  duelHeroFor,
  duelOpponentOf,
  duelPlayerName,
  duelSideLabels,
  duelStakeOf,
  duelStateLabels,
  duelStepIndex,
  duelSteps,
  formatDuelCountdown,
  isDuelCancellable,
  isFriendDuel,
  secondsUntil
} from '@/views/duels/duels.utils'
import DuelHeroTile from '@/views/duels/components/DuelHeroTile.vue'
import DuelPlayerTile from '@/views/duels/components/DuelPlayerTile.vue'
import type { TDuel, TDuelLobbySide, TDuelPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  duel: TDuel
  meId: string | null
  /** Адмін бачить кнопку скасування без штрафу. */
  isAdmin?: boolean
  cancelling?: boolean
  /** Запит «запросити мене ще раз» у польоті. */
  inviting?: boolean
}>(), {
  isAdmin: false,
  cancelling: false,
  inviting: false
})

const emit = defineEmits<{
  cancel: []
  adminCancel: []
  invite: []
}>()

/** Пауза між запитами інвайту — та сама, що `DUEL_INVITE_REQUEST_COOLDOWN_SECONDS` на бекенді. */
const INVITE_COOLDOWN_SECONDS = 15

const now = useNow({ interval: 1000 })
const { copy, isSupported } = useClipboard()

/** Ліміт перезапусків лобі — той самий, що `DUEL_MAX_LOBBY_RESTARTS` на бекенді. */
const DUEL_MAX_LOBBY_RESTARTS = 2

const currentStep = computed(() => duelStepIndex(props.duel.state))
const canCancel = computed(() => isDuelCancellable(props.duel))
const lobbyRestarted = computed(() =>
  props.duel.lobbyRestarts > 0 && (props.duel.state === 'LOBBY_CREATING' || props.duel.state === 'WAITING_PLAYERS')
)
const joinLeft = computed(() => secondsUntil(props.duel.joinDeadlineAt, now.value))

// Локальна пауза після кліку: бекенд і так відповість 429, але кнопка не має спокушати спамити.
const inviteAskedAt = ref<number | null>(null)
const inviteCooldownLeft = computed(() => {
  if (inviteAskedAt.value == null) return 0
  return Math.max(0, INVITE_COOLDOWN_SECONDS - Math.floor((now.value.getTime() - inviteAskedAt.value) / 1000))
})

function askInvite () {
  inviteAskedAt.value = Date.now()
  emit('invite')
}

const me = computed<TDuelPlayer | null>(() => {
  if (!props.meId) return null
  if (props.duel.player1?.id === props.meId) return props.duel.player1
  if (props.duel.player2?.id === props.meId) return props.duel.player2
  return null
})
const opponent = computed(() => duelOpponentOf(props.duel, props.meId))
const myHero = computed(() => duelHeroFor(props.duel, props.meId))
const opponentHero = computed(() => duelHeroFor(props.duel, opponent.value?.id))

function sideOf (playerId: string | null | undefined): TDuelLobbySide | null {
  if (!playerId) return null
  if (props.duel.radiantPlayerId === playerId) return 'radiant'
  if (props.duel.direPlayerId === playerId) return 'dire'
  const entry = props.duel.lobbyPlayers?.find((p) => p.playerId === playerId)
  return entry?.present ? (entry.side ?? 'unassigned') : null
}

function nameOf (playerId: string): string {
  if (props.duel.player1?.id === playerId) return duelPlayerName(props.duel.player1)
  if (props.duel.player2?.id === playerId) return duelPlayerName(props.duel.player2)
  return 'Гравець'
}

async function confirmCancel () {
  try {
    await ElMessageBox.confirm(
      'Ви втратите  очок рейтингу, а суперник автоматично повернеться в чергу.',
      'Скасувати матч?',
      { confirmButtonText: 'Скасувати матч', cancelButtonText: 'Залишитись', type: 'warning' }
    )
  } catch {
    return
  }
  emit('cancel')
}

async function confirmAdminCancel () {
  try {
    await ElMessageBox.confirm(
      'Матч буде скасовано без зміни рейтингу. Суперник повернеться в чергу.',
      'Скасувати без штрафу?',
      { confirmButtonText: 'Скасувати', cancelButtonText: 'Залишитись', type: 'info' }
    )
  } catch {
    return
  }
  emit('adminCancel')
}

async function copyText (text: string) {
  if (!isSupported.value) {
    ElMessage.warning('Буфер обміну недоступний — скопіюйте вручну')
    return
  }
  await copy(text)
  ElMessage.success('Скопійовано')
}
</script>

<style scoped>
.active-card {
  --hud-corner-inset: 8px;
  --hud-corner-color: rgba(var(--ds-gold-rgb), 0.55);

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

@media (min-width: 768px) {
  .active-card {
    padding: 24px;
  }
}

.active-card__title {
  font-family: var(--ds-font-display);
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
}

.active-card__deadline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.4);
  background: rgba(var(--ds-gold-rgb), 0.1);
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-gold);
}

.active-card__deadline.is-live {
  border-color: rgba(244, 63, 94, 0.5);
  background: rgba(244, 63, 94, 0.1);
  color: #fb7185;
  letter-spacing: 0.16em;
}

.active-card__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: #fb7185;
  box-shadow: 0 0 8px rgba(244, 63, 94, 0.9);
  animation: duel-live-blink 1.4s ease-in-out infinite;
}

@keyframes duel-live-blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

.active-card__steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.active-card__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
  text-align: center;
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;
}

.active-card__step.is-done {
  border-color: rgba(34, 197, 94, 0.35);
}

.active-card__step.is-current {
  border-color: rgba(var(--ds-gold-rgb), 0.55);
  background: rgba(var(--ds-gold-rgb), 0.08);
  box-shadow: 0 0 12px rgba(var(--ds-gold-rgb), 0.15);
}

.active-card__step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ds-text-faint);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.active-card__step.is-done .active-card__step-index {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.6);
}

.active-card__step.is-current .active-card__step-index {
  color: var(--ds-gold);
  border-color: rgba(var(--ds-gold-rgb), 0.7);
}

.active-card__step-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.active-card__step.is-current .active-card__step-label {
  color: var(--ds-text-strong);
}

.active-card__hint {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.active-card__restart {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.4);
  background: rgba(var(--ds-gold-rgb), 0.08);
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-gold);
}

.active-card__restart svg {
  margin-top: 3px;
}

.active-card__versus {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.active-card__vs {
  font-family: var(--ds-font-display);
  font-size: 18px;
  letter-spacing: 0.1em;
  color: var(--ds-text-faint);
}

.active-card__heroes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.active-card__heroes-hint {
  grid-column: 1 / -1;
  font-size: 12px;
}

.active-card__voice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(88, 101, 242, 0.45);
  background: rgba(88, 101, 242, 0.1);
}

@media (max-width: 480px) {
  .active-card__voice {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .active-card__voice-link {
    grid-column: 1 / -1;
  }

  .active-card__voice-link :deep(.el-button) {
    width: 100%;
  }
}

.active-card__voice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #5865f2;
  color: #fff;
  box-shadow: 0 0 14px rgba(88, 101, 242, 0.5);
}

.active-card__voice-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.active-card__voice-hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

.active-card__lobby {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(var(--ds-primary-rgb), 0.06);
}

.active-card__lobby-row {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.active-card__lobby-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.active-card__lobby-value--pass {
  font-family: var(--ds-font-mono);
  font-size: 16px;
  letter-spacing: 0.18em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.active-card__invite {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-top: 8px;
  border-top: 1px dashed rgba(var(--ds-primary-rgb), 0.25);
}

.active-card__invite-hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

.active-card__presence {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.active-card__presence-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 13px;
  color: var(--ds-text);
}

.active-card__presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);
}

.active-card__presence-dot.is-on {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
}

.active-card__presence-side {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.active-card__presence-side.is-radiant {
  color: #4ade80;
}

.active-card__presence-side.is-dire {
  color: #f87171;
}

.active-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.active-card__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* ─── Рух ────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  /* Блоки картки з'являються каскадом; нові блоки (лобі, голосовий канал) — теж, бо це нові вузли DOM */
  .active-card > * {
    animation: active-block-in 380ms var(--ds-ease-out) both;
  }

  .active-card > :nth-child(2) { animation-delay: 50ms; }
  .active-card > :nth-child(3) { animation-delay: 100ms; }
  .active-card > :nth-child(4) { animation-delay: 150ms; }
  .active-card > :nth-child(5) { animation-delay: 200ms; }
  .active-card > :nth-child(6) { animation-delay: 250ms; }
  .active-card > :nth-child(7) { animation-delay: 300ms; }
  .active-card > :nth-child(n + 8) { animation-delay: 350ms; }

  /* Поточний етап «дихає» золотом, щоб око одразу знаходило, де ми */
  .active-card__step.is-current {
    animation: active-step-glow 2.4s ease-in-out infinite;
  }

  .active-card__step.is-done .active-card__step-index {
    animation: active-step-done 360ms var(--ds-ease-out) both;
  }

  @keyframes active-block-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes active-step-glow {
    0%,
    100% {
      box-shadow: 0 0 12px rgba(var(--ds-gold-rgb), 0.15);
    }

    50% {
      box-shadow: 0 0 20px rgba(var(--ds-gold-rgb), 0.35);
    }
  }

  @keyframes active-step-done {
    from {
      transform: scale(0.7);
    }

    60% {
      transform: scale(1.15);
    }

    to {
      transform: none;
    }
  }
}
</style>
