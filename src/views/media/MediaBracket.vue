<template>
  <div class="mbp relative flex w-full flex-col text-white">
    <div class="mbp__backdrop" aria-hidden="true" />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-48 lg:px-24">
      <RouterLink :to="{ name: routeNames.mediaDuels }" class="mbp__back no-underline">
        <PhArrowLeft :size="14" weight="bold" />
        Медіа-турніри
      </RouterLink>

      <span v-if="isPending && !bracket" class="skeleton-bone block h-[220px] !rounded-3xl" />

      <p v-else-if="error && !bracket" class="mbp__empty text-error">
        Турнір не знайдено або не вдалося завантажити
      </p>

      <template v-else-if="bracket">
        <!-- ─── Hero ────────────────────────────────────────────────────── -->
        <header class="mbp-hero" :class="`is-${bracket.status.toLowerCase()}`">
          <span class="mbp-hero__grid" aria-hidden="true" />
          <span class="mbp-hero__orb" aria-hidden="true" />

          <div class="mbp-hero__main">
            <div class="flex flex-wrap items-center gap-8">
              <span class="mbp-hero__status">
                <span v-if="bracket.status === 'LIVE'" class="mbp-hero__status-dot" aria-hidden="true" />
                {{ duelBracketStatusLabels[bracket.status] }}
              </span>
              <span class="mbp-chip"><PhTwitchLogo :size="12" weight="fill" /> Медіа-турнір 1v1</span>
              <span class="mbp-chip"><PhTreeStructure :size="12" weight="bold" /> Single elimination · BO1</span>
              <span v-if="bracket.hasPassword" class="mbp-chip">
                <PhLockSimple :size="12" weight="bold" /> За паролем
              </span>
            </div>

            <h1 class="mbp-hero__title">{{ bracket.name }}</h1>

            <dl class="mbp-hero__facts">
              <div>
                <dt>Учасники</dt>
                <dd>{{ bracket.participantsCount }} <small>/ {{ bracket.maxParticipants }}</small></dd>
              </div>
              <div v-if="bracket.rounds">
                <dt>Раунди</dt>
                <dd>{{ currentRoundLabel }}</dd>
              </div>
              <div>
                <dt>{{ whenFact.label }}</dt>
                <dd>{{ whenFact.value }}</dd>
              </div>
              <div v-if="liveMatches.length">
                <dt>Наживо</dt>
                <dd class="text-[rgb(200,175,255)]">{{ liveMatches.length }}</dd>
              </div>
            </dl>

            <div v-if="bracket.winner" class="mbp-hero__champion">
              <PhCrown :size="22" weight="fill" aria-hidden="true" />
              <el-avatar
                :src="resolvePublicOrApiUrl(bracket.winner.avatarUrl)"
                :size="32"
                class="mbp-hero__champion-avatar"
              >
                {{ duelPlayerInitial(bracket.winner) }}
              </el-avatar>
              <span class="flex min-w-0 flex-col">
                <span class="mbp-hero__champion-label">Чемпіон турніру</span>
                <span class="mbp-hero__champion-name">{{ duelPlayerName(bracket.winner) }}</span>
              </span>
            </div>
          </div>

          <!-- Дія гравця -->
          <aside class="mbp-hero__cta" aria-label="Участь">
            <template v-if="bracket.status === 'REGISTRATION'">
              <template v-if="!isLoggedIn">
                <p class="mbp-hero__cta-text">Реєстрація відкрита — увійдіть через Discord, щоб зайняти місце.</p>
                <el-button type="primary" class="mbp-btn-tw" @click="openLogin">Увійти, щоб грати</el-button>
              </template>
              <template v-else-if="bracket.joined">
                <p class="mbp-hero__cta-ok">
                  <PhCheckCircle :size="18" weight="fill" aria-hidden="true" />
                  Ви в турнірі
                </p>
                <p class="mbp-hero__cta-text">
                  Коли стрімер запустить сітку, бот створить лобі й надішле інвайт у Dota 2 — тримайте гру відкритою.
                </p>
                <el-button text size="small" :loading="leaving" @click="leave">Скасувати реєстрацію</el-button>
              </template>
              <template v-else-if="!bracket.viewerHasSteam">
                <p class="mbp-hero__cta-text">
                  Щоб бот міг запросити вас у лобі, прив’яжіть Steam-акаунт у профілі.
                </p>
                <RouterLink :to="{ name: routeNames.profile }" class="no-underline">
                  <el-button type="primary" class="mbp-btn-tw">
                    <PhSteamLogo :size="16" weight="fill" />
                    <span class="ml-6">Прив’язати Steam</span>
                  </el-button>
                </RouterLink>
              </template>
              <template v-else-if="isFull">
                <p class="mbp-hero__cta-text">Усі {{ bracket.maxParticipants }} місць зайняті.</p>
                <el-button disabled>Місць немає</el-button>
              </template>
              <template v-else>
                <p class="mbp-hero__cta-text">
                  Вільних місць: <b>{{ bracket.maxParticipants - bracket.participantsCount }}</b>.
                  {{ bracket.hasPassword ? 'Пароль скаже стрімер на трансляції.' : 'Реєстрація відкрита для всіх.' }}
                </p>
                <el-button type="primary" size="large" class="mbp-btn-tw" :loading="joining" @click="join">
                  <PhKey v-if="bracket.hasPassword" :size="16" weight="bold" />
                  <PhSword v-else :size="16" weight="fill" />
                  <span class="ml-6">Зареєструватися</span>
                </el-button>
              </template>
            </template>

            <template v-else-if="bracket.status === 'LIVE'">
              <template v-if="myMatch">
                <p class="mbp-hero__cta-ok">
                  <PhGameController :size="18" weight="fill" aria-hidden="true" />
                  Ви граєте: {{ bracketRoundLabel(myMatch.round, bracket.rounds, myMatch.isThirdPlace) }}
                </p>
                <el-button type="primary" class="mbp-btn-tw" @click="scrollToMine">До мого матчу</el-button>
              </template>
              <p v-else-if="myEntry?.eliminated" class="mbp-hero__cta-text">
                Ви вибули{{ myEntry.place ? ` — ${bracketPlaceLabel(myEntry.place)} місце` : '' }}. Дякуємо за гру!
              </p>
              <p v-else class="mbp-hero__cta-text">
                Турнір іде — дивіться матчі на стрімі й стежте за сіткою: вона оновлюється сама.
              </p>
            </template>

            <p v-else-if="bracket.status === 'FINISHED'" class="mbp-hero__cta-text">
              Турнір завершено {{ bracket.finishedAt ? dayjs(bracket.finishedAt).format('DD.MM.YYYY') : '' }}.
              Сітка й результати лишаються тут.
            </p>
            <p v-else class="mbp-hero__cta-text">Турнір скасовано організатором.</p>
          </aside>
        </header>

        <!-- ─── Правила одним рядком ───────────────────────────────────── -->
        <ul class="mbp-rules" aria-label="Як грається турнір">
          <li v-for="rule in rules" :key="rule.title" class="mbp-rules__item">
            <component :is="rule.icon" :size="18" weight="duotone" class="mbp-rules__icon" aria-hidden="true" />
            <span class="flex min-w-0 flex-col">
              <span class="mbp-rules__title">{{ rule.title }}</span>
              <span class="mbp-rules__text">{{ rule.text }}</span>
            </span>
          </li>
        </ul>

        <div class="mbp-layout">
          <!-- ─── Основна колонка ─────────────────────────────────────── -->
          <div class="flex min-w-0 flex-col gap-20">
            <section v-if="myMatch" ref="myMatchRef" class="flex flex-col gap-10" aria-label="Ваш матч">
              <h2 class="mbp-section-title is-gold">// Ваш матч</h2>
              <BracketMatchPanel v-bind="panelProps(myMatch)" @updated="applyBracket" @refresh="refresh" />
            </section>

            <section class="mbp-panel" aria-labelledby="mbp-bracket-title">
              <header class="flex flex-wrap items-center justify-between gap-10">
                <h2 id="mbp-bracket-title" class="mbp-section-title">
                  <PhTreeStructure :size="16" weight="bold" aria-hidden="true" />
                  Сітка турніру
                </h2>
                <span v-if="bracket.rounds" class="mbp-panel__meta">
                  {{ bracket.seeding === 'rating' ? 'Посів за рейтингом дуелей' : 'Випадковий посів' }}
                </span>
              </header>

              <BracketTree
                v-if="bracket.matches.length"
                :matches="bracket.matches"
                :rounds="bracket.rounds"
                :selected-id="selectedMatch?.id ?? null"
                :me-id="meId"
                @select="selectMatch"
              />
              <div v-else class="mbp-preview">
                <PhTreeStructure :size="40" weight="duotone" class="mbp-preview__icon" aria-hidden="true" />
                <p class="mbp-preview__title">
                  {{ bracket.status === 'CANCELLED' ? 'Сітку так і не згенерували' : 'Сітка з’явиться після старту' }}
                </p>
                <p v-if="bracket.status === 'REGISTRATION'" class="mbp-preview__text">
                  Стрімер закриє реєстрацію й запустить турнір — посів визначиться випадково або за рейтингом дуелей.
                  Якщо гравців не рівно 4/8/16…, найсильніші посіви пройдуть перше коло без гри.
                </p>
              </div>
            </section>

            <section
              v-if="selectedMatch && selectedMatch.id !== myMatch?.id"
              ref="selectedRef"
              class="flex flex-col gap-10"
              aria-label="Обраний матч"
            >
              <h2 class="mbp-section-title">// Матч</h2>
              <BracketMatchPanel v-bind="panelProps(selectedMatch)" @updated="applyBracket" @refresh="refresh" />
            </section>

            <section v-if="otherOpenMatches.length" class="flex flex-col gap-10" aria-label="Інші матчі, що тривають">
              <h2 class="mbp-section-title">// Зараз грають</h2>
              <div class="mbp-matches">
                <BracketMatchPanel
                  v-for="match in otherOpenMatches"
                  :key="match.id"
                  v-bind="panelProps(match)"
                  @updated="applyBracket"
                  @refresh="refresh"
                />
              </div>
            </section>
          </div>

          <!-- ─── Бічна колонка ───────────────────────────────────────── -->
          <aside class="flex min-w-0 flex-col gap-20">
            <section v-if="bracket.canManage" class="mbp-panel mbp-manage" aria-labelledby="mbp-manage-title">
              <h2 id="mbp-manage-title" class="mbp-section-title">
                <PhSlidersHorizontal :size="16" weight="bold" aria-hidden="true" />
                Керування
              </h2>

              <div v-if="bracket.password && bracket.status === 'REGISTRATION'" class="mbp-password">
                <span class="mbp-password__label">Пароль</span>
                <code class="mbp-password__value">{{ passwordShown ? bracket.password : '••••••••' }}</code>
                <el-button
                  text
                  size="small"
                  class="btn-icon"
                  :aria-label="passwordShown ? 'Сховати' : 'Показати'"
                  @click="passwordShown = !passwordShown"
                >
                  <PhEyeSlash v-if="passwordShown" :size="16" />
                  <PhEye v-else :size="16" />
                </el-button>
                <el-button text size="small" class="btn-icon" aria-label="Скопіювати пароль" @click="copyPassword">
                  <PhCopy :size="16" />
                </el-button>
              </div>

              <div class="mbp-manage__actions">
                <el-button
                  v-if="bracket.status === 'REGISTRATION'"
                  type="primary"
                  class="mbp-btn-tw"
                  :disabled="bracket.participantsCount < DUEL_BRACKET_MIN_PARTICIPANTS"
                  @click="openStart"
                >
                  <PhFlagBanner :size="16" weight="fill" />
                  <span class="ml-6">Запустити турнір</span>
                </el-button>
                <el-button v-if="isOpenBracket" @click="openEdit">
                  <PhPencilSimple :size="14" weight="bold" />
                  <span class="ml-6">Редагувати</span>
                </el-button>
                <el-button v-if="isOpenBracket" type="danger" plain :loading="cancelling" @click="cancelBracket">
                  <PhProhibit :size="14" weight="bold" />
                  <span class="ml-6">Скасувати турнір</span>
                </el-button>
                <el-button v-if="isAdmin" type="danger" :loading="deleting" @click="deleteBracket">
                  <PhTrash :size="14" weight="bold" />
                  <span class="ml-6">Видалити</span>
                </el-button>
              </div>

              <p class="mbp-panel__hint">
                <template v-if="bracket.status === 'REGISTRATION'">
                  Потрібно щонайменше {{ DUEL_BRACKET_MIN_PARTICIPANTS }} гравці. Після старту реєстрація закриється,
                  а бот створить лобі першого раунду. Під час турніру можна спостерігати за будь-яким матчем із лобі
                  та вирішувати спірні матчі вручну.
                </template>
                <template v-else-if="bracket.status === 'LIVE'">
                  Оберіть матч у сітці, щоб спостерігати з лобі або зафіксувати переможця. Матчі, що чекають на ваше
                  рішення, підсвічені жовтим.
                </template>
                <template v-else>Турнір завершено — керувати вже нічим.</template>
              </p>
            </section>

            <div class="mbp-panel">
              <BracketStreamerCard
                :streamer="bracket.createdBy"
                :stream-url="bracket.streamUrl"
                :streamer-links="bracket.streamerLinks"
                :description="bracket.description"
                :live="bracket.status === 'LIVE'"
              />
            </div>

            <div v-if="bracket.prizes.length" class="mbp-panel">
              <BracketPrizes
                :prizes="bracket.prizes"
                :participants="bracket.participants"
                :status="bracket.status"
                :settled="!!bracket.prizesAwardedAt"
              />
            </div>

            <div class="mbp-panel">
              <BracketParticipants
                :participants="bracket.participants"
                :status="bracket.status"
                :max-participants="bracket.maxParticipants"
                :can-manage="bracket.canManage"
                :me-id="meId"
                @remove="removeParticipant"
              />
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useQueryCache } from '@pinia/colada'
import {
  PhArrowLeft,
  PhCheckCircle,
  PhClock,
  PhCopy,
  PhCrown,
  PhDiceFive,
  PhEye,
  PhEyeSlash,
  PhFlagBanner,
  PhGameController,
  PhKey,
  PhLockSimple,
  PhPencilSimple,
  PhProhibit,
  PhRobot,
  PhSlidersHorizontal,
  PhSteamLogo,
  PhSword,
  PhTrash,
  PhTreeStructure,
  PhTwitchLogo
} from '@phosphor-icons/vue'
import type { Component } from 'vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { duelPlayerInitial, duelPlayerName } from '@/views/duels/duels.utils'
import BracketMatchPanel from '@/views/media/components/BracketMatchPanel.vue'
import BracketParticipants from '@/views/media/components/BracketParticipants.vue'
import BracketPrizes from '@/views/media/components/BracketPrizes.vue'
import BracketStreamerCard from '@/views/media/components/BracketStreamerCard.vue'
import BracketTree from '@/views/media/components/BracketTree.vue'
import { DUEL_BRACKETS_QUERY_KEY, duelBracketQueryKey, useGetDuelBracket } from '@/views/media/media.queries'
import { duelBracketsService } from '@/views/media/media.service'
import {
  DUEL_BRACKET_IDLE_POLL_MS,
  DUEL_BRACKET_LIVE_POLL_MS,
  DUEL_BRACKET_MIN_PARTICIPANTS,
  bracketPlaceLabel,
  bracketRoundLabel,
  duelBracketStatusLabels
} from '@/views/media/media.utils'
import type { TDuelBracket, TDuelBracketMatch, TDuelPlayer } from '@/api/types/api.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const queryCache = useQueryCache()
const { open } = useAppModals()

