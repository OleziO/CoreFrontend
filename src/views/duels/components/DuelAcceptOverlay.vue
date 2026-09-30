<template>
  <Teleport to="body">
    <Transition name="accept-fade">
      <div v-if="visible" class="accept-backdrop" role="dialog" aria-modal="true" aria-label="Матч знайдено">
        <!-- Діалог у стилі Dota 2 ready-check: тьмяний фон, вузька панель, велика зелена кнопка -->
        <div class="accept-dialog" :class="{ 'is-accepted': accepted }">
          <header class="accept-dialog__head">
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
          <ul class="accept-dialog__slots" aria-label="Готовність гравців">
            <li
              v-for="slot in slots"
              :key="slot.key"
              class="accept-dialog__slot"
              :class="{ 'is-ready': slot.ready }"
            >
              <span class="accept-dialog__slot-mark" aria-hidden="true">
                <PhCheck v-if="slot.ready" :size="14" weight="bold" />
              </span>
              <span class="accept-dialog__slot-name">{{ slot.name }}</span>
              <span class="accept-dialog__slot-state">{{ slot.ready ? 'прийняв' : 'очікує' }}</span>
            </li>
          </ul>

          <!-- Ваш випадковий герой на цю дуель -->
          <div v-if="myHero" class="accept-dialog__hero">
            <span class="accept-dialog__hero-portrait">
              <img :src="duelHeroImageUrl(myHero)" :alt="myHero.localizedName">
            </span>
            <span class="flex min-w-0 flex-col gap-2">
              <span class="accept-dialog__eyebrow">Ваш герой</span>
              <span class="accept-dialog__hero-name">{{ myHero.localizedName }}</span>
            </span>
          </div>

          <button
            v-if="!accepted"
            type="button"
            class="accept-dialog__button"
            :disabled="accepting"
            @click="emit('accept')"
          >
            <span class="accept-dialog__button-label">ПРИЙНЯТИ</span>
            <span class="accept-dialog__button-timer">{{ secondsLeft }}</span>
          </button>
          <div v-else class="accept-dialog__wait">
            <PhCheckCircle :size="20" weight="fill" class="shrink-0" />
            <span class="truncate">Прийнято — чекаємо на {{ opponentName }}</span>
            <span class="accept-dialog__button-timer">{{ secondsLeft }}</span>
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

const now = useNow({ interval: 250 })
const { muted, unlock, playMatchFound, playTick, toggleMuted } = useDuelSounds()

// Звук дозволений лише після жесту користувача — будь-який клік/тап на сторінці розблоковує контекст.
useEventListener(document, 'pointerdown', unlock, { passive: true })

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
}

.accept-dialog__slot.is-ready .accept-dialog__slot-mark {
  border-color: rgb(var(--accept-rgb));
  background: rgb(var(--accept-rgb));
  box-shadow: 0 0 10px rgba(var(--accept-rgb), 0.6);
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
  transform: translateY(1px);
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
  min-width: 2ch;
  font-family: var(--ds-font-mono);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  opacity: 0.9;
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
  transition: transform 250ms linear;
}

.accept-fade-enter-active,
.accept-fade-leave-active {
  transition: opacity 200ms ease;
}

.accept-fade-enter-active .accept-dialog {
  animation: accept-pop 220ms var(--ds-ease-out) both;
}

.accept-fade-enter-from,
.accept-fade-leave-to {
  opacity: 0;
}

@keyframes accept-pop {
  from {
    transform: translateY(10px) scale(0.98);
  }

  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .accept-fade-enter-active .accept-dialog {
    animation: none;
  }
}
</style>
