<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="duel-how-dialog"
    width="640"
    destroy-on-close
  >
    <template #header>
      <div class="duel-how-dialog__head">
        <span class="duel-how-dialog__glyph" aria-hidden="true">
          <PhSword :size="22" weight="fill" />
        </span>
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Як це працює</span>
          <h2 class="duel-how-dialog__title">Дуель за {{ totalSteps }} кроків</h2>
          <p class="duel-how-dialog__subtitle">
            Solo Mid проти суперника свого рівня. Героя роздає ліга — випадково, на кожну дуель.
          </p>
        </div>
      </div>
      <ul class="duel-how-dialog__rules" aria-label="Правила дуелі">
        <li class="duel-how-dialog__rule">
          <PhShuffle :size="12" weight="bold" aria-hidden="true" />
          випадковий герой
        </li>
        <li class="duel-how-dialog__rule">
          <span class="text-success">+{{ DUEL_RATING_DELTA }}</span>
          <span class="text-white/30">/</span>
          <span class="text-error">−{{ DUEL_RATING_DELTA }}</span>
        </li>
        <li class="duel-how-dialog__rule">
          <PhTimer :size="12" weight="bold" aria-hidden="true" />
          {{ DUEL_ACCEPT_WINDOW_SECONDS }} с на прийняття
        </li>
      </ul>
    </template>

    <div class="duel-how-dialog__phases">
      <section v-for="(phase, phaseIndex) in phases" :key="phase.label" class="duel-how-dialog__phase">
        <header class="duel-how-dialog__phase-head" :style="{ '--i': offsetOf(phaseIndex) }">
          <span class="sys-label sys-label--muted">// {{ phase.label }}</span>
          <span class="duel-how-dialog__phase-line" aria-hidden="true" />
        </header>
        <ol class="duel-how-dialog__steps">
          <li
            v-for="(step, stepIndex) in phase.steps"
            :key="step.title"
            class="duel-how-dialog__step"
            :class="step.tone ? `is-${step.tone}` : ''"
            :style="{ '--i': offsetOf(phaseIndex) + stepIndex + 1 }"
          >
            <span class="duel-how-dialog__node" aria-hidden="true">
              <component :is="step.icon" :size="18" weight="duotone" />
            </span>
            <div class="flex min-w-0 flex-col gap-2">
              <span class="duel-how-dialog__step-title">
                <span class="duel-how-dialog__step-index">{{ numberOf(phaseIndex, stepIndex) }}</span>
                {{ step.title }}
                <span v-if="step.tag" class="duel-how-dialog__tag">{{ step.tag }}</span>
              </span>
              <span class="duel-how-dialog__step-text">{{ step.text }}</span>
            </div>
          </li>
        </ol>
      </section>
    </div>

    <template #footer>
      <div class="duel-how-dialog__footer">
        <span class="duel-how-dialog__footer-hint">
          Після підтвердження вікно більше не з’являтиметься саме — його завжди можна відкрити кнопкою
          «Як це працює».
        </span>
        <div class="duel-how-dialog__actions">
          <el-button @click="close">Нагадати пізніше</el-button>
          <el-button type="primary" class="duel-how-dialog__confirm" @click="confirm">
            <PhCheck :size="16" weight="bold" class="mr-6" />
            Зрозуміло, до бою
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  PhCalendarCheck,
  PhCheck,
  PhCheckCircle,
  PhCrosshair,
  PhDiscordLogo,
  PhHandshake,
  PhRobot,
  PhShuffle,
  PhSignIn,
  PhSword,
  PhTimer,
  PhTrophy,
  PhXCircle
} from '@phosphor-icons/vue'
import {
  DUEL_ACCEPT_WINDOW_SECONDS,
  DUEL_CANCEL_PENALTY,
  DUEL_CHALLENGE_DAILY_LIMIT,
  DUEL_FRIEND_RATING_DELTA,
  DUEL_HOW_IT_WORKS_STORAGE_KEY,
  DUEL_RATING_DELTA
} from '@/views/duels/duels.utils'

interface IHowStep {
  icon: Component
  title: string
  text: string
  /** Короткий акцент праворуч від заголовка: штраф, ставка, техпоразка. */
  tag?: string
  tone?: 'gold' | 'danger' | 'success'
}

interface IHowPhase {
  label: string
  steps: IHowStep[]
}

const modelValue = defineModel<boolean>({ default: false })

