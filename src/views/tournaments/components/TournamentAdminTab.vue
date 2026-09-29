<template>
  <div class="admin w-full mt-20">
    <el-tabs v-model="activeTab" tab-position="top" stretch class="w-full">
      <el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <!-- ─── Огляд ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'status'" class="admin__stack">
      <section class="admin-panel hud-panel rounded-2xl" aria-label="Стан турніру">
        <header class="admin-panel__head">
          <div class="flex min-w-0 flex-col gap-6">
            <p class="sys-label m-0">// Огляд</p>
            <h3 class="admin-panel__title">Стан турніру</h3>
          </div>
        </header>

        <!-- Етапи: пройдені — заповнені, поточний — світиться, майбутні — контур -->
        <ol class="admin-stages" :style="{ '--steps': stages.length }" aria-label="Етапи турніру">
          <li
            v-for="stage in stages"
            :key="stage.key"
            class="admin-stages__step"
            :class="{ 'is-done': stage.state === 'done', 'is-current': stage.state === 'current' }"
            :aria-current="stage.state === 'current' ? 'step' : undefined"
          >
            <span class="admin-stages__node" aria-hidden="true">
              <PhCheck v-if="stage.state === 'done'" :size="10" weight="bold" />
            </span>
            <span class="admin-stages__label">{{ stage.label }}</span>
            <span class="admin-stages__dates">{{ stage.dates }}</span>
          </li>
        </ol>

        <dl class="admin-stats">
          <div class="admin-stats__cell">
            <dt>
              <PhUsersThree :size="12" weight="bold" aria-hidden="true" />
              Команд
            </dt>
            <dd>
              {{ teams.length }}<span class="admin-stats__dim">/{{ tournament?.tournamentSlots ?? '—' }}</span>
            </dd>
          </div>
          <div class="admin-stats__cell">
            <dt>
              <PhCoins :size="12" weight="bold" aria-hidden="true" />
              Внесок
            </dt>
            <dd>{{ entryFeeLabel }}</dd>
          </div>
          <div class="admin-stats__cell">
            <dt>
              <PhLightning :size="12" weight="bold" aria-hidden="true" />
              Старт плей-оф
            </dt>
            <dd class="admin-stats__date">{{ playoffStartLabel }}</dd>
          </div>
        </dl>
      </section>

      <section class="admin-panel hud-panel rounded-2xl" aria-label="Реєстрація">
        <div class="admin-panel__row">
          <div class="flex min-w-0 flex-col gap-8">
            <p class="sys-label sys-label--muted m-0">Реєстрація</p>
            <p class="admin-reg" :class="registrationState.tone">
              <span class="admin-reg__dot" aria-hidden="true" />
              <span class="admin-reg__label">{{ registrationState.label }}</span>
            </p>
            <p class="admin-panel__hint">{{ registrationState.hint }}</p>
          </div>

          <!-- Кнопка лише коли є що робити: відкриту — закрити, закриту вручну — відкрити. -->
          <el-popconfirm
            v-if="registrationAction"
            width="320"
            placement="bottom-end"
            :title="registrationAction.confirmTitle"
            :confirm-button-text="registrationAction.confirmText"
            cancel-button-text="Скасувати"
            :confirm-button-type="registrationAction.type"
            @confirm="toggleRegistrationClosed"
          >
            <template #reference>
              <el-button
                :type="registrationAction.type"
                :loading="registrationToggleLoading"
                plain
                class="shrink-0"
              >
                {{ registrationAction.label }}
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </section>

      <section class="admin-panel admin-panel--danger rounded-2xl" aria-label="Налаштування та видалення">
        <div class="admin-panel__row">
          <div class="flex min-w-0 flex-col gap-8">
            <p class="sys-label sys-label--pink m-0">Небезпечна зона</p>
            <p class="admin-panel__hint">
              Редагування змінює дати, слоти й внесок для всіх учасників. Видалення незворотне:
              команди, матчі та платежі турніру буде втрачено.
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap items-center gap-10">
            <el-button type="primary" plain @click="showEditDrawer = true">
              <PhPencilSimple :size="16" weight="bold" class="mr-8 shrink-0" />
              Редагувати
            </el-button>

            <el-popconfirm
              width="300"
              placement="bottom-end"
              title="Видалити турнір безповоротно?"
              confirm-button-text="Видалити"
              cancel-button-text="Скасувати"
              confirm-button-type="danger"
              @confirm="deleteTournament"
            >
              <template #reference>
                <el-button type="danger" :loading="deleteLoading" plain>
                  <PhTrash :size="16" weight="bold" class="mr-8 shrink-0" />
                  Видалити турнір
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </section>
    </div>

    <CreateTournamentDrawer v-model="showEditDrawer" :tournament="tournament" />

    <!-- ─── Команди та внески ────────────────────────────────────────────── -->
    <div v-if="activeTab === 'participants'" class="admin__stack">
      <section class="admin-panel hud-panel rounded-2xl" aria-label="Додати команду">
        <div class="admin-panel__row">
          <div class="flex min-w-0 flex-col gap-8">
            <p class="sys-label m-0">// Команди</p>
            <h3 class="admin-panel__title">Додати команду вручну</h3>
            <p class="admin-panel__hint">
              Обхід реєстрації для верифікованих команд — без оплати й перевірки дедлайну.
              Вільних слотів: {{ freeSlotsLabel }}.
            </p>
          </div>

          <div class="admin-join">
            <el-select
              v-model="selectedTeamId"
              filterable
              placeholder="Оберіть команду"
              class="admin-join__select"
              :loading="teamsLoading"
              :disabled="joinLoading"
            >
              <el-option
                v-for="team in eligibleTeams"
                :key="team.id"
                :label="team.name"
                :value="team.id"
              >
                <span class="admin-opt">
                  <span class="admin-team__thumb admin-team__thumb--sm">
                    <img v-if="teamLogo(team)" :src="teamLogo(team)" alt="" loading="lazy" decoding="async">
                    <PhUsersThree v-else :size="12" weight="duotone" />
                  </span>
                  <span class="admin-opt__name">{{ team.name }}</span>
                  <span class="admin-opt__meta">{{ team.mainPlayers?.length ?? 0 }} гр.</span>
                </span>
              </el-option>
            </el-select>
            <el-button
              type="primary"
              :loading="joinLoading"
              :disabled="!selectedTeamId"
              @click="adminJoinTeam"
            >
              <PhPlus :size="16" weight="bold" class="mr-8 shrink-0" />
              Додати
            </el-button>
          </div>
        </div>
      </section>

      <section class="admin-panel hud-panel rounded-2xl" aria-label="Учасники">
        <header class="admin-panel__head admin-panel__head--split">
          <div class="flex min-w-0 flex-col gap-6">
            <p class="sys-label sys-label--muted m-0">Учасники</p>
            <h3 class="admin-panel__title">
              {{ teams.length }} {{ pluralTeams(teams.length) }}
            </h3>
          </div>

          <p v-if="tournamentHasEntryFee" class="admin-paid" :class="{ 'is-complete': paidCount === teams.length }">
            <PhCoins :size="14" weight="fill" aria-hidden="true" />
            <span class="admin-paid__value">
              {{ paidCount }}<span class="admin-stats__dim">/{{ teams.length }}</span>
            </span>
            <span class="admin-paid__label">сплатили внесок</span>
          </p>
        </header>

        <el-table
          :data="teams"
          row-key="id"
          class="admin-table"
          max-height="420"
          empty-text="Команд ще немає"
        >
          <el-table-column label="Команда" min-width="220">
            <template #default="{ row }">
              <span class="admin-team">
                <span class="admin-team__thumb">
                  <img v-if="teamLogo(row)" :src="teamLogo(row)" alt="" loading="lazy" decoding="async">
                  <PhUsersThree v-else :size="14" weight="duotone" />
                </span>
                <span class="admin-table__name">{{ row.name }}</span>
              </span>
            </template>
          </el-table-column>

          <template v-if="tournamentHasEntryFee">
            <el-table-column label="Статус оплати" width="170">
              <template #default="{ row }">
                <span class="admin-pay" :class="paymentStatusClass(row.id)">
                  <span class="admin-pay__dot" aria-hidden="true" />
                  {{ paymentStatusLabel(row.id) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="Сплачено" width="130" align="right">
              <template #default="{ row }">
                <span class="admin-table__amount">{{ amountPaidLabel(row.id) }}</span>
              </template>
            </el-table-column>

            <el-table-column v-if="hasUnpaidTeams" label="" width="210" align="right">
              <template #default="{ row }">
                <el-button
                  v-if="!isTeamPaid(row.id)"
                  type="success"
                  size="small"
                  plain
                  :loading="markPaidLoadingId === row.id"
                  @click="markPaid(row.id)"
                >
                  Позначити оплаченим
                </el-button>
              </template>
            </el-table-column>
          </template>
        </el-table>
      </section>
    </div>

    <!-- ─── Матчі ────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'matches'" class="admin__stack">
      <section class="admin-panel hud-panel rounded-2xl" aria-label="Матчі без ID Dota 2">
        <header class="admin-panel__head admin-panel__head--split">
          <div class="flex min-w-0 flex-col gap-6">
            <p class="sys-label m-0">// Матчі</p>
            <h3 class="admin-panel__title">Результати без ID Dota 2</h3>
            <p class="admin-panel__hint">
              Матчі, зараховані вручну (техпоразка або ручне внесення). Прив'яжіть справжній ID
              зіграного матчу, щоб система підтягнула статистику гравців. Переможець і очки не змінюються.
            </p>
          </div>

          <el-button plain :loading="manualMatchesLoading" @click="loadManualMatches">
            <span class="inline-flex items-center gap-8">
              <PhArrowsClockwise v-if="!manualMatchesLoading" :size="14" weight="bold" aria-hidden="true" />
              Оновити
            </span>
          </el-button>
        </header>

        <el-table
          v-loading="manualMatchesLoading"
          :data="manualMatches"
          row-key="matchId"
          class="admin-table"
          max-height="480"
          empty-text="Усі результати мають ID Dota 2"
        >
          <el-table-column label="Етап" width="150">
            <template #default="{ row }">
              <span class="admin-stage" :class="{ 'is-playoff': row.stage === 'playoff' }">
                {{ manualMatchStageLabel(row) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Матч" min-width="280">
            <template #default="{ row }">
              <span class="admin-match">
                <span class="admin-match__team" :class="{ 'is-winner': row.winnerTeamId === row.teamA.id }">
                  <span class="admin-team__thumb admin-team__thumb--sm">
                    <img v-if="teamLogo(row.teamA)" :src="teamLogo(row.teamA)" alt="" loading="lazy" decoding="async">
                    <PhUsersThree v-else :size="12" weight="duotone" />
                  </span>
                  <span class="admin-table__name">{{ row.teamA.name }}</span>
                  <PhTrophy
                    v-if="row.winnerTeamId === row.teamA.id"
                    :size="12"
                    weight="fill"
                    class="admin-match__trophy"
                    aria-label="Переможець"
                  />
                </span>
                <span class="admin-match__vs" aria-hidden="true">vs</span>
                <span class="admin-match__team" :class="{ 'is-winner': row.winnerTeamId === row.teamB.id }">
                  <span class="admin-team__thumb admin-team__thumb--sm">
                    <img v-if="teamLogo(row.teamB)" :src="teamLogo(row.teamB)" alt="" loading="lazy" decoding="async">
                    <PhUsersThree v-else :size="12" weight="duotone" />
                  </span>
                  <span class="admin-table__name">{{ row.teamB.name }}</span>
                  <PhTrophy
                    v-if="row.winnerTeamId === row.teamB.id"
                    :size="12"
                    weight="fill"
                    class="admin-match__trophy"
                    aria-label="Переможець"
                  />
                </span>
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Джерело" width="140">
            <template #default="{ row }">
              <span class="admin-table__amount">{{ manualMatchSourceLabel(row) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="" width="170" align="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" plain @click="openLinkDotaMatchId(row)">
                <span class="inline-flex items-center gap-6">
                  <PhLinkSimple :size="14" weight="bold" aria-hidden="true" />
                  Прив'язати ID
                </span>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <!-- ─── Плей-оф ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'playoff'" class="admin__stack">
      <section v-if="playoffLoading" class="admin-panel hud-panel rounded-2xl" aria-busy="true">
        <p class="admin-panel__hint m-0">Завантаження даних плей-оф…</p>
      </section>

      <template v-else-if="playoff">
        <section class="admin-panel hud-panel rounded-2xl" aria-label="Сітка плей-оф">
          <div class="admin-panel__row">
            <div class="flex min-w-0 flex-col gap-8">
              <p class="sys-label m-0">// Плей-оф</p>
              <div class="flex flex-wrap items-center gap-x-12 gap-y-8">
                <h3 class="admin-panel__title">Сітку сформовано</h3>
                <StatusBadge preset="live" size="sm" />
              </div>
              <p class="admin-panel__hint">
                {{ playoff.teams.length }} {{ pluralTeams(playoff.teams.length) }} у сітці Challonge.
                Результати подаються у вкладці «Сітка»; дискваліфікація перебудовує сітку одразу.
              </p>
            </div>

            <div class="flex shrink-0 flex-wrap items-center gap-8">
              <el-popconfirm
                width="300"
                placement="bottom-end"
                :title="REGENERATE_CONFIRM_TITLE"
                confirm-button-text="Перегенерувати"
                cancel-button-text="Скасувати"
                @confirm="regeneratePlayoffMatches"
              >
                <template #reference>
                  <el-button plain :loading="regenerateLoading" :disabled="actionLoading">
                    <span class="inline-flex items-center gap-8">
                      <PhArrowsClockwise v-if="!regenerateLoading" :size="14" weight="bold" aria-hidden="true" />
                      Перегенерувати матчі
                    </span>
                  </el-button>
                </template>
              </el-popconfirm>

              <el-button
                tag="a"
                :href="playoffPublicUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="inline-flex items-center gap-8">
                  Відкрити на Challonge
                  <PhArrowSquareOut :size="14" weight="bold" aria-hidden="true" />
                </span>
              </el-button>
            </div>
          </div>
        </section>

        <section class="admin-panel hud-panel rounded-2xl" aria-label="Учасники плей-оф">
          <header class="admin-panel__head">
            <p class="sys-label sys-label--muted m-0">Учасники плей-оф</p>
            <h3 class="admin-panel__title">
              {{ playoff.teams.length }} {{ pluralTeams(playoff.teams.length) }} у сітці
            </h3>
          </header>
          <el-table
            :data="playoff.teams"
            row-key="id"
            class="admin-table"
            empty-text="Команд у сітці немає"
          >
            <el-table-column label="#" width="56">
              <template #default="{ $index }">
                <span class="admin-table__index">{{ String($index + 1).padStart(2, '0') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Команда" min-width="220">
              <template #default="{ row }">
                <span class="admin-team">
                  <span class="admin-team__thumb">
                    <img v-if="teamLogo(row)" :src="teamLogo(row)" alt="" loading="lazy" decoding="async">
                    <PhUsersThree v-else :size="14" weight="duotone" />
                  </span>
                  <span class="admin-table__name">{{ row.name }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="" width="190" align="right">
              <template #default="{ row }">
                <el-popconfirm
                  width="280"
                  placement="bottom-end"
                  :title="`Дискваліфікувати «${row.name}»? Сітку буде перебудовано.`"
                  confirm-button-text="Дискваліфікувати"
                  cancel-button-text="Скасувати"
                  confirm-button-type="danger"
                  @confirm="disqualify(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" size="small" text :loading="actionLoading" class="admin-dq">
                      <PhUserMinus v-if="!actionLoading" :size="14" weight="bold" class="mr-6 shrink-0" />
                      Дискваліфікувати
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>

      <template v-else>
        <section class="admin-panel hud-panel rounded-2xl" aria-label="Автостарт плей-оф">
          <div class="admin-panel__row">
            <div class="flex min-w-0 flex-col gap-8">
              <p class="sys-label m-0">// Плей-оф</p>
              <div class="flex flex-wrap items-center gap-x-12 gap-y-8">
                <h3 class="admin-panel__title">Автостарт</h3>
                <StatusBadge preset="upcoming" size="sm" />
              </div>
              <p class="admin-panel__hint">
                Планувальник стартує плей-оф автоматично й розсіє всі команди, допущені
                за кваліфікацією. Ручний запуск вимкнено — змінити час можна в налаштуваннях турніру.
              </p>
            </div>

            <div class="admin-countdown">
              <span class="admin-countdown__label">
                <PhLightning :size="12" weight="bold" aria-hidden="true" />
                Старт
              </span>
              <span class="admin-countdown__value">{{ playoffStartLabel }}</span>
            </div>
          </div>
        </section>

        <section class="admin-panel hud-panel rounded-2xl" aria-label="Допущені команди">
          <header class="admin-panel__head">
            <p class="sys-label sys-label--muted m-0">Допущено до плей-оф</p>
            <h3 class="admin-panel__title">
              {{ playoffEligibleTeams.length }} {{ pluralTeams(playoffEligibleTeams.length) }}
            </h3>
          </header>
          <el-table
            v-loading="eligibleLoading"
            :data="playoffEligibleTeams"
            row-key="id"
            class="admin-table"
            empty-text="Поки жодна команда не пройшла відбір"
          >
            <el-table-column label="#" width="56">
              <template #default="{ $index }">
                <span class="admin-table__index">{{ String($index + 1).padStart(2, '0') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Команда" min-width="220">
              <template #default="{ row }">
                <span class="admin-team">
                  <span class="admin-team__thumb">
                    <img v-if="teamLogo(row)" :src="teamLogo(row)" alt="" loading="lazy" decoding="async">
                    <PhUsersThree v-else :size="14" weight="duotone" />
                  </span>
                  <span class="admin-table__name">{{ row.name }}</span>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PhArrowSquareOut,
  PhArrowsClockwise,
  PhCheck,
  PhCoins,
  PhLightning,
  PhLinkSimple,
  PhPencilSimple,
  PhPlus,
  PhTrash,
  PhTrophy,
  PhUserMinus,
  PhUsersThree
} from '@phosphor-icons/vue'
import { formatEntryFeeUah } from '@/core/utils/formatters'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { tournamentsService } from '@/views/tournaments/tournaments.service'
import { teamsService } from '@/views/teams/teams.service'
import { friendlyPlayoffError } from '@/views/tournaments/utils/playoff-errors.utils'
import { getRegistrationBlockReason } from '@/core/utils/tournament-registration'

const props = defineProps<{
  tournament?: TTournament | null
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'playoff-updated', response: TPlayoff): void
}>()

const showEditDrawer = ref(false)

const router = useRouter()
const tournamentStore = useTournamentStore()
const deleteLoading = ref(false)
const joinLoading = ref(false)
const selectedTeamId = ref<string>('')
const allTeams = ref<TTeam[]>([])
const teamsLoading = ref(false)

// Турніри з відкритою реєстрацією — обмежень за MMR немає, допуск лише за верифікацією.
// Уже зареєстровані команди не пропонуємо вдруге.
const eligibleTeams = computed(() => {
  const joined = new Set(teams.value.map((t) => t.id))
  return allTeams.value
    .filter((t) => t.isVerified && !t.disbandedAt && !joined.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
})

const tabs = [
  { value: 'status', label: 'Огляд' },
  { value: 'participants', label: 'Команди та внески' },
  { value: 'matches', label: 'Матчі' },
  { value: 'playoff', label: 'Плей-оф' }
]

const activeTab = ref('status')

const teams = computed(() => props.tournament?.teams || [])

const DATE_FORMAT = 'D MMM YYYY, HH:mm'

function formatDate (iso: string | null | undefined): string {
  return iso ? dayjs(iso).locale('uk').format(DATE_FORMAT) : '—'
}

function formatRange (from: string | null | undefined, to: string | null | undefined): string {
  if (!from && !to) return '—'
  const f = from ? dayjs(from).locale('uk').format('D MMM') : '…'
  const t = to ? dayjs(to).locale('uk').format('D MMM') : '…'
  return `${f} — ${t}`
}

function pluralTeams (n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'команда'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'команди'
  return 'команд'
}

// ─── Огляд ──────────────────────────────────────────────────────────────────
type TStageKey = 'REGISTRATION' | 'QUALIFICATIONS' | 'PLAYOFF'
type TStageState = 'done' | 'current' | 'upcoming'

interface IStage {
  key: TStageKey
  label: string
  dates: string
  state: TStageState
}

/** Той самий порядок і логіка, що в шапці турніру: без кваліфікації — два етапи. */
const stages = computed<IStage[]>(() => {
  const t = props.tournament
  if (!t) return []

  const order: TStageKey[] = t.hasQualification === false
    ? ['REGISTRATION', 'PLAYOFF']
    : ['REGISTRATION', 'QUALIFICATIONS', 'PLAYOFF']

  const endedByDate = !!t.tournamentEndsAt && dayjs(t.tournamentEndsAt).isBefore(dayjs())
  const currentIndex = t.tournamentStatus === 'COMPLETED' || endedByDate
    ? order.length
    : order.indexOf(t.tournamentStatus as TStageKey)

  const stateAt = (index: number): TStageState => {
    if (currentIndex < 0) return 'upcoming'
    if (index < currentIndex) return 'done'
    return index === currentIndex ? 'current' : 'upcoming'
  }

  const dates: Record<TStageKey, string> = {
    REGISTRATION: formatRange(t.registrationStartsAt, t.registrationEndsAt),
    QUALIFICATIONS: formatRange(
      t.qualificationStartsAt ?? t.registrationEndsAt,
      t.qualificationEndsAt ?? t.tournamentStartsAt
    ),
    PLAYOFF: formatRange(t.tournamentStartsAt, t.tournamentEndsAt)
  }
  const labels: Record<TStageKey, string> = {
    REGISTRATION: 'Реєстрація',
    QUALIFICATIONS: 'Кваліфікація',
    PLAYOFF: 'Плей-оф'
  }

  return order.map((key, index) => ({ key, label: labels[key], dates: dates[key], state: stateAt(index) }))
})

const tournamentHasEntryFee = computed(() => (props.tournament?.entryFee ?? 0) > 0)

const entryFeeLabel = computed(() =>
  tournamentHasEntryFee.value ? formatEntryFeeUah(props.tournament?.entryFee ?? 0) : 'Безкоштовно'
)

const freeSlotsLabel = computed(() => {
  const slots = props.tournament?.tournamentSlots
  if (!slots) return '—'
  return String(Math.max(0, slots - teams.value.length))
})

/** Час автоматичного старту плей-оф (tournamentStartsAt). */
const playoffStartLabel = computed(() => formatDate(props.tournament?.tournamentStartsAt))

// ─── Реєстрація ─────────────────────────────────────────────────────────────
const registrationToggleLoading = ref(false)
const isRegistrationManuallyClosed = computed(() => !!props.tournament?.registrationClosedAt)

/** Тік, щоб стан «Дедлайн минув» оновлювався без перезавантаження сторінки. */
const registrationNow = useNow({ interval: 30_000 })

const registrationBlockReason = computed(() =>
  getRegistrationBlockReason(props.tournament, registrationNow.value.getTime())
)

/** Підпис, тон і пояснення поточного стану реєстрації для адміна. */
const registrationState = computed<{ label: string; tone: string; hint: string }>(() => {
  const t = props.tournament
  if (t?.registrationClosedAt) {
    return {
      label: 'Закрита вручну',
      tone: 'is-closed',
      hint: `Закрив адміністратор ${formatDate(t.registrationClosedAt)}. Планові дати не змінені — ` +
        'реєстрацію можна відкрити знову.'
    }
  }

  if (registrationBlockReason.value === 'NOT_OPEN_YET') {
    return {
      label: 'Ще не відкрита',
      tone: 'is-pending',
      hint: `Відкриється автоматично ${formatDate(t?.registrationStartsAt)}.`
    }
  }

  if (registrationBlockReason.value === 'DEADLINE_PASSED') {
    return {
      label: 'Закрита за дедлайном',
      tone: 'is-expired',
      hint: `Дедлайн минув ${formatDate(t?.registrationEndsAt)}. Щоб подовжити — ` +
        'змініть кінець реєстрації через «Редагувати».'
    }
  }

  return {
    label: 'Відкрита',
    tone: 'is-open',
    hint: `Заявки приймаються до ${formatDate(t?.registrationEndsAt)}.`
  }
})

/** Дія для кнопки або null, коли перемикач нічого не змінить (дедлайн / ще не відкрита). */
const registrationAction = computed<{
  label: string
  type: 'primary' | 'danger'
  confirmTitle: string
  confirmText: string
} | null>(() => {
  if (isRegistrationManuallyClosed.value) {
    return {
      label: 'Відкрити реєстрацію',
      type: 'primary',
      confirmTitle: 'Відкрити реєстрацію знову? Команди зможуть подавати заявки до планового дедлайну.',
      confirmText: 'Відкрити'
    }
  }
  if (registrationBlockReason.value === null) {
    return {
      label: 'Закрити реєстрацію',
      type: 'danger',
      confirmTitle: 'Закрити реєстрацію зараз? Нові команди не зможуть приєднатися й сплатити внесок.',
      confirmText: 'Закрити'
    }
  }
  return null
})

async function toggleRegistrationClosed () {
  if (!props.tournament) return
  registrationToggleLoading.value = true
  try {
    const updated = await tournamentsService.setRegistrationClosedWithToast(
      props.tournament.id,
      !isRegistrationManuallyClosed.value
    )
    if (updated) emit('refresh')
  } finally {
    registrationToggleLoading.value = false
  }
}

// ─── Команди та внески ──────────────────────────────────────────────────────
async function loadTeams () {
  teamsLoading.value = true
  try {
    allTeams.value = await teamsService.fetchAllTeams()
  } catch {
    ElMessage.error('Не вдалося завантажити список команд')
  } finally {
    teamsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'participants') {
    loadTeams()
    loadPaymentsData()
  }
  if (tab === 'matches') loadManualMatches()
  if (tab === 'playoff') loadPlayoffData()
})

// ─── Матчі без ID Dota 2 ────────────────────────────────────────────────────
const { open: openAppModal } = useAppModals()
const manualMatches = ref<TManualMatch[]>([])
const manualMatchesLoading = ref(false)

async function loadManualMatches () {
  const id = props.tournament?.id
  if (!id || manualMatchesLoading.value) return
  manualMatchesLoading.value = true
  try {
    manualMatches.value = await tournamentsService.fetchManualMatches(id)
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося завантажити матчі'))
  } finally {
    manualMatchesLoading.value = false
  }
}

const FINAL_TYPE_LABELS: Record<string, string> = {
  upper_bracket_final: 'Фінал верхньої',
  lower_bracket_final: 'Фінал нижньої',
  grand_final: 'Гранд-фінал'
}

function manualMatchStageLabel (m: TManualMatch): string {
  if (m.stage === 'qualification') return 'Кваліфікація'
  const base = (m.finalType && FINAL_TYPE_LABELS[m.finalType]) || 'Плей-оф'
  return (m.bestOf ?? 1) > 1 && m.gameNumber ? `${base} · гра ${m.gameNumber}` : base
}

function manualMatchSourceLabel (m: TManualMatch): string {
  const id = m.dotaMatchId ?? ''
  if (id.startsWith('tech_loss_')) return 'Техпоразка'
  if (id.startsWith('manual_')) return 'Вручну'
  return id ? 'Тестовий' : 'Без ID'
}

function openLinkDotaMatchId (match: TManualMatch) {
  const id = props.tournament?.id
  if (!id) return
  openAppModal('LinkDotaMatchIdModal', {
    tournamentId: id,
    match,
    onLinked: (result: TLinkManualMatchResult) => {
      manualMatches.value = manualMatches.value.filter((m) => m.matchId !== result.matchId)
      emit('refresh')
    }
  })
}

const payments = ref<TTournamentPaymentSummary[]>([])
const markPaidLoadingId = ref<string | null>(null)

async function loadPaymentsData () {
  const id = props.tournament?.id
  if (!id) return
  try {
    payments.value = await tournamentsService.fetchTournamentPayments(id)
  } catch {
    payments.value = []
  }
}

// Рахуємо лише поточних учасників: у платежах можуть лишатися команди, що вже вийшли з турніру.
const paidCount = computed(() => teams.value.filter((t) => isTeamPaid(t.id)).length)
const hasUnpaidTeams = computed(() => teams.value.some((t) => !isTeamPaid(t.id)))

function teamLogo (team: Pick<TTeam, 'logoUrl'>): string | undefined {
  return resolvePublicOrApiUrl(team.logoUrl) || undefined
}

function paymentSummaryOf (teamId: string): TTournamentPaymentSummary | null {
  return payments.value.find((p) => p.teamId === teamId) ?? null
}

function paymentStatusOf (teamId: string): TTournamentPaymentStatus | null {
  return paymentSummaryOf(teamId)?.status ?? null
}

function amountPaidLabel (teamId: string): string {
  const summary = paymentSummaryOf(teamId)
  return summary && summary.amountPaid > 0 ? formatEntryFeeUah(summary.amountPaid) : '—'
}

function isTeamPaid (teamId: string): boolean {
  return paymentStatusOf(teamId) === 'PAID'
}

function paymentStatusLabel (teamId: string): string {
  const status = paymentStatusOf(teamId)
  if (status === 'PAID') return 'Оплачено'
  if (status === 'UNDERPAID') return 'Неповна оплата'
  if (status === 'PENDING') return 'Очікує оплати'
  return 'Без платежу'
}

function paymentStatusClass (teamId: string): string {
  const status = paymentStatusOf(teamId)
  if (status === 'PAID') return 'is-paid'
  if (status === 'UNDERPAID') return 'is-underpaid'
  if (status === 'PENDING') return 'is-pending'
  return 'is-none'
}

async function markPaid (teamId: string) {
  const id = props.tournament?.id
  if (!id) return

  let note: string | undefined
  try {
    const { value } = await ElMessageBox.prompt(
      'Підстава для аудиту — наприклад, оплата готівкою або переказ без коментаря. Необовʼязково.',
      'Позначити внесок оплаченим',
      {
        confirmButtonText: 'Позначити оплаченим',
        cancelButtonText: 'Скасувати',
        inputPlaceholder: 'Примітка (необовʼязково)',
        inputType: 'textarea'
      }
    )
    note = value?.trim() || undefined
  } catch {
    // Скасовано адміністратором — нічого не робимо.
    return
  }

  markPaidLoadingId.value = teamId
  try {
    await tournamentsService.adminMarkTeamPaid(id, teamId, note)
    ElMessage.success('Внесок позначено оплаченим')
    await loadPaymentsData()
    emit('refresh')
  } catch {
    ElMessage.error('Не вдалося позначити оплату')
  } finally {
    markPaidLoadingId.value = null
  }
}

// ─── Плей-оф ────────────────────────────────────────────────────────────────
const playoff = ref<TPlayoff | null>(null)
const playoffLoading = ref(false)
const actionLoading = ref(false)
const regenerateLoading = ref(false)
const REGENERATE_CONFIRM_TITLE =
  'Перегенерувати матчі плей-оф? Сітка й подані результати збережуться, незіграні матчі буде створено заново.'
const eligibleLoading = ref(false)
const playoffEligibleTeams = ref<TTeam[]>([])

// Публічна сторінка сітки — embed-URL без `/module`.
const playoffPublicUrl = computed(() => (playoff.value?.embedUrl ?? '').replace(/\/module\/?$/, ''))

async function loadPlayoffData () {
  const id = props.tournament?.id
  if (!id || playoffLoading.value) return
  playoffLoading.value = true
  try {
    const started = await tournamentsService.fetchPlayoff(id)
    playoff.value = started
    if (!started) {
      eligibleLoading.value = true
      // Плей-оф стартує планувальник із усіма допущеними командами — показуємо їх лише для перегляду.
      playoffEligibleTeams.value = await tournamentsService.fetchQualificationTeams(id)
    }
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося завантажити дані плей-оф'))
  } finally {
    eligibleLoading.value = false
    playoffLoading.value = false
  }
}

async function disqualify (teamId: string) {
  const id = props.tournament?.id
  if (!id) return
  actionLoading.value = true
  try {
    const response = await tournamentsService.disqualifyPlayoffTeam(id, teamId)
    playoff.value = response
    ElMessage.success('Команду дискваліфіковано, сітку перебудовано')
    emit('playoff-updated', response)
    emit('refresh')
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося дискваліфікувати команду'))
  } finally {
    actionLoading.value = false
  }
}

/** Перегенерувати незіграні матчі плей-оф за поточною сіткою (сітка й результати лишаються). */
async function regeneratePlayoffMatches () {
  const id = props.tournament?.id
  if (!id || regenerateLoading.value) return
  regenerateLoading.value = true
  try {
    const response = await tournamentsService.regeneratePlayoffMatches(id)
    playoff.value = response
    ElMessage.success('Матчі плей-оф перегенеровано')
    emit('playoff-updated', response)
    emit('refresh')
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося перегенерувати матчі плей-оф'))
  } finally {
    regenerateLoading.value = false
  }
}

async function adminJoinTeam () {
  if (!props.tournament?.id || !selectedTeamId.value) return
  joinLoading.value = true
  try {
    await tournamentsService.joinTournament(props.tournament.id, selectedTeamId.value)
    ElMessage.success('Команду додано до турніру')
    selectedTeamId.value = ''
    emit('refresh')
  } catch {
    ElMessage.error('Не вдалося додати команду')
  } finally {
    joinLoading.value = false
  }
}

async function deleteTournament () {
  if (!props.tournament?.id) return
  deleteLoading.value = true
  try {
    await tournamentStore.deleteTournament(props.tournament.id)
    ElMessage.success('Турнір видалено')
    router.push('/tournaments')
  } catch {
    ElMessage.error('Не вдалося видалити турнір')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.admin__stack {
  @apply mt-20 flex flex-col gap-16;
}

// ─── Панель ─────────────────────────────────────────────────────────────────
.admin-panel {
  @apply flex flex-col gap-16 px-16 py-16 md:px-22 md:py-20;
}

// Небезпечна зона: без ціанової верхньої лінії, рожевий контур і легке рожеве повітря.
.admin-panel--danger {
  border: 1px solid rgba(var(--ds-pink-rgb), 0.22);
  background:
    radial-gradient(ellipse 50% 90% at 0% 50%, rgba(var(--ds-pink-rgb), 0.06), transparent 60%),
    rgba(13, 15, 28, 0.6);
}

.admin-panel__head {
  @apply flex flex-col gap-10;

  &--split {
    @apply sm:flex-row sm:items-end sm:justify-between;
  }
}

.admin-panel__row {
  @apply flex flex-col gap-14 md:flex-row md:items-center md:justify-between md:gap-24;
}

.admin-panel__title {
  @apply m-0 font-display uppercase text-white;
  font-size: 1.125rem;
  line-height: 1.15;
  letter-spacing: 0.04em;

  @screen md {
    font-size: 1.25rem;
  }
}

.admin-panel__hint {
  @apply m-0 max-w-2xl;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ds-text-muted);
}

// ─── Етапи ──────────────────────────────────────────────────────────────────
// Рейка з вузлами: пройдені — заповнені ціаном, поточний — світиться, майбутні — контур.
.admin-stages {
  @apply m-0 grid list-none gap-8 p-0;
  grid-template-columns: repeat(var(--steps, 3), minmax(0, 1fr));
}

.admin-stages__step {
  @apply relative flex flex-col gap-6 pt-14;

  // Рейка над кроком; у сусідніх кроків зливається в одну лінію.
  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.08);
  }

  &.is-done::before {
    background: rgba(var(--ds-primary-rgb), 0.6);
  }

  &.is-current::before {
    background: linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.6), rgba(var(--ds-pink-rgb), 0.6));
    box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.4);
  }
}

.admin-stages__node {
  @apply absolute left-0 inline-flex items-center justify-center rounded-full;
  top: 0;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: var(--ds-surface);
  color: var(--ds-background);
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  .is-done & {
    border-color: var(--ds-primary);
    background: var(--ds-primary);
  }

  .is-current & {
    border-color: var(--ds-primary);
    box-shadow: 0 0 0 3px rgba(var(--ds-primary-rgb), 0.18), 0 0 12px rgba(var(--ds-primary-rgb), 0.6);
  }
}

.admin-stages__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  .is-done & {
    color: var(--ds-text-muted);
  }

  .is-current & {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.admin-stages__dates {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);

  .is-current & {
    color: var(--ds-text-strong);
  }
}

// ─── Зведення ───────────────────────────────────────────────────────────────
.admin-stats {
  @apply m-0 grid grid-cols-3 overflow-hidden rounded-xl border;
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.22);
}

.admin-stats__cell {
  @apply flex min-w-0 flex-col gap-4 px-14 py-12;

  & + & {
    border-left: 1px solid rgba(255, 255, 255, 0.06);
  }

  dt {
    @apply inline-flex items-center gap-5;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ds-text-faint);

    svg {
      color: rgba(var(--ds-primary-rgb), 0.75);
    }
  }

  dd {
    @apply m-0 truncate font-display text-white;
    font-size: 1.25rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}

.admin-stats__date {
  font-size: 0.95rem !important;
  font-family: var(--ds-font-mono) !important;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.admin-stats__dim {
  color: var(--ds-text-faint);
}

// ─── Реєстрація ─────────────────────────────────────────────────────────────
.admin-reg {
  @apply m-0 inline-flex items-center gap-8;
  --reg-tone: 156, 163, 175;

  &.is-open {
    --reg-tone: 34, 197, 94;
  }

  &.is-expired {
    --reg-tone: 245, 158, 11;
  }

  &.is-closed {
    --reg-tone: 239, 68, 68;
  }
}

.admin-reg__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgb(var(--reg-tone));
  box-shadow: 0 0 10px rgba(var(--reg-tone), 0.55);
}

.admin-reg__label {
  @apply font-display uppercase text-white;
  font-size: 1rem;
  letter-spacing: 0.04em;
}

// ─── Команди ────────────────────────────────────────────────────────────────
.admin-join {
  @apply flex w-full flex-col gap-10 sm:flex-row sm:items-center md:w-auto;
}

.admin-join__select {
  @apply w-full sm:w-[280px];
}

.admin-paid {
  @apply m-0 inline-flex items-center gap-8 self-start rounded-lg px-10 py-6 sm:self-auto;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  color: var(--ds-text-muted);

  svg {
    color: var(--ds-gold);
  }

  &.is-complete {
    color: var(--ds-success);
    box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.3);
  }
}

.admin-paid__value {
  @apply font-display text-white;
  font-size: 1rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.admin-paid__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

// Таблиця сидить на панелі: без власної рамки й зебри, заголовок у моно-регістрі HUD.
.admin-table {
  @apply rounded-xl shadow-none;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-border-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.18);

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__header) {
    background: rgba(255, 255, 255, 0.02);

    .cell {
      font-family: var(--ds-font-mono);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ds-text-faint);
    }
  }

  :deep(.el-table__body .el-table__row) {
    background: transparent;
    cursor: default;
    transition: background-color 120ms ease;

    &:hover > .el-table__cell {
      background: rgba(var(--ds-primary-rgb), 0.05);
    }
  }

  :deep(.el-table__cell) {
    padding: 10px 0;
  }
}

.admin-team {
  @apply inline-flex min-w-0 items-center gap-10;
}

.admin-team__thumb {
  @apply inline-flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--ds-overlay);
  color: rgba(var(--ds-primary-rgb), 0.45);

  img {
    @apply size-full object-cover object-center;
    display: block;
  }
}

