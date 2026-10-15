<template>
  <section class="dprize-ed" aria-labelledby="dprize-ed-title">
    <header class="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-2">
      <span id="dprize-ed-title" class="dprize-ed__label">Призові місця</span>
      <span class="dprize-ed__counter">{{ prizes.length }} / {{ maxPrizes }}</span>
    </header>
    <p class="dprize-ed__hint">
      <slot name="hint">
        Які місця таблиці отримують приз. Приз місця дістається гравцю, що посідає його після завершення
        турніру й зіграв хоча б одну дуель.
      </slot>
      <template v-if="!canUseVip"> VIP як приз призначає лише адмін.</template>
    </p>

    <TransitionGroup tag="ul" name="dprize-row" class="dprize-ed__list" aria-label="Призи">
      <li
        v-for="draft in prizes"
        :key="draft.key"
        class="dprize-row"
        :class="[`tier-${tierOf(draft.place)}`, {
          'is-vip': draft.kind === 'vip',
          'is-locked': isLocked(draft),
          'is-invalid': showErrors && !!errorOf(draft)
        }]"
      >
        <div class="dprize-row__head">
          <!-- Місце: − [N] + ; число можна й ввести з клавіатури -->
          <div class="dprize-place" role="group" :aria-label="`Місце: ${draft.place}`">
            <button
              type="button"
              class="dprize-place__step"
              :disabled="isLocked(draft) || draft.place <= 1"
              aria-label="Попереднє місце"
              @click="setPlace(draft, draft.place - 1)"
            >
              <PhMinus :size="12" weight="bold" />
            </button>
            <input
              class="dprize-place__value"
              type="text"
              inputmode="numeric"
              :value="draft.place"
              :disabled="isLocked(draft)"
              aria-label="Місце"
              @change="onPlaceInput(draft, $event)"
              @keydown.up.prevent="setPlace(draft, draft.place + 1)"
              @keydown.down.prevent="setPlace(draft, draft.place - 1)"
            >
            <button
              type="button"
              class="dprize-place__step"
              :disabled="isLocked(draft) || draft.place >= placeMax"
              aria-label="Наступне місце"
              @click="setPlace(draft, draft.place + 1)"
            >
              <PhPlus :size="12" weight="bold" />
            </button>
          </div>
          <span class="dprize-row__place-suffix">місце</span>

          <!-- Вид призу: сегментований перемикач -->
          <div
            role="radiogroup"
            aria-label="Вид призу"
            class="dprize-kind"
            @keydown.left.prevent="cycleKind(draft, $event)"
            @keydown.right.prevent="cycleKind(draft, $event)"
          >
            <button
              v-for="opt in kindOptions"
              :key="opt.value"
              type="button"
              role="radio"
              class="dprize-kind__option"
              :class="[`is-${opt.value}`, { 'is-selected': draft.kind === opt.value }]"
              :aria-checked="draft.kind === opt.value"
              :tabindex="draft.kind === opt.value ? 0 : -1"
              :disabled="isLocked(draft) || (opt.value === 'vip' && !canUseVip)"
              :title="opt.value === 'vip' && !canUseVip ? 'VIP як приз призначає лише адмін' : undefined"
              @click="draft.kind = opt.value"
            >
              <component :is="opt.icon" :size="13" weight="fill" aria-hidden="true" />
              {{ opt.label }}
            </button>
          </div>

          <span v-if="isLocked(draft)" class="dprize-row__lock" title="Цей приз призначив адмін">
            <PhLockSimple :size="14" weight="bold" aria-hidden="true" />
            <span class="sr-only">Заблоковано</span>
          </span>
          <button
            v-else
            type="button"
            class="dprize-row__remove"
            :aria-label="`Прибрати приз за ${draft.place} місце`"
            title="Прибрати"
            @click="remove(draft)"
          >
            <PhTrash :size="16" />
          </button>
        </div>

        <!-- VIP: місяці, видаються автоматично -->
        <div v-if="draft.kind === 'vip'" class="dprize-row__body">
          <div
            role="radiogroup"
            aria-label="Місяців VIP"
            class="dprize-months"
            @keydown.left.prevent="stepMonths(draft, -1, $event)"
            @keydown.right.prevent="stepMonths(draft, 1, $event)"
          >
            <button
              v-for="n in DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX"
              :key="n"
              type="button"
              role="radio"
              class="dprize-months__option"
              :class="{ 'is-selected': draft.vipMonths === n }"
              :aria-checked="draft.vipMonths === n"
              :aria-label="pluralizeDuelMonths(n)"
              :tabindex="draft.vipMonths === n ? 0 : -1"
              :disabled="isLocked(draft)"
              @click="draft.vipMonths = n"
            >
              {{ n }}
            </button>
          </div>
          <p class="dprize-row__note">
            <PhCrown :size="13" weight="fill" class="dprize-row__note-icon" aria-hidden="true" />
            <span>
              <strong class="dprize-row__note-strong">{{ pluralizeDuelMonths(draft.vipMonths || 0) }} VIP</strong>
              <template v-if="isLocked(draft)"> — цей приз призначив адмін, змінити його може лише адмін.</template>
              <template v-else> — нарахуємо автоматично, щойно турнір завершиться.</template>
            </span>
          </p>
        </div>

        <!-- Свій приз: картинка + посилання -->
        <div v-else class="dprize-row__body dprize-row__body--custom">
          <button
            type="button"
            class="dprize-row__image"
            :class="{ 'has-image': !!draft.imageUrl }"
            :disabled="uploadingKey === draft.key"
            :aria-label="draft.imageUrl ? 'Замінити картинку призу' : 'Завантажити картинку призу'"
            @click="pickImage(draft)"
          >
            <img v-if="draft.imageUrl" :src="resolvePublicOrApiUrl(draft.imageUrl)" alt="">
            <span v-else-if="uploadingKey !== draft.key" class="flex flex-col items-center gap-4">
              <PhImageSquare :size="20" />
              <span class="dprize-row__image-text">Картинка</span>
            </span>
            <span v-if="draft.imageUrl && uploadingKey !== draft.key" class="dprize-row__image-swap" aria-hidden="true">
              <PhArrowsClockwise :size="16" weight="bold" />
            </span>
            <span v-if="uploadingKey === draft.key" class="dprize-row__image-busy" aria-hidden="true">
              <PhSpinnerGap :size="20" class="animate-spin" />
            </span>
          </button>
          <div class="flex min-w-0 flex-1 flex-col gap-6">
            <el-input
              v-model="draft.title"
              size="small"
              :maxlength="DUEL_TOURNAMENT_PRIZE_TITLE_MAX"
              placeholder="Назва (необов’язково), напр. «Аркана на Pudge»"
            />
            <el-input
              v-model="draft.linkUrl"
              size="small"
              :maxlength="DUEL_TOURNAMENT_PRIZE_URL_MAX"
              placeholder="Посилання на приз: https://…"
              inputmode="url"
            >
              <template #prefix>
                <PhLink :size="14" />
              </template>
            </el-input>
          </div>
        </div>

        <span v-if="showErrors && errorOf(draft)" class="dprize-row__error" role="alert">
          <PhWarningCircle :size="13" weight="fill" aria-hidden="true" />
          {{ errorOf(draft) }}
        </span>
      </li>
    </TransitionGroup>

    <button
      v-if="prizes.length < maxPrizes"
      type="button"
      class="dprize-ed__add"
      @click="add"
    >
      <PhPlus :size="14" weight="bold" aria-hidden="true" />
      Додати призове місце
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChosen"
    >
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  PhArrowsClockwise,
  PhCrown,
  PhGift,
  PhImageSquare,
  PhLink,
  PhLockSimple,
  PhMinus,
  PhPlus,
  PhSpinnerGap,
  PhTrash,
  PhWarningCircle
} from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { duelsService } from '@/views/duels/duels.service'
import {
  createDuelPrizeDraft,
  DUEL_TOURNAMENT_PRIZE_PLACE_MAX,
  DUEL_TOURNAMENT_PRIZE_TITLE_MAX,
  DUEL_TOURNAMENT_PRIZE_URL_MAX,
  DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX,
  DUEL_TOURNAMENT_PRIZES_MAX,
  duelPrizeDraftError,
  pluralizeDuelMonths
} from '@/views/duels/duels.utils'
import type { Component } from 'vue'
import type { TDuelTournamentPrizeKind } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  /** Адмін — може додавати й змінювати VIP-призи; стрімер лише зберігає ті, що поставив адмін. */
  canUseVip: boolean
  showErrors: boolean
  /** Найнижче місце, на яке можна поставити приз (сітка медіа-турніру — лише 1–4). */
  placeMax?: number
  /** Скільки призових місць можна додати. */
  maxPrizes?: number
}>(), {
  placeMax: DUEL_TOURNAMENT_PRIZE_PLACE_MAX,
  maxPrizes: DUEL_TOURNAMENT_PRIZES_MAX
})

