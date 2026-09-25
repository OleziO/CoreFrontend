<template>
  <el-drawer
    v-model="showCreateTournamentDrawer"
    direction="rtl"
    :size="580"
    class="create-tournament-drawer"
    destroy-on-close
    :close-on-click-modal="true"
  >
    <template #header>
      <div class="td-head">
        <span class="sys-label !text-[9px]">// {{ isEditMode ? 'Редагування' : 'Новий турнір' }}</span>
        <h2 id="drawer-title" class="td-head__title">
          {{ isEditMode ? 'Редагувати турнір' : 'Додати турнір' }}
        </h2>
        <p class="td-head__meta">
          Обовʼязкові поля позначено зірочкою. Зображення можна додати зараз або пізніше в картці турніру.
        </p>
      </div>
    </template>

    <el-config-provider :locale="elementPlusUk">
      <div class="custom-scroll td-scroll h-full overflow-y-auto">
        <el-form
          :model="form"
          label-position="top"
          require-asterisk-position="right"
          class="td-form"
          @submit.prevent="handleSubmit"
        >
          <!-- 01 · Основне -->
          <section class="td-section hud-panel">
            <header class="td-section__head">
              <span class="td-section__index">01</span>
              <span class="td-section__icon"><PhSlidersHorizontal :size="14" weight="bold" /></span>
              <span class="td-section__title">Основне</span>
            </header>
            <div class="td-section__body">
              <el-form-item label="Назва" required class="td-field">
                <el-input
                  v-model="form.name"
                  placeholder="Напр., Core League Cup #12"
                  size="large"
                  clearable
                />
              </el-form-item>

              <el-form-item label="Статус турніру" required class="td-field">
                <el-select v-model="form.tournamentStatus" size="large" class="w-full">
                  <el-option
                    v-for="s in statusOptions"
                    :key="s.key"
                    :value="s.key"
                    :label="tournamentStatusLabelMap[s.key]"
                  >
                    <div class="flex items-center gap-8 py-1">
                      <span class="td-status-dot" :class="statusDotClass[s.key]" />
                      <span>{{ tournamentStatusLabelMap[s.key] }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <!-- Кваліфікація — опція-рядок -->
              <label class="td-option" :class="{ 'is-on': form.hasQualification, 'is-locked': isEditMode }">
                <span class="td-option__icon"><PhFlagCheckered :size="16" weight="bold" /></span>
                <span class="td-option__text">
                  <span class="td-option__title">Кваліфікаційний етап</span>
                  <span class="td-option__desc">
                    <template v-if="isEditMode">
                      Етап зафіксовано при створенні турніру й змінити його не можна.
                    </template>
                    <template v-else-if="form.hasQualification">
                      Турнір проходить через кваліфікацію перед плей-оф.
                    </template>
                    <template v-else>
                      Без кваліфікації: команди з реєстрації потрапляють одразу в сітку.
                    </template>
                  </span>
                </span>
                <el-switch
                  v-model="form.hasQualification"
                  :disabled="isEditMode"
                  class="td-option__switch"
                  aria-label="Кваліфікаційний етап"
                />
              </label>
            </div>
          </section>

          <!-- 02 · Формат -->
          <section class="td-section hud-panel">
            <header class="td-section__head">
              <span class="td-section__index">02</span>
              <span class="td-section__icon td-section__icon--pink"><PhTreeStructure :size="14" weight="bold" /></span>
              <span class="td-section__title">Формат сітки</span>
              <span v-if="isBracketLocked" class="td-locked" title="Плей-оф уже стартував">
                <PhLockSimple :size="9" weight="bold" /> Зафіксовано
              </span>
            </header>
            <div class="td-section__body">
              <!-- Single / Double elimination -->
              <div class="td-field td-field--plain">
                <span class="td-label">Тип вибування</span>
                <div class="td-seg" role="radiogroup" aria-label="Тип вибування">
                  <button
                    v-for="opt in bracketOptions"
                    :key="opt.value"
                    type="button"
                    role="radio"
                    class="td-seg__opt"
                    :class="{ 'is-active': form.bracketType === opt.value }"
                    :aria-checked="form.bracketType === opt.value"
                    :disabled="isBracketLocked"
                    @click="form.bracketType = opt.value"
                  >
                    <span class="td-seg__icon"><component :is="opt.icon" :size="16" weight="bold" /></span>
                    <span class="td-seg__text">
                      <span class="td-seg__title">{{ opt.label }}</span>
                      <span class="td-seg__desc">{{ opt.desc }}</span>
                    </span>
                  </button>
                </div>
              </div>

              <!-- Матч за третє місце: лише Single elimination, у Double бронзу визначає фінал нижньої сітки -->
              <label
                class="td-option td-option--gold"
                :class="{ 'is-on': form.hasThirdPlaceMatch, 'is-locked': !canToggleThirdPlace }"
              >
                <span class="td-option__icon"><PhMedal :size="16" weight="bold" /></span>
                <span class="td-option__text">
                  <span class="td-option__title">Матч за третє місце</span>
                  <span class="td-option__desc">
                    <template v-if="!isSingleElimination">
                      У Double elimination третє місце визначає фінал нижньої сітки — окремий матч не потрібен.
                    </template>
                    <template v-else-if="form.hasThirdPlaceMatch">
                      Переможені у півфіналах зіграють додатковий матч за бронзу.
                    </template>
                    <template v-else>
                      Без матчу за бронзу: обидва півфіналісти отримують 3–4 місце.
                    </template>
                  </span>
                </span>
                <el-switch
                  v-model="form.hasThirdPlaceMatch"
                  :disabled="!canToggleThirdPlace"
                  class="td-option__switch"
                  aria-label="Матч за третє місце"
                />
              </label>

              <!-- Формат фіналів: BO1 / BO3 / BO5 на кожен фінальний слот -->
              <div class="td-field td-field--plain">
                <span class="td-label">
                  Формат фіналів <span class="td-label__opt">решта раундів — BO1</span>
                </span>
                <div class="td-bo">
                  <div v-for="row in finalsRows" :key="row.key" class="td-bo__row">
                    <span class="td-bo__text">
                      <span class="td-bo__title">{{ row.label }}</span>
                      <span class="td-bo__desc">{{ row.desc }}</span>
                    </span>
                    <div class="td-bo__seg" role="radiogroup" :aria-label="`Формат: ${row.label}`">
                      <button
                        v-for="bo in BEST_OF_OPTIONS"
                        :key="bo"
                        type="button"
                        role="radio"
                        class="td-bo__opt"
                        :class="{ 'is-active': form[row.key] === bo }"
                        :aria-checked="form[row.key] === bo"
                        :disabled="isBracketLocked"
                        @click="form[row.key] = bo"
                      >
                        BO{{ bo }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="isBracketLocked" class="td-note td-note--warn">
                <PhLockSimple :size="12" weight="bold" class="shrink-0" />
                Плей-оф уже стартував — формат сітки, матч за третє місце та формат фіналів змінити не можна.
              </p>
            </div>
          </section>

          <!-- 03 · Параметри -->
          <section class="td-section hud-panel">
            <header class="td-section__head">
              <span class="td-section__index">03</span>
              <span class="td-section__icon td-section__icon--gold"><PhTrophy :size="14" weight="bold" /></span>
              <span class="td-section__title">Параметри</span>
            </header>
            <div class="td-section__body">
              <div class="td-pair">
                <el-form-item class="td-field">
                  <template #label>
                    <span>Призовий фонд <span class="td-label__opt">опціонально</span></span>
                  </template>
                  <el-input
                    v-model="prizePoolText"
                    inputmode="numeric"
                    placeholder="5000"
                    size="large"
                    class="td-num"
                    @input="prizePoolText = String($event).replace(/\D+/g, '')"
                  >
                    <template #prefix>
                      <span class="td-affix">₴</span>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item class="td-field">
                  <template #label>
                    <span>Слоти команд <span class="td-label__opt">порожньо — без ліміту</span></span>
                  </template>
                  <el-input
                    v-model="slotsText"
                    inputmode="numeric"
                    placeholder="16"
                    size="large"
                    class="td-num"
                    @input="slotsText = String($event).replace(/\D+/g, '')"
                  >
                    <template #suffix>
                      <span class="td-affix"><PhUsersThree :size="13" weight="bold" /></span>
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <!-- Ліга в клієнті Dota 2 (league_id) — турнір і його матчі дзеркалюються туди -->
              <el-form-item class="td-field">
                <template #label>
                  <span>Dota 2 League ID <span class="td-label__opt">опціонально</span></span>
                </template>
                <el-input
                  v-model="dotaLeagueIdText"
                  inputmode="numeric"
                  placeholder="17588"
                  size="large"
                  class="td-num"
                  clearable
                  @input="dotaLeagueIdText = String($event).replace(/\D+/g, '')"
                >
                  <template #prefix>
                    <span class="td-affix">ID</span>
                  </template>
                </el-input>
              </el-form-item>

              <!-- Внесок: вводиться З ГРАВЦЯ, квиток команди рахується автоматично -->
              <div class="td-fee">
                <el-form-item class="td-field td-fee__input">
                  <template #label>
                    <span>Внесок з гравця <span class="td-label__opt">0 або порожньо — безкоштовно</span></span>
                  </template>
                  <el-input
                    v-model="feePerPlayerText"
                    inputmode="numeric"
                    placeholder="200"
                    size="large"
                    class="td-num"
                    @input="feePerPlayerText = String($event).replace(/\D+/g, '')"
                  >
                    <template #prefix>
                      <span class="td-affix">₴</span>
                    </template>
                    <template #suffix>
                      <span class="td-affix">/ гравець</span>
                    </template>
                  </el-input>
                </el-form-item>

                <div class="td-ticket" :class="{ 'is-free': teamTicketUah === 0 }" aria-live="polite">
                  <span class="td-ticket__label">
                    <span class="td-ticket__icon"><PhTicket :size="13" weight="bold" /></span>
                    <span class="flex flex-col gap-3">
                      <span>Квиток команди</span>
                      <span class="td-ticket__sub">сплачує капітан</span>
                    </span>
                  </span>
                  <span class="td-ticket__amount">
                    <template v-if="teamTicketUah > 0">
                      <span class="td-ticket__value">{{ formatUah(teamTicketUah) }} ₴</span>
                      <span class="td-ticket__formula">
                        {{ TEAM_SIZE }} × {{ formatUah(Number(feePerPlayerText)) }} ₴
                      </span>
                    </template>
                    <template v-else>
                      <span class="td-ticket__value">Безкоштовно</span>
                      <span class="td-ticket__formula">внесок не стягується</span>
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- 04 · Графік -->
          <section class="td-section hud-panel">
            <header class="td-section__head">
              <span class="td-section__index">04</span>
              <span class="td-section__icon td-section__icon--sky"><PhCalendar :size="14" weight="bold" /></span>
              <span class="td-section__title">Графік</span>
            </header>
            <div class="td-section__body">
              <p class="td-note mt-0">
                <template v-if="form.hasQualification">
                  Три етапи. Реєстрація може перетинатися з кваліфікацією, але кваліфікація має
                  завершитися до старту плей-оф.
                </template>
                <template v-else>
                  Два етапи: реєстрація, потім плей-оф.
                </template>
              </p>

              <div class="td-phases">
                <div
                  v-for="(group, index) in visibleScheduleGroups"
                  :key="group.title"
                  class="td-phase"
                >
                  <div class="td-phase__head">
                    <span class="td-phase__index">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span class="td-phase__title">{{ group.title }}</span>
                    <span class="td-phase__line" aria-hidden="true" />
                  </div>
                  <p class="td-phase__hint">{{ group.hint }}</p>
                  <div class="td-pair">
                    <el-form-item
                      v-for="field in group.fields"
                      :key="field.key"
                      :label="field.label"
                      required
                      class="td-field"
                    >
                      <el-date-picker
                        v-model="form[field.key]"
                        type="datetime"
                        size="large"
                        class="td-date w-full"
                        popper-class="core-date-picker-popper"
                        format="DD.MM.YYYY HH:mm"
                        value-format="YYYY-MM-DD HH:mm"
                        placeholder="Оберіть дату й час"
                      />
                    </el-form-item>
                  </div>
                </div>
              </div>

              <p v-if="scheduleError" class="td-error">
                <PhWarningCircle :size="14" weight="fill" class="shrink-0" />
                <span>{{ scheduleError }}</span>
              </p>
            </div>
          </section>

          <!-- 05 · Зображення -->
          <section class="td-section hud-panel">
            <header class="td-section__head">
              <span class="td-section__index">05</span>
              <span class="td-section__icon td-section__icon--violet"><PhImageSquare :size="14" weight="bold" /></span>
              <span class="td-section__title">Зображення</span>
            </header>
            <div class="td-section__body">
              <p class="td-note mt-0">
                Завантажуються окремими запитами одразу після збереження. JPEG, PNG або WebP, до 10&nbsp;МБ.
                Розміри нижче — рекомендовані для чіткого вигляду без розмиття.
              </p>
              <div class="td-uploads">
                <div v-for="u in uploads" :key="u.key" class="td-field td-field--plain">
                  <span class="td-label">{{ u.label }} <span class="td-label__opt">{{ u.size }}</span></span>
                  <!-- Як у TeamCreateModal: el-upload без нативної кнопки; превʼю — прямокутник на всю ширину -->
                  <el-upload
                    class="td-upload block w-full"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    :on-change="(file: UploadFile) => handleBannerPick(u.key, file)"
                  >
                    <div v-if="!previews[u.key]" class="td-drop">
                      <span class="td-drop__plus"><PhPlus :size="16" weight="bold" /></span>
                      <span class="flex flex-col items-start gap-4">
                        <span class="td-drop__text">Обрати зображення</span>
                        <span class="td-drop__hint">{{ u.size }} · {{ u.hint }}</span>
                      </span>
                    </div>
                    <div v-else class="td-drop td-drop--filled">
                      <img :src="previews[u.key]" alt="" class="td-drop__img">
                      <span class="td-drop__edit" aria-hidden="true">
                        <PhPencilSimple :size="14" weight="bold" /> Замінити
                      </span>
                    </div>
                  </el-upload>
                </div>
              </div>
            </div>
          </section>
        </el-form>
      </div>
    </el-config-provider>

    <!-- Footer slot (outside the scroll area) — the same hairline foot as dialogs. -->
    <template #footer>
      <div class="td-foot">
        <el-button
          :disabled="!isFormValid"
          :loading="loading"
          type="primary"
          class="shrink-0"
          @click="handleSubmit"
        >
          <PhCheck v-if="!loading" :size="16" weight="bold" class="mr-8 shrink-0" />
          {{ isEditMode ? 'Зберегти зміни' : 'Створити турнір' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import uk from 'element-plus/es/locale/lang/uk'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import {
  PhCalendar, PhCheck, PhFlagCheckered, PhImageSquare, PhLockSimple, PhMedal, PhPencilSimple, PhPlus,
  PhSlidersHorizontal, PhTicket, PhTreeStructure, PhGitFork, PhTrophy, PhUsersThree, PhWarningCircle
} from '@phosphor-icons/vue'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { UPLOAD_ERROR, validateImageFileForUpload } from '@/services/image-upload.service'
import {
  tournamentCreateStatusOptions,
  tournamentStatusLabelMap,
  type TTournamentStatusValue
} from '@/components/tournaments-tags/tournament.constants'
import { getImageUrl } from '@/core/helpers'
import { getScheduleViolation, type TTournamentScheduleForm } from '@/core/utils/tournament-schedule'
import type {
  TCreateTournamentDto as CreateTournamentDto,
  TUpdateTournamentDto as UpdateTournamentDto,
  TPlayoffBestOf,
  TTournamentBracketType
} from '@/api/types/api.types'

type TUploadKey = 'header' | 'list'
/** Поля форми з довжиною серії — по одному на фінальний слот сітки. */
type TBestOfKey = 'upperBracketFinalBestOf' | 'lowerBracketFinalBestOf' | 'grandFinalBestOf'

/** Склад команди в Dota 2 — квиток команди = внесок з гравця × TEAM_SIZE. */
const TEAM_SIZE = 5

const props = defineProps<{ tournament?: TTournament | null }>()
const showCreateTournamentDrawer = defineModel<boolean>()
const isEditMode = computed(() => !!props.tournament)
const loading = ref(false)

const tournamentStore = useTournamentStore()

const elementPlusUk = uk

const prizePoolText = ref('')
const slotsText = ref('')
/** ID ліги в клієнті Dota 2 — числовий рядок, у payload іде як number. */
const dotaLeagueIdText = ref('')
/**
 * Внесок вводиться З ГРАВЦЯ в гривнях. У контракті `entryFee` — квиток за
 * команду в копійках, тож у payload іде `× TEAM_SIZE × 100`.
 */
const feePerPlayerText = ref('')

const uahFormat = new Intl.NumberFormat('uk-UA')

function formatUah (value: number): string {
  return uahFormat.format(value)
}

/** Квиток команди в гривнях — те, що реально сплачує капітан. */
const teamTicketUah = computed(() => {
  if (feePerPlayerText.value === '') return 0
  return Number(feePerPlayerText.value) * TEAM_SIZE
})

const files = reactive<Record<TUploadKey, File | null>>({
  header: null,
  list: null
})

const previews = reactive<Record<TUploadKey, string>>({
  header: '',
  list: ''
})

/**
 * Рекомендовані розміри (px) — під реальні контейнери: шапка турніру розтягується
 * на всю ширину сторінки при висоті 600px (≈3:1), картка в списку — 16:9.
 */
const uploads: { key: TUploadKey; label: string; size: string; hint: string }[] = [
  { key: 'header', label: 'Банер у шапці', size: '1920 × 640 px', hint: 'на всю ширину, важливе — по центру' },
  { key: 'list', label: 'Банер у списку', size: '1280 × 720 px', hint: '16:9, картка в списку турнірів' }
]

const statusDotClass: Record<TTournamentStatusValue, string> = {
  REGISTRATION: 'td-status-dot--registration',
  QUALIFICATIONS: 'td-status-dot--qualifications',
  PLAYOFF: 'td-status-dot--playoff'
}

const bracketOptions: { value: TTournamentBracketType; label: string; desc: string; icon: Component }[] = [
  { value: 'SINGLE_ELIMINATION', label: 'Single elimination', desc: 'Одна поразка — виліт', icon: PhTreeStructure },
  { value: 'DOUBLE_ELIMINATION', label: 'Double elimination', desc: 'Верхня та нижня сітки', icon: PhGitFork }
]

const BEST_OF_OPTIONS: readonly TPlayoffBestOf[] = [1, 3, 5]

/** Дефолти бекенду: Double elimination, без матчу за бронзу, усі фінали BO3. */
const DEFAULT_BRACKET_TYPE: TTournamentBracketType = 'DOUBLE_ELIMINATION'
const DEFAULT_BEST_OF: TPlayoffBestOf = 3

type TFinalsRow = {
  key: TBestOfKey
  label: string
  desc: string
  /** Слот існує лише у Double elimination. */
  doubleOnly?: boolean
}

const FINALS_ROWS: TFinalsRow[] = [
  {
    key: 'upperBracketFinalBestOf',
    label: 'Фінал верхньої сітки',
    desc: 'Переможець іде у гранд-фінал, переможений — у фінал нижньої.',
    doubleOnly: true
  },
  {
    key: 'lowerBracketFinalBestOf',
    label: 'Фінал нижньої сітки',
    desc: 'Переможець іде у гранд-фінал, переможений — третє місце.',
    doubleOnly: true
  },
  { key: 'grandFinalBestOf', label: 'Гранд-фінал', desc: 'Вирішальна серія турніру.' }
]

const form = reactive({
  name: '',
  tournamentStatus: 'REGISTRATION' as CreateTournamentDto['tournamentStatus'],
  hasQualification: true,
  bracketType: DEFAULT_BRACKET_TYPE as TTournamentBracketType,
  hasThirdPlaceMatch: false,
  upperBracketFinalBestOf: DEFAULT_BEST_OF as TPlayoffBestOf,
  lowerBracketFinalBestOf: DEFAULT_BEST_OF as TPlayoffBestOf,
  grandFinalBestOf: DEFAULT_BEST_OF as TPlayoffBestOf,
  registrationStartsAt: '',
  registrationEndsAt: '',
  qualificationStartsAt: '',
  qualificationEndsAt: '',
  tournamentStartsAt: '',
  tournamentEndsAt: ''
})

type TScheduleKey = keyof TTournamentScheduleForm

type TScheduleGroup = {
  title: string
  hint: string
  /** Група кваліфікації зникає, коли етап вимкнено. */
  requiresQualification?: boolean
  fields: { key: TScheduleKey; label: string }[]
}

/**
 * Вікна розкладу. Плей-оф лишається під історичними ключами
 * `tournamentStartsAt`/`tournamentEndsAt` — так їх називає контракт API.
 */
const SCHEDULE_GROUPS: TScheduleGroup[] = [
  {
    title: 'Реєстрація',
    hint: 'Коли капітани можуть подати команду й сплатити внесок.',
    fields: [
      { key: 'registrationStartsAt', label: 'Початок реєстрації' },
      { key: 'registrationEndsAt', label: 'Кінець реєстрації' }
    ]
  },
  {
    title: 'Кваліфікація',
    hint: 'Вікно подачі кваліфікаційних матчів. Може перетинатися з реєстрацією.',
    requiresQualification: true,
    fields: [
      { key: 'qualificationStartsAt', label: 'Початок кваліфікації' },
      { key: 'qualificationEndsAt', label: 'Кінець кваліфікації' }
    ]
  },
  {
    title: 'Плей-оф',
    hint: 'Сітка стартує автоматично о «Початок плей-оф».',
    fields: [
      { key: 'tournamentStartsAt', label: 'Початок плей-оф' },
      { key: 'tournamentEndsAt', label: 'Кінець плей-оф' }
    ]
  }
]

/** Усі ключі розкладу — для заповнення й очищення форми, незалежно від видимості. */
const ALL_SCHEDULE_KEYS: TScheduleKey[] = SCHEDULE_GROUPS.flatMap(g => g.fields.map(f => f.key))

const visibleScheduleGroups = computed(() =>
  SCHEDULE_GROUPS.filter(g => form.hasQualification || !g.requiresQualification)
)

/** Обовʼязкові до заповнення дати — лише з видимих груп. */
const requiredScheduleKeys = computed<TScheduleKey[]>(() =>
  visibleScheduleGroups.value.flatMap(g => g.fields.map(f => f.key))
)

/** Без кваліфікації статус «Кваліфікація» недосяжний — турнір іде одразу в плей-оф. */
const statusOptions = computed(() =>
  tournamentCreateStatusOptions.filter(o => form.hasQualification || o.key !== 'QUALIFICATIONS')
)

const isSingleElimination = computed(() => form.bracketType === 'SINGLE_ELIMINATION')

/** Бекенд дозволяє міняти формат сітки лише доки не стартував плей-оф. */
const isBracketLocked = computed(() => {
  const status = props.tournament?.tournamentStatus
  return isEditMode.value && (status === 'PLAYOFF' || status === 'COMPLETED')
})

/** Матч за бронзу існує лише в Single elimination — у Double його замінює фінал нижньої сітки. */
const canToggleThirdPlace = computed(() => isSingleElimination.value && !isBracketLocked.value)

/**
 * У Single elimination є тільки один фінал — рядок гранд-фіналу підписуємо як
 * «Фінал». Приховані слоти лишаються у формі й ідуть у payload зі своїм
 * значенням: поля у DTO обовʼязкові, бекенд їх просто не використовує.
 */
const finalsRows = computed<TFinalsRow[]>(() =>
  FINALS_ROWS
    .filter(row => !row.doubleOnly || !isSingleElimination.value)
    .map(row => (
      row.key === 'grandFinalBestOf' && isSingleElimination.value
        ? { ...row, label: 'Фінал', desc: 'Єдина серія довша за BO1 у Single elimination.' }
        : row
    ))
)

/** Бекенд відхиляє hasThirdPlaceMatch=true для Double elimination — скидаємо одразу. */
watch(() => form.bracketType, (type) => {
  if (type === 'DOUBLE_ELIMINATION') form.hasThirdPlaceMatch = false
})

/** Порушення послідовності етапів; дзеркалить перевірку бекенду. */
const scheduleError = computed(() => getScheduleViolation(form))

const missingDates = computed(() => requiredScheduleKeys.value.some(key => form[key] === ''))

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
    !missingDates.value &&
    scheduleError.value === null
)

/**
 * Вимкнена кваліфікація не має лишати по собі ні дат, ні статусу: інакше
 * прихована дата поїхала б у payload, а статус суперечив би конфігурації.
 */
watch(() => form.hasQualification, (enabled) => {
  if (enabled) return
  form.qualificationStartsAt = ''
  form.qualificationEndsAt = ''
  if (form.tournamentStatus === 'QUALIFICATIONS') form.tournamentStatus = 'REGISTRATION'
})

function syncDayjsUk () {
  dayjs.locale('uk')
}

function translateUploadErr (msg: string) {
  if (msg === UPLOAD_ERROR.notImage) return 'Дозволені лише файли зображень'
  if (msg === UPLOAD_ERROR.tooLarge) return 'Файл завеликий (максимум 10 МБ)'
  if (msg === UPLOAD_ERROR.network) return 'Не вдалося завантажити зображення, спробуйте ще раз'
  return msg
}

function ingestImageFile (key: TUploadKey, raw: File) {
  const v = validateImageFileForUpload(raw)
  if (v !== null) {
    ElMessage.error(translateUploadErr(v))
    return
  }
  if (previews[key]) URL.revokeObjectURL(previews[key])
  files[key] = raw
  previews[key] = URL.createObjectURL(raw)
}

function handleBannerPick (key: TUploadKey, uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  ingestImageFile(key, raw)
}

/** Захист від нетипових значень з API: усе, що не 1 | 3 | 5, стає дефолтом BO3. */
function toBestOf (value: unknown): TPlayoffBestOf {
  return BEST_OF_OPTIONS.find(bo => bo === value) ?? DEFAULT_BEST_OF
}

function populateFromTournament (t: TTournament) {
  form.name = t.name ?? ''
  form.hasQualification = t.hasQualification !== false
  form.bracketType = t.bracketType ?? DEFAULT_BRACKET_TYPE
  form.hasThirdPlaceMatch = form.bracketType === 'SINGLE_ELIMINATION' && t.hasThirdPlaceMatch === true
  form.upperBracketFinalBestOf = toBestOf(t.upperBracketFinalBestOf)
  form.lowerBracketFinalBestOf = toBestOf(t.lowerBracketFinalBestOf)
  form.grandFinalBestOf = toBestOf(t.grandFinalBestOf)
  const editableStatuses: TTournamentStatusValue[] = ['REGISTRATION', 'QUALIFICATIONS', 'PLAYOFF']
  form.tournamentStatus = editableStatuses.includes(t.tournamentStatus as TTournamentStatusValue)
    ? (t.tournamentStatus as TTournamentStatusValue)
    : 'REGISTRATION'
  for (const key of ALL_SCHEDULE_KEYS) {
    const iso = t[key]
    form[key] = iso ? dayjs(iso).format('YYYY-MM-DD HH:mm') : ''
  }
  prizePoolText.value = t.prizePool != null ? String(t.prizePool) : ''
  slotsText.value = t.tournamentSlots != null ? String(t.tournamentSlots) : ''
  dotaLeagueIdText.value = t.dotaLeagueId != null ? String(t.dotaLeagueId) : ''
  // Копійки за команду → гривні з гравця.
  feePerPlayerText.value = t.entryFee != null && t.entryFee > 0
    ? String(Math.round(t.entryFee / 100 / TEAM_SIZE))
    : ''
  previews.header = t.headerBannerUrl ? getImageUrl(t.headerBannerUrl) : ''
  previews.list = t.listBannerUrl ? getImageUrl(t.listBannerUrl) : ''
}

function clearData () {
  form.name = ''
  form.tournamentStatus = 'REGISTRATION'
  form.hasQualification = true
  form.bracketType = DEFAULT_BRACKET_TYPE
  form.hasThirdPlaceMatch = false
  form.upperBracketFinalBestOf = DEFAULT_BEST_OF
  form.lowerBracketFinalBestOf = DEFAULT_BEST_OF
  form.grandFinalBestOf = DEFAULT_BEST_OF
  for (const key of ALL_SCHEDULE_KEYS) form[key] = ''
  prizePoolText.value = ''
  slotsText.value = ''
  dotaLeagueIdText.value = ''
  feePerPlayerText.value = ''
  for (const k of Object.keys(files) as TUploadKey[]) {
    if (previews[k] && previews[k].startsWith('blob:')) URL.revokeObjectURL(previews[k])
    files[k] = null
    previews[k] = ''
  }
}

watch(showCreateTournamentDrawer, (isOpen) => {
  if (isOpen) {
    syncDayjsUk()
    if (props.tournament) populateFromTournament(props.tournament)
  } else {
    clearData()
  }
})

function toIsoUtc (pickerValue: string): string {
  return dayjs(pickerValue, 'YYYY-MM-DD HH:mm').toISOString()
}

/**
 * Ліга Dota 2 іде в payload лише коли заповнена. При редагуванні очищене поле
 * відв'язує лігу (null), але тільки якщо вона була — інакше ключ не передається.
 */
function dotaLeagueIdPayload (): { dotaLeagueId?: number | null } {
  if (dotaLeagueIdText.value !== '') return { dotaLeagueId: Number(dotaLeagueIdText.value) }
  if (isEditMode.value && props.tournament?.dotaLeagueId != null) return { dotaLeagueId: null }
  return {}
}

const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) return

  const basePayload = {
    name: form.name.trim(),
    tournamentStatus: form.tournamentStatus,
    registrationStartsAt: toIsoUtc(form.registrationStartsAt),
    registrationEndsAt: toIsoUtc(form.registrationEndsAt),
    // Без кваліфікації дати етапу не передаються — бекенд тримає їх null.
    ...(form.hasQualification && {
      qualificationStartsAt: toIsoUtc(form.qualificationStartsAt),
      qualificationEndsAt: toIsoUtc(form.qualificationEndsAt)
    }),
    tournamentStartsAt: toIsoUtc(form.tournamentStartsAt),
    tournamentEndsAt: toIsoUtc(form.tournamentEndsAt),
    ...(prizePoolText.value !== '' && { prizePool: Number(prizePoolText.value) }),
    ...(slotsText.value !== '' && { tournamentSlots: Number(slotsText.value) }),
    ...dotaLeagueIdPayload(),
    // Гривні з гравця → квиток команди в копійках. Порожнє поле — безкоштовний турнір (0).
    entryFee: teamTicketUah.value * 100,
    // Формат сітки. У Single elimination верхній/нижній best-of бекенд ігнорує, але поля обовʼязкові.
    bracketType: form.bracketType,
    hasThirdPlaceMatch: form.bracketType === 'SINGLE_ELIMINATION' && form.hasThirdPlaceMatch,
    upperBracketFinalBestOf: form.upperBracketFinalBestOf,
    lowerBracketFinalBestOf: form.lowerBracketFinalBestOf,
    grandFinalBestOf: form.grandFinalBestOf
  }

  loading.value = true
  try {
    /**
     * `hasQualification` існує лише в контракті створення: етап фіксується при
     * створенні, а PATCH із цим полем бекенд відхилить (forbidNonWhitelisted).
     */
    const saved = isEditMode.value && props.tournament
      ? await tournamentStore.updateTournament(props.tournament.id, basePayload satisfies UpdateTournamentDto)
      : await tournamentStore.createTournament(
        { ...basePayload, hasQualification: form.hasQualification } satisfies CreateTournamentDto
      )
    const id = saved.id

    try {
      if (files.header) await tournamentsService.uploadHeaderBanner(id, files.header)
      if (files.list) await tournamentsService.uploadListBanner(id, files.list)
    } catch (up: unknown) {
      const um = up instanceof Error ? up.message : String(up)
      const action = isEditMode.value ? 'оновлено' : 'створено'
      ElMessage.warning(`Турнір ${action}, але зображення не завантажились: ${translateUploadErr(um)}`)
      showCreateTournamentDrawer.value = false
      clearData()
      return
    }

    ElMessage.success(isEditMode.value ? 'Турнір успішно оновлено' : 'Турнір успішно створено')
    showCreateTournamentDrawer.value = false
  } catch (e: unknown) {
    const action = isEditMode.value ? 'оновленні' : 'створенні'
    ElMessage.error(getApiErrorMessage(e, `Помилка при ${action} турніру`))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
// ─── Head ───────────────────────────────────────────────────────────────────
.td-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 8px;
}

.td-head__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 22px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
}

.td-head__meta {
  margin: 2px 0 0;
  max-width: 26rem;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

// ─── Scroll + form ──────────────────────────────────────────────────────────
.td-scroll {
  padding: 4px 6px 0 0;
}

.td-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ─── Section ────────────────────────────────────────────────────────────────
.td-section {
  border-radius: 12px;
  overflow: hidden;
}

.td-section__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.1);
}