/** «Зрозуміло» запам'ятовується — далі вікно відкривається лише кнопкою на сторінці. */
const confirmed = useLocalStorage<boolean>(DUEL_HOW_IT_WORKS_STORAGE_KEY, false)

const phases: IHowPhase[] = [
  {
    label: 'Перед матчем',
    steps: [
      {
        icon: PhSignIn,
        title: 'Станьте в чергу',
        text: 'Потрібен прив’язаний Steam-акаунт — його прив’язують у профілі.'
      },
      {
        icon: PhCrosshair,
        title: 'Підбір суперника',
        text: 'Шукаємо гравця з рейтингом ±50. Вікно росте на 50 очок кожні 15 секунд, поки ви чекаєте.'
      },
      {
        icon: PhCheckCircle,
        title: 'Прийміть матч',
        text: `На прийняття є ${DUEL_ACCEPT_WINDOW_SECONDS} секунд. Хто не прийме — штраф і коротка пауза перед чергою.`,
        tag: `−${DUEL_CANCEL_PENALTY}`,
        tone: 'danger'
      },
      {
        icon: PhShuffle,
        title: 'Випадковий герой',
        text: 'Героя роздає ліга — свого ви побачите одразу після підбору. Вибору немає, це правило ліги.',
        tag: 'random',
        tone: 'gold'
      }
    ]
  },
  {
    label: 'Лобі',
    steps: [
      {
        icon: PhDiscordLogo,
        title: 'Голосовий канал',
        text: 'Щойно обидва прийняли — у Discord з’явиться приватний канал «Duel #N» лише для вас двох. ' +
          'Кнопка входу — на картці дуелі.'
      },
      {
        icon: PhRobot,
        title: 'Лобі від бота',
        text: 'Бот створить закрите лобі Solo Mid і надішле інвайт у Dota 2. Не прийшов — попросіть ще раз із картки.'
      },
      {
        icon: PhTimer,
        title: 'Зайдіть за 5 хвилин',
        text: 'Станьте на сторону й на піку візьміть саме свого героя. Інший герой — технічна поразка.',
        tag: 'техпоразка',
        tone: 'danger'
      }
    ]
  },
  {
    label: 'Результат',
    steps: [
      {
        icon: PhTrophy,
        title: 'Гра та рейтинг',
        text: 'Щойно гра стартувала, дуель іде в «обробку» — можна одразу шукати наступного суперника. ' +
          'Результат зчитується з Dota автоматично.',
        tag: `+${DUEL_RATING_DELTA} / −${DUEL_RATING_DELTA}`,
        tone: 'success'
      },
      {
        icon: PhXCircle,
        title: 'Скасування',
        text: 'Скасувати матч можна до старту гри — суперник повернеться в чергу, а ви отримаєте штраф.',
        tag: `−${DUEL_CANCEL_PENALTY}`,
        tone: 'danger'
      },
      {
        icon: PhHandshake,
        title: 'Дружня дуель',
        text: 'Викличте друга зі сторінки «Друзі» або звідси — без черги й без таймера, той самий бот і випадкові ' +
          `герої. До ${DUEL_CHALLENGE_DAILY_LIMIT} прийнятих дружніх дуелей на день.`,
        tag: `±${DUEL_FRIEND_RATING_DELTA}`,
        tone: 'gold'
      },
      {
        icon: PhCalendarCheck,
        title: 'Сезони',
        text: 'Сезон триває календарний місяць. Наприкінці таблиця фіксується, призові місця отримують нагороди ' +
          '(VIP — автоматично), а рейтинг та історія дуелей починаються з нуля.',
        tag: 'щомісяця',
        tone: 'gold'
      }
    ]
  }
]

const totalSteps = phases.reduce((sum, phase) => sum + phase.steps.length, 0)

/** Порядковий зсув для каскаду появи: заголовки фаз теж займають слот. */
function offsetOf (phaseIndex: number): number {
  let offset = 0
  for (let i = 0; i < phaseIndex; i++) offset += phases[i].steps.length + 1
  return offset
}

/** Наскрізний номер кроку «01…10»: зсув каскаду мінус слоти заголовків фаз. */
function numberOf (phaseIndex: number, stepIndex: number): string {
  return String(offsetOf(phaseIndex) - phaseIndex + stepIndex + 1).padStart(2, '0')
}

function close () {
  modelValue.value = false
}

