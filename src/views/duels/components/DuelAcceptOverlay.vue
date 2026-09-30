<template>
  <Teleport to="body">
    <Transition name="accept-fade">
      <div v-if="visible" class="accept-backdrop" role="dialog" aria-modal="true" aria-label="Матч знайдено">
        <!-- Зелений спалах на тлі в момент появи — «щось сталося», навіть краєм ока -->
        <span class="accept-backdrop__flash" aria-hidden="true" />

        <!-- Діалог у стилі Dota 2 ready-check: тьмяний фон, вузька панель, велика зелена кнопка -->
        <div class="accept-dialog" :class="{ 'is-accepted': accepted, 'is-urgent': urgent }">
          <header class="accept-dialog__head accept-dialog__in" style="--i: 0">
            <span class="accept-dialog__eyebrow">Дуель · Solo Mid · випадковий герой</span>
            <h2 class="accept-dialog__title">Матч знайдено</h2>
          </header>

          <!-- Звук: фанфара + тікання; вимкнення запам'ятовується -->
          <button
            type="button"
            class="accept-dialog__sound"
            :aria-label="muted ? 'Увімкнути звук' : 'Вимкнути звук'"
            :aria-pressed="muted"
            :title="muted ? 'Увімкнути звук' : 'Вимкнути звук'"
            @click="toggleMuted"
          >
            <PhSpeakerSlash v-if="muted" :size="16" weight="bold" />
            <PhSpeakerHigh v-else :size="16" weight="bold" />
          </button>

          <!-- Хто вже прийняв: два слоти, як індикатори гравців у Dota -->
          <ul class="accept-dialog__slots accept-dialog__in" style="--i: 1" aria-label="Готовність гравців">
            <li
              v-for="slot in slots"
              :key="slot.key"
              class="accept-dialog__slot"
              :class="{ 'is-ready': slot.ready }"
            >
              <span class="accept-dialog__slot-mark" aria-hidden="true">
                <Transition name="accept-check">
                  <PhCheck v-if="slot.ready" :size="14" weight="bold" />
                </Transition>
              </span>
              <span class="accept-dialog__slot-name">{{ slot.name }}</span>
              <span class="accept-dialog__slot-state">{{ slot.ready ? 'прийняв' : 'очікує' }}</span>
            </li>
          </ul>

          <!-- Ваш випадковий герой на цю дуель -->
          <div v-if="myHero" class="accept-dialog__hero accept-dialog__in" style="--i: 2">
            <span class="accept-dialog__hero-portrait">
              <img :src="duelHeroImageUrl(myHero)" :alt="myHero.localizedName">
            </span>
            <span class="flex min-w-0 flex-col gap-2">
              <span class="accept-dialog__eyebrow">Ваш герой</span>
              <span class="accept-dialog__hero-name">{{ myHero.localizedName }}</span>
            </span>
          </div>

          <div class="accept-dialog__in" style="--i: 3">
            <button
              v-if="!accepted"
              type="button"
              class="accept-dialog__button"
              :disabled="accepting"
              @click="emit('accept')"
            >
              <span class="accept-dialog__button-label">ПРИЙНЯТИ</span>
              <span :key="secondsLeft" class="accept-dialog__button-timer">{{ secondsLeft }}</span>
            </button>
            <div v-else class="accept-dialog__wait">
              <PhCheckCircle :size="20" weight="fill" class="shrink-0" />
              <span class="truncate">Прийнято — чекаємо на {{ opponentName }}</span>
              <span :key="secondsLeft" class="accept-dialog__button-timer">{{ secondsLeft }}</span>
            </div>
          </div>

          <span class="accept-dialog__bar" aria-hidden="true">
            <span class="accept-dialog__bar-fill" :style="{ transform: `scaleX(${progress})` }" />
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { PhCheck, PhCheckCircle, PhSpeakerHigh, PhSpeakerSlash } from '@phosphor-icons/vue'
import { useDuelSounds } from '@/views/duels/composables/use-duel-sounds'
import {
  DUEL_ACCEPT_WINDOW_SECONDS,
  duelHeroFor,
  duelHeroImageUrl,
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

/** Останні секунди — таймер і смуга червоніють, кнопка пульсує швидше. */
const URGENT_SECONDS = 5

const now = useNow({ interval: 250 })
const { muted, unlock, playMatchFound, playTick, toggleMuted } = useDuelSounds()

// Звук дозволений лише після жесту користувача — будь-який клік/тап на сторінці розблоковує контекст.
useEventListener(document, 'pointerdown', () => { unlock() }, { passive: true })

const visible = computed(() => props.duel?.state === 'ACCEPTING')
const accepted = computed(() => !!props.duel && hasAcceptedDuel(props.duel, props.meId))
const opponent = computed(() => (props.duel ? duelOpponentOf(props.duel, props.meId) : null))
const opponentName = computed(() => duelPlayerName(opponent.value))
const myHero = computed(() => (props.duel ? duelHeroFor(props.duel, props.meId) : null))

const slots = computed(() => {
  const duel = props.duel
  if (!duel) return []
  return [
    { key: 'me', name: 'Ви', ready: accepted.value },
    { key: 'opponent', name: opponentName.value, ready: hasAcceptedDuel(duel, opponent.value?.id) }
  ]
})

const secondsLeft = computed(() => secondsUntil(props.duel?.acceptDeadlineAt, now.value))
const progress = computed(() => Math.min(1, secondsLeft.value / DUEL_ACCEPT_WINDOW_SECONDS))
const urgent = computed(() => secondsLeft.value > 0 && secondsLeft.value <= URGENT_SECONDS)

// Поки діалог відкритий — сторінка під ним не скролиться; звук «Матч знайдено», на телефоні ще й вібрація.
watch(visible, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) return
  playMatchFound()
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200])
    } catch { /* не критично */ }
  }
}, { immediate: true })

