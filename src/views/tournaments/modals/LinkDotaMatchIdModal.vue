<template>
  <el-dialog
    v-model="modelValue"
    align-center
    width="480"
    class="link-dota-dialog"
    destroy-on-close
    :show-close="false"
    @open="onOpen"
  >
    <!-- Шапка: системний ярлик, заголовок, закриття -->
    <template #header>
      <div class="link-dota-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label sys-label--pink">// Адмін · {{ stageLabel }}</span>
          <h2 class="link-dota-dialog__title">Прив'язати ID матчу</h2>
        </div>
        <button type="button" class="link-dota-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <form class="link-dota" @submit.prevent="submit">
      <!-- Матч, до якого прив'язуємо -->
      <div class="link-dota__match" aria-label="Матч">
        <span class="link-dota__team" :class="{ 'is-winner': match.winnerTeamId === match.teamA.id }">
          <PhTrophy v-if="match.winnerTeamId === match.teamA.id" :size="12" weight="fill" aria-label="Переможець" />
          <span class="truncate">{{ match.teamA.name }}</span>
        </span>
        <span class="link-dota__vs" aria-hidden="true">vs</span>
        <span class="link-dota__team" :class="{ 'is-winner': match.winnerTeamId === match.teamB.id }">
          <PhTrophy v-if="match.winnerTeamId === match.teamB.id" :size="12" weight="fill" aria-label="Переможець" />
          <span class="truncate">{{ match.teamB.name }}</span>
        </span>
      </div>

      <p class="link-dota__lead">
        Результат уже зараховано вручну. Вкажіть ID зіграного матчу Dota 2 — система підтягне
        статистику гравців, не змінюючи переможця й очки.
      </p>

      <!-- Поле ID -->
      <div class="link-dota__field">
        <div class="link-dota__field-head">
          <label for="link-dota-match-id" class="link-dota__label">ID матчу Dota 2</label>
          <span
            class="link-dota__counter"
            :class="{ 'is-valid': isValid, 'is-over': digitsCount > MAX_DIGITS }"
            aria-live="polite"
          >
            {{ digitsCount }}/{{ MAX_DIGITS }}
          </span>
        </div>

        <el-input
          id="link-dota-match-id"
          ref="inputRef"
          v-model="matchIdInput"
          placeholder="7890123456"
          inputmode="numeric"
          autocomplete="off"
          :maxlength="MAX_DIGITS + 2"
          :disabled="loading"
          class="link-dota__input"
          :class="{ 'is-valid': isValid }"
          @input="onMatchIdInput"
          @paste.prevent="onPaste"
        >
          <template #prefix>
            <span class="link-dota__hash" aria-hidden="true">#</span>
          </template>
          <template #suffix>
            <Transition name="link-dota-pop">
              <PhCheckCircle
                v-if="isValid"
                :size="16"
                weight="fill"
                class="link-dota__check"
                aria-label="ID виглядає коректно"
              />
            </Transition>
          </template>
        </el-input>

        <p class="link-dota__hint">
          Dota 2 → «Матчі» → деталі гри. Або вставте цифри з кінця посилання матчу на Dotabuff.
        </p>

        <!-- Перевірка на Dotabuff — з'являється, щойно ID валідний -->
        <Transition name="link-dota-fade">
          <a
            v-if="dotabuffUrl"
            :href="dotabuffUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="link-dota__verify"
          >
            <Icon name="dotabuff" :size="12" />
            <span>Перевірити на Dotabuff</span>
            <span class="link-dota__verify-id">#{{ matchIdInput }}</span>
            <PhArrowSquareOut :size="11" weight="bold" aria-hidden="true" />
          </a>
        </Transition>
      </div>

      <!-- Що перевірить бекенд -->
      <p class="link-dota__note" role="note">
        <PhShieldCheck :size="16" weight="fill" aria-hidden="true" />
        <span>
          Якщо переможець у Dota-матчі не збігається із зарахованим, прив'язку буде відхилено —
          спершу виправте результат.
        </span>
      </p>

      <!-- Прихована кнопка, щоб Enter у полі відправляв форму -->
      <button type="submit" class="hidden" tabindex="-1" aria-hidden="true" />
    </form>

    <template #footer>
      <div class="link-dota-dialog__foot">
        <span class="link-dota-dialog__foot-hint" :class="{ 'is-ready': isValid }">
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
            <PhLinkSimple v-if="!loading" :size="16" weight="bold" class="mr-8 shrink-0" />
            Прив'язати
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
  PhLinkSimple,
  PhShieldCheck,
  PhTrophy,
  PhX
} from '@phosphor-icons/vue'
import { getDotabuffMatchUrl } from '@/core/helpers'
import { friendlyPlayoffError } from '../utils/playoff-errors.utils'

