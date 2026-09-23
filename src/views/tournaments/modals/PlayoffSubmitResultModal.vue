<template>
  <el-dialog
    v-model="modelValue"
    align-center
    width="480"
    class="playoff-submit-dialog"
    destroy-on-close
    :show-close="false"
    @open="onOpen"
  >
    <!-- Шапка: системний ярлик, заголовок, закриття -->
    <template #header>
      <div class="playoff-submit-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Плей-оф</span>
          <h2 class="playoff-submit-dialog__title">Подати результат</h2>
        </div>
        <button type="button" class="playoff-submit-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <form class="playoff-submit" @submit.prevent="submit">
      <p class="playoff-submit__lead">
        Введіть ID зіграного матчу Dota 2 — далі система все зробить сама.
      </p>

      <!-- Поле ID -->
      <div class="playoff-submit__field">
        <div class="playoff-submit__field-head">
          <label for="playoff-match-id" class="playoff-submit__label">ID матчу Dota 2</label>
          <span
            class="playoff-submit__counter"
            :class="{ 'is-valid': isValid, 'is-over': digitsCount > MAX_DIGITS }"
            aria-live="polite"
          >
            {{ digitsCount }}/{{ MAX_DIGITS }}
          </span>
        </div>

        <el-input
          id="playoff-match-id"
          ref="inputRef"
          v-model="matchIdInput"
          placeholder="7890123456"
          inputmode="numeric"
          autocomplete="off"
          :maxlength="MAX_DIGITS + 2"
          :disabled="loading"
          class="playoff-submit__input"
          :class="{ 'is-valid': isValid }"
          @input="onMatchIdInput"
          @paste.prevent="onPaste"
        >
          <template #prefix>
            <span class="playoff-submit__hash" aria-hidden="true">#</span>
          </template>
          <template #suffix>
            <Transition name="playoff-submit-pop">
              <PhCheckCircle
                v-if="isValid"
                :size="16"
                weight="fill"
                class="playoff-submit__check"
                aria-label="ID виглядає коректно"
              />
            </Transition>
          </template>
        </el-input>

        <p class="playoff-submit__hint">
          Dota 2 → «Матчі» → деталі гри. Або вставте цифри з кінця посилання матчу на Dotabuff.
        </p>

        <!-- Перевірка на Dotabuff — з'являється, щойно ID валідний -->
        <Transition name="playoff-submit-fade">
          <a
            v-if="dotabuffUrl"
            :href="dotabuffUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="playoff-submit__verify"
          >
            <Icon name="dotabuff" :size="12" />
            <span>Перевірити на Dotabuff</span>
            <span class="playoff-submit__verify-id">#{{ matchIdInput }}</span>
            <PhArrowSquareOut :size="11" weight="bold" aria-hidden="true" />
          </a>
        </Transition>
      </div>

      <!-- Що станеться після подачі -->
      <ol class="playoff-submit__flow" aria-label="Що зробить система">
        <li class="playoff-submit__flow-step">
          <PhUsersThree :size="14" weight="duotone" aria-hidden="true" />
          <span>Визначить команди</span>
        </li>
        <li class="playoff-submit__flow-step">
          <PhTrophy :size="14" weight="duotone" aria-hidden="true" />
          <span>Зафіксує переможця</span>
        </li>
        <li class="playoff-submit__flow-step">
          <PhTreeStructure :size="14" weight="duotone" aria-hidden="true" />
          <span>Просуне сітку</span>
        </li>
      </ol>

      <!-- Прихована кнопка, щоб Enter у полі відправляв форму -->
      <button type="submit" class="hidden" tabindex="-1" aria-hidden="true" />
    </form>

    <template #footer>
      <div class="playoff-submit-dialog__foot">
        <span class="playoff-submit-dialog__foot-hint" :class="{ 'is-ready': isValid }">
          {{ footHint }}
        </span>
        <div class="flex shrink-0 items-center gap-10">
          <el-button :disabled="loading" @click="close">
            Скасувати
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!isValid"
            @click="submit"
          >
            <PhPaperPlaneTilt v-if="!loading" :size="16" weight="bold" class="mr-8 shrink-0" />
            Подати результат
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  PhArrowSquareOut,
  PhCheckCircle,
  PhPaperPlaneTilt,
  PhTreeStructure,
  PhTrophy,
  PhUsersThree,
  PhX
} from '@phosphor-icons/vue'
import { getDotabuffMatchUrl } from '@/core/helpers'
import { friendlyPlayoffError } from '../utils/playoff-errors.utils'
import type { TPlayoffMatch } from '@/api/types/api.types'

