<template>
  <section class="dprize-ed" aria-labelledby="dprize-ed-title">
    <header class="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-2">
      <span id="dprize-ed-title" class="dprize-ed__label">Призові місця</span>
      <span class="dprize-ed__counter">{{ prizes.length }} / {{ DUEL_TOURNAMENT_PRIZES_MAX }}</span>
    </header>
    <p class="dprize-ed__hint">
      Які місця таблиці отримують приз. Приз місця дістається гравцю, що посідає його після завершення
      турніру й зіграв хоча б одну дуель.
      <template v-if="!canUseVip"> VIP як приз призначає лише адмін.</template>
    </p>

    <TransitionGroup tag="ul" name="dprize-row" class="dprize-ed__list" aria-label="Призи">
      <li
        v-for="draft in prizes"
        :key="draft.key"
        class="dprize-row"
        :class="{ 'is-vip': draft.kind === 'vip', 'is-locked': isLocked(draft) }"
      >
        <div class="dprize-row__head">
          <label class="dprize-row__place">
            <span class="sr-only">Місце</span>
            <el-input-number
              v-model="draft.place"
              :min="1"
              :max="DUEL_TOURNAMENT_PRIZE_PLACE_MAX"
              :step="1"
              step-strictly
              size="small"
              controls-position="right"
              :disabled="isLocked(draft)"
            />
            <span class="dprize-row__place-suffix">місце</span>
          </label>

          <el-radio-group
            v-model="draft.kind"
            size="small"
            :disabled="isLocked(draft)"
            aria-label="Вид призу"
          >
            <el-radio-button value="vip" :disabled="!canUseVip">
              <span class="inline-flex items-center gap-4">
                <PhCrown :size="12" weight="fill" />
                VIP
              </span>
            </el-radio-button>
            <el-radio-button value="custom">
              <span class="inline-flex items-center gap-4">
                <PhGift :size="12" weight="fill" />
                Свій приз
              </span>
            </el-radio-button>
          </el-radio-group>

          <el-button
            v-if="!isLocked(draft)"
            class="dprize-row__remove"
            size="small"
            text
            :aria-label="`Прибрати приз за ${draft.place} місце`"
            title="Прибрати"
            @click="remove(draft)"
          >
            <PhTrash :size="16" />
          </el-button>
        </div>

        <!-- VIP: місяці, видаються автоматично -->
        <div v-if="draft.kind === 'vip'" class="dprize-row__body">
          <div class="flex flex-wrap items-center gap-8">
            <el-input-number
              v-model="draft.vipMonths"
              :min="1"
              :max="DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX"
              :step="1"
              step-strictly
              size="small"
              :disabled="isLocked(draft)"
              aria-label="Місяців VIP"
            />
            <span class="dprize-row__note">
              {{ monthsWord(draft.vipMonths) }} VIP — нарахуємо автоматично, щойно турнір завершиться
            </span>
          </div>
          <span v-if="isLocked(draft)" class="dprize-row__note">
            Цей приз призначив адмін — змінити його може лише адмін.
          </span>
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
            <span v-else-if="uploadingKey !== draft.key" class="flex flex-col items-center gap-2">
              <PhImageSquare :size="20" />
              <span class="dprize-row__image-text">Картинка</span>
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

        <span v-if="showErrors && errorOf(draft)" class="dprize-row__error">{{ errorOf(draft) }}</span>
      </li>
    </TransitionGroup>

    <el-button
      v-if="prizes.length < DUEL_TOURNAMENT_PRIZES_MAX"
      class="dprize-ed__add"
      size="small"
      plain
      @click="add"
    >
      <PhPlus :size="14" weight="bold" class="mr-6" />
      Додати призове місце
    </el-button>

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
  PhCrown,
  PhGift,
  PhImageSquare,
  PhLink,
  PhPlus,
  PhSpinnerGap,
  PhTrash
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

const props = defineProps<{
  /** Адмін — може додавати й змінювати VIP-призи; стрімер лише зберігає ті, що поставив адмін. */
  canUseVip: boolean
  showErrors: boolean
}>()

const prizes = defineModel<TDuelPrizeDraft[]>({ required: true })

/** Стрімер не може змінити VIP-приз (бекенд відповість 403) — рядок лише для читання. */
const isLocked = (draft: TDuelPrizeDraft) => draft.kind === 'vip' && !props.canUseVip

const errorOf = (draft: TDuelPrizeDraft) => duelPrizeDraftError(draft, prizes.value)

/** «3 місяці» → «3 місяці»; число вже в полі, тож показуємо лише слово. */
const monthsWord = (n: number) => pluralizeDuelMonths(n || 0).replace(/^\d+\s/, '')

function add () {
  const nextPlace = Math.min(
    DUEL_TOURNAMENT_PRIZE_PLACE_MAX,
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

<style scoped>
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
  align-self: flex-start;
}

.dprize-row {
  --vip-gold: 255, 206, 84;

  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.dprize-row.is-vip {
  border-color: rgba(var(--vip-gold), 0.3);
  background: linear-gradient(120deg, rgba(var(--vip-gold), 0.06), rgba(255, 94, 170, 0.04));
}

.dprize-row__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.dprize-row__place {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dprize-row__place :deep(.el-input-number) {
  width: 84px;
}

.dprize-row__place-suffix {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.dprize-row__remove {
  margin-left: auto;
  color: var(--ds-text-faint);
}

.dprize-row__remove:hover {
  color: var(--el-color-danger);
}

.dprize-row__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dprize-row__body--custom {
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}

.dprize-row__note {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

.dprize-row__image {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  color: var(--ds-text-muted);
  cursor: pointer;
  transition: border-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

.dprize-row__image:hover:not(:disabled) {
  border-color: rgba(var(--ds-primary-rgb), 0.6);
  color: rgb(var(--ds-primary-rgb));
}

.dprize-row__image:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: 2px;
}

.dprize-row__image.has-image {
  border-style: solid;
}

.dprize-row__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dprize-row__image-text {
  font-size: 10px;
}

.dprize-row__image-busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 12, 24, 0.6);
}

.dprize-row__error {
  font-size: 12px;
  color: var(--el-color-danger);
}

.dprize-row-enter-active,
.dprize-row-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.dprize-row-enter-from,
.dprize-row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dprize-row-enter-active,
  .dprize-row-leave-active {
    transition: none;
  }
}
</style>
