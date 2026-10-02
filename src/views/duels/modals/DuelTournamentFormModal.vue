<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="duel-tournament-dialog"
    width="560"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label inline-flex items-center gap-6">
          <PhBroadcast :size="12" weight="bold" aria-hidden="true" />
          // Стрім-турнір 1v1
        </span>
        <h2 class="duel-tournament-dialog__title">{{ isEdit ? 'Редагувати турнір' : 'Новий стрім-турнір' }}</h2>
      </div>
    </template>

    <form class="flex flex-col gap-16" @submit.prevent="submit">
      <p v-if="!isEdit" class="duel-tournament-dialog__text">
        Турнір для стрімерів ліги: проведіть його на стрімі, а пароль дайте глядачам. Гравці входять за паролем
        і шукають суперника лише серед учасників. Своя таблиця: усі стартують з 0, ±{{ DUEL_RATING_DELTA }} за дуель;
        загальний рейтинг дуелей не змінюється.
      </p>

      <label class="flex flex-col gap-6">
        <span class="duel-tournament-dialog__label">Назва</span>
        <el-input
          v-model="name"
          :maxlength="DUEL_TOURNAMENT_NAME_MAX"
          show-word-limit
          placeholder="Напр. «Стрім-турнір 1v1»"
        />
        <span v-if="showErrors && nameError" class="duel-tournament-dialog__error">{{ nameError }}</span>
      </label>

      <label class="flex flex-col gap-6">
        <span class="duel-tournament-dialog__label">Пароль для входу</span>
        <div class="flex gap-8">
          <el-input
            v-model="password"
            :maxlength="DUEL_TOURNAMENT_PASSWORD_MAX"
            class="min-w-0 flex-1"
            placeholder="Що ви скажете учасникам"
          />
          <el-button title="Згенерувати пароль" @click="password = generateDuelTournamentPassword()">
            <PhShuffle :size="16" weight="bold" />
          </el-button>
        </div>
        <span v-if="showErrors && passwordError" class="duel-tournament-dialog__error">{{ passwordError }}</span>
        <span v-else class="duel-tournament-dialog__hint">
          {{ isEdit ? 'Новий пароль діє для нових учасників — хто вже в турнірі, там і лишається.' :
            'Пароль бачите лише ви та адміни — на сторінці турніру.' }}
        </span>
      </label>

      <label class="flex flex-col gap-6">
        <span class="duel-tournament-dialog__label">
          Посилання на стрім <span class="font-normal">(необов’язково)</span>
        </span>
        <el-input
          v-model="streamUrl"
          :maxlength="DUEL_TOURNAMENT_STREAM_URL_MAX"
          clearable
          inputmode="url"
          placeholder="https://twitch.tv/…"
        >
          <template #prefix>
            <PhBroadcast :size="14" aria-hidden="true" />
          </template>
        </el-input>
        <span v-if="showErrors && streamUrlError" class="duel-tournament-dialog__error">{{ streamUrlError }}</span>
        <span v-else class="duel-tournament-dialog__hint">
          Twitch, YouTube чи інша платформа — кнопка стріму з’явиться на сторінці турніру.
        </span>
      </label>

      <DuelTournamentPrizesEditor v-model="prizes" :can-use-vip="isAdmin" :show-errors="showErrors" />
    </form>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ isEdit ? 'Зберегти' : 'Створити турнір' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhBroadcast, PhShuffle } from '@phosphor-icons/vue'
import { duelsService } from '@/views/duels/duels.service'
import DuelTournamentPrizesEditor from '@/views/duels/components/DuelTournamentPrizesEditor.vue'
import {
  DUEL_RATING_DELTA,
  duelPrizeDraftError,
  duelPrizeDraftsFrom,
  duelPrizeDraftToInput,
  DUEL_TOURNAMENT_NAME_MAX,
  DUEL_TOURNAMENT_NAME_MIN,
  DUEL_TOURNAMENT_PASSWORD_MAX,
  DUEL_TOURNAMENT_PASSWORD_MIN,
  DUEL_TOURNAMENT_STREAM_URL_MAX,
  duelStreamUrlError,
  generateDuelTournamentPassword
} from '@/views/duels/duels.utils'
import type { TDuelTournament } from '@/api/types/api.types'

const props = defineProps<{
  /** Є — редагування (назва, пароль і призи цього турніру); немає — створення. */
  tournament?: TDuelTournament | null
  onSaved?: (tournament: TDuelTournament) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const isEdit = computed(() => !!props.tournament)
/** VIP-призи призначає лише адмін — бекенд перевіряє те саме. */
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin.isAdmin)

const name = ref('')
const password = ref('')
const streamUrl = ref('')
const prizes = ref<TDuelPrizeDraft[]>([])
const saving = ref(false)
const showErrors = ref(false)

const nameError = computed(() => {
  const value = name.value.trim()
  if (value.length < DUEL_TOURNAMENT_NAME_MIN) return `Назва — щонайменше ${DUEL_TOURNAMENT_NAME_MIN} символи`
  return ''
})

const passwordError = computed(() => {
  const value = password.value.trim()
  if (value.length < DUEL_TOURNAMENT_PASSWORD_MIN) return `Пароль — щонайменше ${DUEL_TOURNAMENT_PASSWORD_MIN} символи`
  return ''
})

const streamUrlError = computed(() => duelStreamUrlError(streamUrl.value))

/** Модалку монтують уже відкритою — `@open` у el-dialog тоді не спрацьовує, тож заповнюємо поля за `modelValue`. */
watch(modelValue, (open) => {
  if (!open) return
  showErrors.value = false
  name.value = props.tournament?.name ?? ''
  password.value = props.tournament?.password ?? generateDuelTournamentPassword()
  streamUrl.value = props.tournament?.streamUrl ?? ''
  prizes.value = duelPrizeDraftsFrom(props.tournament?.prizes)
}, { immediate: true })

const prizesError = computed(() => prizes.value.some(p => duelPrizeDraftError(p, prizes.value)))

async function submit () {
  showErrors.value = true
  if (nameError.value || passwordError.value || streamUrlError.value || prizesError.value || saving.value) return
  saving.value = true
  try {
    const dto = {
      name: name.value.trim(),
      password: password.value.trim(),
      // null на редагуванні прибирає посилання
      streamUrl: streamUrl.value.trim() || null,
      prizes: [...prizes.value].sort((a, b) => a.place - b.place).map(duelPrizeDraftToInput)
    }
    const saved = props.tournament
      ? await duelsService.updateTournament(props.tournament.id, dto)
      : await duelsService.createTournament(dto)
    props.onSaved?.(saved)
    modelValue.value = false
  } catch {
    // тост уже показав duelsService
  } finally {
    saving.value = false
  }
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.duel-tournament-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  // Призів може бути до 10 — тіло прокручується, шапка й кнопки лишаються на місці.
  .el-dialog__body {
    max-height: calc(100dvh - 220px);
    overflow-y: auto;
  }

  .duel-tournament-dialog__title {
    font-family: var(--ds-font-display);
    font-size: 20px;
    line-height: 1.2;
    color: var(--ds-text-strong);
  }

  .duel-tournament-dialog__text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }

  .duel-tournament-dialog__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ds-text-muted);
  }

  .duel-tournament-dialog__hint {
    font-size: 12px;
    color: var(--ds-text-faint);
  }

  .duel-tournament-dialog__error {
    font-size: 12px;
    color: var(--el-color-danger);
  }
}
</style>