const prizes = defineModel<TDuelPrizeDraft[]>({ required: true })

const kindOptions: { value: TDuelTournamentPrizeKind; label: string; icon: Component }[] = [
  { value: 'vip', label: 'VIP', icon: PhCrown },
  { value: 'custom', label: 'Свій приз', icon: PhGift }
]

/** Стрімер не може змінити VIP-приз (бекенд відповість 403) — рядок лише для читання. */
const isLocked = (draft: TDuelPrizeDraft) => draft.kind === 'vip' && !props.canUseVip

const errorOf = (draft: TDuelPrizeDraft) => duelPrizeDraftError(draft, prizes.value, props.placeMax)

/** Колір «медалі» місця: золото / срібло / бронза, далі — нейтральний. */
const tierOf = (place: number) => (place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : 'plain')

const clampPlace = (n: number) => Math.min(props.placeMax, Math.max(1, n))

function setPlace (draft: TDuelPrizeDraft, place: number) {
  if (isLocked(draft)) return
  draft.place = clampPlace(place)
}

function onPlaceInput (draft: TDuelPrizeDraft, event: Event) {
  const input = event.target as HTMLInputElement
  const parsed = Number.parseInt(input.value, 10)
  if (Number.isFinite(parsed)) draft.place = clampPlace(parsed)
  // Невалідне введення — повертаємо попереднє значення в поле.
  input.value = String(draft.place)
}