.td-section__index {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--ds-primary);
  font-variant-numeric: tabular-nums;
}

.td-section__icon {
  --td-icon-rgb: var(--ds-primary-rgb);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: rgb(var(--td-icon-rgb));
  background: rgba(var(--td-icon-rgb), 0.1);
  box-shadow: inset 0 0 0 1px rgba(var(--td-icon-rgb), 0.3);

  &--pink { --td-icon-rgb: var(--ds-pink-rgb); }
  &--gold { --td-icon-rgb: var(--ds-gold-rgb); }
  &--sky { --td-icon-rgb: 56, 189, 248; }
  &--violet { --td-icon-rgb: var(--ds-secondary-rgb); }
}

.td-section__title {
  font-family: var(--ds-font-display);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
}

.td-locked {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  height: 18px;
  padding: 0 7px;
  border-radius: 4px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.1);
  font-family: var(--ds-font-mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-gold);
  cursor: help;
}

.td-section__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

// ─── Fields ─────────────────────────────────────────────────────────────────
.td-field {
  margin-bottom: 0 !important;

  :deep(.el-form-item__label) {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 0;
    line-height: 1.25;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    line-height: normal;
  }

  :deep(.el-form-item__error) {
    position: static;
    font-size: 11px;
    line-height: 1.4;
  }
}