const props = defineProps<{
  tournamentId: string
  onSubmitted?: (match: TPlayoffMatch) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const MIN_DIGITS = 6
const MAX_DIGITS = 16

const inputRef = ref<{ focus: () => void } | null>(null)
const matchIdInput = ref('')
const loading = ref(false)

const digitsCount = computed(() => matchIdInput.value.length)
const isValid = computed(() => new RegExp(`^\\d{${MIN_DIGITS},${MAX_DIGITS}}$`).test(matchIdInput.value))
const dotabuffUrl = computed(() => (isValid.value ? getDotabuffMatchUrl(matchIdInput.value) : null))

// Підказка у футері — пояснює, чому кнопка вимкнена, і підтверджує готовність.
const footHint = computed(() => {
  if (!matchIdInput.value) return 'Введіть ID матчу'
  if (digitsCount.value < MIN_DIGITS) return `Ще ${MIN_DIGITS - digitsCount.value} цифр`
  if (digitsCount.value > MAX_DIGITS) return `Не більше ${MAX_DIGITS} цифр`
  return 'Готово до подачі'
})

function onMatchIdInput (raw: string) {
  matchIdInput.value = String(raw ?? '').replace(/\D/g, '')
}

// Вставка приймає і посилання (`dotabuff.com/matches/123…`, `opendota.com/matches/123…`):
// беремо перший довгий блок цифр, а не всі цифри рядка, інакше підмішаються числа з query.
function onPaste (event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  const fromUrl = text.match(/matches\/(\d{6,16})/)?.[1]
  const digits = fromUrl ?? text.replace(/\D/g, '')
  matchIdInput.value = digits.slice(0, MAX_DIGITS + 2)
}

function onOpen () {
  matchIdInput.value = ''
  loading.value = false
  nextTick(() => inputRef.value?.focus())
}

function close () {
  modelValue.value = false
}

async function submit () {
  if (!isValid.value || loading.value) return

  loading.value = true
  try {
    const match = await tournamentsService.submitPlayoffMatch(props.tournamentId, matchIdInput.value)
    ElMessage.success('Результат матчу плей-оф збережено')
    props.onSubmitted?.(match)
    close()
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося зберегти результат'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.playoff-submit {
  @apply flex flex-col gap-18;
}

.playoff-submit__lead {
  @apply m-0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

// ─── Поле ───────────────────────────────────────────────────────────────────
.playoff-submit__field {
  @apply flex flex-col gap-8;
}

.playoff-submit__field-head {
  @apply flex items-baseline justify-between gap-10;
  line-height: 1.25;
}

.playoff-submit__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.playoff-submit__counter {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-valid {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &.is-over {
    color: #f87171;
  }
}

// Великі табличні цифри — це номер, а не проза.
.playoff-submit__input {
  :deep(.el-input__wrapper) {
    min-height: var(--ds-control-height-lg);
    transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;
  }

  :deep(.el-input__inner) {
    font-family: var(--ds-font-mono);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }

  &.is-valid :deep(.el-input__wrapper) {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    box-shadow: var(--ds-glow-primary-soft);
  }
}

.playoff-submit__hash {
  font-family: var(--ds-font-mono);
  font-size: 16px;
  font-weight: 700;
  color: rgba(var(--ds-primary-rgb), 0.6);
}

.playoff-submit__check {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));
}

.playoff-submit__hint {
  @apply m-0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

// Посилання на Dotabuff — тонкий HUD-чіп, щоб перевірити матч перед подачею.
.playoff-submit__verify {
  @apply inline-flex items-center gap-6 self-start rounded-lg px-10 py-6 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
  transition:
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }

  svg:last-child {
    opacity: 0.7;
  }
}

.playoff-submit__verify-id {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--ds-text-muted);
}

// ─── Що станеться далі ──────────────────────────────────────────────────────
// Три кроки на штрихованій плиті, з'єднані стрілками через `::after`.
.playoff-submit__flow {
  @apply m-0 grid list-none gap-6 rounded-xl border p-10;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
}

.playoff-submit__flow-step {
  @apply relative flex flex-col items-center gap-6 px-6 py-6 text-center;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  counter-increment: playoff-step;

  svg {
    color: rgba(var(--ds-primary-rgb), 0.75);
  }

  // Стрілка до наступного кроку
  & + &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    width: 6px;
    height: 1px;
    background: rgba(var(--ds-primary-rgb), 0.4);
  }
}

// ─── Переходи ───────────────────────────────────────────────────────────────
.playoff-submit-pop-enter-active,
.playoff-submit-pop-leave-active {
  transition: opacity var(--ds-duration-fast) ease, transform var(--ds-duration-fast) var(--ds-ease-out);
}

.playoff-submit-pop-enter-from,
.playoff-submit-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.playoff-submit-fade-enter-active,
.playoff-submit-fade-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

.playoff-submit-fade-enter-from,
.playoff-submit-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (hover: hover) and (pointer: fine) {
  .playoff-submit__verify:hover {
    background: rgba(var(--ds-primary-rgb), 0.16);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.6), var(--ds-glow-primary-soft);
  }
}

@media (prefers-reduced-motion: reduce) {
  .playoff-submit-pop-enter-active,
  .playoff-submit-pop-leave-active,
  .playoff-submit-fade-enter-active,
  .playoff-submit-fade-leave-active,
  .playoff-submit__verify,
  .playoff-submit__counter {
    transition: none;
  }

  .playoff-submit__verify:active {
    transform: none;
  }
}
</style>

<style lang="scss">
// Не scoped: `.el-dialog` рендериться поза коренем компонента. Те саме темне
// скло, що й у діалогах профілю та технічної поразки.
.el-dialog.playoff-submit-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .playoff-submit-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.playoff-submit-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.playoff-submit-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.playoff-submit-dialog__close {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.playoff-submit-dialog__foot {
  @apply flex flex-wrap items-center justify-between gap-10;

  .el-button > span {
    @apply inline-flex items-center;
  }
}

// Пояснює, чому кнопка вимкнена; підсвічується, коли ID валідний.
.playoff-submit-dialog__foot-hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-ready {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

@media (hover: hover) and (pointer: fine) {
  .playoff-submit-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