/** Стрілки в радіогрупі: фокус іде за вибором (roving tabindex). */
function focusSelected (event: KeyboardEvent) {
  const group = event.currentTarget as HTMLElement
  nextTick(() => group.querySelector<HTMLElement>('.is-selected')?.focus())
}

function cycleKind (draft: TDuelPrizeDraft, event: KeyboardEvent) {
  if (isLocked(draft) || !props.canUseVip) return
  draft.kind = draft.kind === 'vip' ? 'custom' : 'vip'
  focusSelected(event)
}

function stepMonths (draft: TDuelPrizeDraft, delta: number, event: KeyboardEvent) {
  if (isLocked(draft)) return
  draft.vipMonths = Math.min(DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX, Math.max(1, (draft.vipMonths || 1) + delta))
  focusSelected(event)
}

function add () {
  const nextPlace = Math.min(
    props.placeMax,
    prizes.value.reduce((max, p) => Math.max(max, p.place), 0) + 1
  )
  prizes.value = [...prizes.value, createDuelPrizeDraft(nextPlace, props.canUseVip ? 'vip' : 'custom')]
}

function remove (draft: TDuelPrizeDraft) {
  prizes.value = prizes.value.filter(p => p !== draft)
}

// ─── Картинка власного призу ─────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingKey = ref<number | null>(null)
let pickingFor: TDuelPrizeDraft | null = null