// Тік на кожну секунду таймера, поки діалог відкритий (і після «Прийняти» — час іде далі, як у Dota).
// Стрибок 0 → 30 при відкритті — не тік, а поява діалогу (фанфара вже пролунала).
watch(secondsLeft, (left, previous) => {
  if (!visible.value || left <= 0 || !previous || left === previous) return
  playTick(left)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.accept-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(3, 5, 10, 0.78);
  backdrop-filter: blur(4px);
}

.accept-backdrop__flash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34, 197, 94, 0.35), transparent 70%);
  opacity: 0;
}

.accept-dialog {
  --accept-rgb: 34, 197, 94;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(100%, 360px);
  padding: 20px 20px 18px;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, #1c2128 0%, #0f1319 100%);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6),
    0 24px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(var(--accept-rgb), 0.12);
  color: #e6e9ef;
  transition: box-shadow var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease;
}

/* Останні секунди: рамка й підсвітка діалогу зсуваються до червоного */
.accept-dialog.is-urgent:not(.is-accepted) {
  --urgent-rgb: 244, 63, 94;

  border-color: rgba(var(--urgent-rgb), 0.35);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6),
    0 24px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(var(--urgent-rgb), 0.18);
}

.accept-dialog__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.accept-dialog__sound {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(230, 233, 239, 0.6);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 120ms ease, border-color 120ms ease;
}

.accept-dialog__sound:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

.accept-dialog__sound[aria-pressed='true'] {
  color: #fb7185;
}

.accept-dialog__eyebrow {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(230, 233, 239, 0.5);
}

.accept-dialog__title {
  font-family: var(--ds-font-display);
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
}

.accept-dialog__slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.accept-dialog__slot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 13px;
  transition: background-color var(--ds-duration-base) ease;
}

.accept-dialog__slot.is-ready {
  background: rgba(var(--accept-rgb), 0.08);
}

.accept-dialog__slot-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  transition: background-color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;
}

.accept-dialog__slot.is-ready .accept-dialog__slot-mark {
  border-color: rgb(var(--accept-rgb));
  background: rgb(var(--accept-rgb));
  box-shadow: 0 0 10px rgba(var(--accept-rgb), 0.6);
}

.accept-check-enter-active {
  transition: transform 320ms var(--ds-ease-out), opacity 160ms ease;
}

.accept-check-enter-from {
  opacity: 0;
  transform: scale(0.3);
}

.accept-dialog__slot-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.accept-dialog__slot-state {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(230, 233, 239, 0.45);
  transition: color var(--ds-duration-base) ease;
}

.accept-dialog__slot.is-ready .accept-dialog__slot-state {
  color: rgb(var(--accept-rgb));
}

.accept-dialog__hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(var(--ds-primary-rgb), 0.06);
}

.accept-dialog__hero-portrait {
  display: inline-flex;
  width: 72px;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
}

.accept-dialog__hero-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.accept-dialog__hero-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* ─── Кнопка: суцільна зелена, без рамки, як у Dota ─────────────────────── */
.accept-dialog__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  height: 56px;
  margin: 0;
  padding: 0 18px;
  border: 0;
  outline: 0;
  border-radius: 4px;
  background: linear-gradient(180deg, #34d374 0%, #1f9e4f 100%);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 0 22px rgba(var(--accept-rgb), 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: filter 120ms ease, transform 120ms ease;
}

.accept-dialog__button:not(:disabled):hover {
  filter: brightness(1.1);
}

.accept-dialog__button:not(:disabled):active {
  transform: translateY(1px) scale(0.99);
  filter: brightness(0.95);
}

.accept-dialog__button:disabled {
  cursor: progress;
  opacity: 0.8;
}