const bracketId = computed(() => String(route.params.id ?? ''))
const meId = computed(() => authStore.user?.id ?? null)
const isLoggedIn = computed(() => !!authStore.token)
const isAdmin = computed(() => authStore.isAdmin.isAdmin)

const { data: bracket, isPending, error, refetch } = useGetDuelBracket(() => bracketId.value, () => meId.value)

useSeo(() => ({ title: bracket.value?.name ? `${bracket.value.name} — медіа-турнір 1v1` : undefined }))

const isOpenBracket = computed(() => bracket.value?.status === 'REGISTRATION' || bracket.value?.status === 'LIVE')
const isFull = computed(() => !!bracket.value && bracket.value.participantsCount >= bracket.value.maxParticipants)

// ─── Живе оновлення: часто, поки сітка грається; рідко на реєстрації ─────────
const pollMs = computed(() => (bracket.value?.status === 'LIVE' ? DUEL_BRACKET_LIVE_POLL_MS : DUEL_BRACKET_IDLE_POLL_MS))
const { pause, resume } = useIntervalFn(() => { refresh() }, pollMs, { immediate: false })
watch(() => bracket.value?.status, (status) => {
  if (status === 'LIVE' || status === 'REGISTRATION') resume()
  else pause()
}, { immediate: true })