.admin-team__thumb--sm {
  @apply size-24 rounded-md;
}

// Опція селекта: логотип, назва, розмір складу праворуч.
.admin-opt {
  @apply flex w-full min-w-0 items-center gap-10;
}

.admin-opt__name {
  @apply min-w-0 flex-1 truncate;
}

.admin-opt__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.admin-table__name {
  @apply truncate text-sm font-semibold text-white;
}

.admin-table__index {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

// Етап матчу з ручним результатом: кваліфікація — приглушений чіп, плей-оф — ціановий.
.admin-stage {
  @apply inline-flex items-center whitespace-nowrap rounded-md px-6 py-3;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  &.is-playoff {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.08);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.3);
  }
}

// Пара команд у рядку: переможець підсвічений трофеєм, той, хто програв, — приглушений.
.admin-match {
  @apply inline-flex min-w-0 flex-wrap items-center gap-x-10 gap-y-4;
}

.admin-match__team {
  @apply inline-flex min-w-0 items-center gap-8;

  &:not(.is-winner) .admin-table__name {
    color: var(--ds-text-muted);
    font-weight: 500;
  }
}

.admin-match__trophy {
  flex: none;
  color: var(--ds-primary);
  filter: drop-shadow(0 0 4px rgba(var(--ds-primary-rgb), 0.5));
}

