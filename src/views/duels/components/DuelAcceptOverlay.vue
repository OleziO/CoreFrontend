<template>
  <Teleport to="body">
    <Transition name="accept-fade">
      <div v-if="visible" class="accept-overlay" role="dialog" aria-modal="true" aria-label="Матч знайдено">
        <!-- Уся площа екрана — одна зелена кнопка. Жодних рамок і сторонніх контролів. -->
        <button
          v-if="!accepted"
          type="button"
          class="accept-overlay__button"
          :disabled="accepting"
          @click="emit('accept')"
        >
          <span class="accept-overlay__label">Матч знайдено</span>
          <span class="accept-overlay__title">ПРИЙНЯТИ</span>
          <span class="accept-overlay__timer">{{ secondsLeft }}</span>
          <span class="accept-overlay__opponent">
            <span class="accept-overlay__opponent-label">Суперник</span>
            <span class="accept-overlay__opponent-name">{{ opponentName }}</span>
          </span>
          <span class="accept-overlay__bar" aria-hidden="true">
            <span class="accept-overlay__bar-fill" :style="{ transform: `scaleX(${progress})` }" />
          </span>
        </button>

        <!-- Ми прийняли — чекаємо на суперника. Клікати більше нічого. -->
        <div v-else class="accept-overlay__wait">
          <PhCheckCircle :size="72" weight="fill" class="accept-overlay__wait-icon" />
          <span class="accept-overlay__title accept-overlay__title--sm">Прийнято</span>
          <span class="accept-overlay__label">Чекаємо, поки {{ opponentName }} прийме матч…</span>
          <span class="accept-overlay__timer accept-overlay__timer--sm">{{ secondsLeft }}</span>
          <span class="accept-overlay__bar" aria-hidden="true">
            <span class="accept-overlay__bar-fill" :style="{ transform: `scaleX(${progress})` }" />
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { PhCheckCircle } from '@phosphor-icons/vue'
import {
  DUEL_ACCEPT_WINDOW_SECONDS,
  duelOpponentOf,
  duelPlayerName,
  hasAcceptedDuel,
  secondsUntil
} from '@/views/duels/duels.utils'
import type { TDuel } from '@/api/types/api.types'

const props = defineProps<{
  duel: TDuel | null
  meId: string | null
  accepting: boolean
}>()

const emit = defineEmits<{ accept: [] }>()

const now = useNow({ interval: 250 })

const visible = computed(() => props.duel?.state === 'ACCEPTING')
const accepted = computed(() => !!props.duel && hasAcceptedDuel(props.duel, props.meId))
const opponentName = computed(() => duelPlayerName(props.duel ? duelOpponentOf(props.duel, props.meId) : null))

const secondsLeft = computed(() => secondsUntil(props.duel?.acceptDeadlineAt, now.value))
const progress = computed(() => Math.min(1, secondsLeft.value / DUEL_ACCEPT_WINDOW_SECONDS))

// Поки оверлей відкритий — сторінка під ним не скролиться; на телефоні ще й вібрація як сигнал.
watch(visible, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200])
    } catch { /* не критично */ }
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.accept-overlay {
  --accept-rgb: 34, 197, 94;

  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  background: rgb(var(--accept-rgb));
}

.accept-overlay__button,
.accept-overlay__wait {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 24px;
  border: 0;
  outline: 0;
  border-radius: 0;
  background: rgb(var(--accept-rgb));
  color: #fff;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.accept-overlay__wait {
  cursor: default;
  background: #15803d;
}

.accept-overlay__button:disabled {
  cursor: progress;
  opacity: 0.85;
}

@media (hover: hover) and (pointer: fine) {
  .accept-overlay__button:not(:disabled):hover {
    background: #16a34a;
  }
}

.accept-overlay__button:not(:disabled):active {
  background: #15803d;
}

.accept-overlay__label {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.85;
}

.accept-overlay__title {
  font-family: var(--ds-font-display);
  font-size: clamp(48px, 12vw, 128px);
  line-height: 1;
  letter-spacing: 0.06em;
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
}

.accept-overlay__title--sm {
  font-size: clamp(32px, 7vw, 64px);
}

.accept-overlay__timer {
  font-family: var(--ds-font-mono);
  font-size: clamp(40px, 9vw, 88px);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.accept-overlay__timer--sm {
  font-size: clamp(28px, 6vw, 48px);
}

.accept-overlay__opponent {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.accept-overlay__opponent-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.7;
}

.accept-overlay__opponent-name {
  font-size: 18px;
  font-weight: 600;
}

.accept-overlay__wait-icon {
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.25));
}

.accept-overlay__bar {
  position: absolute;
  inset: auto 0 0;
  height: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.accept-overlay__bar-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  transform-origin: left center;
  transition: transform 250ms linear;
}

.accept-fade-enter-active,
.accept-fade-leave-active {
  transition: opacity 200ms ease;
}

.accept-fade-enter-from,
.accept-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .accept-overlay__button:not(:disabled) .accept-overlay__title {
    animation: accept-pulse 1.2s ease-in-out infinite;
  }

  @keyframes accept-pulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }
  }
}
</style>