function refresh () {
  refetch().catch(() => { /* тихо — наступний тик спробує знову */ })
}

/** Свіжий знімок від мутації — одразу в кеш, без зайвого запиту; список турнірів теж застарів. */
function applyBracket (next: TDuelBracket) {
  queryCache.setQueryData([...duelBracketQueryKey(bracketId.value), meId.value ?? 'guest'], next)
  queryCache.invalidateQueries({ key: [...DUEL_BRACKETS_QUERY_KEY, 'list'] }).catch(() => { /* тихо */ })
}

// ─── Матчі ───────────────────────────────────────────────────────────────────
const matches = computed<TDuelBracketMatch[]>(() => bracket.value?.matches ?? [])
const myMatch = computed(() => matches.value.find(m => m.id === bracket.value?.myMatchId) ?? null)
const myEntry = computed(() => bracket.value?.participants.find(p => p.player.id === meId.value) ?? null)
const liveMatches = computed(() => matches.value.filter(m => m.status === 'LIVE'))

const selectedId = ref<string | null>(null)
/** Обраний у сітці; за замовчуванням — перший, що вимагає уваги (рішення) або грається. */
const selectedMatch = computed(() => {
  const picked = matches.value.find(m => m.id === selectedId.value)
  if (picked) return picked
  return matches.value.find(m => m.status === 'NEEDS_DECISION') ??
    matches.value.find(m => m.status === 'LIVE' && m.id !== myMatch.value?.id) ??
    null
})