function confirm () {
  confirmed.value = true
  close()
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.duel-how-dialog {
  --how-line: rgba(var(--ds-primary-rgb), 0.22);

  margin: 0 auto;
  max-width: calc(100vw - 32px);
  max-height: min(86vh, 900px);
  background: rgba(12, 15, 30, 0.72);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 14px !important;
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 14px;
  }

  .el-dialog__body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .duel-how-dialog__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-right: 28px;
  }

  .duel-how-dialog__glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    border: 1px solid rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(var(--ds-primary-rgb), 0.1);
    color: var(--ds-primary);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.25), inset 0 0 12px rgba(var(--ds-primary-rgb), 0.08);
  }

  .duel-how-dialog__title {
    font-family: var(--ds-font-display);
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: 0.02em;
    color: var(--ds-text-strong);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .duel-how-dialog__subtitle {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }

  .duel-how-dialog__rules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .duel-how-dialog__rule {
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

    svg {
      color: var(--ds-gold);
    }
  }

  // ─── Фази й кроки: вертикальна лінія часу ──────────────────────────────
  .duel-how-dialog__phases {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 8px 0 6px;
  }

  .duel-how-dialog__phase-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .duel-how-dialog__phase-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--how-line), transparent);
  }

  .duel-how-dialog__steps {
    position: relative;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;

    // Лінія, що з'єднує вузли
    &::before {
      content: '';
      position: absolute;
      top: 18px;
      bottom: 18px;
      left: 19px;
      width: 2px;
      background: linear-gradient(180deg, var(--how-line), rgba(var(--ds-primary-rgb), 0.08));
    }
  }

  .duel-how-dialog__step {
    --tone: var(--ds-primary-rgb);

    position: relative;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding: 8px 10px 8px 0;
    border-radius: 12px;
    transition: background-color var(--ds-duration-fast) ease;

    &.is-gold {
      --tone: var(--ds-gold-rgb);
    }

    &.is-danger {
      --tone: 244, 63, 94;
    }

    &.is-success {
      --tone: 34, 197, 94;
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      &:hover .duel-how-dialog__node {
        border-color: rgba(var(--tone), 0.8);
        box-shadow: 0 0 14px rgba(var(--tone), 0.35);
      }
    }
  }

  .duel-how-dialog__node {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    border: 1px solid rgba(var(--tone), 0.45);
    background: linear-gradient(160deg, rgba(var(--tone), 0.16), rgba(8, 10, 20, 0.9));
    color: rgb(var(--tone));
    box-shadow: 0 0 0 4px rgba(12, 15, 30, 0.9);
    transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;
  }

  .duel-how-dialog__step-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-top: 6px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--ds-text-strong);
  }

  .duel-how-dialog__step-index {
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--ds-primary);
  }

  .duel-how-dialog__tag {
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid rgba(var(--tone), 0.45);
    background: rgba(var(--tone), 0.1);
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
    color: rgb(var(--tone));
    white-space: nowrap;
  }

  .duel-how-dialog__step-text {
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }

  // ─── Футер ────────────────────────────────────────────────────────────
  .duel-how-dialog__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
  }

  .duel-how-dialog__footer-hint {
    flex: 1 1 240px;
    font-size: 11.5px;
    line-height: 1.45;
    color: var(--ds-text-faint);
  }

  .duel-how-dialog__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: auto;

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  @media (max-width: 480px) {
    .duel-how-dialog__actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }

  // ─── Рух: каскад появи фаз і кроків ───────────────────────────────────
  @media (prefers-reduced-motion: no-preference) {
    .duel-how-dialog__glyph {
      animation: duel-how-glyph 600ms var(--ds-ease-out) both;
    }

    .duel-how-dialog__phase-head,
    .duel-how-dialog__step {
      animation: duel-how-in 380ms var(--ds-ease-out) both;
      animation-delay: calc(120ms + var(--i, 0) * 45ms);
    }

    .duel-how-dialog__confirm {
      animation: duel-how-cta 2.4s ease-in-out 900ms infinite;
    }
  }
}

@keyframes duel-how-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes duel-how-glyph {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-20deg);
  }

  60% {
    transform: scale(1.08) rotate(3deg);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes duel-how-cta {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(var(--ds-primary-rgb), 0);
  }

  50% {
    box-shadow: 0 0 20px rgba(var(--ds-primary-rgb), 0.4);
  }
}
</style>