// Plain field (no el-form-item): the same label register.
.td-field--plain {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.td-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.25;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.td-label__opt {
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: none;
  color: rgba(255, 255, 255, 0.3);
}

.td-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

@media (max-width: 520px) {
  .td-pair {
    grid-template-columns: 1fr;
  }
}

// Numeric inputs: mono tabular digits.
.td-num :deep(.el-input__inner) {
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.td-affix {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.td-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-faint);

  &--warn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(var(--ds-gold-rgb), 0.25);
    background: rgba(var(--ds-gold-rgb), 0.06);
    color: rgba(255, 255, 255, 0.7);

    svg { color: var(--ds-gold); }
  }
}

.td-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  font-size: 12px;
  line-height: 1.5;
  color: #fca5a5;
}

// Status dot in the select options.
.td-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;

  &--registration { background: var(--ds-primary); box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7); }
  &--qualifications { background: var(--ds-success); box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
  &--playoff { background: var(--ds-pink); box-shadow: 0 0 8px rgba(var(--ds-pink-rgb), 0.6); }
}

// ─── Option row (icon tile + title + description + switch) ─────────────────
.td-option {
  --td-opt-rgb: var(--ds-primary-rgb);

  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(7, 8, 15, 0.35);
  cursor: pointer;
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease;

  &--gold {
    --td-opt-rgb: var(--ds-gold-rgb);
  }

  &.is-on {
    border-color: rgba(var(--td-opt-rgb), 0.38);
    background: rgba(var(--td-opt-rgb), 0.05);

    .td-option__icon {
      color: var(--ds-background);
      background: rgb(var(--td-opt-rgb));
      box-shadow: 0 0 12px rgba(var(--td-opt-rgb), 0.35);
    }

    .td-option__title {
      color: #fff;
    }
  }

  &.is-locked {
    cursor: default;
    opacity: 0.75;
  }
}

