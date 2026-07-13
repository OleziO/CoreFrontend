<template>
  <div class="w-full mt-20">
    <el-tabs v-model="activeTab" tab-position="top" stretch class="w-full">
      <el-tab-pane v-for="tab in tabs" :key="tab.label" class="mt-20" :label="tab.label" :name="tab.value" />
    </el-tabs>

    <div v-if="activeTab === 'status'" class="mt-20">
      <div
        class="bg-surface border border-white/10 rounded-xl p-10
          md:p-20 flex flex-col md:flex-row items-center justify-between gap-8
          relative overflow-hidden"
      >
        <div class="flex items-center w-full gap-10 relative z-10">
          <div class="flex items-center w-full gap-10">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Поточний етап</span>
            <TournamentStatusTag :status="tournament?.tournamentStatus" class="min-w-100" />
          </div>
        </div>

        <!-- TODO: endpoint not in API yet (startTournament, openQualifications, endTournament) -->
        <div class="px-6 py-3 rounded-xl text-gray-500 text-sm bg-white/[0.02] font-mono">
          Управління турніром недоступне
        </div>
      </div>

      <div class="mt-20 flex items-center gap-10">
        <el-button type="primary" plain @click="showEditDrawer = true">
          Редагувати турнір
        </el-button>

        <el-popconfirm
          width="300"
          placement="bottom-start"
          title="Видалити турнір?"
          confirm-button-text="Видалити"
          cancel-button-text="Скасувати"
          confirm-button-type="danger"
          @confirm="deleteTournament"
        >
          <template #reference>
            <el-button type="danger" :loading="deleteLoading" plain>
              Видалити турнір
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <CreateTournamentDrawer v-model="showEditDrawer" :tournament="tournament" />

    <div v-if="activeTab === 'participants'" class="mt-20">
      <div class="participants-tab flex flex-col gap-20 w-full max-w-7xl mx-auto">
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Додати команду до турніру</span>
          <div class="flex gap-10 items-center">
            <el-select
              v-model="selectedTeamId"
              filterable
              placeholder="Оберіть команду"
              class="flex-1"
              :loading="teamsLoading"
            >
              <el-option
                v-for="team in eligibleTeams"
                :key="team.id"
                :label="team.name"
                :value="team.id"
              />
            </el-select>
            <el-button
              type="primary"
              :loading="joinLoading"
              :disabled="!selectedTeamId"
              @click="adminJoinTeam"
            >
              Додати
            </el-button>
          </div>
        </div>

        <el-table
          :data="teams"
          row-key="id"
          class="h-[350px] rounded-md overflow-auto"
          empty-text="Команди відсутні"
          border
        >
          <el-table-column label="ID команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Назва команди">
            <template #default="{ row }">
              <span class="text-sm text-white">{{ row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Оплата внеску" width="150">
            <template #default="{ row }">
              <span :class="paymentStatusClass(row.id)">{{ paymentStatusLabel(row.id) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Дія" width="210">
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
              <span v-else class="text-xs text-emerald-400">Оплачено</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-if="activeTab === 'playoff'" class="mt-20 flex flex-col gap-20 w-full max-w-7xl mx-auto">
      <div v-if="playoffLoading" class="text-gray-500 text-sm">
        Завантаження…
      </div>

      <template v-else-if="playoff">
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Плей-оф запущено</span>
          <a
            :href="playoff.embedUrl"
            target="_blank"
            rel="noopener"
            class="text-primary text-sm break-all hover:underline"
          >
            {{ playoff.embedUrl }}
          </a>
        </div>

        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Учасники плей-оф</span>
          <el-table
            :data="playoff.teams"
            row-key="id"
            class="rounded-md overflow-auto"
            empty-text="Команди відсутні"
            border
          >
            <el-table-column label="Назва команди">
              <template #default="{ row }">
                <span class="text-sm text-white">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Дія" width="180">
              <template #default="{ row }">
                <el-popconfirm
                  width="260"
                  title="Дискваліфікувати команду?"
                  confirm-button-text="Так"
                  cancel-button-text="Ні"
                  confirm-button-type="danger"
                  @confirm="disqualify(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" size="small" :loading="actionLoading" plain>
                      Дискваліфікувати
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <template v-else>
        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Автоматичний старт плей-оф</span>
          <p class="text-sm leading-relaxed text-gray-300">
            Плей-оф стартує автоматично о
            <span class="font-semibold text-white">{{ playoffStartLabel }}</span>
            з усіма командами, допущеними за кваліфікацією. Ручний запуск вимкнено.
          </p>
          <div class="flex items-center gap-8">
            <span class="text-xs text-gray-500">Поточний статус:</span>
            <TournamentStatusTag :status="tournament?.tournamentStatus" />
          </div>
        </div>

        <div class="bg-surface border border-white/10 rounded-xl p-10 md:p-20 flex flex-col gap-12">
          <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Команди, допущені до плей-оф ({{ playoffEligibleTeams.length }})
          </span>
          <el-table
            v-loading="eligibleLoading"
            :data="playoffEligibleTeams"
            row-key="id"
            class="rounded-md overflow-auto"
            empty-text="Немає допущених команд"
            border
          >
            <el-table-column label="Назва команди">
              <template #default="{ row }">
                <span class="text-sm text-white">{{ row.name }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import { inferTournamentDivisionFromAvgRating } from '@/components/tournaments-tags/tournament.constants'
import { tournamentsService } from '@/views/tournaments/tournaments.service'
import { teamsService } from '@/views/teams/teams.service'
import { friendlyPlayoffError } from '@/views/tournaments/utils/playoff-errors.utils'

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
const allTeams = ref<Array<TTeam | TTeam>>([])
const teamsLoading = ref(false)

// Дивізіон рахуємо лише за середнім MMR основи (без верхньої межі по гравцю),
// щоб фільтр збігався з бекендом (tournament-division.util.ts, поріг 6500).
function computeDivision (mainPlayers: { rating: number }[]): string | null {
  if (mainPlayers.length === 0) return null
  const ratings = mainPlayers.map((p) => p.rating)
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
  return inferTournamentDivisionFromAvgRating(avg)
}

const eligibleTeams = computed(() => {
  const tournamentDivision = props.tournament?.division ?? null
  return allTeams.value.filter((t) => {
    if (!t.isVerified) return false
    if (!tournamentDivision) return true
    const main = t.mainPlayers ?? []
    if (main.length === 0) return false
    return computeDivision(main) === tournamentDivision
  })
})
const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'participants', label: 'Управління командами' },
  { value: 'playoff', label: 'Плей-оф' }
]

const activeTab = ref('status')

const teams = computed(() => props.tournament?.teams || [])

async function loadTeams () {
  teamsLoading.value = true
  try {
    allTeams.value = await teamsService.fetchAllTeams()
  } catch {
    ElMessage.error('Не вдалося завантажити команди')
  } finally {
    teamsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'participants') {
    loadTeams()
    loadPaymentsData()
  }
  if (tab === 'playoff') loadPlayoffData()
}, { immediate: false })

// --- Оплата вступного внеску (адмін) ---
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

function paymentStatusOf (teamId: string): TTournamentPaymentStatus | null {
  return payments.value.find((p) => p.teamId === teamId)?.status ?? null
}

function isTeamPaid (teamId: string): boolean {
  return paymentStatusOf(teamId) === 'PAID'
}

function paymentStatusLabel (teamId: string): string {
  const status = paymentStatusOf(teamId)
  if (status === 'PAID') return 'Оплачено'
  if (status === 'UNDERPAID') return 'Неповна оплата'
  if (status === 'PENDING') return 'Очікує оплату'
  return '—'
}

function paymentStatusClass (teamId: string): string {
  const status = paymentStatusOf(teamId)
  if (status === 'PAID') return 'text-sm text-emerald-400'
  if (status === 'UNDERPAID') return 'text-sm text-amber-400'
  return 'text-sm text-gray-400'
}

async function markPaid (teamId: string) {
  const id = props.tournament?.id
  if (!id) return
  markPaidLoadingId.value = teamId
  try {
    await tournamentsService.adminMarkTeamPaid(id, teamId)
    ElMessage.success('Команду позначено як таку, що сплатила внесок')
    await loadPaymentsData()
    emit('refresh')
  } catch {
    ElMessage.error('Не вдалося позначити оплату')
  } finally {
    markPaidLoadingId.value = null
  }
}

// --- Плей-оф (адмін) ---
const playoff = ref<TPlayoff | null>(null)
const playoffLoading = ref(false)
const actionLoading = ref(false)
const eligibleLoading = ref(false)
const playoffEligibleTeams = ref<TTeam[]>([])

/** Час автоматичного старту плей-оф (tournamentStartsAt). */
const playoffStartLabel = computed(() => {
  const startsAt = props.tournament?.tournamentStartsAt
  return startsAt ? dayjs(startsAt).format('DD.MM.YYYY HH:mm') : '—'
})

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