.admin-match__vs {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ds-primary-rgb), 0.55);
}

// Дискваліфікація — тиха текстова дія: вісім червоних рамок у стовпці кричали б голосніше за дані.
.admin-dq {
  :deep(> span) {
    @apply inline-flex items-center;
  }
}

.admin-table__amount {
  font-family: var(--ds-font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
}

// Статус оплати: тонований чіп із крапкою, колір дублюється словом.
.admin-pay {
  @apply inline-flex items-center gap-6 rounded-md px-8 py-4;
  --pay-tone: 156, 163, 175;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(var(--pay-tone), 1);
  background: rgba(var(--pay-tone), 0.1);
  box-shadow: inset 0 0 0 1px rgba(var(--pay-tone), 0.3);

  &.is-paid {
    --pay-tone: 74, 222, 128;
  }

  &.is-underpaid {
    --pay-tone: 251, 191, 36;
  }

  &.is-pending {
    --pay-tone: 148, 163, 184;
  }

  &.is-none {
    color: var(--ds-text-faint);
    background: rgba(255, 255, 255, 0.04);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
}

.admin-pay__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgb(var(--pay-tone));
}

// ─── Плей-оф ────────────────────────────────────────────────────────────────
.admin-countdown {
  @apply flex shrink-0 flex-col gap-4 rounded-xl border px-14 py-10;
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.45);
}

.admin-countdown__label {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    color: rgba(var(--ds-primary-rgb), 0.75);
  }
}

.admin-countdown__value {
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
}

@media (prefers-reduced-motion: reduce) {
  .admin-stages__node {
    transition: none;
  }
}
</style>