.td-option__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease;
}

.td-option__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.td-option__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.88);
  transition: color var(--ds-duration-fast) ease;
}

.td-option__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.td-option__switch {
  flex-shrink: 0;
  --el-switch-on-color: rgb(var(--td-opt-rgb));
  --el-switch-off-color: rgba(255, 255, 255, 0.14);
  --el-switch-border-color: transparent;
}

// ─── Segmented bracket picker ───────────────────────────────────────────────
.td-seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 520px) {
  .td-seg {
    grid-template-columns: 1fr;
  }
}

.td-seg__opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(7, 8, 15, 0.35);
  text-align: left;
  color: var(--ds-text-muted);
  cursor: pointer;
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease;

  &.is-active {
    border-color: rgba(var(--ds-primary-rgb), 0.45);
    background: rgba(var(--ds-primary-rgb), 0.07);
    box-shadow: var(--ds-glow-primary-soft);
    color: #fff;

    .td-seg__icon {
      color: var(--ds-background);
      background: var(--ds-primary);
      box-shadow: var(--ds-glow-primary-soft);
    }

    .td-seg__title {
      color: var(--ds-primary);
      text-shadow: var(--ds-neon-text-subtle);
    }
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
}

.td-seg__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.05);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

.td-seg__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.td-seg__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  transition: color var(--ds-duration-fast) ease;
}