const props = defineProps<{
  tournamentId: string
  match: TManualMatch
  onLinked?: (result: TLinkManualMatchResult) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const MIN_DIGITS = 6
const MAX_DIGITS = 16

const inputRef = ref<{ focus: () => void } | null>(null)
const matchIdInput = ref('')
const loading = ref(false)

const stageLabel = computed(() => (props.match.stage === 'playoff' ? 'Плей-оф' : 'Кваліфікація'))

const digitsCount = computed(() => matchIdInput.value.length)
const isValid = computed(() => new RegExp(`^\\d{${MIN_DIGITS},${MAX_DIGITS}}$`).test(matchIdInput.value))
const dotabuffUrl = computed(() => (isValid.value ? getDotabuffMatchUrl(matchIdInput.value) : null))

// Підказка у футері — пояснює, чому кнопка вимкнена, і підтверджує готовність.
const footHint = computed(() => {
  if (!matchIdInput.value) return 'Введіть ID матчу'
  if (digitsCount.value < MIN_DIGITS) return `Ще ${MIN_DIGITS - digitsCount.value} цифр`
  if (digitsCount.value > MAX_DIGITS) return `Не більше ${MAX_DIGITS} цифр`
  return 'Готово до прив\'язки'
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
    const result = await tournamentsService.linkManualMatchDotaId(props.tournamentId, {
      stage: props.match.stage,
      matchId: props.match.matchId,
      dotaMatchId: matchIdInput.value
    })
    ElMessage.success(
      result.participantsRecorded > 0
        ? `ID прив'язано, статистику записано для ${result.participantsRecorded} гравців`
        : 'ID прив\'язано. Учасників з прив\'язаним Steam у матчі не знайдено'
    )
    props.onLinked?.(result)
    close()
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося прив\'язати ID матчу'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.link-dota {
  @apply flex flex-col gap-18;
}

// Пара команд: переможець підсвічений трофеєм і ціаном.
.link-dota__match {
  @apply grid items-center gap-10 rounded-xl border px-12 py-10;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(7, 8, 15, 0.45);
}

.link-dota__team {
  @apply inline-flex min-w-0 items-center gap-6;
  font-family: var(--ds-font-display);
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ds-text-muted);

  &:last-child {
    @apply justify-end;
  }

  &.is-winner {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  svg {
    flex: none;
  }
}

.link-dota__vs {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ds-primary-rgb), 0.55);
}

.link-dota__lead {
  @apply m-0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

// ─── Поле ───────────────────────────────────────────────────────────────────
.link-dota__field {
  @apply flex flex-col gap-8;
}

.link-dota__field-head {
  @apply flex items-baseline justify-between gap-10;
  line-height: 1.25;
}

.link-dota__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.link-dota__counter {
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
.link-dota__input {
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

.link-dota__hash {
  font-family: var(--ds-font-mono);
  font-size: 16px;
  font-weight: 700;
  color: rgba(var(--ds-primary-rgb), 0.6);
}

.link-dota__check {
  color: var(--ds-primary);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));
}

.link-dota__hint {
  @apply m-0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

// Посилання на Dotabuff — тонкий HUD-чіп, щоб перевірити матч перед прив'язкою.
.link-dota__verify {
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

.link-dota__verify-id {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--ds-text-muted);
}

// Примітка про перевірку переможця — нейтральний ціановий тон, бо дія безпечна.
.link-dota__note {
  @apply m-0 inline-flex items-start gap-8 rounded-lg border px-12 py-10;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
  border-color: rgba(var(--ds-primary-rgb), 0.22);
  background: rgba(var(--ds-primary-rgb), 0.06);

  svg {
    flex: none;
    margin-top: 1px;
    color: var(--ds-primary);
  }
}

// ─── Переходи ───────────────────────────────────────────────────────────────
.link-dota-pop-enter-active,
.link-dota-pop-leave-active {
  transition: opacity var(--ds-duration-fast) ease, transform var(--ds-duration-fast) var(--ds-ease-out);
}

.link-dota-pop-enter-from,
.link-dota-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.link-dota-fade-enter-active,
.link-dota-fade-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-out);
}

.link-dota-fade-enter-from,
.link-dota-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (hover: hover) and (pointer: fine) {
  .link-dota__verify:hover {
    background: rgba(var(--ds-primary-rgb), 0.16);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.6), var(--ds-glow-primary-soft);
  }
}

@media (prefers-reduced-motion: reduce) {
  .link-dota-pop-enter-active,
  .link-dota-pop-leave-active,
  .link-dota-fade-enter-active,
  .link-dota-fade-leave-active,
  .link-dota__verify,
  .link-dota__counter {
    transition: none;
  }

  .link-dota__verify:active {
    transform: none;
  }
}
</style>

<style lang="scss">
// Не scoped: `.el-dialog` рендериться поза коренем компонента.
// Те саме темне скло, що й у діалогах подачі результату та техпоразки.
.el-dialog.link-dota-dialog {
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

  .link-dota-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.link-dota-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.link-dota-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.link-dota-dialog__close {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.link-dota-dialog__foot {
  @apply flex flex-wrap items-center justify-between gap-10;

  .el-button > span {
    @apply inline-flex items-center;
  }
}

// Пояснює, чому кнопка вимкнена; підсвічується, коли все готово.
.link-dota-dialog__foot-hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-ready {
    color: var(--ds-success);
  }
}

@media (hover: hover) and (pointer: fine) {
  .link-dota-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