/** Решта матчів, що тривають або чекають, — щоб стрімер бачив усе одразу. */
const otherOpenMatches = computed(() =>
  matches.value.filter(m =>
    (m.status === 'LIVE' || m.status === 'NEEDS_DECISION' || m.status === 'READY') &&
    m.id !== myMatch.value?.id &&
    m.id !== selectedMatch.value?.id
  )
)

const matchesPerRound = computed(() => {
  const counts = new Map<number, number>()
  for (const m of matches.value) {
    if (!m.isThirdPlace) counts.set(m.round, (counts.get(m.round) ?? 0) + 1)
  }
  return counts
})

function panelProps (match: TDuelBracketMatch) {
  const b = bracket.value as TDuelBracket
  return {
    match,
    bracketId: b.id,
    rounds: b.rounds,
    matchesInRound: matchesPerRound.value.get(match.round) ?? 1,
    canManage: b.canManage,
    bracketLive: b.status === 'LIVE',
    viewerHasSteam: b.viewerHasSteam,
    meId: meId.value
  }
}

const selectedRef = ref<HTMLElement | null>(null)
const myMatchRef = ref<HTMLElement | null>(null)

function selectMatch (id: string) {
  selectedId.value = id
  if (id === myMatch.value?.id) {
    scrollToMine()
    return
  }
  nextTick(() => selectedRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}

function scrollToMine () {
  myMatchRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Факти для героя ─────────────────────────────────────────────────────────
const currentRoundLabel = computed(() => {
  const b = bracket.value
  if (!b?.rounds) return ''
  if (b.status !== 'LIVE') return String(b.rounds)
  const open = matches.value.filter(m => m.status !== 'DONE' && !m.isThirdPlace)
  const round = open.length ? Math.min(...open.map(m => m.round)) : b.rounds
  return `${bracketRoundLabel(round, b.rounds)} · ${round}/${b.rounds}`
})

const whenFact = computed(() => {
  const b = bracket.value
  if (!b) return { label: '', value: '' }
  if (b.status === 'REGISTRATION') {
    return {
      label: 'Старт',
      value: b.scheduledAt ? dayjs(b.scheduledAt).format('DD.MM, HH:mm') : 'за рішенням стрімера'
    }
  }
  if (b.status === 'LIVE') return { label: 'Стартував', value: b.startedAt ? dayjs(b.startedAt).format('DD.MM, HH:mm') : '—' }
  return { label: 'Завершено', value: b.finishedAt ? dayjs(b.finishedAt).format('DD.MM.YYYY') : '—' }
})

const rules: Array<{ icon: Component; title: string; text: string }> = [
  { icon: PhTreeStructure, title: 'На вибування', text: 'Одна гра — програв і вибув' },
  { icon: PhRobot, title: 'Лобі від бота', text: 'Інвайт приходить у Dota 2 сам' },
  { icon: PhDiceFive, title: 'Випадкові герої', text: '1v1 Solo Mid, грайте свого героя' },
  { icon: PhClock, title: '5 хвилин на вхід', text: 'Неявка в лобі — технічна поразка' }
]

// ─── Гравець ─────────────────────────────────────────────────────────────────
function openLogin () {
  open('LoginModal', { redirectTo: route.fullPath })
}

const joining = ref(false)
async function join () {
  const b = bracket.value
  if (!b || joining.value) return
  if (b.hasPassword) {
    open('DuelBracketJoinModal', { bracket: b, onJoined: applyBracket })
    return
  }
  joining.value = true
  try {
    applyBracket(await duelBracketsService.join(b.id))
  } catch {
    // тост уже показав сервіс
  } finally {
    joining.value = false
  }
}

const leaving = ref(false)
async function leave () {
  const b = bracket.value
  if (!b || leaving.value) return
  leaving.value = true
  try {
    applyBracket(await duelBracketsService.leave(b.id))
  } catch {
    // тост уже показав сервіс
  } finally {
    leaving.value = false
  }
}

// ─── Організатор ─────────────────────────────────────────────────────────────
const passwordShown = ref(false)
const { copy } = useClipboard({ legacy: true })
function copyPassword () {
  if (!bracket.value?.password) return
  copy(bracket.value.password)
  ElMessage.success('Пароль скопійовано')
}

function openEdit () {
  if (bracket.value) open('DuelBracketFormModal', { bracket: bracket.value, onSaved: applyBracket })
}

function openStart () {
  if (bracket.value) open('DuelBracketStartModal', { bracket: bracket.value, onStarted: applyBracket })
}

async function removeParticipant (player: TDuelPlayer) {
  const b = bracket.value
  if (!b) return
  try {
    await ElMessageBox.confirm(`Прибрати ${duelPlayerName(player)} з турніру?`, 'Учасник', {
      confirmButtonText: 'Прибрати', cancelButtonText: 'Ні', type: 'warning'
    })
  } catch {
    return
  }
  try {
    applyBracket(await duelBracketsService.removeParticipant(b.id, player.id))
  } catch {
    // тост уже показав сервіс
  }
}

const cancelling = ref(false)
async function cancelBracket () {
  const b = bracket.value
  if (!b || cancelling.value) return
  try {
    await ElMessageBox.confirm(
      'Турнір буде скасовано: лобі, що ще не стартували, закриються, а ігри, які вже йдуть, дограються без ' +
        'зарахування. Призи не розігруються. Скасувати це не можна.',
      'Скасувати турнір?',
      { confirmButtonText: 'Скасувати турнір', cancelButtonText: 'Ні', type: 'warning' }
    )
  } catch {
    return
  }
  cancelling.value = true
  try {
    applyBracket(await duelBracketsService.cancel(b.id))
  } catch {
    // тост уже показав сервіс
  } finally {
    cancelling.value = false
  }
}

const deleting = ref(false)
async function deleteBracket () {
  const b = bracket.value
  if (!b || deleting.value) return
  try {
    await ElMessageBox.confirm(
      `Турнір «${b.name}» разом із сіткою буде видалено назавжди. Зіграні дуелі лишаться в історії гравців.`,
      'Видалити турнір?',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Ні', type: 'error', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  deleting.value = true
  try {
    await duelBracketsService.remove(b.id)
    queryCache.invalidateQueries({ key: [...DUEL_BRACKETS_QUERY_KEY] }).catch(() => { /* тихо */ })
    await router.push({ name: routeNames.mediaDuels })
  } catch {
    // тост уже показав сервіс
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.mbp {
  --tw: 145, 70, 255;
}

.mbp__backdrop {
  position: absolute;
  inset: 0 0 auto;
  height: 520px;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 80% at 20% 0%, rgba(var(--tw), 0.22), transparent 70%),
    radial-gradient(ellipse 35% 60% at 95% 5%, rgba(var(--ds-pink-rgb), 0.08), transparent 70%);
}

.mbp__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding-top: 24px;
  font-size: 13px;
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-base) ease;
}

.mbp__back:hover {
  color: rgb(200, 175, 255);
}

.mbp__empty {
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
}

/* ─── Hero: «студійний» банер — сітка-підкладка, фіолетова сфера, скляна панель дії ── */
.mbp-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  padding: 24px;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(var(--tw), 0.35);
  background:
    linear-gradient(90deg, transparent, rgba(var(--tw), 0.9), rgba(var(--ds-pink-rgb), 0.7), transparent)
      top / 100% 1px no-repeat,
    linear-gradient(135deg, rgba(48, 26, 92, 0.85) 0%, rgba(17, 15, 34, 0.95) 55%, rgba(10, 11, 22, 0.98) 100%);
  box-shadow: var(--ds-elevation-4), 0 0 40px rgba(var(--tw), 0.18);
}

.mbp-hero.is-finished,
.mbp-hero.is-cancelled {
  border-color: rgba(255, 255, 255, 0.12);
}

.mbp-hero__grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(rgba(var(--tw), 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--tw), 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse 70% 90% at 80% 50%, #000, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 90% at 80% 50%, #000, transparent 75%);
}

.mbp-hero__orb {
  position: absolute;
  top: -140px;
  right: -100px;
  z-index: -1;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--tw), 0.45), rgba(var(--ds-pink-rgb), 0.12) 45%, transparent 70%);
  filter: blur(10px);
}