.td-seg__desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

// ─── Finals best-of rows (label + BO1/BO3/BO5 segmented control) ────────────
.td-bo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.td-bo__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(7, 8, 15, 0.35);
}

.td-bo__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.td-bo__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.88);
}

.td-bo__desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

.td-bo__seg {
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.td-bo__opt {
  min-width: 44px;
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ds-text-muted);
  cursor: pointer;
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;

  &.is-active {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.45);
    background: rgba(var(--ds-primary-rgb), 0.1);
    box-shadow: var(--ds-glow-primary-soft);
    text-shadow: var(--ds-neon-text-subtle);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
}

@media (max-width: 520px) {
  .td-bo__row {
    flex-wrap: wrap;
  }

  .td-bo__seg {
    width: 100%;
  }

  .td-bo__opt {
    flex: 1;
  }
}

// ─── Fee: input, then the computed team ticket as a full-width strip ────────
.td-fee {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.td-ticket {
  --td-ticket-rgb: var(--ds-gold-rgb);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(var(--td-ticket-rgb), 0.3);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--td-ticket-rgb), 0.05) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  transition: border-color var(--ds-duration-base) ease;

  &.is-free {
    --td-ticket-rgb: 255, 255, 255;

    border-color: rgba(255, 255, 255, 0.1);

    .td-ticket__icon {
      color: var(--ds-text-faint);
      background: rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .td-ticket__value {
      font-size: 14px;
      color: var(--ds-text-muted);
      text-shadow: none;
    }
  }
}