.accept-dialog__button-label {
  font-family: var(--ds-font-display);
  font-size: 22px;
  letter-spacing: 0.16em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.accept-dialog__button-timer {
  display: inline-block;
  min-width: 2ch;
  font-family: var(--ds-font-mono);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  opacity: 0.9;
}

.is-urgent .accept-dialog__button-timer {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

.is-urgent .accept-dialog__wait .accept-dialog__button-timer {
  color: #fb7185;
  text-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
}

.accept-dialog__wait {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-radius: 4px;
  background: rgba(var(--accept-rgb), 0.12);
  border: 1px solid rgba(var(--accept-rgb), 0.35);
  font-size: 14px;
  font-weight: 600;
  color: #9ff0bd;
}

.accept-dialog__wait .accept-dialog__button-timer {
  margin-left: auto;
}

/* Смуга часу внизу панелі */
.accept-dialog__bar {
  position: absolute;
  inset: auto 0 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
}

.accept-dialog__bar-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: rgb(var(--accept-rgb));
  box-shadow: 0 0 8px rgba(var(--accept-rgb), 0.8);
  transform-origin: left center;
  transition: transform 250ms linear, background-color 400ms ease, box-shadow 400ms ease;
}

.is-urgent .accept-dialog__bar-fill {
  background: #fb7185;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.9);
}

/* ─── Поява / зникнення ──────────────────────────────────────────────────── */
.accept-fade-enter-active,
.accept-fade-leave-active {
  transition: opacity 220ms ease;
}

.accept-fade-enter-from,
.accept-fade-leave-to {
  opacity: 0;
}

.accept-fade-leave-active .accept-dialog {
  transition: transform 200ms var(--ds-ease-in-out);
  transform: scale(0.97);
}

@media (prefers-reduced-motion: no-preference) {
  /*
   * Анімації появи висять на самих елементах, а не на `.accept-fade-enter-active`: діалог живе під
   * `v-if`, тож щоразу створюється заново, а клас enter-active Vue знімає вже через 220 мс — каскад
   * довший. `backwards` замість `both`, щоб після завершення анімація відпустила transform і leave-перехід
   * (scale 0.97) спрацював.
   */
  .accept-backdrop__flash {
    animation: accept-flash 1100ms ease-out both;
  }

  .accept-dialog {
    animation: accept-pop 420ms var(--ds-ease-out) backwards;
  }

  .accept-dialog__title {
    animation: accept-title 600ms var(--ds-ease-out) 80ms backwards;
  }

  /* Вміст діалогу з'являється каскадом: заголовок → слоти → герой → кнопка */
  .accept-dialog__in {
    animation: accept-in 380ms var(--ds-ease-out) backwards;
    animation-delay: calc(120ms + var(--i, 0) * 70ms);
  }

  .accept-dialog__button:not(:disabled) {
    animation: accept-breathe 1.8s ease-in-out infinite;
  }

  .is-urgent .accept-dialog__button:not(:disabled) {
    animation: accept-breathe-urgent 0.9s ease-in-out infinite;
  }

  /* Кожна нова секунда — цифра «стрибає», в останні 5 с сильніше */
  .accept-dialog__button-timer {
    animation: accept-tick 300ms var(--ds-ease-out) both;
  }

  .is-urgent .accept-dialog__button-timer {
    animation: accept-tick-urgent 380ms var(--ds-ease-out) both;
  }

  .accept-dialog__slot.is-ready .accept-dialog__slot-mark {
    animation: accept-mark-pop 360ms var(--ds-ease-out) both;
  }

  @keyframes accept-flash {
    0% {
      opacity: 0;
    }

    18% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }

  @keyframes accept-pop {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.92);
    }

    60% {
      opacity: 1;
      transform: translateY(-2px) scale(1.01);
    }

    to {
      transform: none;
    }
  }

  @keyframes accept-title {
    from {
      opacity: 0;
      letter-spacing: 0.32em;
    }

    to {
      opacity: 1;
      letter-spacing: 0.08em;
    }
  }

  @keyframes accept-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes accept-breathe {
    0%,
    100% {
      box-shadow: 0 0 22px rgba(var(--accept-rgb), 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }

    50% {
      box-shadow: 0 0 38px rgba(var(--accept-rgb), 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
  }

  @keyframes accept-breathe-urgent {
    0%,
    100% {
      box-shadow: 0 0 22px rgba(var(--accept-rgb), 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transform: scale(1);
    }

    50% {
      box-shadow: 0 0 44px rgba(var(--accept-rgb), 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transform: scale(1.015);
    }
  }

  @keyframes accept-tick {
    from {
      transform: translateY(-4px);
      opacity: 0.4;
    }

    to {
      transform: none;
      opacity: 0.9;
    }
  }

  @keyframes accept-tick-urgent {
    from {
      transform: scale(1.45);
      opacity: 0.5;
    }

    to {
      transform: none;
      opacity: 1;
    }
  }

  @keyframes accept-mark-pop {
    from {
      transform: scale(0.7);
    }

    55% {
      transform: scale(1.18);
    }

    to {
      transform: none;
    }
  }
}
</style>