.mbp-hero__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.mbp-hero__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.mbp-hero.is-live .mbp-hero__status {
  color: #fff;
  background: rgb(220, 38, 38);
  border-color: transparent;
  box-shadow: 0 0 16px rgba(220, 38, 38, 0.6);
}

.mbp-hero.is-registration .mbp-hero__status {
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.1);
  border-color: rgba(var(--ds-primary-rgb), 0.35);
}

.mbp-hero__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: mbp-pulse 1.3s ease-in-out infinite;
}

.mbp-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(210, 190, 255);
  background: rgba(var(--tw), 0.14);
  border: 1px solid rgba(var(--tw), 0.25);
}

.mbp-hero__title {
  font-family: var(--ds-font-display);
  font-size: clamp(28px, 5vw, 46px);
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #fff;
  text-shadow: 0 0 24px rgba(var(--tw), 0.55);
  overflow-wrap: anywhere;
}

.mbp-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  margin: 0;
}

.mbp-hero__facts dt {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.mbp-hero__facts dd {
  margin: 2px 0 0;
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: var(--ds-text-strong);
}

.mbp-hero__facts small {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.mbp-hero__champion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  padding: 8px 16px 8px 12px;
  border-radius: 14px;
  color: var(--ds-gold);
  background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.22), rgba(var(--ds-gold-rgb), 0.05));
  border: 1px solid rgba(var(--ds-gold-rgb), 0.4);
  box-shadow: 0 0 20px rgba(var(--ds-gold-rgb), 0.2);
}