.td-ticket__label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.td-ticket__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.1);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-gold-rgb), 0.35);
  transition: background-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

.td-ticket__sub {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: none;
  color: var(--ds-text-faint);
}

.td-ticket__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  text-align: right;
}

.td-ticket__value {
  font-family: var(--ds-font-display);
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.02em;
  color: var(--ds-gold);
  text-shadow: var(--ds-neon-text-gold);
  font-variant-numeric: tabular-nums;
}

.td-ticket__formula {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
}

// ─── Schedule phases ────────────────────────────────────────────────────────
.td-phases {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.td-phase {
  padding: 12px 12px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(7, 8, 15, 0.35);
}

.td-phase__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.td-phase__index {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--ds-primary);
}

.td-phase__title {
  font-family: var(--ds-font-display);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
}

.td-phase__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.35), transparent);
}

.td-phase__hint {
  margin: 6px 0 10px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

// Date pickers: same control contract, mono digits.
:deep(.td-date.el-date-editor) {
  width: 100%;
  max-width: 100%;

  .el-input__wrapper {
    min-height: var(--ds-control-height);
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Global reset adds its own prefix/suffix padding + margins on top of the
     wrapper padding above — collapse them so icon and date sit 8px apart. */
  .el-input__prefix {
    padding-left: 0;
    margin-inline-end: 8px;
  }

  .el-input__suffix {
    padding-right: 0;
    margin-inline-start: 6px;
  }

  .el-input__inner {
    padding-left: 0 !important;
    padding-right: 0 !important;
    font-family: var(--ds-font-mono);
    font-size: 13px;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }

  .el-input__prefix-inner > :first-child {
    margin: 0;
    font-size: 16px;
    color: var(--ds-text-faint);
  }
}

// ─── Uploads ────────────────────────────────────────────────────────────────
.td-uploads {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.td-upload {
  width: 100%;

  :deep(.el-upload) {
    display: block;
    width: 100%;
    border: none;
  }

  :deep(.el-upload__input) {
    display: none !important;
  }
}

.td-drop {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-height: 84px;
  width: 100%;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px dashed rgba(var(--ds-primary-rgb), 0.28);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  &--filled {
    display: block;
    aspect-ratio: 16 / 9;
    min-height: 0;
    overflow: hidden;
    border-style: solid;
    border-color: rgba(var(--ds-primary-rgb), 0.22);
    box-shadow: var(--ds-glow-primary-soft);
  }
}

.td-drop__plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35);
  transition: background-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

.td-drop__text {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.td-drop__hint {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.32);
  font-variant-numeric: tabular-nums;
}

.td-drop__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.td-drop__edit {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(7, 8, 15, 0.55);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease;
}

// ─── Foot (drawer footer slot) ──────────────────────────────────────────────
.td-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

// ─── Scrollbar ──────────────────────────────────────────────────────────────
.td-scroll::-webkit-scrollbar {
  width: 6px;
}

.td-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.td-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 3px;
}

.td-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--ds-primary-rgb), 0.4);
}

