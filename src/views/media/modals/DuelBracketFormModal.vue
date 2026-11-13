<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="media-dialog"
    width="600"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="media-dialog__eyebrow">
          <PhTwitchLogo :size="12" weight="fill" aria-hidden="true" />
          // Медіа-турнір 1v1
        </span>
        <h2 class="media-dialog__title">{{ isEdit ? 'Редагувати турнір' : 'Новий турнір на стрімі' }}</h2>
      </div>
    </template>

    <form class="flex flex-col gap-18" @submit.prevent="submit">
      <p v-if="!isEdit" class="media-dialog__text">
        Сітка на вибування: гравці реєструються, ви запускаєте турнір — і боти ліги самі створюють лобі під кожен
        матч з випадковими героями. Рейтинг дуелей не змінюється; переможець проходить далі, а за перші місця —
        ваші призи.
      </p>

      <label class="flex flex-col gap-6">
        <span class="media-dialog__label">Назва</span>
        <el-input
          v-model="name"
          :maxlength="DUEL_TOURNAMENT_NAME_MAX"
          show-word-limit
          placeholder="Напр. «Mid Wars на стрімі»"
        />
        <span v-if="showErrors && nameError" class="media-dialog__error">{{ nameError }}</span>
      </label>

      <label class="flex flex-col gap-6">
        <span class="media-dialog__label">Про турнір <span class="font-normal">(необов’язково)</span></span>
        <el-input
          v-model="description"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :maxlength="DUEL_BRACKET_DESCRIPTION_MAX"
          show-word-limit
          placeholder="Розклад, правила, пару слів про себе й канал — це побачать усі на сторінці турніру"
        />
      </label>

      <!-- Розмір сітки -->
      <div class="flex flex-col gap-8">
        <span class="media-dialog__label">Максимум учасників</span>
        <div class="flex flex-wrap items-center gap-10">
          <div class="media-dialog__presets" role="group" aria-label="Розмір сітки">
            <button
              v-for="size in DUEL_BRACKET_SIZE_PRESETS"
              :key="size"
              type="button"
              class="media-dialog__preset"
              :class="{ 'is-active': maxParticipants === size }"
              :disabled="sizeLocked || size < minSize"
              @click="maxParticipants = size"
            >
              {{ size }}
            </button>
          </div>
          <el-input-number
            v-model="maxParticipants"
            :min="minSize"
            :max="DUEL_BRACKET_MAX_PARTICIPANTS"
            :disabled="sizeLocked"
            controls-position="right"
            class="!w-[120px]"
          />
        </div>
        <span class="media-dialog__hint">
          <template v-if="sizeLocked">Турнір уже стартував — розмір сітки зафіксовано.</template>
          <template v-else>
            Будь-яке число від 2 до 64. Неповну сітку доповнять слоти без противника —
            найсильніші посіви пройдуть перше коло без гри.
          </template>
        </span>
      </div>

      <!-- Пароль -->
      <div class="flex flex-col gap-8">
        <div class="flex items-center justify-between gap-10">
          <span class="media-dialog__label">Реєстрація за паролем</span>
          <el-switch v-model="usePassword" :disabled="passwordLocked" />
        </div>
        <div v-if="usePassword" class="flex gap-8">
          <el-input
            v-model="password"
            :maxlength="DUEL_TOURNAMENT_PASSWORD_MAX"
            :disabled="passwordLocked"
            class="min-w-0 flex-1"
            placeholder="Пароль, який ви скажете на стрімі"
          />
          <el-button
            :disabled="passwordLocked"
            title="Згенерувати пароль"
            @click="password = generateDuelTournamentPassword()"
          >
            <PhShuffle :size="16" weight="bold" />
          </el-button>
        </div>
        <span v-if="showErrors && passwordError" class="media-dialog__error">{{ passwordError }}</span>
        <span v-else class="media-dialog__hint">
          {{ passwordLocked
            ? 'Реєстрацію закрито — пароль більше не потрібен.'
            : usePassword
              ? 'Зареєструватися зможуть лише ті, хто знає пароль — наприклад, глядачі вашого стріму.'
              : 'Відкрита реєстрація: місце займе будь-який гравець ліги з прив’язаним Steam.' }}
        </span>
      </div>

      <label class="flex flex-col gap-6">
        <span class="media-dialog__label">Запланований старт <span class="font-normal">(необов’язково)</span></span>
        <el-date-picker
          v-model="scheduledAt"
          type="datetime"
          format="DD.MM.YYYY HH:mm"
          placeholder="Коли плануєте запустити сітку"
          :disabled-date="isPastDay"
          class="!w-full"
        />
        <span class="media-dialog__hint">Лише анонс для гравців — запускаєте турнір ви, кнопкою на його сторінці.</span>
      </label>

      <div class="flex flex-col gap-6">
        <span id="bracket-stream-label" class="media-dialog__label">
          Трансляція <span class="font-normal">(необов’язково)</span>
        </span>
        <el-radio-group v-model="streamPlatform" aria-labelledby="bracket-stream-label">
          <el-radio-button v-for="p in STREAM_PREVIEW_PLATFORMS" :key="p.key" :value="p.key">
            <span class="inline-flex items-center gap-6">
              <Icon v-if="p.icon" :name="p.icon" :size="14" aria-hidden="true" />
              <PhTwitchLogo v-else :size="14" weight="fill" aria-hidden="true" />
              {{ p.label }}
            </span>
          </el-radio-button>
        </el-radio-group>
        <el-input
          v-model="streamUrl"
          :maxlength="DUEL_TOURNAMENT_STREAM_URL_MAX"
          :aria-label="`Посилання на стрім ${streamPlatformMeta.label}`"
          clearable
          inputmode="url"
          :placeholder="streamPlatformMeta.placeholder"
        />
        <span v-if="showErrors && streamUrlError" class="media-dialog__error">{{ streamUrlError }}</span>
        <span v-else class="media-dialog__hint">{{ streamPlatformMeta.hint }}</span>
      </div>

      <!-- Інші канали стрімера -->
      <div class="flex flex-col gap-8">
        <span class="media-dialog__label">Канали стрімера <span class="font-normal">(необов’язково)</span></span>
        <div class="flex flex-col gap-8">
          <div v-for="platform in STREAMER_LINK_PLATFORMS" :key="platform.key" class="flex flex-col gap-4">
            <el-input
              v-model="streamerLinks[platform.key]"
              :maxlength="DUEL_TOURNAMENT_STREAM_URL_MAX"
              :aria-label="platform.label"
              clearable
              inputmode="url"
              :placeholder="platform.placeholder"
            >
              <template #prefix>
                <Icon :name="platform.icon" :size="14" aria-hidden="true" />
              </template>
            </el-input>
            <span v-if="showErrors && streamerLinkErrors[platform.key]" class="media-dialog__error">
              {{ streamerLinkErrors[platform.key] }}
            </span>
          </div>
        </div>
        <span class="media-dialog__hint">Покажемо іконками в картці стрімера на сторінці турніру.</span>
      </div>

      <DuelTournamentPrizesEditor
        v-model="prizes"
        :can-use-vip="isAdmin"
        :show-errors="showErrors"
        :place-max="DUEL_BRACKET_PRIZE_PLACE_MAX"
        :max-prizes="DUEL_BRACKET_PRIZE_PLACE_MAX"
      >
        <template #hint>
          Призи за 1–4 місця. Перші два визначить фінал, третє й четверте — матч за 3 місце.
        </template>
      </DuelTournamentPrizesEditor>
    </form>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" class="media-dialog__primary" :loading="saving" @click="submit">
        {{ isEdit ? 'Зберегти' : 'Створити турнір' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhShuffle, PhTwitchLogo } from '@phosphor-icons/vue'
import DuelTournamentPrizesEditor from '@/views/duels/components/DuelTournamentPrizesEditor.vue'
import {
  DUEL_TOURNAMENT_NAME_MAX,
  DUEL_TOURNAMENT_NAME_MIN,
  DUEL_TOURNAMENT_PASSWORD_MAX,
  DUEL_TOURNAMENT_PASSWORD_MIN,
  DUEL_TOURNAMENT_STREAM_URL_MAX,
  duelPrizeDraftError,
  duelPrizeDraftsFrom,
  duelPrizeDraftToInput,
  generateDuelTournamentPassword
} from '@/views/duels/duels.utils'
import { duelBracketsService } from '@/views/media/media.service'
import {
  DUEL_BRACKET_DESCRIPTION_MAX,
  DUEL_BRACKET_MAX_PARTICIPANTS,
  DUEL_BRACKET_MIN_PARTICIPANTS,
  DUEL_BRACKET_PRIZE_PLACE_MAX,
  DUEL_BRACKET_SIZE_PRESETS,
  STREAM_PREVIEW_PLATFORMS,
  STREAMER_LINK_PLATFORMS,
  streamPlatformOf,
  streamPreviewUrlError,
  streamerLinkError,
  type TStreamPreviewPlatform,
  type TStreamerPlatform
} from '@/views/media/media.utils'
import type { TDuelBracket, TDuelBracketStreamerLinks } from '@/api/types/api.types'

const props = defineProps<{
  /** Є — редагування; немає — створення. */
  bracket?: TDuelBracket | null
  onSaved?: (bracket: TDuelBracket) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
/** VIP-призи призначає лише адмін — бекенд перевіряє те саме. */
const isAdmin = computed(() => authStore.isAdmin.isAdmin)

const isEdit = computed(() => !!props.bracket)
/** Після старту бекенд не дає міняти розмір і пароль. */
const sizeLocked = computed(() => !!props.bracket && props.bracket.status !== 'REGISTRATION')
const passwordLocked = sizeLocked
/** Не менше, ніж уже зареєструвалось. */
const minSize = computed(() => Math.max(DUEL_BRACKET_MIN_PARTICIPANTS, props.bracket?.participantsCount ?? 0))

const name = ref('')
const description = ref('')
const maxParticipants = ref<number>(16)
const usePassword = ref(false)
const password = ref('')
const scheduledAt = ref<Date | null>(null)
const streamUrl = ref('')
/** З якої платформи вбудовуємо прев’ю трансляції; на редагуванні — за збереженим посиланням. */
const streamPlatform = ref<TStreamPreviewPlatform>('twitch')
const streamPlatformMeta = computed(() => STREAM_PREVIEW_PLATFORMS.find(p => p.key === streamPlatform.value)!)
const streamerLinks = ref<Record<TStreamerPlatform, string>>(streamerLinksDraft())
const prizes = ref<TDuelPrizeDraft[]>([])
const saving = ref(false)
const showErrors = ref(false)

const nameError = computed(() =>
  name.value.trim().length < DUEL_TOURNAMENT_NAME_MIN ? `Назва — щонайменше ${DUEL_TOURNAMENT_NAME_MIN} символи` : ''
)
const passwordError = computed(() => {
  if (!usePassword.value || passwordLocked.value) return ''
  return password.value.trim().length < DUEL_TOURNAMENT_PASSWORD_MIN
    ? `Пароль — щонайменше ${DUEL_TOURNAMENT_PASSWORD_MIN} символи`
    : ''
})
const streamUrlError = computed(() => streamPreviewUrlError(streamPlatform.value, streamUrl.value))
const streamerLinkErrors = computed(() =>
  Object.fromEntries(
    STREAMER_LINK_PLATFORMS.map(p => [p.key, streamerLinkError(p.key, streamerLinks.value[p.key])])
  ) as Record<TStreamerPlatform, string>
)
const hasStreamerLinkError = computed(() => Object.values(streamerLinkErrors.value).some(Boolean))
const prizesError = computed(() =>
  prizes.value.some(p => duelPrizeDraftError(p, prizes.value, DUEL_BRACKET_PRIZE_PLACE_MAX))
)

function streamerLinksDraft (links?: TDuelBracketStreamerLinks | null): Record<TStreamerPlatform, string> {
  return Object.fromEntries(
    STREAMER_LINK_PLATFORMS.map(p => [p.key, links?.[p.key] ?? ''])
  ) as Record<TStreamerPlatform, string>
}

const isPastDay = (date: Date) => dayjs(date).isBefore(dayjs().startOf('day'))

/** Модалку монтують уже відкритою — заповнюємо поля за `modelValue`, а не за `@open`. */
watch(modelValue, (open) => {
  if (!open) return
  const b = props.bracket
  showErrors.value = false
  name.value = b?.name ?? ''
  description.value = b?.description ?? ''
  maxParticipants.value = b?.maxParticipants ?? 16
  usePassword.value = !!b?.password
  password.value = b?.password ?? generateDuelTournamentPassword()
  scheduledAt.value = b?.scheduledAt ? new Date(b.scheduledAt) : null
  streamUrl.value = b?.streamUrl ?? ''
  const savedPlatform = streamPlatformOf(b?.streamUrl)
  streamPlatform.value = savedPlatform === 'other' ? 'twitch' : savedPlatform
  streamerLinks.value = streamerLinksDraft(b?.streamerLinks)
  prizes.value = duelPrizeDraftsFrom(b?.prizes)
}, { immediate: true })

async function submit () {
  showErrors.value = true
  const invalid = nameError.value || passwordError.value || streamUrlError.value ||
    hasStreamerLinkError.value || prizesError.value
  if (invalid || saving.value) return
  saving.value = true
  try {
    const common = {
      name: name.value.trim(),
      // null на редагуванні прибирає поле
      description: description.value.trim() || null,
      scheduledAt: scheduledAt.value ? scheduledAt.value.toISOString() : null,
      streamUrl: streamUrl.value.trim() || null,
      // Усі ключі щоразу: на редагуванні бекенд замінює весь набір, null прибирає канал
      streamerLinks: Object.fromEntries(
        STREAMER_LINK_PLATFORMS.map(p => [p.key, streamerLinks.value[p.key].trim() || null])
      ) as TDuelBracketStreamerLinks,
      prizes: [...prizes.value].sort((a, b) => a.place - b.place).map(duelPrizeDraftToInput)
    }
    const registration = !sizeLocked.value
      ? { maxParticipants: maxParticipants.value, password: usePassword.value ? password.value.trim() : null }
      : {}
    const saved = props.bracket
      ? await duelBracketsService.update(props.bracket.id, { ...common, ...registration })
      : await duelBracketsService.create({ ...common, maxParticipants: maxParticipants.value, ...registration })
    props.onSaved?.(saved)
    modelValue.value = false
  } catch {
    // тост уже показав сервіс
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" src="./media-dialog.scss"></style>