function pickImage (draft: TDuelPrizeDraft) {
  pickingFor = draft
  fileInput.value?.click()
}

async function onFileChosen (event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const draft = pickingFor
  pickingFor = null
  if (!file || !draft) return
  uploadingKey.value = draft.key
  try {
    draft.imageUrl = await duelsService.uploadTournamentPrizeImage(file)
  } catch (e) {
    ElMessage.error(e instanceof Error && e.message ? e.message : 'Не вдалося завантажити картинку')
  } finally {
    uploadingKey.value = null
  }
}
</script>

<style scoped lang="scss">
// Prize rows: a "medal" place stepper tinted by tier (gold / silver / bronze),
// a segmented VIP / custom switch, and a 1–12 month tile strip in the same
// well + lit-rail vocabulary as the players-needed picker in Find.
.dprize-ed {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dprize-ed__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-muted);
}

.dprize-ed__counter {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.dprize-ed__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.dprize-ed__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dprize-ed__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border-radius: 12px;
  border: 1px dashed rgba(var(--ds-primary-rgb), 0.3);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--ds-primary-rgb), 0.85);
  cursor: pointer;
  transition:
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }
}

// ─── Row ─────────────────────────────────────────────────────────────────────
.dprize-row {
  --tier-rgb: 255, 255, 255;
  --vip-gold: 255, 206, 84;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 12px 12px 15px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.025);
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  // Ліва рейка в кольорі місця.
  &::before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: rgba(var(--tier-rgb), 0.55);
    box-shadow: 0 0 10px rgba(var(--tier-rgb), 0.35);
  }

  &.tier-gold { --tier-rgb: 232, 185, 49; }
  &.tier-silver { --tier-rgb: 196, 206, 222; }
  &.tier-bronze { --tier-rgb: 205, 127, 70; }
  &.tier-plain { --tier-rgb: 120, 130, 150; }

  &.is-vip {
    border-color: rgba(var(--vip-gold), 0.24);
    background:
      radial-gradient(120% 140% at 100% 0%, rgba(var(--vip-gold), 0.08), transparent 55%),
      rgba(255, 255, 255, 0.02);
  }

  &.is-invalid {
    border-color: rgba(239, 68, 68, 0.45);
  }
}

.dprize-row__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.dprize-row__place-suffix {
  margin-right: 4px;
  font-size: 12px;
  color: var(--ds-text-faint);
}

// ─── Place stepper ───────────────────────────────────────────────────────────
.dprize-place {
  display: inline-flex;
  align-items: stretch;
  height: 34px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(var(--tier-rgb), 0.35);
  background: rgba(7, 8, 15, 0.5);
  transition: border-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;

  &:focus-within {
    border-color: rgba(var(--tier-rgb), 0.7);
    box-shadow: 0 0 0 3px rgba(var(--tier-rgb), 0.12);
  }
}

.dprize-place__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    color: var(--ds-text-strong);
    background: rgba(var(--tier-rgb), 0.12);
  }
}

.dprize-place__value {
  width: 40px;
  padding: 0;
  border: 0;
  border-inline: 1px solid rgba(var(--tier-rgb), 0.18);
  background: rgba(var(--tier-rgb), 0.08);
  font-family: var(--ds-font-display);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: rgb(var(--tier-rgb));
  text-shadow: 0 0 10px rgba(var(--tier-rgb), 0.45);
  outline: none;

  &:disabled {
    cursor: not-allowed;
  }
}

.dprize-row.tier-plain .dprize-place__value {
  color: var(--ds-text-strong);
  text-shadow: none;
}

// ─── Kind switch ─────────────────────────────────────────────────────────────
.dprize-kind {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--ds-border-neutral);
  background: rgba(7, 8, 15, 0.5);
}