/* Глобальний .el-avatar фіксує 56px */
.mbp-hero__champion-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-size: 13px;
}

.mbp-hero__champion-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.mbp-hero__champion-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: #fff;
}

.mbp-hero__cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(10, 8, 22, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mbp-hero__cta :deep(.el-button + .el-button) {
  margin-left: 0;
}

.mbp-hero__cta-text {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

.mbp-hero__cta-ok {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--ds-success);
}

.mbp-btn-tw {
  --el-button-bg-color: rgb(var(--tw));
  --el-button-border-color: rgb(var(--tw));
  --el-button-hover-bg-color: rgb(165, 100, 255);
  --el-button-hover-border-color: rgb(165, 100, 255);
  --el-button-active-bg-color: rgb(125, 55, 230);
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;

  box-shadow: 0 0 18px rgba(var(--tw), 0.45);
}

@screen lg {
  .mbp-hero {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: center;
    padding: 32px;
  }
}

/* ─── Правила ────────────────────────────────────────────────────────────── */
.mbp-rules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mbp-rules__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mbp-rules__icon {
  flex-shrink: 0;
  color: rgb(var(--tw));
}

.mbp-rules__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.mbp-rules__text {
  font-size: 11px;
  color: var(--ds-text-faint);
}

/* ─── Розкладка ──────────────────────────────────────────────────────────── */
.mbp-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

@screen lg {
  .mbp-layout {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }
}

.mbp-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(90deg, transparent, rgba(var(--tw), 0.5), transparent) top / 100% 1px no-repeat,
    linear-gradient(160deg, rgba(22, 22, 42, 0.9), rgba(12, 13, 25, 0.94));
  box-shadow: var(--ds-elevation-3);
}

.mbp-panel__meta {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.mbp-panel__hint {
  font-size: 12px;
  line-height: 1.55;
  color: var(--ds-text-faint);
}

.mbp-section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(200, 175, 255);
}

.mbp-section-title.is-gold {
  color: var(--ds-gold);
  text-shadow: var(--ds-neon-text-gold);
}

.mbp-matches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 14px;
}

.mbp-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 16px;
  border-radius: 16px;
  border: 1px dashed rgba(var(--tw), 0.35);
  text-align: center;
}

.mbp-preview__icon {
  color: rgb(var(--tw));
}

.mbp-preview__title {
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: var(--ds-text-strong);
}

.mbp-preview__text {
  max-width: 520px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

/* ─── Керування ──────────────────────────────────────────────────────────── */
.mbp-manage {
  border-color: rgba(var(--tw), 0.35);
}

.mbp-manage__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mbp-manage__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.mbp-password {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(var(--tw), 0.25);
}

.mbp-password__label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.mbp-password__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--ds-font-mono);
  font-size: 14px;
  letter-spacing: 0.08em;
  color: rgb(200, 175, 255);
}

@keyframes mbp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .mbp-hero__status-dot {
    animation: none;
  }
}
</style>