// ─── Drawer shell ───────────────────────────────────────────────────────────
:deep(.create-tournament-drawer.el-drawer) {
  background: linear-gradient(
    180deg,
    var(--ds-elevated-surface) 0%,
    var(--ds-surface) 40%,
    var(--ds-background) 100%
  ) !important;
}

:deep(.create-tournament-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 14px 24px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

:deep(.create-tournament-drawer .el-drawer__body) {
  padding: 12px 18px 12px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

:deep(.create-tournament-drawer .el-drawer__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

:deep(.create-tournament-drawer .el-drawer__close-btn) {
  color: var(--ds-text-faint);
  font-size: 18px;
  transition: color var(--ds-duration-fast) ease;
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .td-option:not(.is-locked):hover,
  .td-seg__opt:not(.is-active):not(:disabled):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.28);
    background: rgba(var(--ds-primary-rgb), 0.04);
  }

  .td-bo__opt:not(.is-active):not(:disabled):hover {
    color: #fff;
    background: rgba(var(--ds-primary-rgb), 0.06);
  }

  .td-drop:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.55);

    .td-drop__plus {
      color: var(--ds-background);
      background: var(--ds-primary);
    }

    .td-drop__edit {
      opacity: 1;
    }
  }

  :deep(.create-tournament-drawer .el-drawer__close-btn:hover) {
    color: #fff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .td-option,
  .td-seg__opt,
  .td-seg__icon,
  .td-bo__opt,
  .td-drop,
  .td-drop__plus,
  .td-drop__edit,
  .td-ticket {
    transition: none;
  }
}
</style>