.dprize-kind__option {
  --opt-rgb: var(--ds-primary-rgb);

  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &.is-vip { --opt-rgb: 255, 206, 84; }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--opt-rgb), 0.7);
    outline-offset: 1px;
  }

  &:disabled:not(.is-selected) {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.is-selected {
    border-color: rgba(var(--opt-rgb), 0.45);
    background: rgba(var(--opt-rgb), 0.14);
    color: rgb(var(--opt-rgb));
    box-shadow: 0 0 12px rgba(var(--opt-rgb), 0.15);
  }

  &.is-selected:disabled {
    cursor: default;
  }
}

.dprize-row__lock,
.dprize-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border-radius: 8px;
  color: var(--ds-text-faint);
}

.dprize-row__remove {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(239, 68, 68, 0.7);
    outline-offset: 1px;
  }
}

// ─── VIP months ──────────────────────────────────────────────────────────────
.dprize-row__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dprize-months {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.dprize-months__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0;
  overflow: hidden;
  border-radius: 7px;
  border: 1px solid var(--ds-border-neutral);
  background: rgba(7, 8, 15, 0.45);
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  // Верхня рейка світиться на обраній плитці.
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: rgb(var(--vip-gold));
    box-shadow: 0 0 8px rgba(var(--vip-gold), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-fast) ease;
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--vip-gold), 0.7);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:disabled:not(.is-selected) {
    opacity: 0.4;
  }

  &.is-selected {
    border-color: rgba(var(--vip-gold), 0.55);
    background: rgba(var(--vip-gold), 0.12);
    color: rgb(var(--vip-gold));

    &::before {
      opacity: 1;
    }
  }
}

.dprize-row__note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

.dprize-row__note-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: rgb(var(--vip-gold));
}

.dprize-row__note-strong {
  font-weight: 600;
  color: var(--ds-text);
}

// ─── Custom prize ────────────────────────────────────────────────────────────
.dprize-row__body--custom {
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}

.dprize-row__image {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  padding: 0;
  overflow: hidden;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(7, 8, 15, 0.45);
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: border-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }

  &.has-image {
    border-style: solid;
    border-color: var(--ds-border-neutral);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.dprize-row__image-text {
  font-size: 10px;
}

.dprize-row__image-swap,
.dprize-row__image-busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 12, 24, 0.6);
  color: var(--ds-text-strong);
}

.dprize-row__image-swap {
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease;
}

.dprize-row__image:focus-visible .dprize-row__image-swap {
  opacity: 1;
}

.dprize-row__error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
}

// Hover лише там, де він справжній — без «залиплих» станів на тачі.
@media (hover: hover) and (pointer: fine) {
  .dprize-ed__add:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.06);
  }

  .dprize-place__step:hover:not(:disabled) {
    color: var(--ds-text-strong);
    background: rgba(var(--tier-rgb), 0.12);
  }

  .dprize-kind__option:not(.is-selected):not(:disabled):hover {
    color: var(--ds-text);
  }

  .dprize-months__option:not(.is-selected):not(:disabled):hover {
    color: var(--ds-text);
    border-color: rgba(var(--vip-gold), 0.35);
  }

  .dprize-row__remove:hover {
    color: var(--el-color-danger);
    background: rgba(239, 68, 68, 0.1);
  }

  .dprize-row__image:hover:not(:disabled) {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    color: rgb(var(--ds-primary-rgb));
  }

  .dprize-row__image:hover .dprize-row__image-swap {
    opacity: 1;
  }
}

// ─── Enter / leave ───────────────────────────────────────────────────────────
.dprize-row-enter-active,
.dprize-row-leave-active {
  transition: opacity 180ms var(--ds-ease-out), transform 180ms var(--ds-ease-out);
}

.dprize-row-enter-from,
.dprize-row-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  .dprize-row-enter-active,
  .dprize-row-leave-active,
  .dprize-months__option,
  .dprize-kind__option,
  .dprize-ed__add {
    transition: none;
  }
}
</style>
